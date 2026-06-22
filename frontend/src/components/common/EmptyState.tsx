import { ReactNode } from "react";

export default function EmptyState({ icon, title, description, action }: { icon?: ReactNode; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center text-center gap-3 py-16 px-4">
      {icon && <div className="text-black/30">{icon}</div>}
      <h3 className="font-display font-semibold text-lg">{title}</h3>
      {description && <p className="text-sm text-black/50 max-w-sm">{description}</p>}
      {action}
    </div>
  );
}
