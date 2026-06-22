import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Tag, Copy, Check } from "lucide-react";
import api from "../services/api";
import { Promotion } from "../types";
import Loader from "../components/common/Loader";
import EmptyState from "../components/common/EmptyState";

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get("/promotions")
      .then(({ data }) => setPromotions(data.promotions))
      .finally(() => setLoading(false));
  }, []);

  function copyCode(code: string) {
    navigator.clipboard?.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 1500);
  }

  if (loading) return <Loader />;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="section-title mb-6">Promociones activas</h1>

      {promotions.length === 0 ? (
        <EmptyState icon={<Tag size={48} />} title="No hay promociones activas por ahora" />
      ) : (
        <div className="flex flex-col gap-4">
          {promotions.map((promo) => (
            <div key={promo.id} className="card p-5 flex items-center gap-4 border-l-4 border-l-kfc-gold">
              <div className="w-12 h-12 rounded-full bg-kfc-red/10 text-kfc-red flex items-center justify-center flex-shrink-0">
                <Tag size={20} />
              </div>
              <div className="flex-1">
                <p className="font-display font-bold text-lg text-kfc-red">
                  {promo.discountType === "PERCENTAGE" ? `${promo.discountValue}% OFF` : `S/ ${promo.discountValue} OFF`}
                </p>
                <p className="text-sm text-black/60">{promo.description}</p>
                <p className="text-xs text-black/40 mt-1">Válido hasta {new Date(promo.validUntil).toLocaleDateString("es-PE")}</p>
              </div>
              <button
                onClick={() => copyCode(promo.code)}
                className="flex items-center gap-1 border-2 border-dashed border-black/20 rounded-lg px-3 py-2 text-sm font-mono font-bold hover:border-kfc-red hover:text-kfc-red"
              >
                {copied === promo.code ? <Check size={14} /> : <Copy size={14} />}
                {promo.code}
              </button>
            </div>
          ))}
        </div>
      )}

      <button onClick={() => navigate("/menu")} className="btn-primary w-full mt-8">
        Ir al menú y aplicar cupón
      </button>
    </div>
  );
}
