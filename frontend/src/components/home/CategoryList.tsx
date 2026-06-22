import { Link } from "react-router-dom";

const CATEGORIES = [
  { name: "Pollo", emoji: "🍗" },
  { name: "Combos", emoji: "🍱" },
  { name: "Acompañamientos", emoji: "🍟" },
  { name: "Bebidas", emoji: "🥤" },
  { name: "Postres", emoji: "🍰" },
];

export default function CategoryList() {
  return (
    <section className="max-w-7xl mx-auto px-4 py-8">
      <h2 className="section-title mb-4">Explora por categoría</h2>
      <div className="flex gap-4 overflow-x-auto scrollbar-thin pb-2">
        {CATEGORIES.map((cat) => (
          <Link
            key={cat.name}
            to={`/menu?category=${encodeURIComponent(cat.name)}`}
            className="flex-shrink-0 w-28 flex flex-col items-center gap-2 card p-4 hover:shadow-md hover:-translate-y-0.5 transition-all"
          >
            <span className="text-3xl">{cat.emoji}</span>
            <span className="text-xs font-semibold text-center">{cat.name}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
