export default function Loader({ label = "Cargando..." }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-black/50">
      <div className="w-10 h-10 border-4 border-kfc-red/20 border-t-kfc-red rounded-full animate-spin" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
