import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, LayoutGrid, List as ListIcon } from "lucide-react";
import api from "../services/api";
import { Product } from "../types";
import ProductCard from "../components/common/ProductCard";
import Loader from "../components/common/Loader";
import EmptyState from "../components/common/EmptyState";
import { useFavorites } from "../hooks/useFavorites";
import { useCartStore } from "../store/cartStore";

const CATEGORIES = ["Todos", "Pollo", "Combos", "Acompañamientos", "Bebidas", "Postres"];

export default function MenuPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [sort, setSort] = useState("name");
  const [view, setView] = useState<"grid" | "list">("grid");
  const category = searchParams.get("category") || "Todos";
  const { favoriteIds, toggle } = useFavorites();
  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string> = { sort };
    if (category !== "Todos") params.category = category;
    if (search) params.search = search;

    api
      .get("/products", { params })
      .then(({ data }) => setProducts(data.products))
      .finally(() => setLoading(false));
  }, [category, search, sort]);

  const handleCategoryChange = (cat: string) => {
    const next = new URLSearchParams(searchParams);
    if (cat === "Todos") next.delete("category");
    else next.set("category", cat);
    setSearchParams(next);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="section-title mb-6">Menú completo</h1>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-black/40" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar en el menú..."
            className="input-field pl-9"
          />
        </div>
        <select value={sort} onChange={(e) => setSort(e.target.value)} className="input-field md:w-48">
          <option value="name">Ordenar: Nombre</option>
          <option value="price_asc">Precio: menor a mayor</option>
          <option value="price_desc">Precio: mayor a menor</option>
        </select>
        <div className="flex gap-1 bg-black/5 rounded-xl p-1">
          <button onClick={() => setView("grid")} className={`p-2 rounded-lg ${view === "grid" ? "bg-white shadow" : ""}`}>
            <LayoutGrid size={18} />
          </button>
          <button onClick={() => setView("list")} className={`p-2 rounded-lg ${view === "list" ? "bg-white shadow" : ""}`}>
            <ListIcon size={18} />
          </button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto scrollbar-thin pb-4 mb-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => handleCategoryChange(cat)}
            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
              category === cat ? "bg-kfc-red text-white" : "bg-black/5 hover:bg-black/10"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <Loader />
      ) : products.length === 0 ? (
        <EmptyState title="No encontramos productos" description="Intenta con otra búsqueda o categoría." />
      ) : view === "grid" ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} isFavorite={favoriteIds.has(p.id)} onToggleFavorite={toggle} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {products.map((p) => (
            <div key={p.id} className="card flex items-center gap-4 p-3">
              <img src={p.imageUrl} alt={p.name} className="w-20 h-20 rounded-xl object-cover bg-black/5" />
              <div className="flex-1">
                <p className="font-display font-semibold">{p.name}</p>
                <p className="text-xs text-black/50 line-clamp-1">{p.description}</p>
              </div>
              <span className="font-display font-bold text-kfc-red">S/ {p.price.toFixed(2)}</span>
              <button onClick={() => addItem(p, 1)} className="btn-primary text-sm py-2">
                Agregar
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
