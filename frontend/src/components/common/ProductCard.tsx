import { Link } from "react-router-dom";
import { Plus, Heart } from "lucide-react";
import { Product } from "../../types";
import { useCartStore } from "../../store/cartStore";
import { useAuthStore } from "../../store/authStore";
import SpicyBadge from "./SpicyBadge";

interface Props {
  product: Product;
  isFavorite?: boolean;
  onToggleFavorite?: (productId: string) => void;
}

export default function ProductCard({ product, isFavorite, onToggleFavorite }: Props) {
  const addItem = useCartStore((s) => s.addItem);
  const user = useAuthStore((s) => s.user);

  return (
    <div className="card group overflow-hidden flex flex-col">
      <Link to={`/product/${product.id}`} className="relative block aspect-[4/3] overflow-hidden bg-black/5">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        {product.stock <= 10 && product.stock > 0 && (
          <span className="absolute top-2 left-2 bg-kfc-gold text-kfc-black text-[10px] font-bold px-2 py-1 rounded-full">
            ¡Pocas unidades!
          </span>
        )}
        {product.stock === 0 && (
          <span className="absolute top-2 left-2 bg-black/70 text-white text-[10px] font-bold px-2 py-1 rounded-full">
            Agotado
          </span>
        )}
        {user && onToggleFavorite && (
          <button
            onClick={(e) => {
              e.preventDefault();
              onToggleFavorite(product.id);
            }}
            className="absolute top-2 right-2 bg-white/90 rounded-full p-1.5 hover:bg-white"
          >
            <Heart size={16} className={isFavorite ? "fill-kfc-red text-kfc-red" : "text-black/50"} />
          </button>
        )}
      </Link>

      <div className="p-3 flex flex-col gap-1 flex-1">
        <Link to={`/product/${product.id}`} className="font-display font-semibold text-sm leading-tight hover:text-kfc-red line-clamp-2">
          {product.name}
        </Link>
        <p className="text-xs text-black/50 line-clamp-2">{product.description}</p>
        <div className="mt-1">
          <SpicyBadge level={product.spicyLevel} />
        </div>

        <div className="mt-auto pt-2 flex items-center justify-between">
          <span className="font-display font-bold text-kfc-red">S/ {product.price.toFixed(2)}</span>
          <button
            onClick={() => addItem(product, 1)}
            disabled={product.stock === 0}
            className="bg-kfc-red text-white rounded-full p-2 hover:bg-kfc-red-dark disabled:opacity-40 transition-colors"
            title="Agregar al carrito"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
