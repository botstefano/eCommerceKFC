import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Minus, Plus, Star, Flame } from "lucide-react";
import api from "../services/api";
import { Product, Review } from "../types";
import Loader from "../components/common/Loader";
import ProductCard from "../components/common/ProductCard";
import { useCartStore } from "../store/cartStore";
import { useAuthStore } from "../store/authStore";
import { useRecommendations } from "../hooks/useRecommendations";
import { useFavorites } from "../hooks/useFavorites";

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const addItem = useCartStore((s) => s.addItem);
  const user = useAuthStore((s) => s.user);
  const { recommendations } = useRecommendations({ productId: id, limit: 4 });
  const { favoriteIds, toggle } = useFavorites();

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([api.get(`/products/${id}`), api.get(`/reviews/product/${id}`)])
      .then(([prodRes, reviewRes]) => {
        setProduct(prodRes.data.product);
        setAvgRating(prodRes.data.avgRating);
        setReviews(reviewRes.data.reviews);
      })
      .finally(() => setLoading(false));
  }, [id]);

  async function submitReview() {
    if (!id) return;
    await api.post("/reviews", { productId: id, rating: newRating, comment: newComment });
    const { data } = await api.get(`/reviews/product/${id}`);
    setReviews(data.reviews);
    setNewComment("");
  }

  if (loading) return <Loader />;
  if (!product) return <div className="max-w-3xl mx-auto px-4 py-16 text-center">Producto no encontrado.</div>;

  const n = product.nutritionalInfo;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8">
        <div className="rounded-2xl overflow-hidden bg-black/5 aspect-square">
          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
        </div>

        <div>
          <h1 className="font-display font-bold text-3xl mb-2">{product.name}</h1>
          {avgRating !== null && (
            <div className="flex items-center gap-1 mb-2 text-sm">
              <Star size={14} className="fill-kfc-gold text-kfc-gold" />
              <span className="font-semibold">{avgRating.toFixed(1)}</span>
              <span className="text-black/40">({reviews.length} reseñas)</span>
            </div>
          )}
          <p className="text-black/60 mb-4">{product.description}</p>

          {product.spicyLevel > 0 && (
            <div className="flex items-center gap-1 mb-4 text-kfc-red font-semibold text-sm">
              <Flame size={16} /> Nivel de picante: {product.spicyLevel}/5
            </div>
          )}

          <p className="font-display font-extrabold text-3xl text-kfc-red mb-6">S/ {product.price.toFixed(2)}</p>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center gap-3 border border-black/10 rounded-full px-3 py-1.5">
              <button onClick={() => setQuantity((q) => Math.max(1, q - 1))}>
                <Minus size={16} />
              </button>
              <span className="font-semibold w-6 text-center">{quantity}</span>
              <button onClick={() => setQuantity((q) => q + 1)}>
                <Plus size={16} />
              </button>
            </div>
            <button
              onClick={() => addItem(product, quantity)}
              disabled={product.stock === 0}
              className="btn-primary flex-1 disabled:opacity-40"
            >
              {product.stock === 0 ? "Agotado" : "Agregar al carrito"}
            </button>
            {user && (
              <button onClick={() => toggle(product.id)} className="btn-outline px-3">
                {favoriteIds.has(product.id) ? "♥" : "♡"}
              </button>
            )}
          </div>

          <div className="card p-4">
            <p className="font-display font-semibold mb-3">Información nutricional</p>
            <div className="grid grid-cols-4 gap-3 text-center text-sm">
              <div>
                <p className="font-bold">{n.calories}</p>
                <p className="text-black/50 text-xs">Calorías</p>
              </div>
              <div>
                <p className="font-bold">{n.protein}g</p>
                <p className="text-black/50 text-xs">Proteína</p>
              </div>
              <div>
                <p className="font-bold">{n.fat}g</p>
                <p className="text-black/50 text-xs">Grasa</p>
              </div>
              <div>
                <p className="font-bold">{n.carbs}g</p>
                <p className="text-black/50 text-xs">Carbohidratos</p>
              </div>
            </div>
            {product.allergens.length > 0 && (
              <p className="text-xs text-black/50 mt-3">
                <strong>Alérgenos:</strong> {product.allergens.join(", ")}
              </p>
            )}
          </div>
        </div>
      </div>

      {recommendations.length > 0 && (
        <section className="mt-12">
          <h2 className="section-title mb-4">Combina perfecto con</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {recommendations.map((r) => (
              <ProductCard key={r.product.id} product={r.product} />
            ))}
          </div>
        </section>
      )}

      <section className="mt-12 max-w-2xl">
        <h2 className="section-title mb-4">Reseñas</h2>
        {user && (
          <div className="card p-4 mb-6">
            <p className="font-semibold text-sm mb-2">Deja tu reseña</p>
            <div className="flex gap-1 mb-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} onClick={() => setNewRating(n)}>
                  <Star size={20} className={n <= newRating ? "fill-kfc-gold text-kfc-gold" : "text-black/20"} />
                </button>
              ))}
            </div>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="¿Qué te pareció?"
              className="input-field mb-2"
              rows={2}
            />
            <button onClick={submitReview} className="btn-primary text-sm py-2">
              Publicar reseña
            </button>
          </div>
        )}
        <div className="flex flex-col gap-3">
          {reviews.map((r) => (
            <div key={r.id} className="card p-4">
              <div className="flex items-center justify-between mb-1">
                <p className="font-semibold text-sm">{r.user?.name || "Cliente"}</p>
                <div className="flex">
                  {Array.from({ length: r.rating }).map((_, i) => (
                    <Star key={i} size={12} className="fill-kfc-gold text-kfc-gold" />
                  ))}
                </div>
              </div>
              {r.comment && <p className="text-sm text-black/60">{r.comment}</p>}
            </div>
          ))}
          {reviews.length === 0 && <p className="text-sm text-black/50">Aún no hay reseñas. ¡Sé el primero!</p>}
        </div>
      </section>

      <Link to="/menu" className="inline-block mt-10 text-sm font-semibold text-kfc-red hover:underline">
        ← Volver al menú
      </Link>
    </div>
  );
}
