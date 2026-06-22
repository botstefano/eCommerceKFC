import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PackageSearch, RotateCcw } from "lucide-react";
import api from "../services/api";
import { Order } from "../types";
import Loader from "../components/common/Loader";
import EmptyState from "../components/common/EmptyState";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  PREPARING: "En preparación",
  READY: "Listo",
  ON_THE_WAY: "En camino",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
  REFUNDED: "Reembolsado",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  PREPARING: "bg-blue-100 text-blue-700",
  READY: "bg-blue-100 text-blue-700",
  ON_THE_WAY: "bg-purple-100 text-purple-700",
  DELIVERED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
  REFUNDED: "bg-gray-100 text-gray-700",
};

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get("/orders")
      .then(({ data }) => setOrders(data.orders))
      .finally(() => setLoading(false));
  }, []);

  async function handleReorder(orderId: string) {
    await api.post(`/orders/${orderId}/reorder`);
    navigate("/cart");
  }

  if (loading) return <Loader />;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="section-title mb-6">Mis pedidos</h1>

      {orders.length === 0 ? (
        <EmptyState icon={<PackageSearch size={48} />} title="Aún no tienes pedidos" description="Cuando hagas tu primer pedido aparecerá aquí." />
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map((order) => (
            <div key={order.id} className="card p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="font-display font-semibold">Pedido #{order.id.slice(0, 8).toUpperCase()}</p>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_COLORS[order.status]}`}>
                  {STATUS_LABELS[order.status]}
                </span>
              </div>
              <p className="text-xs text-black/50 mb-3">{new Date(order.createdAt).toLocaleString("es-PE")}</p>
              <ul className="text-sm text-black/70 mb-3">
                {order.items.slice(0, 3).map((it, i) => (
                  <li key={i}>
                    {it.quantity}x {it.name}
                  </li>
                ))}
                {order.items.length > 3 && <li className="text-black/40">+{order.items.length - 3} más</li>}
              </ul>
              <div className="flex items-center justify-between">
                <span className="font-display font-bold text-kfc-red">S/ {order.total.toFixed(2)}</span>
                <div className="flex gap-2">
                  <button onClick={() => handleReorder(order.id)} className="btn-outline text-sm py-1.5 flex items-center gap-1">
                    <RotateCcw size={14} /> Reordenar
                  </button>
                  <Link to={`/orders/${order.id}`} className="btn-primary text-sm py-1.5">
                    Ver detalle
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
