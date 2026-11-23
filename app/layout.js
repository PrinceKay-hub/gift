import "./globals.css";
export const metadata = { title: "Church Youth Gift Exchange" };
const items = ["🎄", "🍭", "❄️", "🍬", "⭐", "❄️", "🍭", "🔔", "❄️", "🎄", "🍬", "❄️", "⭐", "🍭", "❄️", "🎁"];
const trees = ["🎄", "🎁", "🎄", "🍭", "🎄", "🎁", "🎄", "🍬", "🎄"];
export default function RootLayout({ children }) {
  return (
    <html lang="en"><body>
      <div className="deco" aria-hidden="true">
        {items.map((e, i) => (
          <span key={i} style={{ left: `${(i * 37 + 5) % 94}%`, fontSize: 16 + (i % 4) * 8, animationDuration: `${12 + (i % 5) * 4}s`, animationDelay: `-${(i * 2.3) % 14}s` }}>{e}</span>
        ))}
      </div>
      <div className="trees" aria-hidden="true">
        {trees.map((e, i) => <span key={i} style={{ fontSize: e === "🎄" ? 44 + (i % 3) * 14 : 26 }}>{e}</span>)}
      </div>
      <div className="wrap">{children}</div>
    </body></html>
  );
}
