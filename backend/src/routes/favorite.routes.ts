import { Router } from "express";
import { listFavorites, addFavorite, removeFavorite } from "../controllers/favorite.controller";
import { requireAuth } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

router.get("/", listFavorites);
router.post("/", addFavorite);
router.delete("/:productId", removeFavorite);

export default router;
