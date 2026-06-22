import { useEffect, useState } from "react";
import { Plus, Minus, X } from "lucide-react";
import api from "../services/api";
import { Product } from "../types";
import Loader from "../components/common/Loader";

const ALLERGENS = ["gluten", "lácteos", "huevo", "frutos secos"];

export default function NutritionPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [excludedAllergens, setExcludedAllergens] = useState<Set<string>>(new Set());
  const [maxSpicy, setMaxSpicy] = useState(4);
  const [selected, setSelected] = useState<{ product: Product; quantity: number }[]>([]);

  useEffect(() => {
    api
      .get("/products")
      .then(({ data }) => setProducts(data.products))
      .finally(() => setLoading(false));
  }, []);

  function toggleAllergen(allergen: string) {
    setExcludedAllergens((prev) => {
      const next = new Set(prev);
      if (next.has(allergen)) next.delete(allergen);
      else next.add(allergen);
      return next;
    });
  }

  const filtered = products.filter((p) => {
    if (p.spicyLevel > maxSpicy) return false;
    return !p.allergens.some((a) => excludedAllergens.has(a));
  });

  function addToCalculator(product: Product) {
    setSelected((prev) => {
      const existing = prev.find((s) => s.product.id === product.id);
      if (existing) return prev.map((s) => (s.product.id === product.id ? { ...s, quantity: s.quantity + 1 } : s));
      return [...prev, { product, quantity: 1 }];
    });
  }

  function updateQty(productId: string, delta: number) {
    setSelected((prev) =>
      prev
        .map((s) => (s.product.id === productId ? { ...s, quantity: s.quantity + delta } : s))
        .filter((s) => s.quantity > 0)
    );
  }

  const totals = selected.reduce(
    (acc, s) => ({
      calories: acc.calories + s.product.nutritionalInfo.calories * s.quantity,
      protein: acc.protein + s.product.nutritionalInfo.protein * s.quantity,
      fat: acc.fat + s.product.nutritionalInfo.fat * s.quantity,
      carbs: acc.carbs + s.product.nutritionalInfo.carbs * s.quantity,
    }),
    { calories: 0, protein: 0, fat: 0, carbs: 0 }
  );

  if (loading) return <Loader />;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="section-title mb-6">Nutrición y salud</h1>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <div className="card p-5 mb-6">
            <p className="font-display font-semibold mb-3">Filtros</p>
            <div className="mb-4">
              <label className="text-xs font-semibold text-black/50">Nivel máximo de picante: {maxSpicy}</label>
              <input
                type="range"
                min={0}
                max={4}
                value={maxSpicy}
                onChange={(e) => setMaxSpicy(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <p className="text-xs font-semibold text-black/50 mb-2">Excluir alérgenos</p>
              <div className="flex flex-wrap gap-2">
                {ALLERGENS.map((a) => (
                  <button
                    key={a}
                    onClick={() => toggleAllergen(a)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full border-2 ${
                      excludedAllergens.has(a) ? "border-kfc-red bg-kfc-red/5 text-kfc-red" : "border-black/10"
                    }`}
                  >
                    Sin {a}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            {filtered.map((p) => (
              <div key={p.id} className="card p-4 flex gap-3">
                <img src={p.imageUrl} alt={p.name} className="w-16 h-16 rounded-xl object-cover bg-black/5" />
                <div className="flex-1">
                  <p className="font-semibold text-sm">{p.name}</p>
                  <p className="text-xs text-black/50">{p.nutritionalInfo.calories} kcal</p>
                  <button onClick={() => addToCalculator(p)} className="text-xs font-semibold text-kfc-red mt-1 hover:underline">
                    + Agregar a calculadora
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="card p-5 sticky top-20">
            <p className="font-display font-semibold mb-3">Calculadora de calorías</p>
            {selected.length === 0 ? (
              <p className="text-sm text-black/50">Agrega productos para calcular su valor nutricional total.</p>
            ) : (
              <>
                <div className="flex flex-col gap-2 mb-4">
                  {selected.map((s) => (
                    <div key={s.product.id} className="flex items-center gap-2 text-sm">
                      <span className="flex-1 truncate">{s.product.name}</span>
                      <button onClick={() => updateQty(s.product.id, -1)}>
                        <Minus size={14} />
                      </button>
                      <span className="w-5 text-center">{s.quantity}</span>
                      <button onClick={() => updateQty(s.product.id, 1)}>
                        <Plus size={14} />
                      </button>
                      <button onClick={() => setSelected((prev) => prev.filter((x) => x.product.id !== s.product.id))}>
                        <X size={14} className="text-black/30" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3 text-center border-t border-black/10 pt-3">
                  <div>
                    <p className="font-display font-bold text-lg">{totals.calories}</p>
                    <p className="text-xs text-black/50">Calorías</p>
                  </div>
                  <div>
                    <p className="font-display font-bold text-lg">{totals.protein}g</p>
                    <p className="text-xs text-black/50">Proteína</p>
                  </div>
                  <div>
                    <p className="font-display font-bold text-lg">{totals.fat}g</p>
                    <p className="text-xs text-black/50">Grasa</p>
                  </div>
                  <div>
                    <p className="font-display font-bold text-lg">{totals.carbs}g</p>
                    <p className="text-xs text-black/50">Carbohidratos</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
