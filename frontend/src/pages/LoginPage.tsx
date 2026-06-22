import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useCartStore } from "../store/cartStore";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const syncToServer = useCartStore((s) => s.syncToServer);
  const loadFromServer = useCartStore((s) => s.loadFromServer);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      await syncToServer();
      await loadFromServer();
      navigate("/");
    } catch (err: any) {
      setError(err.message || "No se pudo iniciar sesión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <h1 className="font-display font-bold text-3xl text-center mb-1">🍗 Bienvenido de vuelta</h1>
      <p className="text-center text-black/50 text-sm mb-8">Ingresa para seguir tu pedido y ganar puntos.</p>

      <form onSubmit={handleSubmit} className="card p-6 flex flex-col gap-4">
        <input
          type="email"
          required
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input-field"
        />
        <input
          type="password"
          required
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input-field"
        />
        {error && <p className="text-sm text-kfc-red">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? "Ingresando..." : "Ingresar"}
        </button>
      </form>

      <p className="text-center text-sm mt-4">
        ¿No tienes cuenta?{" "}
        <Link to="/register" className="text-kfc-red font-semibold hover:underline">
          Regístrate
        </Link>
      </p>

      <div className="card p-4 mt-6 text-xs text-black/50">
        <p className="font-semibold mb-1">Cuentas demo:</p>
        <p>Admin: admin@kfc.com / admin123</p>
        <p>Cliente: cliente@kfc.com / cliente123</p>
      </div>
    </div>
  );
}
