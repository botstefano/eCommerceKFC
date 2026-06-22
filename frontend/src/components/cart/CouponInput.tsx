import { useState } from "react";
import { Tag } from "lucide-react";
import api from "../../services/api";
import { useCartStore } from "../../store/cartStore";

export default function CouponInput() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const subtotal = useCartStore((s) => s.subtotal());
  const applyPromo = useCartStore((s) => s.applyPromo);
  const appliedPromoCode = useCartStore((s) => s.appliedPromoCode);
  const clearPromo = useCartStore((s) => s.clearPromo);

  async function handleApply() {
    if (!code.trim()) return;
    setLoading(true);
    setError("");
    try {
      const { data } = await api.post("/promotions/validate", { code, subtotal });
      applyPromo(data.promotion.code, data.discount);
    } catch (err: any) {
      setError(err.message || "Cupón inválido");
    } finally {
      setLoading(false);
    }
  }

  if (appliedPromoCode) {
    return (
      <div className="flex items-center justify-between bg-green-50 text-green-700 text-sm rounded-xl px-4 py-2.5">
        <span className="flex items-center gap-2 font-semibold">
          <Tag size={14} /> Cupón {appliedPromoCode} aplicado
        </span>
        <button onClick={clearPromo} className="underline text-xs">
          Quitar
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Código de cupón"
          className="input-field"
        />
        <button onClick={handleApply} disabled={loading} className="btn-outline whitespace-nowrap">
          {loading ? "..." : "Aplicar"}
        </button>
      </div>
      {error && <p className="text-xs text-kfc-red mt-1">{error}</p>}
    </div>
  );
}
