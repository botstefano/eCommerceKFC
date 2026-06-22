import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { CheckCircle2, Circle, MapPin, Bike, Clock } from "lucide-react";
import api from "../services/api";
import { Order } from "../types";
import Loader from "../components/common/Loader";

const STEP_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  PREPARING: "En preparación",
  READY: "Listo",
  ON_THE_WAY: "En camino",
  DELIVERED: "Entregado",
};

export default function OrderTrackingPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [timeline, setTimeline] = useState<string[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let interval: ReturnType<typeof setInterval>;

    function fetchOrder() {
      api.get(`/orders/${id}`).then(({ data }) => {
        setOrder(data.order);
        setTimeline(data.timeline);
        setCurrentStepIndex(data.currentStepIndex);
        setLoading(false);
      });
    }

    fetchOrder();
    interval = setInterval(fetchOrder, 15000);
    return () => clearInterval(interval);
  }, [id]);

  if (loading) return <Loader />;
  if (!order) return <div className="max-w-3xl mx-auto px-4 py-16 text-center">Pedido no encontrado.</div>;

  const isFinal = ["DELIVERED", "CANCELLED", "REFUNDED"].includes(order.status);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="section-title mb-1">Seguimiento de pedido</h1>
      <p className="text-black/50 text-sm mb-6">Pedido #{order.id.slice(0, 8).toUpperCase()}</p>

      {order.status === "CANCELLED" || order.status === "REFUNDED" ? (
        <div className="card p-6 text-center">
          <p className="font-display font-semibold text-lg mb-2">
            Pedido {order.status === "CANCELLED" ? "cancelado" : "reembolsado"}
          </p>
          <p className="text-sm text-black/50">Si tienes dudas, visita la sección de soporte.</p>
        </div>
      ) : (
        <div className="card p-6 mb-6">
          <div className="flex flex-col gap-6">
            {timeline.map((step, i) => (
              <div key={step} className="flex items-center gap-3">
                {i <= currentStepIndex ? (
                  <CheckCircle2 size={22} className="text-kfc-red flex-shrink-0" />
                ) : (
                  <Circle size={22} className="text-black/20 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <p className={`font-semibold text-sm ${i <= currentStepIndex ? "text-kfc-black" : "text-black/40"}`}>
                    {STEP_LABELS[step] || step}
                  </p>
                </div>
                {i === currentStepIndex && !isFinal && (
                  <span className="text-xs bg-kfc-gold/30 text-kfc-black px-2 py-1 rounded-full font-semibold">Actual</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {order.type === "DELIVERY" && !isFinal && (
        <div className="card p-6 mb-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-kfc-red/10 flex items-center justify-center text-kfc-red">
            <Bike size={22} />
          </div>
          <div>
            <p className="font-semibold text-sm">Tu repartidor está en camino</p>
            <p className="text-xs text-black/50 flex items-center gap-1 mt-1">
              <Clock size={12} /> Tiempo estimado: 25-35 min
            </p>
          </div>
        </div>
      )}

      <div className="card p-6 mb-6">
        <p className="font-display font-semibold mb-3 flex items-center gap-2">
          <MapPin size={16} /> Detalles del pedido
        </p>
        <ul className="text-sm space-y-1 text-black/70">
          {order.items.map((it, i) => (
            <li key={i} className="flex justify-between">
              <span>
                {it.quantity}x {it.name}
              </span>
              <span>S/ {(it.price * it.quantity).toFixed(2)}</span>
            </li>
          ))}
        </ul>
        <div className="border-t border-black/10 mt-3 pt-3 flex justify-between font-display font-bold">
          <span>Total</span>
          <span className="text-kfc-red">S/ {order.total.toFixed(2)}</span>
        </div>
      </div>

      <Link to="/orders" className="text-sm font-semibold text-kfc-red hover:underline">
        ← Ver todos mis pedidos
      </Link>
    </div>
  );
}
