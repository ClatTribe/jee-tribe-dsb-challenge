const API_KEY = 'AIzaSyCblKwhS_eMB6g4hFQXf3ehK4QzAUDL6FI';
const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;
const start = Date.now();
try {
  const r = await fetch(url, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({contents: [{parts: [{text: 'Say hello in 5 words'}]}], generationConfig: {maxOutputTokens: 50}})
  });
  const d = await r.json();
  console.log(`Status: ${r.status} (${Date.now()-start}ms)`);
  console.log('Text:', d.candidates?.[0]?.content?.parts?.[0]?.text || JSON.stringify(d).substring(0,200));
} catch(e) {
  console.log('Error:', e.message);
}
process.exit(0);
