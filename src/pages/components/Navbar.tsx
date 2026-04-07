"use client";
import React, { useState, useEffect } from "react";
import { LogOut, Menu, X, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

// ——— BRAND COLORS ————————————————————————————————————————————
const primary = "#F59E0B"; 
const textMuted = "#94a3b8"; 

// ——— PRODUCT ECOSYSTEM ——————————————————————————————————————
const CURRENT_PRODUCT = "preptribe";

const PRODUCTS = [
  { id: "edunext", label: "EduNext", url: "https://getedunext.com" },
  { id: "preptribe", label: "PrepTribe", url: "https://jeetribechallenge.getedunext.com" },
  { id: "schooltribe", label: "SchoolTribe", url: "https://vidyaa-rho.vercel.app" },
];

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "Success Stories", href: "#stories" },
];

const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);

  // FIXED: Destructure the correct function names from your AuthContext
  const { user, profile, logout, loginWithGoogle } = useAuth();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    await logout(); // Using 'logout' from your context
    setMobileMenuOpen(false);
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsSigningIn(true);
      setMobileMenuOpen(false);
      await loginWithGoogle(); // Using 'loginWithGoogle' from your context
    } catch (err) {
      console.error("Google sign-in failed:", err);
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${
        isScrolled || mobileMenuOpen
          ? "bg-[#060818]/90 backdrop-blur-xl border-white/10 shadow-2xl"
          : "bg-[#060818]/80 backdrop-blur-md border-white/5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
        
        {/* LEFT: Logo */}
        <Link to="/">
          <span className="flex items-center flex-shrink-0 cursor-pointer">
            <img
              src="/preptribe-white.svg"
              alt="PrepTribe Logo"
              className="h-36 w-auto object-contain"
            />
          </span>
        </Link>

        {/* CENTER: Nav Links (Desktop) */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm font-semibold text-slate-400 hover:text-white transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* RIGHT: Product Switcher + Auth */}
        <div className="hidden md:flex items-center gap-4">
          <div 
            className="flex items-center rounded-lg overflow-hidden border border-white/5"
            style={{ backgroundColor: "rgba(255,255,255,0.02)" }}
          >
            {PRODUCTS.map((p) => {
              const isActive = p.id === CURRENT_PRODUCT;
              return (
                <a
                  key={p.id}
                  href={p.url}
                  className="px-4 py-2 text-[10px] font-bold tracking-widest uppercase transition-all duration-200"
                  style={{
                    color: isActive ? primary : textMuted,
                    backgroundColor: isActive ? "rgba(245, 158, 11, 0.1)" : "transparent",
                    borderBottom: isActive ? `2px solid ${primary}` : "2px solid transparent",
                  }}
                >
                  {p.label}
                </a>
              );
            })}
          </div>

          {user ? (
            <div className="flex items-center gap-3">
              <button
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
              >
                <LogOut size={18} />
              </button>
              <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-500 font-bold text-xs" title={profile?.displayName || user.email || ""}>
                {/* FIXED: Using profile displayName or user email safely */}
                {(profile?.displayName || user.email || "U").charAt(0).toUpperCase()}
              </div>
            </div>
          ) : (
            <button
              onClick={handleGoogleSignIn}
              disabled={isSigningIn}
              className="bg-amber-500 hover:bg-amber-400 text-[#060818] px-5 py-2 rounded-full font-black text-[10px] uppercase tracking-widest transition-all hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              {isSigningIn ? <Loader2 size={14} className="animate-spin" /> : "Join Elite"}
            </button>
          )}
        </div>

        {/* Mobile Toggle */}
        <div className="md:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-400"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#060818] border-b border-white/10 p-6 flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-lg font-semibold text-slate-300"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2">
            {PRODUCTS.map((p) => (
              <a
                key={p.id}
                href={p.url}
                className={`py-2 text-[10px] text-center font-bold rounded-md border ${
                  p.id === CURRENT_PRODUCT 
                    ? "border-amber-500/50 bg-amber-500/10 text-amber-500" 
                    : "border-white/5 text-slate-500"
                }`}
              >
                {p.label}
              </a>
            ))}
          </div>

          {!user ? (
            <button
              onClick={handleGoogleSignIn}
              className="w-full bg-amber-500 text-[#060818] py-3 rounded-xl font-bold uppercase tracking-widest"
            >
              {isSigningIn ? "Connecting..." : "Join Elite"}
            </button>
          ) : (
            <button
              onClick={handleLogout}
              className="w-full bg-red-500/10 text-red-500 py-3 rounded-xl font-bold"
            >
              Logout
            </button>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;