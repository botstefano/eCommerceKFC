import { prisma } from "../lib/prisma";
import { cacheGet, cacheSet } from "../lib/redis";

// ----- Weights from the product spec -----
// 30% Collaborative Filtering, 15% Content-Based, 20% Category Matching,
// 30% Selected Boost (similar to currently selected product), 20% Search Boost
const WEIGHTS = {
  collaborative: 0.3,
  content: 0.15,
  category: 0.2,
  selected: 0.3,
  search: 0.2,
};

// Contextual rule bonuses (additive, applied on top of the weighted hybrid score)
const RULE_BONUS = {
  complement: 0.25, // chicken -> sides + drink + sauce
  dayPart: 0.15, // recommendation matches the current hour-of-day segment
  groupSize: 0.15, // recommendation matches the inferred cart/group size
  spicy: 0.1, // recommendation matches user's spicy preference
};

type OrderItem = { productId: string; quantity: number };

export interface RecommendationParams {
  userId?: string;
  productId?: string;
  limit?: number;
  hourOfDay?: number;
  cartSize?: number;
  query?: string;
}

export interface RecommendationResult {
  product: any;
  score: number;
  reasons: string[];
}

function dayPartFor(hour: number): "morning" | "lunch" | "afternoon" | "night" {
  if (hour >= 5 && hour < 11) return "morning";
  if (hour >= 11 && hour < 15) return "lunch";
  if (hour >= 15 && hour < 19) return "afternoon";
  return "night";
}

function groupSizeLabel(size: number): "individual" | "pareja" | "familia" | "grupo_grande" {
  if (size <= 1) return "individual";
  if (size === 2) return "pareja";
  if (size <= 4) return "familia";
  return "grupo_grande";
}

function parseItems(raw: unknown): OrderItem[] {
  if (!raw) return [];
  try {
    const arr = Array.isArray(raw) ? raw : JSON.parse(raw as string);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function minMaxNormalize(values: number[]): (v: number) => number {
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max - min < 1e-9) return () => 0.5;
  return (v: number) => (v - min) / (max - min);
}

export async function getRecommendations(params: RecommendationParams): Promise<RecommendationResult[]> {
  const limit = params.limit && params.limit > 0 ? params.limit : 10;
  const hour = typeof params.hourOfDay === "number" ? params.hourOfDay : new Date().getHours();
  const cartSize = params.cartSize && params.cartSize > 0 ? params.cartSize : 1;
  const currentDayPart = dayPartFor(hour);
  const currentGroupLabel = groupSizeLabel(cartSize);

  const cacheKey = `reco:${params.userId || "guest"}:${params.productId || "none"}:${hour}:${cartSize}:${params.query || ""}:${limit}`;
  const cached = await cacheGet<RecommendationResult[]>(cacheKey);
  if (cached) return cached;

  const [products, allOrders, user, selectedProduct] = await Promise.all([
    prisma.product.findMany({ where: { stock: { gt: 0 } } }),
    prisma.order.findMany({ select: { userId: true, items: true } }),
    params.userId ? prisma.user.findUnique({ where: { id: params.userId } }) : Promise.resolve(null),
    params.productId ? prisma.product.findUnique({ where: { id: params.productId } }) : Promise.resolve(null),
  ]);

  // ---- Build purchase histories per user (for collaborative filtering) ----
  const purchasesByUser = new Map<string, Set<string>>();
  const purchaseCountByProduct = new Map<string, number>();

  for (const order of allOrders) {
    const items = parseItems(order.items);
    if (!purchasesByUser.has(order.userId)) purchasesByUser.set(order.userId, new Set());
    const set = purchasesByUser.get(order.userId)!;
    for (const item of items) {
      set.add(item.productId);
      purchaseCountByProduct.set(item.productId, (purchaseCountByProduct.get(item.productId) || 0) + item.quantity);
    }
  }

  const userHistory = params.userId ? purchasesByUser.get(params.userId) || new Set<string>() : new Set<string>();

  // Users who share at least one product with the current user ("neighbors")
  const neighbors: string[] = [];
  if (params.userId && userHistory.size > 0) {
    for (const [otherUserId, otherSet] of purchasesByUser.entries()) {
      if (otherUserId === params.userId) continue;
      const shared = [...userHistory].some((p) => otherSet.has(p));
      if (shared) neighbors.push(otherUserId);
    }
  }

  const maxPopularity = Math.max(1, ...Array.from(purchaseCountByProduct.values()));

  // ---- User taste profile (for content-based score) ----
  let avgSpicyLevel = 1.5;
  const categoryFrequency = new Map<string, number>();
  if (userHistory.size > 0) {
    const purchasedProducts = products.filter((p) => userHistory.has(p.id));
    if (purchasedProducts.length > 0) {
      avgSpicyLevel = purchasedProducts.reduce((sum, p) => sum + p.spicyLevel, 0) / purchasedProducts.length;
      for (const p of purchasedProducts) {
        categoryFrequency.set(p.category, (categoryFrequency.get(p.category) || 0) + 1);
      }
    }
  }
  const totalPurchases = [...categoryFrequency.values()].reduce((a, b) => a + b, 0);

  const spicyPreference = (user?.preferences as any)?.spicyPreference as "spicy" | "no_spicy" | undefined;
  const searchQuery = (params.query || "").trim().toLowerCase();

  // ---- Score every candidate product ----
  const raw = products.map((product) => {
    const reasons: string[] = [];

    // 1. Collaborative filtering: how many neighbors bought this product
    let collaborativeRaw = 0;
    if (neighbors.length > 0) {
      const neighborBuys = neighbors.filter((n) => purchasesByUser.get(n)?.has(product.id)).length;
      collaborativeRaw = neighborBuys / neighbors.length;
    } else {
      // cold start fallback: global popularity
      collaborativeRaw = (purchaseCountByProduct.get(product.id) || 0) / maxPopularity;
    }
    if (collaborativeRaw > 0.3) reasons.push("Comprado por usuarios similares");

    // 2. Content-based: spicy-level proximity to the user's taste profile
    const spicyDistance = Math.abs(product.spicyLevel - avgSpicyLevel);
    const contentRaw = 1 - Math.min(spicyDistance / 4, 1);

    // 3. Category matching: affinity for this product's category from order history
    const categoryRaw = totalPurchases > 0 ? (categoryFrequency.get(product.category) || 0) / totalPurchases : 0.4;
    if (categoryRaw > 0.4) reasons.push(`Afinidad con la categoría ${product.category}`);

    // 4. Selected boost: complementary / similar to the product currently being viewed
    let selectedRaw = 0;
    if (selectedProduct && selectedProduct.id !== product.id) {
      const isComplementCategory =
        selectedProduct.category === "Pollo" &&
        (product.category === "Acompañamientos" || product.category === "Bebidas");
      const isSauce = product.name.toLowerCase().includes("salsa");
      if (isComplementCategory || isSauce) {
        selectedRaw = 1;
        reasons.push("Complemento ideal para tu selección");
      } else if (product.category === selectedProduct.category) {
        selectedRaw = 0.5;
        reasons.push("Similar a lo que estás viendo");
      }
    }

    // 5. Search boost: matches the recent/active search term
    let searchRaw = 0;
    if (searchQuery) {
      const haystack = `${product.name} ${product.description} ${product.category}`.toLowerCase();
      if (haystack.includes(searchQuery)) {
        searchRaw = 1;
        reasons.push("Relacionado con tu búsqueda");
      }
    }

    let hybridScore =
      WEIGHTS.collaborative * collaborativeRaw +
      WEIGHTS.content * contentRaw +
      WEIGHTS.category * categoryRaw +
      WEIGHTS.selected * selectedRaw +
      WEIGHTS.search * searchRaw;

    // ---- KFC-specific contextual rules (additive bonuses) ----

    // Complement rule: Pollo -> Papas + Refresco + Salsa
    if (selectedProduct?.category === "Pollo") {
      const complements = ["Acompañamientos", "Bebidas"];
      if (complements.includes(product.category) || product.name.toLowerCase().includes("salsa")) {
        hybridScore += RULE_BONUS.complement;
      }
    }

    // Hour-of-day rule
    const productDayPart = (product.nutritionalInfo as any)?.dayPart;
    if (productDayPart && productDayPart === currentDayPart) {
      hybridScore += RULE_BONUS.dayPart;
      reasons.push(`Ideal para ${currentDayPart === "morning" ? "la mañana" : currentDayPart === "lunch" ? "el almuerzo" : currentDayPart === "afternoon" ? "la tarde" : "la noche"}`);
    }

    // Group-size rule
    const productGroupSize = (product.nutritionalInfo as any)?.groupSize;
    if (productGroupSize && productGroupSize === currentGroupLabel) {
      hybridScore += RULE_BONUS.groupSize;
      reasons.push("Tamaño perfecto para tu grupo");
    }

    // Spicy preference rule
    if (spicyPreference === "spicy" && product.spicyLevel >= 3) {
      hybridScore += RULE_BONUS.spicy;
      reasons.push("Para los que les gusta picante");
    } else if (spicyPreference === "no_spicy" && product.spicyLevel === 0) {
      hybridScore += RULE_BONUS.spicy;
    }

    return { product, rawScore: hybridScore, reasons };
  });

  const normalize = minMaxNormalize(raw.map((r) => r.rawScore));
  const results: RecommendationResult[] = raw
    .map((r) => ({ product: r.product, score: Math.round(normalize(r.rawScore) * 1000) / 1000, reasons: r.reasons }))
    .filter((r) => !selectedProduct || r.product.id !== selectedProduct.id)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  await cacheSet(cacheKey, results, 120);

  // Persist a sample for admin/audit visibility (best-effort, non-blocking)
  if (params.userId) {
    Promise.all(
      results.slice(0, 5).map((r) =>
        prisma.recommendation.create({
          data: { userId: params.userId!, productId: r.product.id, score: r.score, type: "hybrid" },
        })
      )
    ).catch(() => {
      /* non-critical */
    });
  }

  return results;
}
