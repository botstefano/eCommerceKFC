import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { useCartStore } from "../store/cartStore";
import CartItemRow from "../components/cart/CartItemRow";
import CouponInput from "../components/cart/CouponInput";
import OrderTypeSelector from "../components/cart/OrderTypeSelector";
import EmptyState from "../components/common/EmptyState";
import RecommendedSection from "../components/home/RecommendedSection";

export default function CartPage() {
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal());
  const discount = useCartStore((s) => s.discount);
  const orderType = useCartStore((s) => s.orderType);
  const navigate = useNavigate();

  const deliveryFee = orderType === "DELIVERY" ? 5 : 0;
  const total = Math.max(0, subtotal - discount + deliveryFee);

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <EmptyState
          icon={<ShoppingCart size={48} />}
          title="Tu carrito está vacío"
          description="Explora el menú y agrega tus productos favoritos."
          action={
            <Link to="/menu" className="btn-primary">
              Ir al menú
            </Link>
          }
        />
        <RecommendedSection />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="section-title mb-6">Tu carrito</h1>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <div className="card p-4 mb-6">
            {items.map((item) => (
              <CartItemRow key={item.product.id} item={item} />
            ))}
          </div>

          <p className="font-display font-semibold mb-3">Tipo de pedido</p>
          <OrderTypeSelector />
        </div>

        <div>
          <div className="card p-4 sticky top-20">
            <p className="font-display font-semibold mb-3">Resumen</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-black/60">Subtotal</span>
                <span>S/ {subtotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Descuento</span>
                  <span>- S/ {discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-black/60">Envío</span>
                <span>{deliveryFee > 0 ? `S/ ${deliveryFee.toFixed(2)}` : "Gratis"}</span>
              </div>
              <div className="border-t border-black/10 pt-2 flex justify-between font-display font-bold text-lg">
                <span>Total</span>
                <span className="text-kfc-red">S/ {total.toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-4">
              <CouponInput />
            </div>

            <button onClick={() => navigate("/checkout")} className="btn-primary w-full mt-4">
              Continuar al pago
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
