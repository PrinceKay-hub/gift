import { db, enc, dec, hashPin, checkPin, shuffle } from "../../../lib/server";
const P = db.collection("participants"), M = db.collection("messages"), S = db.doc("meta/state");
const ok = (d) => Response.json(d);
const err = (m, s = 400) => Response.json({ error: m }, { status: s });
const slug = (n) => n.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
async function auth({ id, pin }) {
  const s = await P.doc(String(id || "x")).get();
  return s.exists && checkPin(String(pin), s.data().pinHash) ? s : null;
}
export async function POST(req, { params }) {
  const { action } = await params, b = await req.json();
  const drawn = !!(await S.get()).data()?.drawn;

  if (action === "status") return ok({ drawn, count: (await P.count().get()).data().count });

  if (action === "register") {
    if (drawn) return err("Registration is closed");
    const name = (b.name || "").trim().slice(0, 50); if (!name) return err("Name required");
    const id = slug(name); if ((await P.doc(id).get()).exists) return err("That name is already registered");
    const pin = String(100000 + Math.floor(Math.random() * 900000));
    await P.doc(id).set({ name, wishlist: (b.wishlist || "").slice(0, 1000), pinHash: hashPin(pin) });
    return ok({ id, pin });
  }

  if (action === "draw") {
    if (b.adminKey !== process.env.ADMIN_KEY) return err("Wrong admin key", 403);
    if (drawn) return err("Already drawn");
    const ids = shuffle((await P.get()).docs.map((d) => d.id));
    if (ids.length < 3) return err("Need at least 3 people");
    const batch = db.batch();
    ids.forEach((id, i) => {
      const to = ids[(i + 1) % ids.length]; // each gives to next in shuffled ring
      batch.update(P.doc(id), { recipient: enc(to) });
      batch.update(P.doc(to), { giver: enc(id) });
    });
    batch.set(S, { drawn: true });
    await batch.commit();
    return ok({ ok: true });
  }

  if (action === "resetpin") {
    if (b.adminKey !== process.env.ADMIN_KEY) return err("Wrong admin key", 403);
    const id = slug(b.name || "");
    if (!id || !(await P.doc(id).get()).exists) return err("No one registered with that name");
    const pin = String(100000 + Math.floor(Math.random() * 900000));
    await P.doc(id).update({ pinHash: hashPin(pin) });
    return ok({ pin });
  }

  const me = await auth(b); if (!me) return err("Wrong name or PIN", 401);
  const d = me.data();

  if (action === "me") {
    let recipient = null;
    if (d.recipient) { const r = (await P.doc(dec(d.recipient)).get()).data(); recipient = { name: r.name, wishlist: r.wishlist }; }
    const inbox = (await M.where("toId", "==", me.id).get()).docs.map((x) => x.data()).sort((a, c) => c.at - a.at);
    return ok({ name: d.name, wishlist: d.wishlist, drawn, recipient, inbox });
  }
  if (action === "wishlist") { await P.doc(me.id).update({ wishlist: (b.wishlist || "").slice(0, 1000) }); return ok({ ok: true }); }

  if (action === "message") {
    if (!drawn) return err("Names not drawn yet");
    const toGiver = b.to === "giver", text = (b.text || "").trim().slice(0, 500);
    if (!text) return err("Message is empty");
    await M.add({ toId: dec(toGiver ? d.giver : d.recipient), text, at: Date.now(),
      from: toGiver ? "Your gift receiver" : "Your Secret Santa" });
    return ok({ ok: true });
  }
  return err("Unknown action", 404);
}
