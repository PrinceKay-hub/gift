"use client";
import { useState, useEffect } from "react";
const api = async (a, body) => {
  const r = await fetch("/api/" + a, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const j = await r.json(); if (!r.ok) throw new Error(j.error); return j;
};
const toId = (n) => n.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");

export default function Home() {
  const [creds, setCreds] = useState(null), [me, setMe] = useState(null), [status, setStatus] = useState({});
  const [f, setF] = useState({ name: "", pin: "", wishlist: "" }), [msg, setMsg] = useState(""), [to, setTo] = useState("recipient");
  const [admin, setAdmin] = useState(""), [rName, setRName] = useState(""), [wl, setWl] = useState(""), [newPin, setNewPin] = useState("");
  const [busy, setBusy] = useState(""), [note, setNote] = useState(null), [auth, setAuth] = useState("join"), [tab, setTab] = useState("gift"), [shown, setShown] = useState(false);

  const ok = (m) => setNote({ m });
  const run = async (fn, key) => {
    setNote(null); setBusy(key);
    try { await fn(); } catch (e) { setNote({ m: e.message, bad: true }); }
    setBusy("");
  };
  const B = (key, fn, label, cls = "") => (
    <button key={key} className={"btn " + cls} disabled={!!busy} onClick={() => run(fn, key)}>
      {busy === key && <span className="spin" />}{busy === key ? "Please wait…" : label}
    </button>
  );
  const fetchMe = async (c) => { const m = await api("me", c); setMe(m); setWl(m.wishlist); };
  const save = async (c) => { await fetchMe(c); localStorage.setItem("ge", JSON.stringify(c)); setCreds(c); };

  useEffect(() => {
    api("status", {}).then(setStatus);
    const s = localStorage.getItem("ge");
    if (s) run(() => save(JSON.parse(s)), "init");
  }, []);
  useEffect(() => { if (note) { const t = setTimeout(() => setNote(null), 3500); return () => clearTimeout(t); } }, [note]);

  const toast = note && <div className={"toast" + (note.bad ? " bad" : "")}>{note.m}</div>;

  if (!me) return (<div>
    <div className="hero"><div style={{ fontSize: 46 }}>🎁</div><h1>Oforikom Foursquare Youth - Gift Exchange 2026</h1><p>Secret gifts, shared joy this Christmas</p>
      <span className="pill">{busy === "init" ? "Loading…" : `${status.count ?? 0} joined · ${status.drawn ? "names drawn" : "sign-ups open"}`}</span></div>
    <div className="seg">
      {!status.drawn && <button className={auth === "join" ? "on" : ""} onClick={() => setAuth("join")}>Join</button>}
      <button className={auth === "login" || status.drawn ? "on" : ""} onClick={() => setAuth("login")}>I have a PIN</button>
    </div>
    <div className="card">
      {auth === "join" && !status.drawn ? <div key="join">
        <h3>Join the exchange</h3><p className="mut">You'll get a 6-digit PIN to see who you're gifting.</p>
        <input className="input" placeholder="Your full name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        <textarea className="input" rows={3} placeholder="Wishlist / gift ideas (optional)" value={f.wishlist} onChange={(e) => setF({ ...f, wishlist: e.target.value })} />
        {B("register", async () => { const r = await api("register", f); setNewPin(r.pin); await save({ id: r.id, pin: r.pin }); }, "Sign up 🎄")}
      </div> : <div key="login">
        <h3>Welcome back</h3>
        <input className="input" placeholder="Your full name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        <input className="input" placeholder="6-digit PIN" inputMode="numeric" maxLength={6} value={f.pin} onChange={(e) => setF({ ...f, pin: e.target.value })} />
        {B("login", () => save({ id: toId(f.name), pin: f.pin }), "Log in")}
        <p className="mut">Forgot your PIN? Ask the organizer to reset it.</p>
      </div>}
    </div>
    <details className="card"><summary>Organizer tools</summary>
      <input className="input" type="password" placeholder="Admin key" onChange={(e) => setAdmin(e.target.value)} />
      {B("draw", async () => { await api("draw", { adminKey: admin }); setStatus({ ...status, drawn: true }); ok("Names drawn! 🎉"); }, "Draw names")}
      <p className="mut" style={{ marginBottom: 0 }}>Reset a forgotten PIN</p>
      <input className="input" placeholder="Person's name" onChange={(e) => setRName(e.target.value)} />
      {B("reset", async () => { const r = await api("resetpin", { adminKey: admin, name: rName }); ok(`New PIN for ${rName}: ${r.pin}`); }, "Reset PIN", "alt")}
    </details>
    {toast}
  </div>);

  return (<div>
    <div className="top"><h2>Hi {me.name.split(" ")[0]} 🎄</h2>
      <button className="link" onClick={() => { localStorage.removeItem("ge"); location.reload(); }}>Log out</button></div>
    {newPin && <div className="pin"><div><div className="mut">Your PIN, save it!</div><b>{newPin}</b></div>
      <button onClick={() => { navigator.clipboard?.writeText(newPin); ok("PIN copied"); }}>Copy</button></div>}
    <div className="seg">
      <button className={tab === "gift" ? "on" : ""} onClick={() => setTab("gift")}>🎁 My person</button>
      <button className={tab === "wish" ? "on" : ""} onClick={() => setTab("wish")}>📝 Wishlist</button>
      <button className={tab === "msg" ? "on" : ""} onClick={() => setTab("msg")}>💌 Messages{me.inbox.length > 0 && <span className="badge">{me.inbox.length}</span>}</button>
    </div>

    {tab === "gift" && (!me.drawn
      ? <div className="card" style={{ textAlign: "center" }}><div style={{ fontSize: 44 }}>⏳</div><h3>Waiting for the draw</h3>
          <p className="mut">Names haven't been drawn yet. Come back once the organizer announces it!</p></div>
      : <>
        <div className="gift" onClick={() => setShown(true)}>
          {shown ? <><div className="mut" style={{ color: "#fff9" }}>You're buying a gift for</div><h2>{me.recipient.name}</h2><div>🤫 Keep it secret!</div></>
            : <><div className="big">🎁</div><h3 style={{ margin: 0 }}>Tap to reveal your person</h3></>}
        </div>
        {shown && <div className="card"><h3>Their wishlist</h3><p style={{ whiteSpace: "pre-wrap", margin: 0 }}>{me.recipient.wishlist || "They haven't added anything yet. Try sending an anonymous message to ask!"}</p></div>}
      </>)}

    {tab === "wish" && <div className="card"><h3>My wishlist</h3><p className="mut">Help your Secret Santa pick something you'll love.</p>
      <textarea className="input" rows={5} value={wl} onChange={(e) => setWl(e.target.value)} />
      {B("wishlist", async () => { await api("wishlist", { ...creds, wishlist: wl }); ok("Wishlist saved ✓"); }, "Save wishlist")}</div>}

    {tab === "msg" && (!me.drawn
      ? <div className="card mut">Messaging opens after names are drawn.</div>
      : <>
        <div className="card"><h3>Send an anonymous message</h3>
          <div className="seg"><button className={to === "recipient" ? "on" : ""} onClick={() => setTo("recipient")}>To my person</button>
            <button className={to === "giver" ? "on" : ""} onClick={() => setTo("giver")}>To my Secret Santa</button></div>
          <textarea className="input" rows={3} maxLength={500} placeholder="Ask a question or drop a hint…" value={msg} onChange={(e) => setMsg(e.target.value)} />
          <div className="mut" style={{ textAlign: "right" }}>{msg.length}/500</div>
          {B("send", async () => { await api("message", { ...creds, to, text: msg }); setMsg(""); ok("Sent anonymously 🤫"); }, "Send")}
        </div>
        <div className="card"><h3>Inbox</h3>
          {me.inbox.length === 0 && <p className="mut">No messages yet.</p>}
          {me.inbox.map((m, i) => <div className="bub" key={i}><small>{m.from}</small><div>{m.text}</div></div>)}
          {B("refresh", () => fetchMe(creds), "Refresh", "alt")}
        </div>
      </>)}
    {toast}
  </div>);
}
