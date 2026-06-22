import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useCartStore } from "../store/cartStore";
import { useAuthStore } from "../store/authStore";
import { Branch } from "../types";
import OrderTypeSelector from "../components/cart/OrderTypeSelector";

export default function CheckoutPage() {
  const navigate = useNavigate();
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal());
  const discount = useCartStore((s) => s.discount);
  const appliedPromoCode = useCartStore((s) => s.appliedPromoCode);
  const orderType = useCartStore((s) => s.orderType);
  const clearCart = useCartStore((s) => s.clear);
  const user = useAuthStore((s) => s.user);

  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchId, setBranchId] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [street, setStreet] = useState(user?.addresses?.[0]?.street || "");
  const [city, setCity] = useState(user?.addresses?.[0]?.city || "Trujillo");
  const [instructions, setInstructions] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const deliveryFee = orderType === "DELIVERY" ? 5 : 0;
  const total = Math.max(0, subtotal - discount + deliveryFee);

  useEffect(() => {
    if (orderType === "PICKUP") {
      api.get("/branches").then(({ data }) => setBranches(data.branches));
    }
  }, [orderType]);

  if (items.length === 0) {
    navigate("/cart");
    return null;
  }

  async function handleSubmit() {
    setError("");
    if (orderType === "DELIVERY" && !street.trim()) {
      setError("Ingresa una dirección de entrega");
      return;
    }
    if (orderType === "PICKUP" && (!branchId || !scheduledTime)) {
      setError("Selecciona una sucursal y un horario");
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await api.post("/orders", {
        items: items.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
        type: orderType,
        address: orderType === "DELIVERY" ? { street, city } : undefined,
        branchId: orderType === "PICKUP" ? branchId : undefined,
        scheduledTime: orderType === "PICKUP" ? scheduledTime : undefined,
        specialInstructions: instructions,
        promoCode: appliedPromoCode || undefined,
        paymentMethod,
      });
      clearCart();
      navigate(`/orders/${data.order.id}`);
    } catch (err: any) {
      setError(err.message || "No se pudo procesar el pedido");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="section-title mb-6">Checkout</h1>

      <div className="card p-5 mb-5">
        <p className="font-display font-semibold mb-3">Tipo de pedido</p>
        <OrderTypeSelector />
      </div>

      {orderType === "DELIVERY" && (
        <div className="card p-5 mb-5">
          <p className="font-display font-semibold mb-3">Dirección de entrega</p>
          <div className="grid gap-3">
            <input value={street} onChange={(e) => setStreet(e.target.value)} placeholder="Calle y número" className="input-field" />
            <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Ciudad" className="input-field" />
          </div>
        </div>
      )}

      {orderType === "PICKUP" && (
        <div className="card p-5 mb-5">
          <p className="font-display font-semibold mb-3">Sucursal y horario</p>
          <div className="grid gap-3">
            <select value={branchId} onChange={(e) => setBranchId(e.target.value)} className="input-field">
              <option value="">Selecciona una sucursal</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            <input
              type="datetime-local"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="input-field"
            />
          </div>
        </div>
      )}

      {orderType === "DINE_IN" && (
        <div className="card p-5 mb-5 text-sm text-black/60">
          Te asignaremos automáticamente una mesa disponible al confirmar tu pedido.
        </div>
      )}

      {orderType === "DRIVE_THRU" && (
        <div className="card p-5 mb-5 text-sm text-black/60">
          Pasa por la ventanilla y muestra tu código de pedido para recogerlo.
        </div>
      )}

      <div className="card p-5 mb-5">
        <p className="font-display font-semibold mb-3">Método de pago</p>
        <div className="flex gap-3">
          <button
            onClick={() => setPaymentMethod("card")}
            className={`flex-1 p-3 rounded-xl border-2 text-sm font-semibold ${
              paymentMethod === "card" ? "border-kfc-red bg-kfc-red/5 text-kfc-red" : "border-black/10"
            }`}
          >
            Tarjeta (Stripe test)
          </button>
          <button
            onClick={() => setPaymentMethod("cash")}
            className={`flex-1 p-3 rounded-xl border-2 text-sm font-semibold ${
              paymentMethod === "cash" ? "border-kfc-red bg-kfc-red/5 text-kfc-red" : "border-black/10"
            }`}
          >
            Efectivo al recoger
          </button>
        </div>
      </div>

      <div className="card p-5 mb-5">
        <p className="font-display font-semibold mb-3">Instrucciones especiales</p>
        <textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder="Ej. sin cebolla, tocar el timbre 2 veces..."
          className="input-field"
          rows={2}
        />
      </div>

      <div className="card p-5 mb-5">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-black/60">Subtotal</span>
          <span>S/ {subtotal.toFixed(2)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-sm mb-1 text-green-600">
            <span>Descuento</span>
            <span>- S/ {discount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between text-sm mb-2">
          <span className="text-black/60">Envío</span>
          <span>{deliveryFee > 0 ? `S/ ${deliveryFee.toFixed(2)}` : "Gratis"}</span>
        </div>
        <div className="flex justify-between font-display font-bold text-lg border-t border-black/10 pt-2">
          <span>Total</span>
          <span className="text-kfc-red">S/ {total.toFixed(2)}</span>
        </div>
      </div>

      {error && <p className="text-sm text-kfc-red mb-4">{error}</p>}

      <button onClick={handleSubmit} disabled={submitting} className="btn-primary w-full">
        {submitting ? "Procesando pago..." : `Confirmar pedido — S/ ${total.toFixed(2)}`}
      </button>
    </div>
  );
}
