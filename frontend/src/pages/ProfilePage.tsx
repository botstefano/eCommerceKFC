import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { useAuthStore } from "../store/authStore";

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const refreshUser = useAuthStore((s) => s.refreshUser);
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [spicyPreference, setSpicyPreference] = useState(user?.preferences?.spicyPreference || "no_spicy");
  const [street, setStreet] = useState(user?.addresses?.[0]?.street || "");
  const [city, setCity] = useState(user?.addresses?.[0]?.city || "Trujillo");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      const { data } = await api.put("/users/profile", { name, phone, preferences: { spicyPreference } });
      const { data: addrData } = await api.put("/users/addresses", {
        addresses: [{ id: "addr-1", label: "Principal", street, city }],
      });
      refreshUser(addrData.user);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="section-title mb-6">Mi perfil</h1>

      <div className="card p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-14 h-14 rounded-full bg-kfc-red text-white flex items-center justify-center font-display font-bold text-xl">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-display font-semibold">{user.name}</p>
            <p className="text-sm text-black/50">{user.email}</p>
          </div>
          <span className="ml-auto text-xs font-bold bg-kfc-gold/30 px-3 py-1 rounded-full">{user.loyaltyLevel}</span>
        </div>

        <div className="grid gap-3">
          <div>
            <label className="text-xs font-semibold text-black/50">Nombre</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="input-field mt-1" />
          </div>
          <div>
            <label className="text-xs font-semibold text-black/50">Teléfono</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className="input-field mt-1" />
          </div>
        </div>
      </div>

      <div className="card p-6 mb-6">
        <p className="font-display font-semibold mb-3">Dirección principal</p>
        <div className="grid gap-3">
          <input value={street} onChange={(e) => setStreet(e.target.value)} placeholder="Calle y número" className="input-field" />
          <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Ciudad" className="input-field" />
        </div>
      </div>

      <div className="card p-6 mb-6">
        <p className="font-display font-semibold mb-3">Preferencias</p>
        <div className="flex gap-3">
          <button
            onClick={() => setSpicyPreference("spicy")}
            className={`flex-1 p-3 rounded-xl border-2 text-sm font-semibold ${
              spicyPreference === "spicy" ? "border-kfc-red bg-kfc-red/5 text-kfc-red" : "border-black/10"
            }`}
          >
            🌶️ Me gusta el picante
          </button>
          <button
            onClick={() => setSpicyPreference("no_spicy")}
            className={`flex-1 p-3 rounded-xl border-2 text-sm font-semibold ${
              spicyPreference === "no_spicy" ? "border-kfc-red bg-kfc-red/5 text-kfc-red" : "border-black/10"
            }`}
          >
            Sin picante
          </button>
        </div>
      </div>

      <button onClick={handleSave} disabled={saving} className="btn-primary w-full">
        {saving ? "Guardando..." : "Guardar cambios"}
      </button>
      {saved && <p className="text-sm text-green-600 text-center mt-2">Perfil actualizado ✓</p>}

      <div className="flex justify-center gap-4 mt-8 text-sm">
        <Link to="/orders" className="text-kfc-red font-semibold hover:underline">
          Mis pedidos
        </Link>
        <Link to="/loyalty" className="text-kfc-red font-semibold hover:underline">
          Programa de lealtad
        </Link>
        <Link to="/favorites" className="text-kfc-red font-semibold hover:underline">
          Favoritos
        </Link>
      </div>
    </div>
  );
}
