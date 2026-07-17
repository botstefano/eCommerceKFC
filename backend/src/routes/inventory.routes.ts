import { Router } from "express";
import { requireAuth, requireAdmin } from "../middleware/auth";
import {
  getStockMovementsHandler,
  getPurchaseOrders,
  receivePurchaseOrderHandler,
  checkReorderHandler,
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} from "../controllers/inventory.controller";

const router = Router();

// All inventory routes require authentication and admin role
router.use(requireAuth, requireAdmin);

// Stock movements
router.get("/movements", getStockMovementsHandler);

// Purchase orders
router.get("/purchase-orders", getPurchaseOrders);
router.post("/purchase-orders/:id/receive", receivePurchaseOrderHandler);

// Reorder check
router.post("/check-reorder", checkReorderHandler);

// Suppliers CRUD
router.get("/suppliers", getSuppliers);
router.post("/suppliers", createSupplier);
router.put("/suppliers/:id", updateSupplier);
router.delete("/suppliers/:id", deleteSupplier);

export default router;
