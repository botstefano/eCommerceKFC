import { useEffect, useState } from "react";
import api from "../services/api";
import { Recommendation } from "../types";
import { useAuthStore } from "../store/authStore";
import { useCartStore } from "../store/cartStore";

interface Options {
  productId?: string;
  limit?: number;
  query?: string;
}

export function useRecommendations({ productId, limit = 8, query }: Options = {}) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const user = useAuthStore((s) => s.user);
  const cartSize = useCartStore((s) => s.totalItems());

  useEffect(() => {
    let active = true;
    setLoading(true);
    const params: Record<string, string | number> = {
      hourOfDay: new Date().getHours(),
      cartSize: Math.max(1, cartSize),
      limit,
    };
    if (user) params.userId = user.id;
    if (productId) params.productId = productId;
    if (query) params.q = query;

    api
      .get("/recommendations", { params })
      .then(({ data }) => {
        if (active) setRecommendations(data.recommendations);
      })
      .catch(() => {
        if (active) setRecommendations([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, limit, query, user?.id, cartSize]);

  return { recommendations, loading };
}
