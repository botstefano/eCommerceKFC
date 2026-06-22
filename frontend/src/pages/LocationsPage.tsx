import { useEffect, useState } from "react";
import { MapPin, Clock, Phone } from "lucide-react";
import api from "../services/api";
import { Branch } from "../types";
import Loader from "../components/common/Loader";

export default function LocationsPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Branch | null>(null);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    api
      .get("/branches")
      .then(({ data }) => {
        setBranches(data.branches);
        setSelected(data.branches[0] || null);
      })
      .finally(() => setLoading(false));

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {
          /* user denied geolocation, that's fine */
        }
      );
    }
  }, []);

  useEffect(() => {
    if (!userCoords) return;
    api
      .get("/branches/nearby", { params: userCoords })
      .then(({ data }) => setBranches(data.branches));
  }, [userCoords]);

  if (loading) return <Loader />;

  const mapQuery = selected ? encodeURIComponent(`${selected.lat},${selected.lng}`) : "";

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="section-title mb-6">Nuestras ubicaciones</h1>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1 flex flex-col gap-3 max-h-[600px] overflow-y-auto">
          {branches.map((b) => (
            <button
              key={b.id}
              onClick={() => setSelected(b)}
              className={`card p-4 text-left transition-all ${selected?.id === b.id ? "ring-2 ring-kfc-red" : ""}`}
            >
              <p className="font-display font-semibold text-sm">{b.name}</p>
              <p className="text-xs text-black/50 flex items-center gap-1 mt-1">
                <MapPin size={12} /> {b.address}
              </p>
              <p className="text-xs text-black/50 flex items-center gap-1 mt-1">
                <Clock size={12} /> {b.openTime} - {b.closeTime}
              </p>
              {b.phone && (
                <p className="text-xs text-black/50 flex items-center gap-1 mt-1">
                  <Phone size={12} /> {b.phone}
                </p>
              )}
              {b.distanceKm !== undefined && (
                <p className="text-xs font-semibold text-kfc-red mt-1">{b.distanceKm} km de tu ubicación</p>
              )}
            </button>
          ))}
        </div>

        <div className="md:col-span-2 card overflow-hidden h-[400px] md:h-auto">
          {selected ? (
            <iframe
              title="Mapa de sucursal"
              className="w-full h-full min-h-[400px] border-0"
              src={`https://www.google.com/maps?q=${mapQuery}&z=15&output=embed`}
              loading="lazy"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-black/40">Selecciona una sucursal</div>
          )}
        </div>
      </div>
    </div>
  );
}
