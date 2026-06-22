import { useEffect, useState } from "react";
import { Gift, Crown } from "lucide-react";
import api from "../services/api";
import { useAuthStore } from "../store/authStore";
import Loader from "../components/common/Loader";

interface LoyaltyData {
  points: number;
  level: "SILVER" | "GOLD" | "PLATINUM";
  nextLevel: "GOLD" | "PLATINUM" | null;
  pointsToNextLevel: number;
  rewards: { id: string; name: string; cost: number }[];
}

const LEVEL_THRESHOLDS = { SILVER: 0, GOLD: 500, PLATINUM: 1500 };
const LEVEL_COLORS: Record<string, string> = {
  SILVER: "from-gray-300 to-gray-400",
  GOLD: "from-kfc-gold to-yellow-500",
  PLATINUM: "from-slate-700 to-slate-900",
};

export default function LoyaltyPage() {
  const [data, setData] = useState<LoyaltyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const refreshUser = useAuthStore((s) => s.refreshUser);
  const user = useAuthStore((s) => s.user);

  function load() {
    api
      .get("/users/loyalty")
      .then(({ data }) => setData(data))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleRedeem(rewardId: string) {
    setRedeeming(rewardId);
    setMessage("");
    try {
      const { data: res } = await api.post("/users/loyalty/redeem", { rewardId });
      setMessage(`¡Canjeaste "${res.reward.name}"! Te quedan ${res.remainingPoints} puntos.`);
      if (user) refreshUser({ ...user, loyaltyPoints: res.remainingPoints, loyaltyLevel: res.level });
      load();
    } catch (err: any) {
      setMessage(err.message || "No se pudo canjear la recompensa");
    } finally {
      setRedeeming(null);
    }
  }

  if (loading || !data) return <Loader />;

  const currentThreshold = LEVEL_THRESHOLDS[data.level];
  const nextThreshold = data.nextLevel ? LEVEL_THRESHOLDS[data.nextLevel] : currentThreshold;
  const progress = data.nextLevel
    ? Math.min(100, ((data.points - currentThreshold) / (nextThreshold - currentThreshold)) * 100)
    : 100;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="section-title mb-6">Programa de lealtad</h1>

      <div className={`rounded-2xl p-6 text-white bg-gradient-to-br ${LEVEL_COLORS[data.level]} mb-6`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Crown size={22} />
            <span className="font-display font-bold text-xl">Nivel {data.level}</span>
          </div>
          <span className="font-display font-extrabold text-2xl">{data.points} pts</span>
        </div>
        {data.nextLevel ? (
          <>
            <div className="w-full bg-white/30 rounded-full h-2 mb-2">
              <div className="bg-white h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-sm text-white/80">
              Te faltan {data.pointsToNextLevel} puntos para alcanzar nivel {data.nextLevel}
            </p>
          </>
        ) : (
          <p className="text-sm text-white/80">¡Has alcanzado el nivel máximo!</p>
        )}
      </div>

      <h2 className="font-display font-semibold text-lg mb-3 flex items-center gap-2">
        <Gift size={18} /> Recompensas disponibles
      </h2>
      {message && <p className="text-sm text-kfc-red mb-3">{message}</p>}
      <div className="grid gap-3">
        {data.rewards.map((reward) => (
          <div key={reward.id} className="card p-4 flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm">{reward.name}</p>
              <p className="text-xs text-black/50">{reward.cost} puntos</p>
            </div>
            <button
              onClick={() => handleRedeem(reward.id)}
              disabled={data.points < reward.cost || redeeming === reward.id}
              className="btn-primary text-sm py-2 disabled:opacity-40"
            >
              {redeeming === reward.id ? "..." : "Canjear"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
