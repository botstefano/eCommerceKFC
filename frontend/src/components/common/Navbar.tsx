import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, User, Heart, MapPin, Menu as MenuIcon, X } from "lucide-react";
import { useState } from "react";
import { useAuthStore } from "../../store/authStore";
import { useCartStore } from "../../store/cartStore";

const NAV_LINKS = [
  { to: "/menu", label: "Menú" },
  { to: "/promotions", label: "Promociones" },
  { to: "/nutrition", label: "Nutrición" },
  { to: "/locations", label: "Ubicaciones" },
  { to: "/support", label: "Ayuda" },
];

export default function Navbar() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const totalItems = useCartStore((s) => s.totalItems());
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-black/5 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 font-display font-extrabold text-xl text-kfc-red">
          <span className="text-2xl">🍗</span> KFC
        </Link>

        <nav className="hidden md:flex items-center gap-6 font-medium text-sm">
          {NAV_LINKS.map((link) => (
            <Link key={link.to} to={link.to} className="hover:text-kfc-red transition-colors">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link to="/locations" className="hidden sm:flex p-2 rounded-full hover:bg-black/5" title="Ubicaciones">
            <MapPin size={20} />
          </Link>
          {user && (
            <Link to="/favorites" className="p-2 rounded-full hover:bg-black/5" title="Favoritos">
              <Heart size={20} />
            </Link>
          )}
          <Link to="/cart" className="relative p-2 rounded-full hover:bg-black/5" title="Carrito">
            <ShoppingCart size={20} />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-kfc-red text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </Link>

          {user ? (
            <div className="relative group">
              <button className="flex items-center gap-2 p-2 rounded-full hover:bg-black/5">
                <User size={20} />
              </button>
              <div className="absolute right-0 mt-1 w-48 bg-white card shadow-lg py-2 hidden group-hover:block">
                <p className="px-4 py-1 text-xs text-black/50 truncate">{user.email}</p>
                <Link to="/profile" className="block px-4 py-2 text-sm hover:bg-black/5">
                  Mi perfil
                </Link>
                <Link to="/orders" className="block px-4 py-2 text-sm hover:bg-black/5">
                  Mis pedidos
                </Link>
                <Link to="/loyalty" className="block px-4 py-2 text-sm hover:bg-black/5">
                  Programa de lealtad
                </Link>
                {user.role === "ADMIN" && (
                  <Link to="/admin" className="block px-4 py-2 text-sm hover:bg-black/5 font-semibold text-kfc-red">
                    Panel admin
                  </Link>
                )}
                <button
                  onClick={() => {
                    logout();
                    navigate("/");
                  }}
                  className="block w-full text-left px-4 py-2 text-sm hover:bg-black/5 text-kfc-red"
                >
                  Cerrar sesión
                </button>
              </div>
            </div>
          ) : (
            <Link to="/login" className="btn-primary text-sm py-2">
              Ingresar
            </Link>
          )}

          <button className="md:hidden p-2" onClick={() => setMobileOpen((o) => !o)}>
            {mobileOpen ? <X size={22} /> : <MenuIcon size={22} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav className="md:hidden border-t border-black/5 px-4 py-3 flex flex-col gap-3">
          {NAV_LINKS.map((link) => (
            <Link key={link.to} to={link.to} onClick={() => setMobileOpen(false)} className="text-sm font-medium">
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
