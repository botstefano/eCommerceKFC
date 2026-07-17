import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Package,
  ClipboardList,
  Tag,
  FlaskConical,
  Download,
  Plus,
  Trash2,
  Pencil,
  TrendingUp,
  ChefHat,
} from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import api, { API_URL } from "../services/api";
import { Product, Order, Promotion } from "../types";
import Loader from "../components/common/Loader";

type Tab = "dashboard" | "products" | "orders" | "promotions" | "inventory" | "forecast" | "kitchen" | "simulations";

const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "products", label: "Productos", icon: Package },
  { id: "orders", label: "Pedidos", icon: ClipboardList },
  { id: "promotions", label: "Promociones", icon: Tag },
  { id: "inventory", label: "Inventario", icon: Package },
  { id: "forecast", label: "Predicción de Demanda", icon: TrendingUp },
  { id: "kitchen", label: "Cocina en Tiempo Real", icon: ChefHat },
  { id: "simulations", label: "Simulaciones", icon: FlaskConical },
];

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("dashboard");

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="section-title mb-6">Panel de administración</h1>

      <div className="flex gap-2 overflow-x-auto scrollbar-thin mb-8 border-b border-black/10">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
              tab === id ? "border-kfc-red text-kfc-red" : "border-transparent text-black/50 hover:text-black"
            }`}
          >
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {tab === "dashboard" && <DashboardTab />}
      {tab === "products" && <ProductsTab />}
      {tab === "orders" && <OrdersTab />}
      {tab === "promotions" && <PromotionsTab />}
      {tab === "inventory" && <InventoryTab />}
      {tab === "forecast" && <ForecastTab />}
      {tab === "kitchen" && <KitchenTab />}
      {tab === "simulations" && <SimulationsTab />}
    </div>
  );
}

// ============================= DASHBOARD =============================
function DashboardTab() {
  const [summary, setSummary] = useState<any>(null);
  const [integratedData, setIntegratedData] = useState<any>(null);

  function loadSummary() {
    api.get("/admin/dashboard").then(({ data }) => setSummary(data));
  }

  function loadIntegratedData() {
    api.get("/admin/dashboard/integrated").then(({ data }) => setIntegratedData(data));
  }

  useEffect(() => {
    loadSummary();
    loadIntegratedData();
    const interval = setInterval(loadIntegratedData, 30000); // Auto-refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  if (!summary) return <Loader />;

  const cards = [
    { label: "Clientes", value: summary.userCount },
    { label: "Pedidos totales", value: summary.orderCount },
    { label: "Productos", value: summary.productCount },
    { label: "Ingresos totales", value: `S/ ${summary.totalRevenue.toLocaleString("es-PE")}` },
    { label: "Ticket promedio", value: `S/ ${summary.avgOrderValue.toFixed(2)}` },
    { label: "Tickets de soporte abiertos", value: summary.pendingTickets },
  ];

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {cards.map((c) => (
          <div key={c.label} className="card p-5">
            <p className="text-xs text-black/50 mb-1">{c.label}</p>
            <p className="font-display font-bold text-2xl">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="card p-5 mb-8">
        <p className="font-display font-semibold mb-3">Pedidos e ingresos (últimos 7 días)</p>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={summary.last7Days}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="orders" stroke="#C8102E" name="Pedidos" strokeWidth={2} />
            <Line type="monotone" dataKey="revenue" stroke="#FFC72C" name="Ingresos (S/)" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Vista Operativa en Tiempo Real */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <p className="font-display font-semibold">Vista Operativa en Tiempo Real</p>
          <p className="text-xs text-black/50">Auto-refresh cada 30s</p>
        </div>

        <div className="grid md:grid-cols-4 gap-4 mb-6">
          {/* Inventory Critical */}
          <div className="card p-4">
            <p className="text-xs text-black/50 mb-2">Inventario Crítico</p>
            {integratedData?.inventory?.criticalProducts?.length > 0 ? (
              <div className="space-y-2">
                {integratedData.inventory.criticalProducts.slice(0, 3).map((p: any) => (
                  <div key={p.id} className="text-sm">
                    <p className="font-medium">{p.name}</p>
                    <p className="text-xs text-red-600">{p.stock} unidades</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-green-600">Sin alertas</p>
            )}
          </div>

          {/* Demand Forecast */}
          <div className="card p-4">
            <p className="text-xs text-black/50 mb-2">Demanda (Próximas 4h)</p>
            {integratedData?.demand?.nextHoursForecast ? (
              <div className="space-y-1">
                {integratedData.demand.nextHoursForecast.map((f: any) => (
                  <div key={f.hour} className="flex justify-between text-sm">
                    <span>{f.hour}:00</span>
                    <span className="font-medium">{Math.round(f.predictedOrders)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-black/50">Cargando...</p>
            )}
            {integratedData?.demand?.source && (
              <p className={`text-xs mt-2 ${
                integratedData.demand.source === "ml_model" ? "text-blue-600" : "text-yellow-600"
              }`}>
                {integratedData.demand.source === "ml_model" ? "Modelo ML" : "Heurístico"}
              </p>
            )}
          </div>

          {/* Kitchen Counts */}
          <div className="card p-4">
            <p className="text-xs text-black/50 mb-2">Pedidos en Cocina</p>
            {integratedData?.kitchen?.counts ? (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Recibido</span>
                  <span className="bg-kfc-red text-white text-xs font-semibold px-2 py-1 rounded-full">
                    {integratedData.kitchen.counts.pending}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">En preparación</span>
                  <span className="bg-kfc-gold text-black text-xs font-semibold px-2 py-1 rounded-full">
                    {integratedData.kitchen.counts.preparing}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Listo</span>
                  <span className="bg-green-600 text-white text-xs font-semibold px-2 py-1 rounded-full">
                    {integratedData.kitchen.counts.ready}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-black/50">Cargando...</p>
            )}
          </div>

          {/* Sales Today */}
          <div className="card p-4">
            <p className="text-xs text-black/50 mb-2">Ventas Hoy</p>
            {integratedData?.sales ? (
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-black/50">Pedidos</p>
                  <p className="font-display font-bold text-xl">{integratedData.sales.todayOrders}</p>
                </div>
                <div>
                  <p className="text-xs text-black/50">Ingresos</p>
                  <p className="font-display font-bold text-xl">S/ {integratedData.sales.todayRevenue.toFixed(0)}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-black/50">Cargando...</p>
            )}
          </div>
        </div>

        {/* Bottlenecks Alert */}
        {integratedData?.kitchen?.bottlenecks?.length > 0 && (
          <div className="card p-4 bg-red-50 border border-red-200">
            <p className="font-semibold text-red-700 mb-2">⚠️ Cuellos de botella detectados</p>
            <div className="flex gap-4 text-sm">
              <div>
                <span className="text-red-900/50">Espera promedio:</span>
                <span className="font-semibold ml-1">{integratedData.kitchen.avgWaitTime.toFixed(1)} min</span>
              </div>
              <div>
                <span className="text-red-900/50">Preparación promedio:</span>
                <span className="font-semibold ml-1">{integratedData.kitchen.avgPreparationTime.toFixed(1)} min</span>
              </div>
              <div>
                <span className="text-red-900/50">Pedidos afectados:</span>
                <span className="font-semibold ml-1">{integratedData.kitchen.bottlenecks.length}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================= PRODUCTS =============================
function ProductsTab() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Product> | null>(null);

  function load() {
    api
      .get("/products")
      .then(({ data }) => setProducts(data.products))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este producto?")) return;
    await api.delete(`/products/${id}`);
    load();
  }

  async function handleSave() {
    if (!editing) return;
    const payload = { ...editing };
    if (editing.id) {
      await api.put(`/products/${editing.id}`, payload);
    } else {
      await api.post("/products", payload);
    }
    setEditing(null);
    load();
  }

  if (loading) return <Loader />;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="font-display font-semibold">Catálogo ({products.length})</p>
        <button
          onClick={() =>
            setEditing({
              name: "",
              description: "",
              price: 0,
              category: "Pollo",
              imageUrl: "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=600",
              stock: 50,
              nutritionalInfo: { calories: 0, protein: 0, fat: 0, carbs: 0 },
              spicyLevel: 0,
              allergens: [],
              preparationTime: 10,
            })
          }
          className="btn-primary text-sm py-2 flex items-center gap-1"
        >
          <Plus size={14} /> Nuevo producto
        </button>
      </div>

      {editing && (
        <div className="card p-5 mb-6">
          <p className="font-semibold mb-3">{editing.id ? "Editar producto" : "Nuevo producto"}</p>
          <div className="grid md:grid-cols-2 gap-3">
            <input
              placeholder="Nombre"
              value={editing.name}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              className="input-field"
            />
            <select
              value={editing.category}
              onChange={(e) => setEditing({ ...editing, category: e.target.value })}
              className="input-field"
            >
              {["Pollo", "Combos", "Acompañamientos", "Bebidas", "Postres"].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Precio"
              value={editing.price}
              onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })}
              className="input-field"
            />
            <input
              type="number"
              placeholder="Stock"
              value={editing.stock}
              onChange={(e) => setEditing({ ...editing, stock: Number(e.target.value) })}
              className="input-field"
            />
            <input
              type="number"
              placeholder="Nivel de picante (0-4)"
              value={editing.spicyLevel}
              onChange={(e) => setEditing({ ...editing, spicyLevel: Number(e.target.value) })}
              className="input-field"
            />
            <input
              placeholder="URL de imagen"
              value={editing.imageUrl}
              onChange={(e) => setEditing({ ...editing, imageUrl: e.target.value })}
              className="input-field"
            />
            <textarea
              placeholder="Descripción"
              value={editing.description}
              onChange={(e) => setEditing({ ...editing, description: e.target.value })}
              className="input-field md:col-span-2"
              rows={2}
            />
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleSave} className="btn-primary text-sm py-2">
              Guardar
            </button>
            <button onClick={() => setEditing(null)} className="btn-outline text-sm py-2">
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-black/50 border-b border-black/10">
              <th className="py-2">Producto</th>
              <th>Categoría</th>
              <th>Precio</th>
              <th>Stock</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b border-black/5">
                <td className="py-2 flex items-center gap-2">
                  <img src={p.imageUrl} className="w-8 h-8 rounded object-cover" />
                  {p.name}
                </td>
                <td>{p.category}</td>
                <td>S/ {p.price.toFixed(2)}</td>
                <td>{p.stock}</td>
                <td className="flex gap-2 justify-end py-2">
                  <button onClick={() => setEditing(p)} className="p-1.5 rounded hover:bg-black/5">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded hover:bg-black/5 text-kfc-red">
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================= ORDERS =============================
const STATUS_OPTIONS: Record<string, string[]> = {
  PENDING: ["PREPARING", "CANCELLED"],
  PREPARING: ["READY", "CANCELLED"],
  READY: ["ON_THE_WAY", "DELIVERED"],
  ON_THE_WAY: ["DELIVERED"],
  DELIVERED: ["REFUNDED"],
  CANCELLED: [],
  REFUNDED: [],
};

function OrdersTab() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    api
      .get("/orders/admin/all")
      .then(({ data }) => setOrders(data.orders))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function updateStatus(id: string, status: string) {
    await api.put(`/orders/${id}/status`, { status });
    load();
  }

  if (loading) return <Loader />;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-black/50 border-b border-black/10">
            <th className="py-2">Cliente</th>
            <th>Tipo</th>
            <th>Total</th>
            <th>Estado</th>
            <th>Fecha</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id} className="border-b border-black/5">
              <td className="py-2">{o.user?.name || o.userId.slice(0, 8)}</td>
              <td>{o.type}</td>
              <td>S/ {o.total.toFixed(2)}</td>
              <td>{o.status}</td>
              <td>{new Date(o.createdAt).toLocaleDateString("es-PE")}</td>
              <td>
                {STATUS_OPTIONS[o.status]?.length > 0 && (
                  <select
                    onChange={(e) => e.target.value && updateStatus(o.id, e.target.value)}
                    className="input-field py-1 text-xs"
                    defaultValue=""
                  >
                    <option value="">Cambiar estado...</option>
                    {STATUS_OPTIONS[o.status].map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============================= PROMOTIONS =============================
function PromotionsTab() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Promotion> | null>(null);

  function load() {
    api
      .get("/promotions/admin/all")
      .then(({ data }) => setPromotions(data.promotions))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSave() {
    if (!editing) return;
    if (editing.id) await api.put(`/promotions/admin/${editing.id}`, editing);
    else await api.post("/promotions/admin", editing);
    setEditing(null);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta promoción?")) return;
    await api.delete(`/promotions/admin/${id}`);
    load();
  }

  if (loading) return <Loader />;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="font-display font-semibold">Promociones ({promotions.length})</p>
        <button
          onClick={() =>
            setEditing({
              code: "",
              description: "",
              discountType: "PERCENTAGE",
              discountValue: 10,
              validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
              usageLimit: 100,
              active: true,
            })
          }
          className="btn-primary text-sm py-2 flex items-center gap-1"
        >
          <Plus size={14} /> Nueva promoción
        </button>
      </div>

      {editing && (
        <div className="card p-5 mb-6 grid md:grid-cols-2 gap-3">
          <input
            placeholder="Código"
            value={editing.code}
            onChange={(e) => setEditing({ ...editing, code: e.target.value.toUpperCase() })}
            className="input-field"
          />
          <select
            value={editing.discountType}
            onChange={(e) => setEditing({ ...editing, discountType: e.target.value as any })}
            className="input-field"
          >
            <option value="PERCENTAGE">Porcentaje</option>
            <option value="FIXED">Monto fijo</option>
          </select>
          <input
            type="number"
            placeholder="Valor del descuento"
            value={editing.discountValue}
            onChange={(e) => setEditing({ ...editing, discountValue: Number(e.target.value) })}
            className="input-field"
          />
          <input
            type="date"
            value={String(editing.validUntil).slice(0, 10)}
            onChange={(e) => setEditing({ ...editing, validUntil: e.target.value })}
            className="input-field"
          />
          <input
            type="number"
            placeholder="Límite de usos"
            value={editing.usageLimit}
            onChange={(e) => setEditing({ ...editing, usageLimit: Number(e.target.value) })}
            className="input-field"
          />
          <input
            placeholder="Descripción"
            value={editing.description}
            onChange={(e) => setEditing({ ...editing, description: e.target.value })}
            className="input-field"
          />
          <div className="md:col-span-2 flex gap-2">
            <button onClick={handleSave} className="btn-primary text-sm py-2">
              Guardar
            </button>
            <button onClick={() => setEditing(null)} className="btn-outline text-sm py-2">
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-black/50 border-b border-black/10">
              <th className="py-2">Código</th>
              <th>Descuento</th>
              <th>Usos</th>
              <th>Válido hasta</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {promotions.map((p) => (
              <tr key={p.id} className="border-b border-black/5">
                <td className="py-2 font-mono font-semibold">{p.code}</td>
                <td>{p.discountType === "PERCENTAGE" ? `${p.discountValue}%` : `S/ ${p.discountValue}`}</td>
                <td>
                  {p.usedCount}/{p.usageLimit}
                </td>
                <td>{new Date(p.validUntil).toLocaleDateString("es-PE")}</td>
                <td>{p.active ? "Activa" : "Inactiva"}</td>
                <td className="flex gap-2 justify-end py-2">
                  <button onClick={() => setEditing(p)} className="p-1.5 rounded hover:bg-black/5">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded hover:bg-black/5 text-kfc-red">
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================= SIMULATIONS =============================
function SimulationsTab() {
  const [sim, setSim] = useState<"ml" | "traffic" | "inventory" | "staffing" | "delivery">("ml");

  const SIM_TABS = [
    { id: "ml" as const, label: "ML vs Sin ML" },
    { id: "traffic" as const, label: "Tráfico por hora" },
    { id: "inventory" as const, label: "Inventario" },
    { id: "staffing" as const, label: "Personal en cocina" },
    { id: "delivery" as const, label: "Delivery por zona" },
  ];

  return (
    <div>
      <div className="flex gap-2 mb-6 flex-wrap">
        {SIM_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setSim(t.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
              sim === t.id ? "bg-kfc-red text-white" : "bg-black/5 hover:bg-black/10"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {sim === "ml" && <MlVsNoMlSim />}
      {sim === "traffic" && <TrafficSim />}
      {sim === "inventory" && <InventorySim />}
      {sim === "staffing" && <StaffingSim />}
      {sim === "delivery" && <DeliverySim />}
    </div>
  );
}

function MlVsNoMlSim() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    api.get("/admin/simulations/ml-vs-no-ml").then(({ data }) => setData(data));
  }, []);

  if (!data) return <Loader />;

  const chartData = [
    { name: "CTR", upliftPercent: data.uplift.ctrPercent },
    { name: "Conversión", upliftPercent: data.uplift.conversionPercent },
    { name: "AOV", upliftPercent: data.uplift.aovPercent },
    { name: "Ingreso", upliftPercent: data.uplift.revenuePercent },
  ];

  function downloadPdf() {
    const token = localStorage.getItem("kfc_token");
    fetch(`${API_URL}/admin/simulations/ml-vs-no-ml/pdf`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "reporte-ml-vs-sin-ml.pdf";
        a.click();
        URL.revokeObjectURL(url);
      });
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="font-display font-semibold">Comparativa: con motor de recomendaciones vs. sin él</p>
        <button onClick={downloadPdf} className="btn-primary text-sm py-2 flex items-center gap-1">
          <Download size={14} /> Descargar PDF
        </button>
      </div>

      <div className="overflow-x-auto mb-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-black/50 border-b border-black/10">
              <th className="py-2">Métrica</th>
              <th>Sin ML</th>
              <th>Con ML</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-black/5">
              <td className="py-2">CTR</td>
              <td>{(data.baseline.ctr * 100).toFixed(2)}%</td>
              <td className="font-semibold text-kfc-red">{(data.withMl.ctr * 100).toFixed(2)}%</td>
            </tr>
            <tr className="border-b border-black/5">
              <td className="py-2">Conversión</td>
              <td>{(data.baseline.conversion * 100).toFixed(2)}%</td>
              <td className="font-semibold text-kfc-red">{(data.withMl.conversion * 100).toFixed(2)}%</td>
            </tr>
            <tr className="border-b border-black/5">
              <td className="py-2">Ticket promedio (AOV)</td>
              <td>S/ {data.baseline.aov.toFixed(2)}</td>
              <td className="font-semibold text-kfc-red">S/ {data.withMl.aov.toFixed(2)}</td>
            </tr>
            <tr className="border-b border-black/5">
              <td className="py-2">Ingreso mensual estimado</td>
              <td>S/ {data.baseline.monthlyRevenue.toLocaleString("es-PE")}</td>
              <td className="font-semibold text-kfc-red">S/ {data.withMl.monthlyRevenue.toLocaleString("es-PE")}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="card p-5">
        <p className="font-semibold mb-3 text-sm">% de mejora (uplift)</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="upliftPercent" fill="#FFC72C" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="text-xs text-black/40 mt-3">{data.assumptions.note}</p>
    </div>
  );
}

function TrafficSim() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    api.get("/admin/simulations/traffic").then(({ data }) => setData(data));
  }, []);

  if (!data) return <Loader />;

  return (
    <div>
      <p className="text-sm text-black/60 mb-4">{data.note}</p>
      <div className="card p-5">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.hours}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="weekdayOrders" fill="#C8102E" name="Día de semana" />
            <Bar dataKey="weekendOrders" fill="#FFC72C" name="Fin de semana" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="text-sm mt-3">
        <strong>Horas pico:</strong> {data.peakHours.join(", ")}
      </p>
    </div>
  );
}

function InventorySim() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    api.get("/admin/simulations/inventory").then(({ data }) => setData(data));
  }, []);

  if (!data) return <Loader />;

  const statusColor: Record<string, string> = {
    "CRÍTICO": "bg-red-100 text-red-700",
    "ATENCIÓN": "bg-yellow-100 text-yellow-700",
    OK: "bg-green-100 text-green-700",
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-black/50 border-b border-black/10">
            <th className="py-2">Producto</th>
            <th>Stock</th>
            <th>Ventas/día (est.)</th>
            <th>Días de stock</th>
            <th>Estado</th>
            <th>Reabastecer</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((item: any) => (
            <tr key={item.productId} className="border-b border-black/5">
              <td className="py-2">{item.name}</td>
              <td>{item.stock}</td>
              <td>{item.avgDailySales}</td>
              <td>{item.daysOfStockLeft}</td>
              <td>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusColor[item.status]}`}>{item.status}</span>
              </td>
              <td>{item.suggestedReorder > 0 ? `+${item.suggestedReorder} uds` : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StaffingSim() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    api.get("/admin/simulations/staffing").then(({ data }) => setData(data));
  }, []);

  if (!data) return <Loader />;

  return (
    <div>
      <p className="text-sm text-black/60 mb-4">Tiempo de preparación promedio por producto: {data.avgPrepTimeMinutes} min</p>
      <div className="card p-5">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.staffing}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="cooksNeeded" fill="#C8102E" name="Cocineros necesarios" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function DeliverySim() {
  const [data, setData] = useState<any[] | null>(null);
  const [peak, setPeak] = useState(false);

  useEffect(() => {
    api.get("/admin/simulations/delivery", { params: { peak } }).then(({ data }) => setData(data.zones));
  }, [peak]);

  if (!data) return <Loader />;

  return (
    <div>
      <label className="flex items-center gap-2 mb-4 text-sm font-semibold">
        <input type="checkbox" checked={peak} onChange={(e) => setPeak(e.target.checked)} />
        Simular hora pico (recargo dinámico)
      </label>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-black/50 border-b border-black/10">
              <th className="py-2">Zona</th>
              <th>Distancia promedio</th>
              <th>Tiempo estimado</th>
              <th>Costo de envío</th>
            </tr>
          </thead>
          <tbody>
            {data.map((z) => (
              <tr key={z.zone} className="border-b border-black/5">
                <td className="py-2">{z.zone}</td>
                <td>{z.avgDistanceKm} km</td>
                <td>{z.estimatedDeliveryMinutes} min</td>
                <td>S/ {z.deliveryCost.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================= INVENTORY =============================
function InventoryTab() {
  const [products, setProducts] = useState<any[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [stockMovements, setStockMovements] = useState<any[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [receivingOrderId, setReceivingOrderId] = useState<string | null>(null);
  const [receivedQuantity, setReceivedQuantity] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  function loadData() {
    Promise.all([
      api.get("/products").then(({ data }) => setProducts(data.products)),
      api.get("/admin/inventory/purchase-orders").then(({ data }) => setPurchaseOrders(data.orders)),
      api.get("/admin/inventory/movements").then(({ data }) => setStockMovements(data.movements)),
    ]).finally(() => setLoading(false));
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleCheckReorder() {
    await api.post("/admin/inventory/check-reorder");
    loadData();
  }

  async function handleReceiveOrder() {
    if (!receivingOrderId || receivedQuantity <= 0) return;
    await api.post(`/admin/inventory/purchase-orders/${receivingOrderId}/receive`, { receivedQuantity });
    setReceivingOrderId(null);
    setReceivedQuantity(0);
    loadData();
  }

  const statusColor: Record<string, string> = {
    "CRÍTICO": "bg-red-100 text-red-700",
    "ATENCIÓN": "bg-yellow-100 text-yellow-700",
    OK: "bg-green-100 text-green-700",
  };

  const CRITICAL_THRESHOLD = 20;
  const LEAD_TIME_DAYS = 3;

  const productsWithStatus = products.map((p) => {
    const avgDailySales = 1.5; // simplified calculation
    const daysOfStockLeft = p.stock / avgDailySales;
    const status = p.stock < CRITICAL_THRESHOLD || daysOfStockLeft < LEAD_TIME_DAYS ? "CRÍTICO" : daysOfStockLeft < LEAD_TIME_DAYS * 2 ? "ATENCIÓN" : "OK";
    return { ...p, status, daysOfStockLeft };
  });

  const filteredMovements = selectedProductId
    ? stockMovements.filter((m) => m.productId === selectedProductId)
    : stockMovements.slice(0, 20);

  const movementChartData = filteredMovements
    .slice()
    .reverse()
    .map((m) => ({
      date: new Date(m.createdAt).toLocaleDateString("es-PE"),
      quantity: m.quantity,
    }));

  if (loading) return <Loader />;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="font-display font-semibold">Gestión de Inventario</p>
        <button onClick={handleCheckReorder} className="btn-primary text-sm py-2">
          Revisar umbrales ahora
        </button>
      </div>

      {/* Stock Table */}
      <div className="card p-5 mb-6">
        <p className="font-semibold mb-3">Estado del Stock</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-black/50 border-b border-black/10">
                <th className="py-2">Producto</th>
                <th>Categoría</th>
                <th>Stock</th>
                <th>Días de stock</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {productsWithStatus.map((p) => (
                <tr key={p.id} className="border-b border-black/5">
                  <td className="py-2 flex items-center gap-2">
                    <img src={p.imageUrl} className="w-8 h-8 rounded object-cover" />
                    {p.name}
                  </td>
                  <td>{p.category}</td>
                  <td>{p.stock}</td>
                  <td>{p.daysOfStockLeft.toFixed(1)}</td>
                  <td>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusColor[p.status]}`}>
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Purchase Orders */}
      <div className="card p-5 mb-6">
        <p className="font-semibold mb-3">Órdenes de Compra Pendientes</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-black/50 border-b border-black/10">
                <th className="py-2">ID</th>
                <th>Producto</th>
                <th>Proveedor</th>
                <th>Cantidad</th>
                <th>Estado</th>
                <th>Automática</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {purchaseOrders
                .filter((po) => po.status === "PENDING" || po.status === "SENT")
                .map((po) => (
                  <tr key={po.id} className="border-b border-black/5">
                    <td className="py-2 font-mono text-xs">{po.id.slice(0, 8)}</td>
                    <td>{po.product?.name}</td>
                    <td>{po.supplier?.name}</td>
                    <td>{po.quantity}</td>
                    <td>{po.status}</td>
                    <td>{po.isAutomatic ? "Sí" : "No"}</td>
                    <td>
                      {receivingOrderId === po.id ? (
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={receivedQuantity}
                            onChange={(e) => setReceivedQuantity(Number(e.target.value))}
                            className="input-field py-1 w-20 text-xs"
                            placeholder="Cant."
                          />
                          <button onClick={handleReceiveOrder} className="btn-primary text-xs py-1">
                            Confirmar
                          </button>
                          <button onClick={() => setReceivingOrderId(null)} className="btn-outline text-xs py-1">
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setReceivingOrderId(po.id);
                            setReceivedQuantity(po.quantity);
                          }}
                          className="btn-primary text-xs py-1"
                        >
                          Recibir
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Movements */}
      <div className="card p-5 mb-6">
        <div className="flex justify-between items-center mb-3">
          <p className="font-semibold">Historial de Movimientos</p>
          <select
            value={selectedProductId || ""}
            onChange={(e) => setSelectedProductId(e.target.value || null)}
            className="input-field py-1 text-xs w-48"
          >
            <option value="">Todos los productos</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div className="overflow-x-auto mb-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-black/50 border-b border-black/10">
                <th className="py-2">Fecha</th>
                <th>Producto</th>
                <th>Tipo</th>
                <th>Cantidad</th>
                <th>Razón</th>
              </tr>
            </thead>
            <tbody>
              {filteredMovements.map((m) => (
                <tr key={m.id} className="border-b border-black/5">
                  <td className="py-2">{new Date(m.createdAt).toLocaleDateString("es-PE")}</td>
                  <td>{m.product?.name}</td>
                  <td>{m.type}</td>
                  <td className={m.quantity < 0 ? "text-red-600" : "text-green-600"}>
                    {m.quantity > 0 ? "+" : ""}{m.quantity}
                  </td>
                  <td>{m.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {selectedProductId && movementChartData.length > 0 && (
          <div className="card p-4">
            <p className="text-sm font-semibold mb-2">Gráfico de Movimientos</p>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={movementChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="quantity" stroke="#C8102E" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================= FORECAST =============================
function ForecastTab() {
  const [subTab, setSubTab] = useState<"datasets" | "training" | "predictions">("datasets");
  const [datasets, setDatasets] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [forecastData, setForecastData] = useState<any>(null);
  const [accuracy, setAccuracy] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [training, setTraining] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState<string>("");
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<"linear_regression" | "random_forest">("linear_regression");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [previewData, setPreviewData] = useState<any>(null);

  function loadDatasets() {
    api.get("/admin/forecast/datasets").then(({ data }) => setDatasets(data.datasets));
  }

  function loadModels() {
    api.get("/admin/forecast/models").then(({ data }) => setModels(data.models));
  }

  function loadForecast() {
    api.get("/admin/forecast/hourly", { params: { date: selectedDate } }).then(({ data }) => {
      setForecastData(data);
      loadAccuracy();
    });
  }

  function loadAccuracy() {
    api.get("/admin/forecast/accuracy").then(({ data }) => setAccuracy(data));
  }

  useEffect(() => {
    Promise.all([loadDatasets(), loadModels(), loadForecast()]).finally(() => setLoading(false));
  }, []);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("name", file.name);

    try {
      await api.post("/admin/forecast/datasets/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      loadDatasets();
    } catch (error) {
      console.error("Error uploading dataset:", error);
    } finally {
      setUploading(false);
    }
  }

  async function handleTrainModel() {
    if (!selectedDataset) return;

    setTraining(true);
    try {
      await api.post("/admin/forecast/train", { datasetId: selectedDataset, algorithm: selectedAlgorithm });
      loadModels();
    } catch (error) {
      console.error("Error training model:", error);
    } finally {
      setTraining(false);
    }
  }

  async function handleActivateModel(modelId: string) {
    await api.post(`/admin/forecast/models/${modelId}/activate`);
    loadModels();
  }

  async function handlePreviewDataset(datasetId: string) {
    const { data } = await api.get(`/admin/forecast/datasets/${datasetId}/preview`);
    setPreviewData(data);
  }

  async function handleDeleteDataset(datasetId: string) {
    if (!confirm("¿Eliminar este dataset?")) return;
    await api.delete(`/admin/forecast/datasets/${datasetId}`);
    loadDatasets();
  }

  if (loading) return <Loader />;

  const SUB_TABS = [
    { id: "datasets" as const, label: "Datasets" },
    { id: "training" as const, label: "Entrenamiento" },
    { id: "predictions" as const, label: "Predicciones" },
  ];

  return (
    <div>
      <div className="flex gap-2 mb-6 flex-wrap">
        {SUB_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setSubTab(t.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
              subTab === t.id ? "bg-kfc-red text-white" : "bg-black/5 hover:bg-black/10"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {subTab === "datasets" && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <p className="font-display font-semibold">Datasets Subidos</p>
            <label className="btn-primary text-sm py-2 flex items-center gap-1 cursor-pointer">
              <Plus size={14} /> Subir Dataset
              <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          {uploading && <p className="text-sm text-black/50 mb-4">Subiendo...</p>}

          <div className="overflow-x-auto mb-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-black/50 border-b border-black/10">
                  <th className="py-2">Nombre</th>
                  <th>Archivo</th>
                  <th>Filas</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {datasets.map((d) => (
                  <tr key={d.id} className="border-b border-black/5">
                    <td className="py-2">{d.name}</td>
                    <td className="font-mono text-xs">{d.fileName}</td>
                    <td>{d.rowCount}</td>
                    <td>
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                        d.status === "VALIDATED" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                      }`}>
                        {d.status}
                      </span>
                    </td>
                    <td>{new Date(d.createdAt).toLocaleDateString("es-PE")}</td>
                    <td className="flex gap-2 justify-end py-2">
                      <button onClick={() => handlePreviewDataset(d.id)} className="p-1.5 rounded hover:bg-black/5 text-xs">
                        Ver
                      </button>
                      <button onClick={() => handleDeleteDataset(d.id)} className="p-1.5 rounded hover:bg-black/5 text-kfc-red text-xs">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {previewData && (
            <div className="card p-5">
              <div className="flex justify-between items-center mb-3">
                <p className="font-semibold">Preview: {previewData.dataset.name}</p>
                <button onClick={() => setPreviewData(null)} className="text-xs text-black/50">Cerrar</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-black/50 border-b border-black/10">
                      {Object.keys(previewData.rows[0] || {}).map((key) => (
                        <th key={key} className="py-2">{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.rows.slice(0, 10).map((row: any, i: number) => (
                      <tr key={i} className="border-b border-black/5">
                        {Object.values(row).map((val: any, j: number) => (
                          <td key={j} className="py-2">{val}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {subTab === "training" && (
        <div>
          <div className="card p-5 mb-6">
            <p className="font-semibold mb-3">Entrenar Nuevo Modelo</p>
            <div className="grid md:grid-cols-2 gap-3">
              <select
                value={selectedDataset}
                onChange={(e) => setSelectedDataset(e.target.value)}
                className="input-field"
              >
                <option value="">Seleccionar dataset...</option>
                {datasets.filter((d) => d.status === "VALIDATED").map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
              <select
                value={selectedAlgorithm}
                onChange={(e) => setSelectedAlgorithm(e.target.value as any)}
                className="input-field"
              >
                <option value="linear_regression">Regresión Lineal</option>
                <option value="random_forest">Random Forest</option>
              </select>
            </div>
            <button
              onClick={handleTrainModel}
              disabled={!selectedDataset || training}
              className="btn-primary text-sm py-2 mt-4"
            >
              {training ? "Entrenando..." : "Entrenar Modelo"}
            </button>
          </div>

          <div className="card p-5">
            <p className="font-semibold mb-3">Histórico de Modelos</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-black/50 border-b border-black/10">
                    <th className="py-2">Dataset</th>
                    <th>Algoritmo</th>
                    <th>MAE</th>
                    <th>RMSE</th>
                    <th>R²</th>
                    <th>Estado</th>
                    <th>Fecha</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {models.map((m) => (
                    <tr key={m.id} className="border-b border-black/5">
                      <td className="py-2">{m.dataset?.name}</td>
                      <td>{m.algorithm}</td>
                      <td>{m.mae?.toFixed(2)}</td>
                      <td>{m.rmse?.toFixed(2)}</td>
                      <td>{m.r2Score?.toFixed(3)}</td>
                      <td>
                        {m.isActive ? (
                          <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded-full">Activo</span>
                        ) : (
                          <span className="bg-gray-100 text-gray-700 text-xs font-semibold px-2 py-1 rounded-full">Inactivo</span>
                        )}
                      </td>
                      <td>{new Date(m.trainedAt).toLocaleDateString("es-PE")}</td>
                      <td>
                        {!m.isActive && (
                          <button onClick={() => handleActivateModel(m.id)} className="btn-primary text-xs py-1">
                            Activar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {subTab === "predictions" && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <p className="font-display font-semibold">Predicciones de Demanda</p>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="input-field py-1 text-sm"
            />
          </div>

          <button onClick={loadForecast} className="btn-primary text-sm py-2 mb-4">
            Generar Predicción
          </button>

          {forecastData && (
            <>
              <div className="card p-5 mb-6">
                <div className="flex justify-between items-center mb-3">
                  <p className="font-semibold">Fuente de Predicción</p>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    forecastData.source === "ml_model" ? "bg-blue-100 text-blue-700" : "bg-yellow-100 text-yellow-700"
                  }`}>
                    {forecastData.source === "ml_model" ? `Modelo ML (${forecastData.algorithm})` : "Modo heurístico (sin modelo entrenado)"}
                  </span>
                </div>
                {accuracy && accuracy.mae && (
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-black/50">MAE</p>
                      <p className="font-semibold">{accuracy.mae.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-black/50">RMSE</p>
                      <p className="font-semibold">{accuracy.rmse.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-black/50">R²</p>
                      <p className="font-semibold">{accuracy.r2Score.toFixed(3)}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="card p-5">
                <p className="font-semibold mb-3">Predicción por Hora</p>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={forecastData.forecasts.map((f: any) => ({ ...f, hora: `${f.hour}:00` }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="hora" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="predictedOrders" stroke="#C8102E" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ============================= KITCHEN =============================
function KitchenTab() {
  const [board, setBoard] = useState<any[]>([]);
  const [bottlenecks, setBottlenecks] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  function loadData() {
    Promise.all([
      api.get("/admin/kitchen/board").then(({ data }) => setBoard(data.board)),
      api.get("/admin/kitchen/bottlenecks").then(({ data }) => setBottlenecks(data)),
    ]).finally(() => setLoading(false));
  }

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000); // Auto-refresh every 15 seconds
    return () => clearInterval(interval);
  }, []);

  async function handleStartPreparation(orderId: string) {
    await api.post(`/admin/kitchen/${orderId}/start`);
    loadData();
  }

  async function handleQualityCheck(orderId: string) {
    await api.post(`/admin/kitchen/${orderId}/quality-check`);
    loadData();
  }

  async function handleMarkReady(orderId: string) {
    await api.post(`/admin/kitchen/${orderId}/ready`);
    loadData();
  }

  if (loading) return <Loader />;

  const pendingOrders = board.filter((o) => o.status === "PENDING");
  const preparingOrders = board.filter((o) => o.status === "PREPARING");
  const readyOrders = board.filter((o) => o.status === "READY");

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="font-display font-semibold">Cocina en Tiempo Real</p>
        <p className="text-xs text-black/50">Auto-refresh cada 15s</p>
      </div>

      {/* Bottlenecks Section */}
      {bottlenecks && bottlenecks.bottlenecks.length > 0 && (
        <div className="card p-5 mb-6 bg-red-50 border border-red-200">
          <p className="font-semibold text-red-700 mb-3">⚠️ Cuellos de botella detectados</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-red-900/50 border-b border-red-200">
                  <th className="py-2">Pedido ID</th>
                  <th>Tiempo espera</th>
                  <th>Tiempo preparación</th>
                  <th>Exceso</th>
                </tr>
              </thead>
              <tbody>
                {bottlenecks.bottlenecks.map((b: any) => (
                  <tr key={b.orderId} className="border-b border-red-100">
                    <td className="py-2 font-mono text-xs">{b.orderId.slice(0, 8)}</td>
                    <td>{b.waitTime} min</td>
                    <td>{b.preparationTime} min</td>
                    <td className="text-red-600 font-semibold">+{b.excessPercentage}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Kanban Board */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Pending Column */}
        <div className="card p-4">
          <div className="flex justify-between items-center mb-3">
            <p className="font-semibold">Recibido</p>
            <span className="bg-kfc-red text-white text-xs font-semibold px-2 py-1 rounded-full">
              {pendingOrders.length}
            </span>
          </div>
          <div className="space-y-3">
            {pendingOrders.map((order) => (
              <div key={order.id} className="bg-white border border-black/10 rounded p-3">
                <div className="flex justify-between items-start mb-2">
                  <p className="font-mono text-xs text-black/50">{order.id.slice(0, 8)}</p>
                  <p className="text-xs text-black/50">{order.timeSinceCreated} min</p>
                </div>
                <p className="text-sm font-medium mb-2">{order.user?.name}</p>
                <div className="text-xs text-black/50 mb-3">
                  {(order.items as any[]).map((item, i) => (
                    <div key={i}>• {item.product?.name} x{item.quantity}</div>
                  ))}
                </div>
                <button
                  onClick={() => handleStartPreparation(order.id)}
                  className="btn-primary text-xs py-1.5 w-full"
                >
                  Iniciar preparación
                </button>
              </div>
            ))}
            {pendingOrders.length === 0 && (
              <p className="text-sm text-black/50 text-center py-4">Sin pedidos</p>
            )}
          </div>
        </div>

        {/* Preparing Column */}
        <div className="card p-4">
          <div className="flex justify-between items-center mb-3">
            <p className="font-semibold">En Preparación / Control de Calidad</p>
            <span className="bg-kfc-gold text-black text-xs font-semibold px-2 py-1 rounded-full">
              {preparingOrders.length}
            </span>
          </div>
          <div className="space-y-3">
            {preparingOrders.map((order) => (
              <div key={order.id} className="bg-white border border-black/10 rounded p-3">
                <div className="flex justify-between items-start mb-2">
                  <p className="font-mono text-xs text-black/50">{order.id.slice(0, 8)}</p>
                  <p className="text-xs text-black/50">{order.timeSinceStarted} min</p>
                </div>
                <p className="text-sm font-medium mb-2">{order.user?.name}</p>
                <div className="text-xs text-black/50 mb-3">
                  {(order.items as any[]).map((item, i) => (
                    <div key={i}>• {item.product?.name} x{item.quantity}</div>
                  ))}
                </div>
                {order.qualityCheckedAt ? (
                  <button
                    onClick={() => handleMarkReady(order.id)}
                    className="btn-primary text-xs py-1.5 w-full bg-green-600"
                  >
                    Marcar listo
                  </button>
                ) : (
                  <button
                    onClick={() => handleQualityCheck(order.id)}
                    className="btn-primary text-xs py-1.5 w-full"
                  >
                    Control de calidad
                  </button>
                )}
              </div>
            ))}
            {preparingOrders.length === 0 && (
              <p className="text-sm text-black/50 text-center py-4">Sin pedidos</p>
            )}
          </div>
        </div>

        {/* Ready Column */}
        <div className="card p-4">
          <div className="flex justify-between items-center mb-3">
            <p className="font-semibold">Listo</p>
            <span className="bg-green-600 text-white text-xs font-semibold px-2 py-1 rounded-full">
              {readyOrders.length}
            </span>
          </div>
          <div className="space-y-3">
            {readyOrders.map((order) => (
              <div key={order.id} className="bg-white border border-black/10 rounded p-3">
                <div className="flex justify-between items-start mb-2">
                  <p className="font-mono text-xs text-black/50">{order.id.slice(0, 8)}</p>
                  <p className="text-xs text-green-600 font-semibold">✓ Listo</p>
                </div>
                <p className="text-sm font-medium mb-2">{order.user?.name}</p>
                <div className="text-xs text-black/50 mb-3">
                  {(order.items as any[]).map((item, i) => (
                    <div key={i}>• {item.product?.name} x{item.quantity}</div>
                  ))}
                </div>
                <p className="text-xs text-black/50 text-center">Esperando entrega</p>
              </div>
            ))}
            {readyOrders.length === 0 && (
              <p className="text-sm text-black/50 text-center py-4">Sin pedidos</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
