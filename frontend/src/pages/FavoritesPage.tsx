import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import api from "../services/api";
import { Product } from "../types";
import Loader from "../components/common/Loader";
import EmptyState from "../components/common/EmptyState";
import ProductCard from "../components/common/ProductCard";
import { useFavorites } from "../hooks/useFavorites";

export default function FavoritesPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { favoriteIds, toggle, refresh } = useFavorites();

  useEffect(() => {
    api
      .get("/favorites")
      .then(({ data }) => setProducts(data.favorites.map((f: any) => f.product)))
      .finally(() => setLoading(false));
  }, []);

  async function handleToggle(productId: string) {
    await toggle(productId);
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    refresh();
  }

  if (loading) return <Loader />;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="section-title mb-6">Mis favoritos</h1>

      {products.length === 0 ? (
        <EmptyState icon={<Heart size={48} />} title="No tienes favoritos aún" description="Toca el corazón en cualquier producto para guardarlo aquí." />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} isFavorite={favoriteIds.has(p.id)} onToggleFavorite={handleToggle} />
          ))}
        </div>
      )}
    </div>
  );
}
