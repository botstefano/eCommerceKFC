import { useCallback, useEffect, useState } from "react";
import api from "../services/api";
import { useAuthStore } from "../store/authStore";

export function useFavorites() {
  const user = useAuthStore((s) => s.user);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setFavoriteIds(new Set());
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.get("/favorites");
      setFavoriteIds(new Set(data.favorites.map((f: any) => f.productId)));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const toggle = useCallback(
    async (productId: string) => {
      if (!user) return;
      if (favoriteIds.has(productId)) {
        await api.delete(`/favorites/${productId}`);
        setFavoriteIds((prev) => {
          const next = new Set(prev);
          next.delete(productId);
          return next;
        });
      } else {
        await api.post("/favorites", { productId });
        setFavoriteIds((prev) => new Set(prev).add(productId));
      }
    },
    [favoriteIds, user]
  );

  return { favoriteIds, toggle, loading, refresh };
}
