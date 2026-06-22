import { Router } from "express";
import { listReviews, createReview } from "../controllers/review.controller";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.get("/product/:productId", listReviews);
router.post("/", requireAuth, createReview);

export default router;
