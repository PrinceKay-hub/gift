import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import crypto from "crypto";
if (!getApps().length) initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
export const db = getFirestore();
const key = () => crypto.createHash("sha256").update(process.env.SERVER_SECRET).digest();
export const enc = (t) => {
  const iv = crypto.randomBytes(12), c = crypto.createCipheriv("aes-256-gcm", key(), iv);
  const d = Buffer.concat([c.update(t, "utf8"), c.final()]);
  return [iv, c.getAuthTag(), d].map((b) => b.toString("base64")).join(".");
};
export const dec = (s) => {
  const [iv, tag, d] = s.split(".").map((x) => Buffer.from(x, "base64"));
  const c = crypto.createDecipheriv("aes-256-gcm", key(), iv); c.setAuthTag(tag);
  return Buffer.concat([c.update(d), c.final()]).toString("utf8");
};
export const hashPin = (pin, salt = crypto.randomBytes(8).toString("hex")) =>
  salt + ":" + crypto.scryptSync(pin, salt, 32).toString("hex");
export const checkPin = (pin, h) => {
  const a = Buffer.from(hashPin(pin, h.split(":")[0])), b = Buffer.from(h);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};
export const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = crypto.randomInt(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
