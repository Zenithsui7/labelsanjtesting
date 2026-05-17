// ─── src/AuthModal.jsx ────────────────────────────────────────────────────────
// Customer auth modal: Google one-tap OR phone OTP (India +91).
// Props:
//   open       – boolean
//   onClose    – () => void
//   onSuccess  – (firebaseUser) => void

import { useState, useEffect, useRef } from "react";
import {
  signInWithPopup,
  signInWithCredential,
  PhoneAuthProvider,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import { auth, googleProvider, setupRecaptcha, signInWithPhoneNumber } from "./firebase";

// ─── inline styles (matches site palette) ────────────────────────────────────
const S = {
  overlay: {
    position: "fixed", inset: 0, background: "rgba(36,5,6,.55)",
    zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center",
    padding: "16px",
  },
  card: {
    background: "#fffaf0", borderRadius: 12, width: "100%", maxWidth: 400,
    boxShadow: "0 24px 64px rgba(36,5,6,.28)", overflow: "hidden",
  },
  header: {
    background: "#3b0909", padding: "22px 24px 18px",
    display: "flex", alignItems: "center", justifyContent: "space-between",
  },
  title: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: "1.5rem", fontWeight: 700, color: "#f8e9b1", margin: 0,
  },
  sub: {
    fontFamily: "'Josefin Sans', Arial, sans-serif",
    fontSize: 11, color: "rgba(248,233,177,.65)", letterSpacing: ".05em",
    marginTop: 3,
  },
  closeBtn: {
    background: "none", border: "none", color: "rgba(248,233,177,.7)",
    fontSize: 22, cursor: "pointer", lineHeight: 1, padding: "2px 6px",
  },
  body: { padding: "28px 24px 24px" },
  sectionLabel: {
    fontFamily: "'Josefin Sans', Arial, sans-serif",
    fontSize: 10, fontWeight: 700, letterSpacing: ".12em",
    color: "#7b5b55", marginBottom: 10, textTransform: "uppercase",
  },
  googleBtn: {
    display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
    width: "100%", padding: "12px 16px",
    border: "1.5px solid rgba(122,28,28,.2)", borderRadius: 8,
    background: "#fff", cursor: "pointer",
    fontFamily: "'Josefin Sans', Arial, sans-serif",
    fontSize: 13, fontWeight: 600, color: "#2a0d0d",
    transition: "box-shadow .2s, border-color .2s",
  },
  divider: {
    display: "flex", alignItems: "center", gap: 10, margin: "20px 0",
  },
  divLine: { flex: 1, height: 1, background: "rgba(122,28,28,.12)" },
  divText: {
    fontFamily: "'Josefin Sans', Arial, sans-serif",
    fontSize: 10, color: "#7b5b55", letterSpacing: ".1em", flexShrink: 0,
  },
  inputRow: { display: "flex", gap: 8, marginBottom: 12 },
  prefix: {
    display: "flex", alignItems: "center", padding: "0 12px",
    background: "#f8edd7", border: "1.5px solid rgba(122,28,28,.2)",
    borderRadius: 8, fontFamily: "'Josefin Sans', Arial, sans-serif",
    fontSize: 13, fontWeight: 600, color: "#2a0d0d", flexShrink: 0,
  },
  input: {
    flex: 1, padding: "11px 14px",
    border: "1.5px solid rgba(122,28,28,.2)", borderRadius: 8,
    fontFamily: "'Josefin Sans', Arial, sans-serif", fontSize: 14,
    color: "#2a0d0d", background: "#fff", outline: "none",
    width: "100%",
  },
  primaryBtn: {
    width: "100%", padding: "12px 16px",
    background: "#7a1c1c", border: "none", borderRadius: 8,
    color: "#f8e9b1", cursor: "pointer",
    fontFamily: "'Josefin Sans', Arial, sans-serif",
    fontSize: 13, fontWeight: 700, letterSpacing: ".06em",
    transition: "background .2s",
  },
  secondaryBtn: {
    background: "none", border: "none", cursor: "pointer",
    fontFamily: "'Josefin Sans', Arial, sans-serif",
    fontSize: 12, color: "#7a1c1c", marginTop: 10,
    textDecoration: "underline", padding: 0,
  },
  errMsg: {
    fontFamily: "'Josefin Sans', Arial, sans-serif",
    fontSize: 12, color: "#b91c1c", marginTop: 8,
  },
  successBox: {
    textAlign: "center", padding: "8px 0",
  },
  successIcon: { fontSize: 40, marginBottom: 8 },
  successTitle: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: "1.3rem", fontWeight: 700, color: "#2a0d0d", marginBottom: 4,
  },
  successSub: {
    fontFamily: "'Josefin Sans', Arial, sans-serif",
    fontSize: 12, color: "#7b5b55",
  },
};

// Google SVG icon
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48">
    <path fill="#EA4335" d="M24 9.5c3.2 0 5.9 1.1 8.1 2.9l6-6C34.2 3.2 29.4 1 24 1 14.8 1 7 6.7 3.7 14.6l7 5.4C12.5 13.5 17.8 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.4c-.5 2.8-2.1 5.1-4.5 6.7l7 5.4c4.1-3.8 6.2-9.4 6.2-16.1z"/>
    <path fill="#FBBC05" d="M10.7 28.7A14.7 14.7 0 0 1 9.5 24c0-1.6.3-3.2.7-4.7l-7-5.4A23.8 23.8 0 0 0 .5 24c0 3.8.9 7.4 2.7 10.6l7-5.9z"/>
    <path fill="#34A853" d="M24 47c5.4 0 10-.1 13.5-3.3l-7-5.4c-1.8 1.2-4.1 1.9-6.5 1.9-6.2 0-11.5-4.2-13.3-9.9l-7 5.4C7 41.4 14.9 47 24 47z"/>
  </svg>
);

export default function AuthModal({ open, onClose, onSuccess }) {
  const [phase, setPhase]   = useState("start");   // start | otp | done
  const [phone, setPhone]   = useState("");
  const [otp, setOtp]       = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");
  const confirmRef          = useRef(null);

  // Reset when modal opens
  useEffect(() => {
    if (open) { setPhase("start"); setPhone(""); setOtp(""); setError(""); setLoading(false); }
  }, [open]);

  if (!open) return null;

  // ── Google sign-in ──────────────────────────────────────────────────────────
  async function handleGoogle() {
    setLoading(true); setError("");
    try {
      const result = await signInWithPopup(auth, googleProvider);
      onSuccess(result.user);
      onClose();
    } catch (e) {
      if (e.code !== "auth/popup-closed-by-user") setError(friendlyError(e.code));
    } finally { setLoading(false); }
  }

  // ── Send OTP ────────────────────────────────────────────────────────────────
  async function handleSendOtp() {
    const digits = phone.replace(/\D/g, "");
    if (digits.length !== 10) { setError("Enter a valid 10-digit mobile number."); return; }
    setLoading(true); setError("");
    try {
      const verifier = setupRecaptcha("recaptcha-container");
      confirmRef.current = await signInWithPhoneNumber(auth, "+91" + digits, verifier);
      setPhase("otp");
    } catch (e) {
      setError(friendlyError(e.code));
      window._recaptchaVerifier = null;
    } finally { setLoading(false); }
  }

  // ── Verify OTP ──────────────────────────────────────────────────────────────
  async function handleVerifyOtp() {
    if (otp.length !== 6) { setError("Enter the 6-digit OTP."); return; }
    setLoading(true); setError("");
    try {
      const result = await confirmRef.current.confirm(otp);
      setPhase("done");
      setTimeout(() => { onSuccess(result.user); onClose(); }, 1200);
    } catch (e) {
      setError(friendlyError(e.code));
    } finally { setLoading(false); }
  }

  // ── Friendly errors ─────────────────────────────────────────────────────────
  function friendlyError(code) {
    const map = {
      "auth/invalid-phone-number":      "Invalid phone number. Try again.",
      "auth/too-many-requests":         "Too many attempts. Please wait a moment.",
      "auth/invalid-verification-code": "Incorrect OTP. Check and retry.",
      "auth/code-expired":              "OTP expired. Please resend.",
      "auth/quota-exceeded":            "SMS quota exceeded. Try again later.",
    };
    return map[code] || "Something went wrong. Please retry.";
  }

  return (
    <div style={S.overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={S.card}>
        {/* Header */}
        <div style={S.header}>
          <div>
            <div style={S.title}>Sign In</div>
            <div style={S.sub}>LABEL SANJ · SECURE LOGIN</div>
          </div>
          <button style={S.closeBtn} onClick={onClose} aria-label="Close">×</button>
        </div>

        {/* Body */}
        <div style={S.body}>

          {phase === "done" && (
            <div style={S.successBox}>
              <div style={S.successIcon}>✅</div>
              <div style={S.successTitle}>You're signed in!</div>
              <div style={S.successSub}>Welcome back to Label Sanj.</div>
            </div>
          )}

          {phase !== "done" && (
            <>
              {/* Google */}
              <div style={S.sectionLabel}>Continue with</div>
              <button
                style={S.googleBtn}
                onClick={handleGoogle}
                disabled={loading}
                onMouseEnter={e => e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,.12)"}
                onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
              >
                <GoogleIcon />
                {loading && phase === "start" ? "Signing in…" : "Sign in with Google"}
              </button>

              <div style={S.divider}>
                <div style={S.divLine}/><span style={S.divText}>OR</span><div style={S.divLine}/>
              </div>

              {/* Phone */}
              <div style={S.sectionLabel}>Mobile number (India)</div>

              {phase === "start" && (
                <>
                  <div style={S.inputRow}>
                    <div style={S.prefix}>🇮🇳 +91</div>
                    <input
                      style={S.input}
                      type="tel"
                      placeholder="10-digit mobile"
                      value={phone}
                      maxLength={10}
                      onChange={e => { setPhone(e.target.value.replace(/\D/g, "").slice(0, 10)); setError(""); }}
                      onKeyDown={e => e.key === "Enter" && handleSendOtp()}
                    />
                  </div>
                  <button style={S.primaryBtn} onClick={handleSendOtp} disabled={loading}>
                    {loading ? "Sending OTP…" : "Send OTP →"}
                  </button>
                </>
              )}

              {phase === "otp" && (
                <>
                  <p style={{ fontFamily:"'Josefin Sans',Arial,sans-serif", fontSize:12, color:"#7b5b55", marginBottom:12 }}>
                    OTP sent to +91 {phone}
                  </p>
                  <div style={S.inputRow}>
                    <input
                      style={{ ...S.input, letterSpacing: ".3em", textAlign: "center", fontSize: 20 }}
                      type="tel"
                      placeholder="——————"
                      value={otp}
                      maxLength={6}
                      onChange={e => { setOtp(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }}
                      onKeyDown={e => e.key === "Enter" && handleVerifyOtp()}
                      autoFocus
                    />
                  </div>
                  <button style={S.primaryBtn} onClick={handleVerifyOtp} disabled={loading}>
                    {loading ? "Verifying…" : "Verify OTP →"}
                  </button>
                  <div style={{ textAlign:"center" }}>
                    <button style={S.secondaryBtn} onClick={() => { setPhase("start"); setOtp(""); setError(""); }}>
                      ← Change number / Resend
                    </button>
                  </div>
                </>
              )}

              {error && <div style={S.errMsg}>⚠ {error}</div>}
            </>
          )}
        </div>
      </div>

      {/* Invisible reCAPTCHA anchor */}
      <div id="recaptcha-container" />
    </div>
  );
}
