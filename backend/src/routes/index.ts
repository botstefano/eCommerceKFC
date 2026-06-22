import { Router } from "express";
import authRoutes from "./auth.routes";
import productRoutes from "./product.routes";
import cartRoutes from "./cart.routes";
import orderRoutes from "./order.routes";
import recommendationRoutes from "./recommendation.routes";
import promotionRoutes from "./promotion.routes";
import favoriteRoutes from "./favorite.routes";
import reviewRoutes from "./review.routes";
import branchRoutes from "./branch.routes";
import userRoutes from "./user.routes";
import supportRoutes from "./support.routes";
import adminRoutes from "./admin.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/products", productRoutes);
router.use("/cart", cartRoutes);
router.use("/orders", orderRoutes);
router.use("/recommendations", recommendationRoutes);
router.use("/promotions", promotionRoutes);
router.use("/favorites", favoriteRoutes);
router.use("/reviews", reviewRoutes);
router.use("/branches", branchRoutes);
router.use("/users", userRoutes);
router.use("/support", supportRoutes);
router.use("/admin", adminRoutes);

export default router;
