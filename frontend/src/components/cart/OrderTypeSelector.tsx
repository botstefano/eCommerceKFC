import { Truck, Store, UtensilsCrossed, Car } from "lucide-react";
import { useCartStore } from "../../store/cartStore";

const OPTIONS = [
  { type: "DELIVERY" as const, label: "Delivery", icon: Truck },
  { type: "PICKUP" as const, label: "Pickup", icon: Store },
  { type: "DINE_IN" as const, label: "Comer aquí", icon: UtensilsCrossed },
  { type: "DRIVE_THRU" as const, label: "Drive-thru", icon: Car },
];

export default function OrderTypeSelector() {
  const orderType = useCartStore((s) => s.orderType);
  const setOrderType = useCartStore((s) => s.setOrderType);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {OPTIONS.map(({ type, label, icon: Icon }) => (
        <button
          key={type}
          onClick={() => setOrderType(type)}
          className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-colors ${
            orderType === type ? "border-kfc-red bg-kfc-red/5 text-kfc-red" : "border-black/10 hover:border-black/20"
          }`}
        >
          <Icon size={20} />
          <span className="text-xs font-semibold">{label}</span>
        </button>
      ))}
    </div>
  );
}
