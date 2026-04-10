import { useState, useEffect, useRef } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBiAsz4GbVedPvQgziWsKDbR9ej18nj9Oo",
  authDomain: "damastic-8bb8b.firebaseapp.com",
  projectId: "damastic-8bb8b",
  storageBucket: "damastic-8bb8b.firebasestorage.app",
  messagingSenderId: "801898641235",
  appId: "1:801898641235:web:43e8c66aa32b0818ea53a6",
  measurementId: "G-GWTEZ3NF75"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const C = {
  bg: "#080C16",
  surface: "#0E1420",
  card: "#141C2E",
  card2: "#1A2438",
  border: "#1E2D45",
  accent: "#00D48A",
  accentDim: "#00D48A18",
  accentGlow: "#00D48A55",
  warn: "#F59E0B",
  danger: "#F04444",
  blue: "#4A90FF",
  blueDim: "#4A90FF18",
  purple: "#9B72FF",
  text: "#EEF2FF",
  sub: "#7A8BA8",
  muted: "#3A4A60",
};

const DRIVERS_MAP = [
  { id: 1, name: "Alisher", bx: 62, by: 100, color: "#4A90FF" },
  { id: 2, name: "Bobur",   bx: 105, by: 103, color: "#F59E0B" },
  { id: 3, name: "Jasur",   bx: 160, by: 100, color: "#9B72FF" },
  { id: 4, name: "Siz",     bx: 210, by: 97,  color: "#00D48A" },
];

const QUEUE_DATA = [
  { pos: 1, name: "Alisher D.", car: "01A 234 BC" },
  { pos: 2, name: "Bobur R.",   car: "40F 567 XA" },
  { pos: 3, name: "Jasur M.",   car: "30B 891 KL" },
  { pos: 4, name: "Siz",        car: "10A 111 UZ", isYou: true },
];

// ─── Utils ───────────────────────────────────────────────────
function pad(n) { return String(n).padStart(2, "0"); }
function formatTime(d) { return `${pad(d.getHours())}:${pad(d.getMinutes())}`; }
function formatDate(d) { return `${pad(d.getDate())}.${pad(d.getMonth()+1)}.${d.getFullYear()}`; }

// ─── Mini Map ────────────────────────────────────────────────
function MiniMap({ animated }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!animated) return;
    const t = setInterval(() => setTick(p => p + 1), 1300);
    return () => clearInterval(t);
  }, [animated]);
  const offsets = [[0,0],[tick%3===0?2:-1,tick%2===0?-2:1],[tick%2===0?-2:2,tick%3===0?1:-1],[0,0]];
  return (
    <svg viewBox="0 0 320 190" style={{width:"100%",height:"100%",borderRadius:14}}>
      <defs>
        <radialGradient id="mg2" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#142030"/>
          <stop offset="100%" stopColor="#080C16"/>
        </radialGradient>
        <filter id="glow2"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      <rect width="320" height="190" fill="url(#mg2)"/>
      {[40,80,120,160,200,240,280].map(x=><line key={x} x1={x} y1="0" x2={x} y2="190" stroke="#182030" strokeWidth="0.5"/>)}
      {[40,80,120,160].map(y=><line key={y} x1="0" y1={y} x2="320" y2={y} stroke="#182030" strokeWidth="0.5"/>)}
      <path d="M0 97 Q80 92 160 100 Q240 108 320 97" stroke="#1B3555" strokeWidth="11" fill="none" strokeLinecap="round"/>
      <path d="M0 97 Q80 92 160 100 Q240 108 320 97" stroke="#243F66" strokeWidth="4" fill="none" strokeDasharray="12 8"/>
      <path d="M60 0 Q65 48 80 97 Q95 146 90 190" stroke="#1B3555" strokeWidth="8" fill="none"/>
      <path d="M222 0 Q226 48 230 97 Q234 146 238 190" stroke="#1B3555" strokeWidth="8" fill="none"/>
      <path d="M38 97 Q100 92 160 100 Q222 108 280 97" stroke="#00D48A" strokeWidth="1.5" fill="none" strokeOpacity="0.4" strokeDasharray="6 4"/>
      <circle cx="60" cy="97" r="9" fill="#00D48A" opacity="0.12"/>
      <circle cx="60" cy="97" r="5" fill="#00D48A" filter="url(#glow2)"/>
      <text x="71" y="93" fill="#00D48A" fontSize="8" fontWeight="bold">A punkt</text>
      <circle cx="250" cy="98" r="9" fill="#4A90FF" opacity="0.12"/>
      <circle cx="250" cy="98" r="5" fill="#4A90FF" filter="url(#glow2)"/>
      <text x="258" y="94" fill="#4A90FF" fontSize="8" fontWeight="bold">B punkt</text>
      {DRIVERS_MAP.map((d,i)=>{
        const ox=offsets[i][0], oy=offsets[i][1];
        return (
          <g key={d.id} transform={`translate(${d.bx+ox},${d.by+oy})`} style={{transition:"transform 1.3s ease"}}>
            <circle r="11" fill={d.color} opacity="0.18"/>
            <circle r="6" fill={d.color} filter="url(#glow2)"/>
            {d.name==="Siz"&&<circle r="13" fill="none" stroke={d.color} strokeWidth="1.5" strokeDasharray="3 2" opacity="0.7"/>}
            <text y="-13" textAnchor="middle" fill={d.color} fontSize="7.5" fontWeight="bold">{d.name}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── Swipe Toggle ────────────────────────────────────────────
function SwipeToggle({ value, onChange }) {
  const trackRef = useRef(null);
  const startX = useRef(null);
  const isDragging = useRef(false);
  const isOnline = value === "online";

  function onPointerDown(e) {
    startX.current = e.clientX ?? e.touches?.[0]?.clientX;
    isDragging.current = false;
    e.currentTarget.setPointerCapture?.(e.pointerId);
  }
  function onPointerMove(e) {
    if (startX.current === null) return;
    const dx = (e.clientX ?? e.touches?.[0]?.clientX) - startX.current;
    if (Math.abs(dx) > 8) isDragging.current = true;
  }
  function onPointerUp(e) {
    if (startX.current === null) return;
    const dx = (e.clientX ?? e.touches?.[0]?.clientX) - startX.current;
    if (Math.abs(dx) > 30) {
      if (dx > 0 && !isOnline) onChange("online");
      if (dx < 0 && isOnline) onChange("offline");
    } else if (!isDragging.current) {
      onChange(isOnline ? "offline" : "online");
    }
    startX.current = null;
    isDragging.current = false;
  }

  return (
    <div
      ref={trackRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={{
        width: "100%", height: 52, borderRadius: 26,
        background: isOnline
          ? "linear-gradient(135deg,#00D48A22,#00D48A11)"
          : "linear-gradient(135deg,#F0444422,#F0444411)",
        border: `1.5px solid ${isOnline ? C.accent : C.danger}`,
        position: "relative", cursor: "grab", userSelect: "none",
        transition: "background 0.4s, border-color 0.4s",
        display: "flex", alignItems: "center", padding: "4px",
        touchAction: "none",
      }}
    >
      {/* Labels */}
      <div style={{
        position: "absolute", left: 20, fontFamily:"monospace", fontWeight:700,
        fontSize:11, color: isOnline ? C.accent : C.muted,
        transition:"color 0.3s", letterSpacing:1,
      }}>⚡ ISHDA</div>
      <div style={{
        position: "absolute", right: 18, fontFamily:"monospace", fontWeight:700,
        fontSize:11, color: isOnline ? C.muted : C.danger,
        transition:"color 0.3s", letterSpacing:1,
      }}>🏠 UYDA</div>
      {/* Thumb */}
      <div style={{
        width: 42, height: 42, borderRadius: 21,
        background: isOnline
          ? "linear-gradient(135deg,#00D48A,#00A870)"
          : "linear-gradient(135deg,#F04444,#C42020)",
        boxShadow: isOnline ? `0 4px 16px ${C.accentGlow}` : "0 4px 16px #F0444440",
        position: "absolute",
        left: isOnline ? "calc(100% - 46px)" : "4px",
        transition: "left 0.35s cubic-bezier(.4,0,.2,1), background 0.35s, box-shadow 0.35s",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 18,
      }}>
        {isOnline ? "⚡" : "🏠"}
      </div>
    </div>
  );
}

// ─── Bottom Nav ──────────────────────────────────────────────
function BottomNav({ screen, setScreen }) {
  const tabs = [
    { id:"main",    icon:"🗺️",  label:"Asosiy" },
    { id:"queue",   icon:"🔢",  label:"Navbat"  },
    { id:"qr",      icon:"💳",  label:"To'lov"  },
    { id:"profile", icon:"👤",  label:"Profil"  },
  ];
  return (
    <div style={{
      display:"flex", borderTop:`1px solid ${C.border}`,
      background: C.surface, paddingBottom: 6,
    }}>
      {tabs.map(t=>(
        <button key={t.id} onClick={()=>setScreen(t.id)} style={{
          flex:1, padding:"8px 0 4px", background:"none", border:"none",
          cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:2,
          borderTop: screen===t.id ? `2px solid ${C.accent}` : "2px solid transparent",
          transition:"border-color 0.2s",
        }}>
          <span style={{fontSize:18}}>{t.icon}</span>
          <span style={{
            fontFamily:"monospace", fontSize:9, letterSpacing:0.5,
            color: screen===t.id ? C.accent : C.sub, fontWeight: screen===t.id?700:400,
            transition:"color 0.2s",
          }}>{t.label}</span>
        </button>
      ))}
    </div>
  );
}

// ─── Header ──────────────────────────────────────────────────
function Header({ status, driverName }) {
  const [pulse, setPulse] = useState(false);
  useEffect(()=>{ const t=setInterval(()=>setPulse(p=>!p),1800); return()=>clearInterval(t); },[]);
  const isOnline = status==="online";
  return (
    <div style={{
      padding:"10px 18px 8px", display:"flex", justifyContent:"space-between",
      alignItems:"center", borderBottom:`1px solid ${C.border}`,
    }}>
      <div>
        <div style={{fontFamily:"monospace",fontWeight:800,color:C.text,fontSize:15,letterSpacing:-0.5}}>
          DAMASTIC<span style={{color:C.accent}}>.</span>UZ
        </div>
        <div style={{color:C.sub,fontSize:9,fontFamily:"monospace"}}>{driverName} • 33-liniya</div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:6}}>
        <div style={{
          width:7,height:7,borderRadius:"50%",
          background:isOnline?C.accent:C.danger,
          boxShadow:isOnline&&pulse?`0 0 8px ${C.accent}`:"none",
          transition:"box-shadow 0.5s",
        }}/>
        <span style={{
          color:isOnline?C.accent:C.danger, fontSize:9,
          fontFamily:"monospace", fontWeight:700,
        }}>{isOnline?"ONLINE":"OFFLINE"}</span>
      </div>
    </div>
  );
}

// ─── SCREENS ─────────────────────────────────────────────────

// LOGIN
function LoginScreen({ onNext }) {
  const [step, setStep] = useState("phone");
  const [phone, setPhone] = useState("+998 ");
  const [code, setCode] = useState(["","","","","",""]);
  const [loading, setLoading] = useState(false);
  const [dots, setDots] = useState(0);
  const [confirmationResult, setConfirmationResult] = useState(null);

  useEffect(() => {
    if(!loading) return;
    const t=setInterval(()=>setDots(p=>(p+1)%4),400);
    return()=>clearInterval(t);
  },[loading]);

  useEffect(() => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'send-code-btn', {
        'size': 'invisible',
        'callback': (response) => {}
      });
    }
  }, []);

  async function send() {
    setLoading(true);
    const normalized = phone.replace(/\D/g, "");
    if (normalized === "998000000000") {
      setTimeout(() => { setLoading(false); setStep("code"); }, 1800);
      return;
    }

    const realPhone = normalized.startsWith("998") ? "+" + normalized : "+998" + normalized;
    try {
      const appVerifier = window.recaptchaVerifier;
      const res = await signInWithPhoneNumber(auth, realPhone, appVerifier);
      setConfirmationResult(res);
      setStep("code");
    } catch (e) {
      console.error(e);
      alert("SMS yuborishda xatolik: " + e.message);
    } finally {
      setLoading(false);
    }
  }

  async function verifyFirebaseCode(fullCode) {
    if (phone.replace(/\D/g, "") === "998000000000") {
      onNext();
      return;
    }
    if (!confirmationResult) return;
    try {
      setLoading(true);
      const result = await confirmationResult.confirm(fullCode);
      const idToken = await result.user.getIdToken();
      // Muvaffaqiyatli!
      onNext();
    } catch (e) {
      alert("Kod xato yoki eskirgan: " + e.message);
      setCode(["","","","","",""]);
      document.getElementById("c-0")?.focus();
    } finally {
      setLoading(false);
    }
  }

  function handleCode(v,i) {
    const nc=[...code]; nc[i]=v.slice(-1); setCode(nc);
    if(v&&i<5) document.getElementById(`c-${i+1}`)?.focus();
    
    // Check if fully entered
    const isFull = nc.every((c, idx) => (idx === i ? v.slice(-1) : c) !== "");
    if(isFull && i===5) {
      const fullCode = nc.map((c, idx) => idx === i ? v.slice(-1) : c).join("");
      verifyFirebaseCode(fullCode);
    }
  }

  return (
    <div style={{height:"100%",display:"flex",flexDirection:"column",justifyContent:"center",padding:"0 26px",background:`linear-gradient(160deg,${C.bg},#0C1520)`}}>
      <div style={{textAlign:"center",marginBottom:40}}>
        <div style={{
          width:76,height:76,background:"linear-gradient(135deg,#00D48A,#00A870)",
          borderRadius:22,margin:"0 auto 16px",display:"flex",alignItems:"center",
          justifyContent:"center",boxShadow:`0 0 34px ${C.accentGlow}`,fontSize:34,
        }}>🚐</div>
        <div style={{fontFamily:"monospace",fontSize:24,fontWeight:800,color:C.text,letterSpacing:-0.5}}>
          DAMASTIC<span style={{color:C.accent}}>.</span>UZ
        </div>
        <div style={{color:C.sub,fontSize:11,marginTop:4,fontFamily:"monospace"}}>Haydovchi ilovasi</div>
      </div>
      {step==="phone"?(
        <>
          <div style={{marginBottom:6,color:C.sub,fontSize:10,letterSpacing:1,fontFamily:"monospace"}}>TELEFON RAQAM</div>
          <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"14px 16px",marginBottom:18,display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:18}}>🇺🇿</span>
            <input value={phone} onChange={e=>setPhone(e.target.value)}
              style={{background:"none",border:"none",color:C.text,fontSize:16,fontFamily:"monospace",flex:1,outline:"none"}}
              placeholder="+998 XX XXX XX XX"/>
          </div>
          <button id="send-code-btn" onClick={send} disabled={loading} style={{
            background:loading?C.card:"linear-gradient(135deg,#00D48A,#00A870)",
            border:"none",borderRadius:12,padding:"15px",color:loading?C.accent:"#001A0E",
            fontSize:13,fontWeight:700,fontFamily:"monospace",letterSpacing:1,cursor:"pointer",
            boxShadow:loading?"none":`0 8px 22px ${C.accentGlow}`,transition:"all 0.3s",
          }}>
            {loading?`SMS yuborilmoqda${".".repeat(dots)}`:"SMS KOD YUBORISH →"}
          </button>
        </>
      ):(
        <>
          <div style={{marginBottom:8,color:C.sub,fontSize:10,letterSpacing:1,fontFamily:"monospace",textAlign:"center"}}>
            SMS KOD • <span style={{color:C.accent}}>{phone}</span>
          </div>
          <div style={{display:"flex",gap:8,marginBottom:22,justifyContent:"center"}}>
            {code.map((c,i)=>(
              <input key={i} id={`c-${i}`} value={c} onChange={e=>handleCode(e.target.value,i)} maxLength={1}
                style={{
                  width:44,height:48,background:c?C.accentDim:C.card,
                  border:`2px solid ${c?C.accent:C.border}`,borderRadius:10,
                  color:C.text,fontSize:22,fontFamily:"monospace",textAlign:"center",outline:"none",transition:"all 0.2s",
                }}/>
            ))}
          </div>
          <div style={{color:C.sub,fontSize:10,textAlign:"center",fontFamily:"monospace"}}>Demo uchun: <span style={{color:C.accent}}>000 000 0000 raqami</span></div>
        </>
      )}
    </div>
  );
}

// MAIN
function MainScreen({ status, setStatus, onQueue, onQR }) {
  const [pulse, setPulse] = useState(false);
  useEffect(()=>{ const t=setInterval(()=>setPulse(p=>!p),2000);return()=>clearInterval(t);},[]);
  const isOnline=status==="online";

  return (
    <div style={{height:"100%",display:"flex",flexDirection:"column",background:C.bg,overflow:"hidden"}}>
      {/* Toggle */}
      <div style={{padding:"12px 16px 8px"}}>
        <SwipeToggle value={status} onChange={setStatus}/>
        <div style={{textAlign:"center",marginTop:5,color:C.sub,fontSize:9,fontFamily:"monospace"}}>
          ← chapga yoki o'ngga suring
        </div>
      </div>

      {/* Map */}
      <div style={{flex:1,margin:"4px 14px 10px",borderRadius:14,overflow:"hidden",border:`1px solid ${C.border}`,position:"relative"}}>
        <MiniMap animated={isOnline}/>
        {isOnline&&(
          <>
            <div style={{position:"absolute",bottom:10,right:10,background:C.card+"CC",borderRadius:8,padding:"4px 10px",display:"flex",alignItems:"center",gap:5,backdropFilter:"blur(4px)"}}>
              <div style={{width:5,height:5,borderRadius:"50%",background:C.accent,boxShadow:pulse?`0 0 5px ${C.accent}`:"none",transition:"box-shadow 0.5s"}}/>
              <span style={{color:C.accent,fontFamily:"monospace",fontSize:8}}>GPS • FAOL</span>
            </div>
            <div style={{position:"absolute",top:10,left:10,background:C.card+"CC",borderRadius:8,padding:"5px 10px",backdropFilter:"blur(4px)"}}>
              <div style={{color:C.sub,fontFamily:"monospace",fontSize:8}}>A PUNKTDA</div>
              <div style={{color:C.text,fontFamily:"monospace",fontSize:11,fontWeight:700}}>4 ta damas</div>
            </div>
          </>
        )}
        {!isOnline&&(
          <div style={{position:"absolute",inset:0,background:"#080C1688",display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(2px)",borderRadius:14}}>
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:28,marginBottom:6}}>🏠</div>
              <div style={{color:C.sub,fontFamily:"monospace",fontSize:11}}>Offline rejim</div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div style={{padding:"0 14px 12px",display:"flex",gap:10}}>
        <button onClick={onQueue} disabled={!isOnline} style={{
          flex:1,padding:"14px 0",borderRadius:13,
          background:isOnline?"linear-gradient(135deg,#00D48A,#00A870)":C.card,
          border:"none",color:isOnline?"#001A0E":C.muted,
          fontFamily:"monospace",fontWeight:800,fontSize:11,letterSpacing:0.5,
          cursor:isOnline?"pointer":"default",
          boxShadow:isOnline?`0 6px 18px ${C.accentGlow}`:"none",
          transition:"all 0.3s",display:"flex",flexDirection:"column",alignItems:"center",gap:3,
        }}>
          <span style={{fontSize:18}}>🔢</span>NAVBAT OLISH
        </button>
        <button onClick={onQR} disabled={!isOnline} style={{
          flex:1,padding:"14px 0",borderRadius:13,
          background:isOnline?"linear-gradient(135deg,#4A90FF,#2563EB)":C.card,
          border:"none",color:isOnline?"#fff":C.muted,
          fontFamily:"monospace",fontWeight:800,fontSize:11,letterSpacing:0.5,
          cursor:isOnline?"pointer":"default",
          boxShadow:isOnline?"0 6px 18px #4A90FF40":"none",
          transition:"all 0.3s",display:"flex",flexDirection:"column",alignItems:"center",gap:3,
        }}>
          <span style={{fontSize:18}}>📱</span>QR KO'RSATISH
        </button>
      </div>
    </div>
  );
}

// QUEUE
function QueueScreen() {
  const [joined, setJoined] = useState(true);
  const [flash, setFlash] = useState(false);
  useEffect(()=>{ setFlash(true); setTimeout(()=>setFlash(false),700); },[]);

  return (
    <div style={{height:"100%",display:"flex",flexDirection:"column",background:C.bg}}>
      <div style={{padding:"12px 18px 8px",display:"flex",gap:10}}>
        <div style={{flex:1,background:C.card,borderRadius:12,padding:"12px 16px",border:`1px solid ${C.border}`}}>
          <div style={{color:C.sub,fontSize:8,fontFamily:"monospace",letterSpacing:1}}>JAMI NAVBAT</div>
          <div style={{color:C.text,fontSize:26,fontWeight:700,fontFamily:"monospace"}}>4</div>
        </div>
        <div style={{flex:1,background:joined?C.accentDim:C.card,borderRadius:12,padding:"12px 16px",border:`1px solid ${joined?C.accent:C.border}`,transition:"all 0.4s"}}>
          <div style={{color:C.sub,fontSize:8,fontFamily:"monospace",letterSpacing:1}}>SIZNING NAVBAT</div>
          <div style={{color:joined?C.accent:C.sub,fontSize:26,fontWeight:700,fontFamily:"monospace"}}>{joined?"#4":"—"}</div>
        </div>
      </div>

      <div style={{flex:1,padding:"6px 16px",overflowY:"auto",display:"flex",flexDirection:"column",gap:8}}>
        {QUEUE_DATA.map(d=>(
          <div key={d.pos} style={{
            background:d.isYou?(flash?C.accentGlow:C.accentDim):C.card,
            border:`1.5px solid ${d.isYou?C.accent:C.border}`,
            borderRadius:12,padding:"12px 14px",display:"flex",alignItems:"center",gap:12,
            transition:"background 0.4s",
          }}>
            <div style={{width:36,height:36,borderRadius:10,background:d.isYou?C.accent:C.surface,display:"flex",alignItems:"center",justifyContent:"center",border:`1px solid ${d.isYou?C.accent:C.border}`,flexShrink:0}}>
              <span style={{fontFamily:"monospace",fontWeight:800,fontSize:14,color:d.isYou?"#001A0E":C.sub}}>#{d.pos}</span>
            </div>
            <div style={{flex:1}}>
              <div style={{color:d.isYou?C.accent:C.text,fontFamily:"monospace",fontWeight:d.isYou?700:500,fontSize:13}}>{d.name}{d.isYou&&" 👤"}</div>
              <div style={{color:C.sub,fontSize:10,fontFamily:"monospace"}}>{d.car}</div>
            </div>
            {d.pos===1&&<div style={{background:"#00D48A20",border:`1px solid ${C.accent}`,borderRadius:6,padding:"3px 8px",color:C.accent,fontSize:8,fontFamily:"monospace",fontWeight:700}}>NAVBATDA</div>}
            {d.isYou&&<div style={{background:C.blueDim,border:`1px solid ${C.blue}`,borderRadius:6,padding:"3px 8px",color:C.blue,fontSize:8,fontFamily:"monospace",fontWeight:700}}>SIZ</div>}
          </div>
        ))}
      </div>
      <div style={{padding:"8px 16px 14px"}}>
        <button onClick={()=>setJoined(!joined)} style={{
          width:"100%",padding:"13px",borderRadius:12,
          background:joined?"#F0444418":C.accentDim,
          border:`1.5px solid ${joined?C.danger:C.accent}`,
          color:joined?C.danger:C.accent,fontFamily:"monospace",fontWeight:700,
          fontSize:11,letterSpacing:1,cursor:"pointer",transition:"all 0.3s",
        }}>
          {joined?"✕  NAVBATDAN CHIQISH":"✓  NAVBATGA QO'SHILISH"}
        </button>
      </div>
    </div>
  );
}

// QR
function QRScreen() {
  const [paid, setPaid] = useState(false);
  const [scanning, setScanning] = useState(false);

  function handleScan() { setScanning(true); setTimeout(()=>{ setScanning(false); setPaid(true); },2000); }

  const cells = Array.from({length:21*21},(_,i)=>{
    const r=Math.floor(i/21),c=i%21;
    const corner=(r<7&&c<7)||(r<7&&c>13)||(r>13&&c<7);
    return { corner, data: Math.random()>0.48 };
  });

  return (
    <div style={{height:"100%",display:"flex",flexDirection:"column",background:C.bg}}>
      <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"16px"}}>
        {!paid?(
          <>
            <div style={{textAlign:"center",marginBottom:20}}>
              <div style={{color:C.sub,fontSize:10,fontFamily:"monospace",letterSpacing:1,marginBottom:3}}>TO'LOV SUMMASI</div>
              <div style={{fontFamily:"monospace",fontSize:40,fontWeight:800,color:C.text}}>
                5 000 <span style={{color:C.accent,fontSize:18}}>so'm</span>
              </div>
            </div>
            <div style={{background:"#fff",borderRadius:20,padding:18,boxShadow:`0 0 40px ${C.accentGlow}`,position:"relative",marginBottom:18}}>
              {scanning&&(
                <div style={{position:"absolute",top:0,left:0,right:0,height:"100%",overflow:"hidden",borderRadius:20,zIndex:2,pointerEvents:"none"}}>
                  <div style={{height:3,background:`linear-gradient(90deg,transparent,${C.accent},transparent)`,animation:"scan2 2s linear infinite"}}/>
                </div>
              )}
              <svg viewBox="0 0 21 21" width="170" height="170">
                {cells.map((cell,i)=>{
                  const r=Math.floor(i/21),c=i%21;
                  return <rect key={i} x={c} y={r} width={1} height={1} fill={(cell.corner||cell.data)?"#111":"#fff"}/>;
                })}
              </svg>
              <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",background:"#fff",padding:4,borderRadius:8}}>
                <div style={{width:28,height:28,background:"#00D48A",borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>🚐</div>
              </div>
            </div>
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"7px 14px",marginBottom:16}}>
              <div style={{color:C.sub,fontSize:8,fontFamily:"monospace",letterSpacing:1}}>LINK</div>
              <div style={{color:C.accent,fontSize:11,fontFamily:"monospace"}}>pay.damastic.uz/driver/123</div>
            </div>
            <div style={{display:"flex",gap:10,marginBottom:20}}>
              {["💳 Payme","🔵 Click"].map(p=>(
                <div key={p} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"7px 14px",color:C.sub,fontFamily:"monospace",fontSize:11}}>{p}</div>
              ))}
            </div>
            <button onClick={handleScan} style={{
              width:"100%",maxWidth:260,padding:"13px",borderRadius:12,
              background:scanning?C.card:"linear-gradient(135deg,#00D48A,#00A870)",
              border:"none",color:scanning?C.accent:"#001A0E",
              fontFamily:"monospace",fontWeight:800,fontSize:11,cursor:"pointer",
              boxShadow:`0 6px 20px ${C.accentGlow}`,
            }}>
              {scanning?"⏳  SKANLANMOQDA...":"✓  TO'LOV SIMULATSIYA"}
            </button>
          </>
        ):(
          <div style={{textAlign:"center",animation:"fadeIn2 0.5s ease"}}>
            <div style={{width:78,height:78,background:C.accentDim,border:`3px solid ${C.accent}`,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:34,margin:"0 auto 18px",boxShadow:`0 0 28px ${C.accentGlow}`}}>✓</div>
            <div style={{fontFamily:"monospace",fontSize:26,fontWeight:800,color:C.accent,marginBottom:6}}>TO'LANDI!</div>
            <div style={{fontFamily:"monospace",fontSize:18,color:C.text,marginBottom:4}}>5 000 so'm</div>
            <div style={{color:C.sub,fontSize:10,fontFamily:"monospace",marginBottom:24}}>Payme orqali • #TXN-8821</div>
            <button onClick={()=>setPaid(false)} style={{padding:"11px 28px",borderRadius:12,background:C.card,border:`1px solid ${C.border}`,color:C.text,fontFamily:"monospace",fontSize:11,cursor:"pointer"}}>
              ← YANGI TO'LOV
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// PROFILE
const DAILY_QUEUE = [
  { time:"08:14", point:"A punkt", pos:2, duration:"18 daq" },
  { time:"10:32", point:"A punkt", pos:1, duration:"5 daq"  },
  { time:"12:55", point:"B punkt", pos:3, duration:"27 daq" },
  { time:"15:08", point:"A punkt", pos:2, duration:"12 daq" },
];
const DAILY_PAY = [
  { time:"08:38", amount:5000, via:"Payme",  status:"success" },
  { time:"09:15", amount:5000, via:"Click",  status:"success" },
  { time:"11:02", amount:5000, via:"Payme",  status:"success" },
  { time:"13:20", amount:5000, via:"Click",  status:"pending" },
  { time:"14:45", amount:5000, via:"Payme",  status:"success" },
  { time:"16:10", amount:5000, via:"Click",  status:"failed"  },
];

function ProfileScreen({ driverName, setDriverName }) {
  const [tab, setTab] = useState("info"); // info | queue | payments
  const [editing, setEditing] = useState(null); // "name"|"car"|"phone"
  const [name, setName] = useState(driverName);
  const [car, setCar] = useState("10A 111 UZ");
  const [phone, setPhone] = useState("+998 90 123 45 67");
  const [tmpVal, setTmpVal] = useState("");

  function startEdit(field) {
    setEditing(field);
    setTmpVal(field==="name"?name:field==="car"?car:phone);
  }
  function saveEdit() {
    if(editing==="name"){ setName(tmpVal); setDriverName(tmpVal); }
    if(editing==="car") setCar(tmpVal);
    if(editing==="phone") setPhone(tmpVal);
    setEditing(null);
  }

  const totalPaid = DAILY_PAY.filter(p=>p.status==="success").reduce((s,p)=>s+p.amount,0);
  const successCount = DAILY_PAY.filter(p=>p.status==="success").length;

  return (
    <div style={{height:"100%",display:"flex",flexDirection:"column",background:C.bg,overflow:"hidden"}}>
      {/* Avatar + name */}
      <div style={{padding:"16px 18px 10px",textAlign:"center",borderBottom:`1px solid ${C.border}`}}>
        <div style={{width:58,height:58,background:"linear-gradient(135deg,#00D48A,#00A870)",borderRadius:"50%",margin:"0 auto 8px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,boxShadow:`0 0 20px ${C.accentGlow}`}}>
          {name[0]?.toUpperCase()||"H"}
        </div>
        <div style={{color:C.text,fontFamily:"monospace",fontWeight:700,fontSize:14}}>{name}</div>
        <div style={{color:C.sub,fontFamily:"monospace",fontSize:10}}>{phone}</div>
      </div>

      {/* Tab bar */}
      <div style={{display:"flex",borderBottom:`1px solid ${C.border}`,background:C.surface}}>
        {[{id:"info",label:"Ma'lumot"},{id:"queue",label:"Navbat tarixi"},{id:"payments",label:"To'lovlar"}].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{
            flex:1,padding:"9px 0",background:"none",border:"none",
            borderBottom:`2px solid ${tab===t.id?C.accent:"transparent"}`,
            color:tab===t.id?C.accent:C.sub,fontFamily:"monospace",
            fontSize:9,fontWeight:tab===t.id?700:400,cursor:"pointer",
            letterSpacing:0.5,transition:"all 0.2s",
          }}>{t.label}</button>
        ))}
      </div>

      <div style={{flex:1,overflowY:"auto",padding:"10px 16px"}}>

        {/* INFO TAB */}
        {tab==="info"&&(
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {[
              { field:"name",  label:"Ism familiya", value:name,  icon:"👤" },
              { field:"car",   label:"Mashina raqami", value:car,  icon:"🚐" },
              { field:"phone", label:"Telefon raqam", value:phone, icon:"📱" },
            ].map(row=>(
              <div key={row.field} style={{background:C.card,border:`1px solid ${editing===row.field?C.accent:C.border}`,borderRadius:12,padding:"12px 14px",transition:"border-color 0.2s"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:editing===row.field?8:0}}>
                  <div>
                    <div style={{color:C.sub,fontSize:9,fontFamily:"monospace",letterSpacing:1,marginBottom:2}}>{row.icon} {row.label.toUpperCase()}</div>
                    {editing!==row.field&&<div style={{color:C.text,fontFamily:"monospace",fontSize:13,fontWeight:600}}>{row.value}</div>}
                  </div>
                  <button onClick={()=>editing===row.field?saveEdit():startEdit(row.field)} style={{
                    background:editing===row.field?C.accent:"none",
                    border:`1px solid ${editing===row.field?C.accent:C.border}`,
                    borderRadius:8,padding:"4px 12px",
                    color:editing===row.field?"#001A0E":C.sub,
                    fontFamily:"monospace",fontSize:9,fontWeight:700,cursor:"pointer",
                    transition:"all 0.2s",
                  }}>
                    {editing===row.field?"SAQLASH":"TAHRIR"}
                  </button>
                </div>
                {editing===row.field&&(
                  <input value={tmpVal} onChange={e=>setTmpVal(e.target.value)}
                    style={{
                      width:"100%",background:C.surface,border:`1.5px solid ${C.accent}`,
                      borderRadius:8,padding:"9px 12px",color:C.text,
                      fontFamily:"monospace",fontSize:13,outline:"none",
                    }}/>
                )}
              </div>
            ))}

            {/* Logout */}
            <div style={{marginTop:6}}>
              <button style={{
                width:"100%",padding:"12px",borderRadius:12,
                background:"#F0444412",border:`1px solid ${C.danger}44`,
                color:C.danger,fontFamily:"monospace",fontSize:11,fontWeight:700,
                cursor:"pointer",letterSpacing:1,
              }}>
                🚪  CHIQISH
              </button>
            </div>
          </div>
        )}

        {/* QUEUE HISTORY TAB */}
        {tab==="queue"&&(
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {/* Summary row */}
            <div style={{display:"flex",gap:8,marginBottom:4}}>
              <div style={{flex:1,background:C.card,borderRadius:10,padding:"10px 12px",border:`1px solid ${C.border}`,textAlign:"center"}}>
                <div style={{color:C.sub,fontSize:8,fontFamily:"monospace",letterSpacing:1}}>BUGUNGI NAVBAT</div>
                <div style={{color:C.accent,fontSize:22,fontWeight:800,fontFamily:"monospace"}}>{DAILY_QUEUE.length}</div>
              </div>
              <div style={{flex:1,background:C.card,borderRadius:10,padding:"10px 12px",border:`1px solid ${C.border}`,textAlign:"center"}}>
                <div style={{color:C.sub,fontSize:8,fontFamily:"monospace",letterSpacing:1}}>O'RT. KUTISH</div>
                <div style={{color:C.warn,fontSize:22,fontWeight:800,fontFamily:"monospace"}}>16 <span style={{fontSize:11}}>dq</span></div>
              </div>
            </div>

            <div style={{color:C.sub,fontSize:9,fontFamily:"monospace",letterSpacing:1,marginBottom:2}}>
              📅 {formatDate(new Date())} — NAVBAT TARIXI
            </div>

            {DAILY_QUEUE.map((q,i)=>(
              <div key={i} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 14px",display:"flex",alignItems:"center",gap:12}}>
                <div style={{background:C.accentDim,borderRadius:8,padding:"5px 10px",minWidth:46,textAlign:"center"}}>
                  <div style={{color:C.accent,fontFamily:"monospace",fontSize:10,fontWeight:700}}>{q.time}</div>
                </div>
                <div style={{flex:1}}>
                  <div style={{color:C.text,fontFamily:"monospace",fontSize:12,fontWeight:600}}>{q.point}</div>
                  <div style={{color:C.sub,fontFamily:"monospace",fontSize:9}}>Kutish: {q.duration}</div>
                </div>
                <div style={{background:C.surface,borderRadius:8,padding:"4px 10px",textAlign:"center"}}>
                  <div style={{color:C.sub,fontFamily:"monospace",fontSize:8}}>NAVBAT</div>
                  <div style={{color:C.text,fontFamily:"monospace",fontSize:14,fontWeight:700}}>#{q.pos}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* PAYMENTS TAB */}
        {tab==="payments"&&(
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {/* Summary */}
            <div style={{display:"flex",gap:8,marginBottom:4}}>
              <div style={{flex:1,background:C.accentDim,borderRadius:10,padding:"10px 12px",border:`1px solid ${C.accent}`,textAlign:"center"}}>
                <div style={{color:C.sub,fontSize:8,fontFamily:"monospace",letterSpacing:1}}>BUGUNGI DAROMAD</div>
                <div style={{color:C.accent,fontSize:18,fontWeight:800,fontFamily:"monospace"}}>{(totalPaid/1000).toFixed(0)}K <span style={{fontSize:10}}>so'm</span></div>
              </div>
              <div style={{flex:1,background:C.card,borderRadius:10,padding:"10px 12px",border:`1px solid ${C.border}`,textAlign:"center"}}>
                <div style={{color:C.sub,fontSize:8,fontFamily:"monospace",letterSpacing:1}}>MUVAFFAQIYATLI</div>
                <div style={{color:C.text,fontSize:18,fontWeight:800,fontFamily:"monospace"}}>{successCount}/{DAILY_PAY.length}</div>
              </div>
            </div>

            <div style={{color:C.sub,fontSize:9,fontFamily:"monospace",letterSpacing:1,marginBottom:2}}>
              📅 {formatDate(new Date())} — TO'LOV TARIXI
            </div>

            {DAILY_PAY.map((p,i)=>{
              const statusColor = p.status==="success"?C.accent:p.status==="pending"?C.warn:C.danger;
              const statusLabel = p.status==="success"?"✓ O'TKAZILDI":p.status==="pending"?"⏳ KUTILMOQDA":"✕ XATO";
              return (
                <div key={i} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 14px",display:"flex",alignItems:"center",gap:10}}>
                  <div style={{background:`${statusColor}18`,borderRadius:8,padding:"5px 10px",minWidth:44,textAlign:"center"}}>
                    <div style={{color:statusColor,fontFamily:"monospace",fontSize:10,fontWeight:700}}>{p.time}</div>
                  </div>
                  <div style={{flex:1}}>
                    <div style={{color:C.text,fontFamily:"monospace",fontSize:12,fontWeight:600}}>5 000 so'm</div>
                    <div style={{color:C.sub,fontFamily:"monospace",fontSize:9}}>{p.via}</div>
                  </div>
                  <div style={{
                    background:`${statusColor}18`,border:`1px solid ${statusColor}44`,
                    borderRadius:7,padding:"3px 8px",
                    color:statusColor,fontFamily:"monospace",fontSize:8,fontWeight:700,
                  }}>{statusLabel}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── ROOT APP ────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState("login");
  const [status, setStatus] = useState("online");
  const [driverName, setDriverName] = useState("Abdullayev Ulug'bek");

  const showNav = screen !== "login";

  return (
    <div style={{minHeight:"100vh",background:"#030508",display:"flex",alignItems:"center",justifyContent:"center",padding:"20px",fontFamily:"system-ui"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:3px;}
        ::-webkit-scrollbar-track{background:transparent;}
        ::-webkit-scrollbar-thumb{background:#1E2D45;border-radius:2px;}
        @keyframes scan2{0%{transform:translateY(-10px);opacity:0;}10%{opacity:1;}90%{opacity:1;}100%{transform:translateY(260px);opacity:0;}}
        @keyframes fadeIn2{from{opacity:0;transform:scale(0.9);}to{opacity:1;transform:scale(1);}}
        @keyframes glow{0%,100%{box-shadow:0 0 8px #00D48A;}50%{box-shadow:none;}}
      `}</style>

      {/* Phone frame */}
      <div style={{
        width:364,height:728,
        background:C.bg,
        borderRadius:46,
        border:"8px solid #141E30",
        boxShadow:`0 0 70px #00D48A1A, 0 40px 80px #00000090, inset 0 0 0 2px #243040`,
        overflow:"hidden",
        position:"relative",
        display:"flex",flexDirection:"column",
      }}>
        {/* Notch */}
        <div style={{position:"absolute",top:0,left:"50%",transform:"translateX(-50%)",width:96,height:24,background:C.bg,borderRadius:"0 0 16px 16px",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",gap:7}}>
          <div style={{width:5,height:5,borderRadius:"50%",background:"#1E2A40"}}/>
          <div style={{width:48,height:5,borderRadius:3,background:"#1E2A40"}}/>
        </div>

        {/* Status bar */}
        <div style={{paddingTop:26,paddingLeft:18,paddingRight:18,paddingBottom:0,display:"flex",justifyContent:"space-between",alignItems:"center",background:C.bg,flexShrink:0}}>
          <span style={{color:C.sub,fontSize:10,fontFamily:"monospace"}}>9:41</span>
          <div style={{display:"flex",gap:5,alignItems:"center"}}>
            <span style={{color:C.sub,fontSize:9}}>▲▲▲</span>
            <span style={{color:C.sub,fontSize:9}}>WiFi</span>
            <span style={{color:C.sub,fontSize:9}}>87%</span>
          </div>
        </div>

        {/* Header (shown except login) */}
        {showNav&&<Header status={status} driverName={driverName}/>}

        {/* Screen */}
        <div style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column"}}>
          {screen==="login"    && <LoginScreen onNext={()=>setScreen("main")}/>}
          {screen==="main"     && <MainScreen status={status} setStatus={setStatus} onQueue={()=>setScreen("queue")} onQR={()=>setScreen("qr")}/>}
          {screen==="queue"    && <QueueScreen/>}
          {screen==="qr"       && <QRScreen/>}
          {screen==="profile"  && <ProfileScreen driverName={driverName} setDriverName={setDriverName}/>}
        </div>

        {/* Bottom Nav */}
        {showNav&&<BottomNav screen={screen} setScreen={setScreen}/>}

        {/* Home indicator */}
        <div style={{height:4,display:"flex",justifyContent:"center",alignItems:"center",background:C.bg,paddingBottom:4}}>
          <div style={{width:90,height:3,background:"#1E2D45",borderRadius:2}}/>
        </div>
      </div>
    </div>
  );
}
