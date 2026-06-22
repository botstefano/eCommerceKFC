import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useCartStore } from "../store/cartStore";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const register = useAuthStore((s) => s.register);
  const syncToServer = useCartStore((s) => s.syncToServer);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(email, password, name, phone);
      await syncToServer();
      navigate("/");
    } catch (err: any) {
      setError(err.message || "No se pudo crear la cuenta");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <h1 className="font-display font-bold text-3xl text-center mb-1">Crea tu cuenta</h1>
      <p className="text-center text-black/50 text-sm mb-8">Únete y empieza a ganar puntos de lealtad.</p>

      <form onSubmit={handleSubmit} className="card p-6 flex flex-col gap-4">
        <input required placeholder="Nombre completo" value={name} onChange={(e) => setName(e.target.value)} className="input-field" />
        <input
          type="email"
          required
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input-field"
        />
        <input placeholder="Teléfono (opcional)" value={phone} onChange={(e) => setPhone(e.target.value)} className="input-field" />
        <input
          type="password"
          required
          minLength={6}
          placeholder="Contraseña (mín. 6 caracteres)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input-field"
        />
        {error && <p className="text-sm text-kfc-red">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? "Creando cuenta..." : "Registrarme"}
        </button>
      </form>

      <p className="text-center text-sm mt-4">
        ¿Ya tienes cuenta?{" "}
        <Link to="/login" className="text-kfc-red font-semibold hover:underline">
          Inicia sesión
        </Link>
      </p>
    </div>
  );
}
