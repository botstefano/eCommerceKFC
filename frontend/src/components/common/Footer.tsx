import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-kfc-black text-white mt-16">
      <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <p className="font-display font-extrabold text-xl text-kfc-gold mb-2">🍗 KFC</p>
          <p className="text-sm text-white/60">It's finger lickin' good. Pide en línea y disfruta tu pollo favorito donde estés.</p>
        </div>
        <div>
          <p className="font-display font-semibold mb-3">Explorar</p>
          <ul className="space-y-2 text-sm text-white/70">
            <li><Link to="/menu" className="hover:text-kfc-gold">Menú completo</Link></li>
            <li><Link to="/promotions" className="hover:text-kfc-gold">Promociones</Link></li>
            <li><Link to="/locations" className="hover:text-kfc-gold">Ubicaciones</Link></li>
            <li><Link to="/nutrition" className="hover:text-kfc-gold">Nutrición y salud</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-display font-semibold mb-3">Mi cuenta</p>
          <ul className="space-y-2 text-sm text-white/70">
            <li><Link to="/profile" className="hover:text-kfc-gold">Mi perfil</Link></li>
            <li><Link to="/orders" className="hover:text-kfc-gold">Mis pedidos</Link></li>
            <li><Link to="/loyalty" className="hover:text-kfc-gold">Lealtad</Link></li>
            <li><Link to="/support" className="hover:text-kfc-gold">Soporte</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-display font-semibold mb-3">Contacto</p>
          <ul className="space-y-2 text-sm text-white/70">
            <li>Trujillo, Perú</li>
            <li>soporte@kfc-demo.com</li>
            <li>+51 044 123456</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-white/40">
        Proyecto demo educativo — no afiliado oficialmente a KFC Corporation.
      </div>
    </footer>
  );
}
