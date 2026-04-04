import type { VercelRequest, VercelResponse } from "@vercel/node";
import * as crypto from "crypto";
import * as admin from "firebase-admin";

// --- Firebase Admin singleton ---
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY || "{}"
  );
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}
const db = admin.firestore();

/**
 * Vercel Serverless Function: Razorpay Webhook
 *
 * Razorpay sends a POST with payment details after successful payment.
 * We verify the signature, extract the payer's email, find the user
 * in Firestore, and set isPremium = true.
 *
 * Required env vars:
 *   RAZORPAY_WEBHOOK_SECRET  – from Razorpay Dashboard → Webhooks
 *   FIREBASE_SERVICE_ACCOUNT_KEY – JSON string of Firebase service account
 */

function verifySignature(
  body: string,
  signature: string,
  secret: string
): boolean {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only accept POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    console.error("RAZORPAY_WEBHOOK_SECRET not configured");
    return res.status(500).json({ error: "Webhook secret not configured" });
  }

  // Verify Razorpay signature
  const signature = req.headers["x-razorpay-signature"] as string;
  const rawBody =
    typeof req.body === "string" ? req.body : JSON.stringify(req.body);

  if (!signature || !verifySignature(rawBody, signature, secret)) {
    console.error("Invalid Razorpay signature");
    return res.status(400).json({ error: "Invalid signature" });
  }

  try {
    const event = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const eventType = event?.event;

    // We care about successful payments / payment page completions
    if (
      eventType !== "payment.captured" &&
      eventType !== "payment_link.paid"
    ) {
      // Acknowledge other events without processing
      return res.status(200).json({ status: "ignored", event: eventType });
    }

    // Extract email from payment entity
    const payment =
      event?.payload?.payment?.entity ||
      event?.payload?.payment_link?.entity;

    const email =
      payment?.email ||
      payment?.customer_details?.email ||
      event?.payload?.payment?.entity?.email ||
      null;

    if (!email) {
      console.error("No email found in Razorpay payload", JSON.stringify(event));
      return res
        .status(200)
        .json({ status: "no_email", message: "Could not extract email" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    console.log(`Processing premium upgrade for: ${normalizedEmail}`);

    // Find user by email in Firestore
    const usersRef = db.collection("users");
    const snapshot = await usersRef
      .where("email", "==", normalizedEmail)
      .limit(1)
      .get();

    if (snapshot.empty) {
      console.error(`No user found with email: ${normalizedEmail}`);
      // Still return 200 so Razorpay doesn't retry
      return res
        .status(200)
        .json({ status: "user_not_found", email: normalizedEmail });
    }

    // Mark user as premium
    const userDoc = snapshot.docs[0];
    await userDoc.ref.update({
      isPremium: true,
      premiumSince: new Date().toISOString(),
      razorpayPaymentId:
        event?.payload?.payment?.entity?.id || "unknown",
    });

    console.log(`✅ User ${normalizedEmail} upgraded to premium`);

    return res.status(200).json({
      status: "success",
      email: normalizedEmail,
      uid: userDoc.id,
    });
  } catch (error: any) {
    console.error("Webhook processing error:", error);
    return res
      .status(500)
      .json({ error: "Internal error", message: error.message });
  }
}
