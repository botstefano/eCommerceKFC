import { Minus, Plus, Trash2 } from "lucide-react";
import { CartItem } from "../../store/cartStore";
import { useCartStore } from "../../store/cartStore";

export default function CartItemRow({ item }: { item: CartItem }) {
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  return (
    <div className="flex items-center gap-4 py-4 border-b border-black/5 last:border-0">
      <img src={item.product.imageUrl} alt={item.product.name} className="w-16 h-16 rounded-xl object-cover bg-black/5" />
      <div className="flex-1 min-w-0">
        <p className="font-display font-semibold text-sm truncate">{item.product.name}</p>
        <p className="text-xs text-black/50">S/ {item.product.price.toFixed(2)} c/u</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
          className="w-7 h-7 rounded-full border border-black/10 flex items-center justify-center hover:bg-black/5"
        >
          <Minus size={14} />
        </button>
        <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
        <button
          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
          className="w-7 h-7 rounded-full border border-black/10 flex items-center justify-center hover:bg-black/5"
        >
          <Plus size={14} />
        </button>
      </div>
      <span className="font-display font-bold text-sm w-20 text-right">S/ {(item.product.price * item.quantity).toFixed(2)}</span>
      <button onClick={() => removeItem(item.product.id)} className="text-black/30 hover:text-kfc-red">
        <Trash2 size={16} />
      </button>
    </div>
  );
}
