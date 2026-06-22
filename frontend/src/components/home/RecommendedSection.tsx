import { Sparkles } from "lucide-react";
import { useRecommendations } from "../../hooks/useRecommendations";
import ProductCard from "../common/ProductCard";
import { useFavorites } from "../../hooks/useFavorites";

export default function RecommendedSection() {
  const { recommendations, loading } = useRecommendations({ limit: 8 });
  const { favoriteIds, toggle } = useFavorites();

  if (!loading && recommendations.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles size={20} className="text-kfc-gold" />
        <h2 className="section-title">Recomendado para ti</h2>
      </div>
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card aspect-[4/3] animate-pulse bg-black/5" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {recommendations.map((r) => (
            <ProductCard
              key={r.product.id}
              product={r.product}
              isFavorite={favoriteIds.has(r.product.id)}
              onToggleFavorite={toggle}
            />
          ))}
        </div>
      )}
    </section>
  );
}
