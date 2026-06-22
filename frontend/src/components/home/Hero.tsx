import { Link } from "react-router-dom";

export default function Hero() {
  return (
    <section className="relative bg-kfc-red overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 py-14 md:py-20 grid md:grid-cols-2 gap-8 items-center">
        <div className="text-white relative z-10">
          <span className="inline-block bg-kfc-gold text-kfc-black text-xs font-bold px-3 py-1 rounded-full mb-4">
            Receta original de 11 especias
          </span>
          <h1 className="font-display font-extrabold text-4xl md:text-5xl leading-tight mb-4">
            Tu antojo de pollo,<br /> a un clic de distancia.
          </h1>
          <p className="text-white/80 mb-6 max-w-md">
            Combos, buckets y tus acompañamientos favoritos. Pide para delivery, pickup, dine-in o drive-thru.
          </p>
          <div className="flex gap-3">
            <Link to="/menu" className="btn-gold">
              Ver el menú
            </Link>
            <Link to="/promotions" className="btn-secondary bg-white/10 hover:bg-white/20">
              Promociones activas
            </Link>
          </div>
        </div>
        <div className="relative flex justify-center">
          <div className="w-64 h-64 md:w-80 md:h-80 rounded-full bg-kfc-gold/90 flex items-center justify-center text-[7rem] md:text-[9rem] shadow-2xl">
            🍗
          </div>
        </div>
      </div>
      <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-white/5 rounded-full" />
      <div className="absolute -top-16 -right-16 w-72 h-72 bg-white/5 rounded-full" />
    </section>
  );
}
