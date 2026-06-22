import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { Product } from "../types";
import Hero from "../components/home/Hero";
import CategoryList from "../components/home/CategoryList";
import RecommendedSection from "../components/home/RecommendedSection";
import ProductCard from "../components/common/ProductCard";
import Loader from "../components/common/Loader";
import { useFavorites } from "../hooks/useFavorites";

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { favoriteIds, toggle } = useFavorites();

  useEffect(() => {
    api
      .get("/products", { params: { sort: "name" } })
      .then(({ data }) => setProducts(data.products.slice(0, 8)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <Hero />
      <CategoryList />
      <RecommendedSection />

      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title">Lo más pedido</h2>
          <Link to="/menu" className="text-sm font-semibold text-kfc-red hover:underline">
            Ver todo el menú →
          </Link>
        </div>
        {loading ? (
          <Loader />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} isFavorite={favoriteIds.has(p.id)} onToggleFavorite={toggle} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
