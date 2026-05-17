// ─── src/AdminPage.jsx ────────────────────────────────────────────────────────
// Admin panel with local credential login (no Firebase Auth for admin).
// Owner: Name = Gaurav  |  Password = Gaurav@Zenithsui@owner@##@%@
// Role system: owner → full access, admin → read-only limited view

import { useState, useEffect, useRef } from "react";
import {
  collection, onSnapshot, doc, updateDoc,
  addDoc, deleteDoc, query, orderBy, serverTimestamp, getDoc, getDocs, setDoc
} from "firebase/firestore";
import { db, auth, signInWithGooglePopup, uploadFile } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";

// Admins are managed in Firestore under `admins/{uid}` with a `role` field (owner/admin)

// ─── helpers ─────────────────────────────────────────────────────────────────
const fmt   = (v) => `₹${Number(v).toLocaleString("en-IN")}`;
const today = () => new Date().toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" });
const STATUS = ["new","processing","shipped","delivered","cancelled"];
const statusClass = { new:"s-new", processing:"s-processing", shipped:"s-shipped", delivered:"s-delivered", cancelled:"s-cancelled" };

// ─── Admin styles ─────────────────────────────────────────────────────────────
const ADMIN_CSS = `
/* ── Login page ── */
.admin-login{max-width:400px;margin:60px auto;padding:0 22px}
.admin-login h1{font-family:var(--display);font-size:2.1rem;color:var(--m900);text-align:center;margin-bottom:4px}
.admin-login .sub{text-align:center;color:var(--muted);margin-bottom:28px;font-family:var(--ui);font-size:11px;letter-spacing:.07em;text-transform:uppercase}
.lbox{background:#fff;border:1.5px solid var(--border);border-radius:14px;padding:28px 24px;box-shadow:0 8px 32px rgba(36,5,6,.07)}
.lerr{background:#fee2e2;color:#991b1b;padding:10px 14px;border-radius:8px;font-family:var(--ui);font-size:12px;font-weight:600;margin-bottom:16px}
.lsuccess{background:#d1fae5;color:#065f46;padding:10px 14px;border-radius:8px;font-family:var(--ui);font-size:12px;font-weight:600;margin-bottom:16px}
.hint-box{background:var(--cr2);border:1.5px solid var(--border);border-radius:10px;padding:14px 16px;margin-top:16px}
.hint-box p{font-family:var(--ui);font-size:11px;color:var(--muted);line-height:1.7}
.hint-box strong{color:var(--m800)}

/* ── Wrap ── */
.admin-wrap{max-width:1200px;margin:0 auto;padding:28px 20px 80px}
.admin-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:28px;flex-wrap:wrap;gap:14px}
.admin-header h1{font-family:var(--display);font-size:1.9rem;color:var(--m900)}

/* ── Stats ── */
.stats-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:14px;margin-bottom:28px}
.scard{background:#fff;border:1.5px solid var(--border);border-radius:12px;padding:18px 20px;text-align:center}
.scard.new-card{border-color:#fc8181;background:#fff5f5}
.scard.hl{background:var(--m950);border-color:var(--m950)}
.scard.hl .snum,.scard.hl .slbl{color:var(--g200)}
.snum{font-family:var(--display);font-size:1.9rem;font-weight:700;color:var(--m900)}
.slbl{font-family:var(--ui);font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin-top:4px}

/* ── Orders ── */
.orders-wrap{background:#fff;border:1.5px solid var(--border);border-radius:14px;overflow:hidden}
.otable-head{display:grid;grid-template-columns:120px 1fr 90px 100px 110px 90px;gap:12px;padding:10px 18px;background:var(--m950);font-family:var(--ui);font-size:10px;font-weight:700;letter-spacing:.08em;color:var(--g200);text-transform:uppercase}
.orow{display:grid;grid-template-columns:120px 1fr 90px 100px 110px 90px;gap:12px;padding:14px 18px;border-top:1px solid var(--border);cursor:pointer;transition:background .15s;align-items:center}
.orow:hover{background:var(--cr2)}
.orow.new-row{background:#fff5f5}
.or-id{font-family:var(--ui);font-size:12px;font-weight:700;color:var(--m800)}
.or-name{font-size:13px;font-weight:600;color:var(--ink)}
.or-items{font-family:var(--ui);font-size:11px;color:var(--muted);margin-top:2px}
.or-amt{font-family:var(--ui);font-size:13px;font-weight:700;color:var(--m900)}
.or-pay{font-family:var(--ui);font-size:11px;color:var(--muted)}
.sbadge{display:inline-block;padding:3px 9px;border-radius:99px;font-family:var(--ui);font-size:9px;font-weight:700;letter-spacing:.06em;text-transform:uppercase}
.s-new{background:#fee2e2;color:#991b1b}
.s-processing{background:#fef9c3;color:#854d0e}
.s-shipped{background:#dbeafe;color:#1e40af}
.s-delivered{background:#d1fae5;color:#065f46}
.s-cancelled{background:#f3f4f6;color:#6b7280}

/* ── Notification toast ── */
.notif-toast{position:fixed;top:20px;left:50%;transform:translateX(-50%) translateY(-80px);background:var(--m900);color:var(--g200);padding:12px 24px;border-radius:10px;font-family:var(--ui);font-size:13px;font-weight:700;z-index:9999;transition:transform .35s;box-shadow:0 4px 24px rgba(36,5,6,.3);display:flex;align-items:center;gap:8px}
.notif-toast.show{transform:translateX(-50%) translateY(0)}

/* ── Order detail modal ── */
.modal-bg{position:fixed;inset:0;background:rgba(36,5,6,.55);z-index:8000;display:flex;align-items:center;justify-content:center;padding:16px}
.modal-box{background:#fffaf0;border-radius:16px;width:100%;max-width:580px;max-height:88vh;overflow-y:auto;padding:28px;box-shadow:0 24px 64px rgba(36,5,6,.28)}
.modal-box h2{font-family:var(--display);font-size:1.5rem;color:var(--m900);display:flex;align-items:center;justify-content:space-between;margin-bottom:20px}
.modal-box h2 button{background:none;border:none;font-size:20px;cursor:pointer;color:var(--muted)}
.od-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:20px}
.od-f{display:flex;flex-direction:column;gap:3px}
.od-f label{font-family:var(--ui);font-size:9px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)}
.od-f span{font-size:13px;color:var(--ink);font-weight:500}
.status-sel{border:1.5px solid var(--border);border-radius:7px;padding:5px 10px;font-family:var(--ui);font-size:12px;color:var(--ink);background:#fff;cursor:pointer}

/* ── Buttons ── */
.btn-sm{padding:7px 14px;font-size:11px;letter-spacing:.05em;border-radius:7px;font-family:var(--ui);font-weight:700;cursor:pointer;border:1.5px solid transparent;transition:all .18s}
.btn-outline{background:#fff;border-color:var(--border);color:var(--ink)}
.btn-outline:hover{border-color:var(--m700);color:var(--m700)}
.btn-red{background:#dc2626;color:#fff;border-color:#dc2626}
.btn-red:hover{background:#b91c1c}
.btn-dark{background:var(--m900);color:var(--g200);border-color:var(--m900)}
.btn-dark:hover{background:var(--m950)}

/* ── Suggestion cards ── */
.suggest-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px;margin-bottom:28px}
.suggest-card{background:#fff;border:1.5px solid var(--border);border-radius:12px;padding:18px 20px;position:relative;overflow:hidden}
.suggest-card::before{content:"";position:absolute;top:0;left:0;width:4px;height:100%;background:var(--m700)}
.suggest-card.urgent::before{background:#dc2626}
.suggest-card.gold::before{background:var(--g600)}
.sc-icon{font-size:22px;margin-bottom:8px}
.sc-title{font-family:var(--ui);font-size:11px;font-weight:700;color:var(--m900);letter-spacing:.04em;margin-bottom:4px}
.sc-body{font-family:var(--ui);font-size:11px;color:var(--muted);line-height:1.6}

/* ── Responsive ── */
@media(max-width:760px){
  .otable-head,.orow{grid-template-columns:90px 1fr 80px 90px}
  .otable-head>:nth-child(4),.orow>:nth-child(4),
  .otable-head>:last-child,.orow>:last-child{display:none}
  .od-grid{grid-template-columns:1fr}
  .stats-grid{grid-template-columns:1fr 1fr}
}
@media(max-width:480px){
  .otable-head,.orow{grid-template-columns:80px 1fr 70px}
  .otable-head>:nth-child(3)~*,.orow>:nth-child(3)~*{display:none}
}

/* ── Form layout ── */
.frow2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.fld label{display:block;font-family:var(--ui);font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin-bottom:5px}
.fld input,.fld select{width:100%;padding:9px 12px;border:1.5px solid var(--border);border-radius:7px;fontFamily:var(--ui);font-size:13px;color:var(--ink);outline:none;background:#fff}
.fld input:focus,.fld select:focus{border-color:var(--m700)}
@media(max-width:540px){.frow2{grid-template-columns:1fr}}

/* ── Admin full-screen ── */
.admin-root{min-height:100vh;background:var(--cr1)}
`;

const LOCAL_ADMIN = {
  username: "Owner@#$@#$",
  password: "Owner@#@$@#$@#$@#$@%#@#$@#$#@$@#$@#$@#$@#$@$%#@#$@#$#@$@#$@#$@#$@#@%#",
  displayName: "Owner@#$@#$",
};

// ─── AdminPage ────────────────────────────────────────────────────────────────
export default function AdminPage({ navigate }) {
  // ── local auth state ───────────────────────────────────────────────────────
  const [adminProfile, setAdminProfile] = useState(null); // null = not logged in
  const [authErr,      setAuthErr]      = useState("");
  const [signingIn,    setSigningIn]    = useState(false);
  const [localUser,    setLocalUser]    = useState(LOCAL_ADMIN.username);
  const [localPass,    setLocalPass]    = useState(LOCAL_ADMIN.password);

  // ── Rate limiting ──────────────────────────────────────────────────────────
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutUntil,   setLockoutUntil]   = useState(null); // timestamp ms

  const handleLocalLogin = () => {
    setAuthErr("");
    const now = Date.now();
    if (lockoutUntil && now < lockoutUntil) {
      setAuthErr('Too many attempts. Please wait before retrying.');
      return;
    }

    const enteredUser = localUser.trim();
    const enteredPass = localPass.trim();
    if (enteredUser === LOCAL_ADMIN.username && enteredPass === LOCAL_ADMIN.password) {
      setAdminProfile({ uid: 'local-owner', displayName: LOCAL_ADMIN.displayName, role: 'owner', local: true });
      setFailedAttempts(0);
      setLockoutUntil(null);
      return;
    }

    const attempts = failedAttempts + 1;
    setFailedAttempts(attempts);
    if (attempts >= 5) {
      setLockoutUntil(now + 5 * 60 * 1000);
      setAuthErr('Too many failed attempts. Locked for 5 minutes.');
    } else {
      setAuthErr('Invalid local credentials.');
    }
  };

  const handleAutoLocalLogin = () => {
    setLocalUser(LOCAL_ADMIN.username);
    setLocalPass(LOCAL_ADMIN.password);
    handleLocalLogin();
  };

  // ── Session timeout (30 min) ───────────────────────────────────────────────
  const sessionTimer = useRef(null);
  const SESSION_MS = 30 * 60 * 1000;
  const resetSessionTimer = () => {
    clearTimeout(sessionTimer.current);
    sessionTimer.current = setTimeout(() => {
      setAdminProfile(null);
      setOrders([]);
      lastCountRef.current = 0;
    }, SESSION_MS);
  };
  useEffect(() => {
    if (!adminProfile) { clearTimeout(sessionTimer.current); return; }
    resetSessionTimer();
    const events = ["mousemove","keydown","click","scroll"];
    events.forEach(e => window.addEventListener(e, resetSessionTimer));
    return () => {
      clearTimeout(sessionTimer.current);
      events.forEach(e => window.removeEventListener(e, resetSessionTimer));
    };
  }, [adminProfile]);

  // Listen to Firebase auth state and set adminProfile if user is in admins collection
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { setAdminProfile(null); return; }
      try {
        const aDoc = await getDoc(doc(db, 'admins', user.uid));
        if (aDoc.exists()) {
          setAdminProfile({ uid: user.uid, displayName: user.displayName || user.email, ...aDoc.data() });
        } else {
          // not an admin
          setAdminProfile(null);
          await signOut(auth);
        }
      } catch (e) { console.error(e); }
    });
    return unsub;
  }, []);

  // ── panel state ────────────────────────────────────────────────────────────
  const [orders,     setOrders]     = useState([]);
  const [selected,   setSelected]   = useState(null);
  const [notifToast, setNotifToast] = useState("");
  const [activeTab,  setActiveTab]  = useState("orders");
  const [searchQ,    setSearchQ]    = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const lastCountRef = useRef(0);

  // ── Firestore orders listener ──────────────────────────────────────────────
  useEffect(() => {
    if (!adminProfile) return;
    const q = query(collection(db, "orders"), orderBy("timestamp", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map((d) => ({ firestoreId: d.id, ...d.data() }));
      const newCount = docs.filter((o) => o.status === "new").length;
      if (lastCountRef.current > 0 && newCount > lastCountRef.current) {
        setNotifToast("🛍 New order received!");
        setTimeout(() => setNotifToast(""), 3500);
      }
      lastCountRef.current = newCount;
      setOrders(docs);
    });
    return unsub;
  }, [adminProfile]);

  // ── Login using Firebase Google sign-in ───────────────────────────────────
  const handleLogin = async () => {
    setAuthErr("");
    setSigningIn(true);
    try {
      const user = await signInWithGooglePopup();
      // If no admins exist, bootstrap this user as owner
      const adminsSnap = await getDocs(collection(db, 'admins'));
      if (adminsSnap.empty) {
        await setDoc(doc(db, 'admins', user.uid), { role: 'owner', displayName: user.displayName || user.email, createdAt: serverTimestamp() });
        setAdminProfile({ uid: user.uid, displayName: user.displayName || user.email, role: 'owner' });
        return;
      }
      // Otherwise check this user exists in admins collection
      const aDoc = await getDoc(doc(db, 'admins', user.uid));
      if (aDoc.exists()) {
        setAdminProfile({ uid: user.uid, displayName: user.displayName || user.email, ...aDoc.data() });
      } else {
        setAuthErr('Your account is not registered as an admin.');
        await signOut(auth);
      }
    } catch (e) {
      setAuthErr(e.message || 'Sign-in failed');
    } finally { setSigningIn(false); }
  };

  // ── Logout ─────────────────────────────────────────────────────────────────
  const handleLogout = () => {
    setAdminProfile(null);
    setOrders([]);
    lastCountRef.current = 0;
    clearTimeout(sessionTimer.current);
    signOut(auth).catch(()=>{});
  };

  // ── Update order status ────────────────────────────────────────────────────
  const updateStatus = async (firestoreId, status) => {
    if (adminProfile?.role !== "owner") return;
    try {
      await updateDoc(doc(db, "orders", firestoreId), { status });
      if (selected?.firestoreId === firestoreId) setSelected((p) => ({ ...p, status }));
    } catch (e) { console.error("Status update failed:", e); }
  };

  // ── LOGIN SCREEN ───────────────────────────────────────────────────────────
  if (!adminProfile) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: ADMIN_CSS }} />
        <div className="admin-login">
          <div style={{ textAlign:"center", marginBottom:18 }}>
            <img src="./assets/logo.jpg" alt="Label-Sanj"
              style={{ width:64, height:64, objectFit:"contain", borderRadius:12, margin:"0 auto 10px", display:"block", boxShadow:"0 4px 16px rgba(36,5,6,.12)" }} />
            <h1>Admin Panel</h1>
            <p className="sub">Label-Sanj · Owner Access</p>
          </div>

          <div className="lbox">
            {authErr && <div className="lerr">⚠ {authErr}</div>}
            {lockoutUntil && Date.now() < lockoutUntil && (
              <div className="lerr" style={{ background:"#fef3c7", color:"#92400e" }}>
                🔒 Account locked. Please wait before retrying.
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <div className="fld" style={{ marginBottom: 12 }}>
                <label>Username</label>
                <input type="text" value={localUser} onChange={(e) => setLocalUser(e.target.value)} placeholder="Owner@#$@#$" />
              </div>
              <div className="fld" style={{ marginBottom: 16 }}>
                <label>Password</label>
                <input type="password" value={localPass} onChange={(e) => setLocalPass(e.target.value)} placeholder="Enter your password" />
              </div>
              <button
                style={{ width:"100%", marginTop:0, padding:"13px", background:"#111827", color:"#fff", border:"none", borderRadius:9, fontFamily:"var(--ui)", fontSize:13, fontWeight:700, letterSpacing:".06em", cursor:"pointer", transition:"background .2s" }}
                onClick={handleLocalLogin}
              >
                Sign in locally
              </button>
              <button
                style={{ width:"100%", marginTop:12, padding:"13px", background:"#10b981", color:"#fff", border:"none", borderRadius:9, fontFamily:"var(--ui)", fontSize:13, fontWeight:700, letterSpacing:".06em", cursor:"pointer", transition:"background .2s" }}
                onClick={handleAutoLocalLogin}
              >
                Use exact local credentials
              </button>
            </div>
            <div style={{ marginBottom: 8 }}>
              <p style={{ fontFamily:"var(--ui)", fontSize:13, color:"var(--muted)" }}>Use local owner credentials if Firebase Auth is unavailable.</p>
              <button
                style={{ width:"100%", marginTop:8, padding:"13px", background:"#4285F4", color:"#fff", border:"none", borderRadius:9, fontFamily:"var(--ui)", fontSize:13, fontWeight:700, letterSpacing:".06em", cursor:"pointer", transition:"background .2s" }}
                onClick={handleLogin}
                disabled={signingIn}
              >
                {signingIn ? "Signing in…" : "Sign in with Google"}
              </button>
            </div>

            <div className="hint-box" style={{ marginTop:18 }}>
              <p>🔐 <strong>Owner access only.</strong> Contact Gaurav for credentials. This panel is for order management and business operations.</p>
            </div>
            <div style={{ textAlign:"center", marginTop:16 }}>
              <button onClick={() => navigate && navigate("home")}
                style={{ background:"none", border:"none", color:"var(--muted)", fontFamily:"var(--ui)", fontSize:11, cursor:"pointer", textDecoration:"underline" }}>
                ← Back to Store
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ── LOGGED IN — derive data ────────────────────────────────────────────────
  const isOwner  = adminProfile.role === "owner";
  const todayStr = today();

  const visibleOrders = (isOwner ? orders : orders.filter((o) => o.status === "new" || o.status === "processing"))
    .filter((o) => {
      const matchStatus = filterStatus === "all" || o.status === filterStatus;
      const q = searchQ.toLowerCase();
      const matchSearch = !q || (o.id||"").toLowerCase().includes(q) ||
        (o.customer?.name||"").toLowerCase().includes(q) ||
        (o.customer?.phone||"").includes(q) ||
        (o.customer?.city||"").toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });

  const newOrders = orders.filter((o) => o.status === "new");
  const totalRev  = orders.filter((o) => o.status !== "cancelled").reduce((s,o) => s + (o.total||0), 0);
  const todayRev  = orders.filter((o) => o.date === todayStr && o.status !== "cancelled").reduce((s,o) => s + (o.total||0), 0);
  const pendingShip = orders.filter((o) => o.status === "processing").length;

  // ── Suggestions ────────────────────────────────────────────────────────────
  const suggestions = [];
  if (newOrders.length > 0)
    suggestions.push({ type:"urgent", icon:"🔔", title:`${newOrders.length} New Order${newOrders.length>1?"s":""} Awaiting`, body:"Review and confirm these orders. Process payment and update status to 'Processing' to start fulfillment." });
  if (pendingShip > 0)
    suggestions.push({ type:"", icon:"📦", title:`${pendingShip} Order${pendingShip>1?"s":""} Ready to Ship`, body:"Mark these as 'Shipped' and share tracking details with customers via phone or WhatsApp." });
  if (totalRev > 0 && orders.filter(o=>o.status==="delivered").length > 0)
    suggestions.push({ type:"gold", icon:"📊", title:"Revenue Tip", body:`₹${Math.round(totalRev*0.15).toLocaleString("en-IN")} can be reinvested in inventory. Your best-selling category drives repeat buyers.` });
  if (orders.filter(o=>o.status==="cancelled").length > 2)
    suggestions.push({ type:"urgent", icon:"⚠️", title:"High Cancellation Rate", body:"Consider adding COD + instant WhatsApp confirmation to reduce cancellations. Reach out to cancelled customers." });

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: ADMIN_CSS }} />
      <div className="admin-root">

    

      {/* ── Top bar: name + role + session info ── */}
      <div style={{
        position:"fixed", top:14, right:18, zIndex:300,
        display:"flex", alignItems:"center", gap:8,
        background:"rgba(255,250,240,.97)", border:"1px solid var(--border)",
        borderRadius:9, padding:"6px 14px", fontFamily:"var(--ui)", fontSize:11,
        boxShadow:"0 2px 10px rgba(49,8,8,.08)"
      }}>
        <span style={{ fontWeight:700, color:"var(--m900)" }}>{adminProfile.displayName}</span>
        <span style={{
          background: isOwner ? "var(--m700)" : "var(--g700)",
          color:"#fff", padding:"2px 7px", borderRadius:4,
          fontSize:9, fontWeight:700, letterSpacing:".06em", textTransform:"uppercase"
        }}>{adminProfile.role}</span>
        <span style={{ fontSize:9, color:"var(--muted)", marginLeft:2 }}>🔒 30-min session</span>
      </div>

      {/* ── Order detail modal ── */}
      {selected && (
        <div className="modal-bg" onClick={(e) => e.target===e.currentTarget && setSelected(null)}>
          <div className="modal-box">
            <h2>
              Order Details
              <button onClick={() => setSelected(null)}>✕</button>
            </h2>
            <div className="od-grid">
              <div className="od-f"><label>Order ID</label><span style={{ fontWeight:700, color:"var(--m800)" }}>{selected.id}</span></div>
              <div className="od-f"><label>Date</label><span>{selected.date}</span></div>
              <div className="od-f"><label>Customer Name</label><span>{selected.customer?.name}</span></div>
              <div className="od-f"><label>Mobile</label><span>+91 {selected.customer?.phone}</span></div>
              {isOwner && <div className="od-f"><label>Email</label><span>{selected.customer?.email||"—"}</span></div>}
              <div className="od-f"><label>Total</label><span style={{ fontWeight:700, fontSize:17, color:"var(--m900)" }}>{fmt(selected.total)}</span></div>
              <div className="od-f" style={{ gridColumn:"span 2" }}>
                <label>Delivery Address</label>
                <span>{selected.customer?.address}, {selected.customer?.city}, {selected.customer?.state} – {selected.customer?.pincode}{selected.customer?.landmark ? ` (Near: ${selected.customer.landmark})` : ""}</span>
              </div>
              {isOwner && (
                <>
                  <div className="od-f">
                    <label>Payment Method</label>
                    <span style={{ textTransform:"capitalize" }}>{selected.payment?.upiApp||selected.payment?.bank||selected.payment?.method}</span>
                  </div>
                  <div className="od-f">
                    <label>Update Status</label>
                    <select className="status-sel" value={selected.status}
                      onChange={(e) => updateStatus(selected.firestoreId, e.target.value)}>
                      {STATUS.map((s) => (
                        <option key={s} value={s} style={{ textTransform:"capitalize" }}>
                          {s.charAt(0).toUpperCase()+s.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}
              {!isOwner && (
                <div className="od-f"><label>Status</label><span><span className={`sbadge ${statusClass[selected.status]||"s-new"}`}>{selected.status}</span></span></div>
              )}
            </div>

            <h3 style={{ fontFamily:"var(--ui)", fontSize:11, fontWeight:700, letterSpacing:".1em", textTransform:"uppercase", color:"var(--muted)", marginBottom:12 }}>
              Items Ordered
            </h3>
            {(selected.items||[]).map((it,i) => (
              <div key={i} style={{ display:"grid", gridTemplateColumns:"50px 1fr auto", gap:10, padding:"9px 0", borderBottom:"1px solid var(--border)", alignItems:"center" }}>
                <img src={it.image} alt={it.name} style={{ width:50, height:50, objectFit:"cover", borderRadius:7 }} />
                <div>
                  <p style={{ fontSize:13, fontWeight:600, color:"var(--ink)" }}>{it.name}</p>
                  <p style={{ fontSize:11, color:"var(--muted)" }}>Color: {it.color} · Qty: {it.qty}</p>
                </div>
                <span style={{ fontFamily:"var(--ui)", fontSize:13, fontWeight:700, color:"var(--m900)" }}>{fmt(it.price*it.qty)}</span>
              </div>
            ))}

            <div style={{ marginTop:12, padding:"12px 0", borderTop:"1px solid var(--border)" }}>
              {selected.discount>0 && (
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:"#276749", marginBottom:4 }}>
                  <span>Bundle Discount</span><span>−{fmt(selected.discount)}</span>
                </div>
              )}
              <div style={{ display:"flex", justifyContent:"space-between", fontFamily:"var(--ui)", fontSize:14, fontWeight:700, color:"var(--m900)" }}>
                <span>Order Total</span><span>{fmt(selected.total)}</span>
              </div>
            </div>

            {isOwner && (
              <div style={{ display:"flex", gap:8, marginTop:18, justifyContent:"flex-end", flexWrap:"wrap" }}>
                {["processing","shipped","delivered"].map((s) => (
                  <button key={s} className="btn-sm btn-outline" onClick={() => updateStatus(selected.firestoreId, s)} style={{ textTransform:"capitalize" }}>{s}</button>
                ))}
                <button className="btn-sm btn-red" onClick={() => updateStatus(selected.firestoreId,"cancelled")}>Cancel Order</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Main panel ── */}
      <div className="admin-wrap">
        <div className="admin-header">
          <div>
            <h1>Welcome, {adminProfile.displayName} 👋</h1>
            <p style={{ fontFamily:"var(--ui)", fontSize:11, color:"var(--muted)", letterSpacing:".05em" }}>
              Label-Sanj Order Management {isOwner && `· ${orders.length} total orders`}
            </p>
          </div>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            {isOwner && (
              <>
                <button className={`btn-sm ${activeTab==="orders"?"btn-dark":"btn-outline"}`} onClick={()=>setActiveTab("orders")}>📦 Orders</button>
                <button className={`btn-sm ${activeTab==="products"?"btn-dark":"btn-outline"}`} onClick={()=>setActiveTab("products")}>🛍 Products</button>
              </>
            )}
            <button className="btn-sm btn-outline" onClick={() => navigate && navigate("home")}>← Store</button>
            <button className="btn-sm btn-dark" onClick={handleLogout}>Logout</button>
          </div>
        </div>

        {/* ── Suggestions ── */}
        {activeTab==="orders" && suggestions.length>0 && (
          <>
            <p style={{ fontFamily:"var(--ui)", fontSize:10, fontWeight:700, letterSpacing:".12em", color:"var(--muted)", textTransform:"uppercase", marginBottom:10 }}>
              💡 Suggestions & Alerts
            </p>
            <div className="suggest-grid">
              {suggestions.map((s,i) => (
                <div key={i} className={`suggest-card ${s.type}`}>
                  <div className="sc-icon">{s.icon}</div>
                  <div className="sc-title">{s.title}</div>
                  <div className="sc-body">{s.body}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ════ ORDERS TAB ════ */}
        {activeTab==="orders" && (
          <>
            {/* Stats */}
            <div className="stats-grid">
              <div className={`scard${newOrders.length>0?" new-card":""}`}>
                <div className="snum">{newOrders.length}</div>
                <div className="slbl">New Orders 🔔</div>
              </div>
              <div className="scard">
                <div className="snum">{orders.filter(o=>o.status==="processing").length}</div>
                <div className="slbl">Processing</div>
              </div>
              {isOwner && (
                <>
                  <div className="scard">
                    <div className="snum">{orders.filter(o=>o.status==="shipped").length}</div>
                    <div className="slbl">Shipped</div>
                  </div>
                  <div className="scard">
                    <div className="snum">{orders.filter(o=>o.status==="delivered").length}</div>
                    <div className="slbl">Delivered ✓</div>
                  </div>
                  <div className="scard hl">
                    <div className="snum">{fmt(todayRev)}</div>
                    <div className="slbl">Today's Revenue</div>
                  </div>
                  <div className="scard hl">
                    <div className="snum">{fmt(totalRev)}</div>
                    <div className="slbl">Total Revenue</div>
                  </div>
                </>
              )}
            </div>

            {/* Search + filter bar */}
            <div style={{ display:"flex", gap:10, marginBottom:16, flexWrap:"wrap" }}>
              <input
                placeholder="🔍  Search by order ID, name, phone, city…"
                value={searchQ} onChange={e=>setSearchQ(e.target.value)}
                style={{ flex:1, minWidth:200, padding:"9px 14px", border:"1.5px solid var(--border)", borderRadius:8, fontFamily:"var(--ui)", fontSize:13, color:"var(--ink)", outline:"none", background:"#fff" }}
              />
              <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}
                style={{ padding:"9px 14px", border:"1.5px solid var(--border)", borderRadius:8, fontFamily:"var(--ui)", fontSize:12, color:"var(--ink)", background:"#fff", cursor:"pointer" }}>
                <option value="all">All Statuses</option>
                {STATUS.map(s=><option key={s} value={s} style={{ textTransform:"capitalize" }}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
              </select>
            </div>

            {/* Orders table */}
            <div className="orders-wrap">
              <div className="otable-head">
                <div>Order ID</div><div>Customer</div><div>Amount</div>
                {isOwner && <div>Payment</div>}
                <div>Status</div><div>Date</div>
              </div>
              {!visibleOrders.length && (
                <div style={{ textAlign:"center", padding:"48px", color:"var(--muted)" }}>
                  <div style={{ fontSize:36, marginBottom:10 }}>📦</div>
                  <p style={{ fontFamily:"var(--ui)", fontSize:13, fontWeight:600 }}>
                    {searchQ||filterStatus!=="all" ? "No orders match your search." : isOwner ? "No orders yet. Share your store!" : "No pending orders right now."}
                  </p>
                </div>
              )}
              {visibleOrders.map((o) => (
                <div key={o.firestoreId} className={`orow${o.status==="new"?" new-row":""}`} onClick={()=>setSelected(o)}>
                  <div className="or-id">
                    {o.id}
                    {o.status==="new" && <span style={{ display:"inline-block", width:6, height:6, background:"#e53e3e", borderRadius:"50%", marginLeft:5, verticalAlign:"middle" }} />}
                  </div>
                  <div>
                    <div className="or-name">{o.customer?.name}</div>
                    <div className="or-items">{(o.items||[]).length} item{(o.items||[]).length!==1?"s":""} · {o.customer?.city}</div>
                  </div>
                  <div className="or-amt">{fmt(o.total)}</div>
                  {isOwner && <div className="or-pay" style={{ textTransform:"capitalize" }}>{o.payment?.upiApp||o.payment?.bank||o.payment?.method||"—"}</div>}
                  <div><span className={`sbadge ${statusClass[o.status]||"s-new"}`}>{o.status}</span></div>
                  <div className="or-pay">{o.date}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ════ PRODUCTS TAB ════ */}
        {activeTab==="products" && isOwner && <ProductManager />}
      </div>
      </div>{/* /admin-root */}
    </>
  );
}

// ─── ProductManager ───────────────────────────────────────────────────────────
function ProductManager() {
  const [products,  setProducts]  = useState([]);
  const [editing,   setEditing]   = useState(null);
  const [saving,    setSaving]    = useState(false);
  const [deleting,  setDeleting]  = useState(null); // firestoreId being deleted
  const [confirmDel, setConfirmDel] = useState(null); // product to confirm-delete
  const [msg,       setMsg]       = useState("");
  const [search,    setSearch]    = useState("");

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "products"), (snap) => {
      setProducts(snap.docs.map((d) => ({ firestoreId: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  const save = async () => {
    if (!editing) return;
    if (!editing.name?.trim()) { setMsg("✗ Product name is required."); return; }
    setSaving(true);
    try {
      if (editing.firestoreId) {
        const { firestoreId, ...data } = editing;
        await updateDoc(doc(db, "products", firestoreId), { ...data, updatedAt: serverTimestamp() });
      } else {
        await addDoc(collection(db, "products"), { ...editing, createdAt: serverTimestamp() });
      }
      setMsg("✓ Saved successfully"); setEditing(null);
      setTimeout(() => setMsg(""), 2500);
    } catch (e) {
      setMsg("✗ Save failed: " + e.message);
    } finally { setSaving(false); }
  };

  const deleteProduct = async (p) => {
    setDeleting(p.firestoreId);
    try {
      await deleteDoc(doc(db, "products", p.firestoreId));
      setMsg("✓ Product deleted");
      setTimeout(() => setMsg(""), 2500);
    } catch (e) {
      setMsg("✗ Delete failed: " + e.message);
    } finally { setDeleting(null); setConfirmDel(null); }
  };

  const BLANK = { name:"", fabric:"", price:"", original:"", badge:"", rating:"", description:"", colors:[], images:[], tags:[], category:"" };

  const filtered = products.filter(p =>
    !search || (p.name||"").toLowerCase().includes(search.toLowerCase()) ||
    (p.fabric||"").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Delete confirm modal */}
      {confirmDel && (
        <div className="modal-bg" onClick={() => setConfirmDel(null)}>
          <div className="modal-box" style={{ maxWidth:380 }} onClick={e=>e.stopPropagation()}>
            <h2 style={{ fontSize:"1.2rem" }}>Delete Product? <button onClick={()=>setConfirmDel(null)}>✕</button></h2>
            <p style={{ fontFamily:"var(--ui)", fontSize:13, color:"var(--muted)", marginBottom:20 }}>
              Are you sure you want to delete <strong style={{ color:"var(--ink)" }}>{confirmDel.name}</strong>? This cannot be undone.
            </p>
            <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
              <button className="btn-sm btn-outline" onClick={()=>setConfirmDel(null)}>Cancel</button>
              <button className="btn-sm btn-red" onClick={()=>deleteProduct(confirmDel)} disabled={!!deleting}>
                {deleting===confirmDel.firestoreId ? "Deleting…" : "Delete Product"}
              </button>
            </div>
          </div>
        </div>
      )}

      {msg && (
        <div style={{ background:msg.startsWith("✓")?"#d1fae5":"#fee2e2", color:msg.startsWith("✓")?"#065f46":"#991b1b", padding:"10px 16px", borderRadius:8, marginBottom:16, fontFamily:"var(--ui)", fontSize:12, fontWeight:700 }}>
          {msg}
        </div>
      )}

      {/* Edit / Add form */}
      {editing && (
        <div style={{ background:"#fff", border:"1.5px solid var(--border)", borderRadius:14, padding:24, marginBottom:24 }}>
          <h3 style={{ fontFamily:"var(--display)", fontSize:"1.3rem", color:"var(--m900)", marginBottom:18 }}>
            {editing.firestoreId ? "✏️ Edit Product" : "➕ New Product"}
          </h3>
          <div className="frow2">
            {[["name","Product Name *"],["fabric","Fabric"],["price","Sale Price (₹)"],["original","Original Price (₹)"],["badge","Badge (e.g. 89% OFF)"],["rating","Rating (e.g. 4.5)"]].map(([f,l]) => (
              <div className="fld" key={f}>
                <label>{l}</label>
                <input value={editing[f]||""} onChange={e=>setEditing({...editing,[f]:e.target.value})} type={["price","original","rating"].includes(f)?"number":"text"} />
              </div>
            ))}
          </div>
          <div className="fld" style={{ marginTop:8 }}>
            <label>Category (e.g. saree, dress, set)</label>
            <input value={editing.category||""} onChange={e=>setEditing({...editing,category:e.target.value})} placeholder="saree" />
          </div>
          <div className="fld" style={{ marginTop:8 }}>
            <label>Description</label>
            <textarea rows={3} value={editing.description||""} onChange={e=>setEditing({...editing,description:e.target.value})}
              style={{ width:"100%", padding:"8px 12px", border:"1.5px solid var(--border)", borderRadius:8, resize:"vertical", fontFamily:"var(--body)" }} />
          </div>
          <div className="frow2" style={{ marginTop:8 }}>
            <div className="fld">
              <label>Colors (comma separated)</label>
              <input value={Array.isArray(editing.colors)?editing.colors.join(", "):(editing.colors||"")} onChange={e=>setEditing({...editing,colors:e.target.value.split(",").map(s=>s.trim()).filter(Boolean)})} placeholder="Wine Maroon, Emerald, Gold" />
            </div>
            <div className="fld">
              <label>Tags (comma separated)</label>
              <input value={Array.isArray(editing.tags)?editing.tags.join(", "):(editing.tags||"")} onChange={e=>setEditing({...editing,tags:e.target.value.split(",").map(s=>s.trim()).filter(Boolean)})} placeholder="new, trending, festive, brocade" />
            </div>
          </div>
          <div className="fld" style={{ marginTop:8 }}>
            <label>Image URLs (one per line or comma separated) — or upload</label>
            <textarea rows={3} value={Array.isArray(editing.images)?editing.images.join("\n"):(editing.images||"")} onChange={e=>setEditing({...editing,images:e.target.value.split(/[\n,]+/).map(s=>s.trim()).filter(Boolean)})}
              style={{ width:"100%", padding:"8px 12px", border:"1.5px solid var(--border)", borderRadius:8, resize:"vertical", fontFamily:"var(--body)", fontSize:12 }}
              placeholder="https://images.example.com/photo-1.jpg&#10;https://images.example.com/photo-2.jpg" />
            <div style={{ display:'flex', gap:8, marginTop:8, alignItems:'center' }}>
              <input id="prod-image-file" type="file" accept="image/*" style={{ display:'none' }} onChange={async (e)=>{
                const f = e.target.files && e.target.files[0];
                if(!f) return;
                try {
                  const url = await uploadFile(f, `products/${Date.now()}_${f.name}`);
                  setEditing((s)=>({ ...s, images: Array.isArray(s.images)?[...s.images, url]:[...(s.images? [s.images] : []), url] }));
                } catch(err){ console.error('Upload failed', err); setMsg('✗ Image upload failed'); }
                e.target.value = null;
              }} />
              <label htmlFor="prod-image-file" className="btn-sm btn-outline" style={{ display:'inline-block', padding:'8px 12px', cursor:'pointer' }}>Upload Image</label>
              <span style={{ fontSize:12, color:'var(--muted)' }}>Or paste image URLs above.</span>
            </div>
          </div>
          {/* Image preview */}
          {(Array.isArray(editing.images) ? editing.images : []).filter(Boolean).length > 0 && (
            <div style={{ display:"flex", gap:8, marginTop:8, flexWrap:"wrap" }}>
              {(Array.isArray(editing.images)?editing.images:[]).filter(Boolean).slice(0,5).map((url,i) => (
                <img key={i} src={url} alt="" onError={e=>e.target.style.display="none"}
                  style={{ width:64, height:64, objectFit:"cover", borderRadius:7, border:"1.5px solid var(--border)" }} />
              ))}
            </div>
          )}
          <div style={{ display:"flex", gap:8, marginTop:18, justifyContent:"flex-end" }}>
            <button className="btn-sm btn-outline" onClick={()=>setEditing(null)}>Cancel</button>
            <button className="btn-sm btn-dark" onClick={save} disabled={saving}>{saving?"Saving…":"Save Product"}</button>
          </div>
        </div>
      )}

      {/* Header row */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14, flexWrap:"wrap", gap:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <p style={{ fontFamily:"var(--ui)", fontSize:11, color:"var(--muted)", fontWeight:700, letterSpacing:".08em", textTransform:"uppercase" }}>
            {filtered.length} / {products.length} Products
          </p>
          <input placeholder="🔍 Search products…" value={search} onChange={e=>setSearch(e.target.value)}
            style={{ padding:"6px 12px", border:"1.5px solid var(--border)", borderRadius:7, fontFamily:"var(--ui)", fontSize:12, color:"var(--ink)", outline:"none", background:"#fff" }} />
        </div>
        <button className="btn-sm btn-dark" onClick={()=>setEditing(BLANK)}>
          + Add Product
        </button>
      </div>

      {/* Product list */}
      <div className="orders-wrap">
        {!filtered.length && (
          <div style={{ textAlign:"center", padding:"40px", color:"var(--muted)" }}>
            <div style={{ fontSize:32, marginBottom:8 }}>🛍</div>
            <p style={{ fontFamily:"var(--ui)", fontSize:13, fontWeight:600 }}>No products found.</p>
          </div>
        )}
        {filtered.map((p) => (
          <div key={p.firestoreId} style={{ display:"grid", gridTemplateColumns:"60px 1fr auto auto auto", gap:12, padding:"12px 18px", borderTop:"1px solid var(--border)", alignItems:"center" }}>
            {/* Thumbnail */}
            <img src={Array.isArray(p.images)?p.images[0]:p.images} alt={p.name}
              onError={e=>{e.target.src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Crect fill='%23f3e8d0' width='60' height='60'/%3E%3Ctext y='35' x='18' font-size='20'%3E🛍%3C/text%3E%3C/svg%3E"}}
              style={{ width:60, height:60, objectFit:"cover", borderRadius:8 }} />
            {/* Info */}
            <div>
              <p style={{ fontSize:13, fontWeight:600, color:"var(--ink)", marginBottom:2 }}>{p.name}</p>
              <p style={{ fontFamily:"var(--ui)", fontSize:11, color:"var(--muted)" }}>
                {p.fabric} · <strong style={{ color:"var(--m800)" }}>₹{p.price}</strong>
                {p.original && <span style={{ color:"#9ca3af", textDecoration:"line-through", marginLeft:4 }}>₹{p.original}</span>}
              </p>
              {Array.isArray(p.tags) && p.tags.length>0 && (
                <p style={{ fontFamily:"var(--ui)", fontSize:10, color:"var(--g700)", marginTop:2 }}>
                  {p.tags.slice(0,4).map(t=>`#${t}`).join(" ")}
                </p>
              )}
            </div>
            {/* Badge */}
            <span style={{ fontFamily:"var(--ui)", fontSize:10, fontWeight:700, color:"var(--g700)", background:"var(--g200)", padding:"2px 8px", borderRadius:99, whiteSpace:"nowrap" }}>
              {p.badge||"—"}
            </span>
            {/* Edit */}
            <button className="btn-sm btn-outline" onClick={()=>setEditing(p)}>Edit</button>
            {/* Delete */}
            <button className="btn-sm btn-red" onClick={()=>setConfirmDel(p)} disabled={deleting===p.firestoreId}>
              {deleting===p.firestoreId ? "…" : "Delete"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
