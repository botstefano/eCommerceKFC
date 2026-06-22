import { Flame } from "lucide-react";

export default function SpicyBadge({ level }: { level: number }) {
  if (!level) return null;
  return (
    <span className="badge-spicy">
      <Flame size={12} />
      {Array.from({ length: Math.min(level, 4) }).map((_, i) => (
        <span key={i}>🌶️</span>
      ))}
    </span>
  );
}
