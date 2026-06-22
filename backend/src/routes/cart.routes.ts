import { Router } from "express";
import { getCart, syncCart, addItem, updateItem, removeItem, clearCart } from "../controllers/cart.controller";
import { requireAuth } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

router.get("/", getCart);
router.put("/sync", syncCart);
router.post("/items", addItem);
router.put("/items/:productId", updateItem);
router.delete("/items/:productId", removeItem);
router.delete("/", clearCart);

export default router;
