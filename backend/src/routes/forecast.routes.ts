import { Router } from "express";
import { requireAuth, requireAdmin } from "../middleware/auth";
import {
  uploadDatasetHandler,
  listDatasetsHandler,
  getDatasetPreviewHandler,
  deleteDatasetHandler,
  trainModelHandler,
  listModelsHandler,
  activateModelHandler,
  getHourlyForecastHandler,
  getProductForecastHandler,
  getForecastAccuracyHandler,
  backfillActualOrdersHandler,
  uploadMiddleware,
} from "../controllers/forecast.controller";

const router = Router();

// All forecast routes require authentication and admin role
router.use(requireAuth, requireAdmin);

// Datasets
router.post("/datasets/upload", uploadMiddleware, uploadDatasetHandler);
router.get("/datasets", listDatasetsHandler);
router.get("/datasets/:id/preview", getDatasetPreviewHandler);
router.delete("/datasets/:id", deleteDatasetHandler);

// Models
router.post("/train", trainModelHandler);
router.get("/models", listModelsHandler);
router.post("/models/:id/activate", activateModelHandler);

// Forecasts
router.get("/hourly", getHourlyForecastHandler);
router.get("/by-product", getProductForecastHandler);
router.get("/accuracy", getForecastAccuracyHandler);
router.post("/backfill", backfillActualOrdersHandler);

export default router;
