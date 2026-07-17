import { Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { uploadDataset, getDatasetPreview, listDatasets, deleteDataset } from "../services/datasetService";
import { trainModel, listModels, activateModel } from "../services/mlTrainingService";
import { forecastDemandByHour, forecastDemandByProduct, getForecastAccuracy, backfillActualOrders } from "../services/demandForecastService";
import { ApiError } from "../utils/ApiError";

// Configure multer for file uploads
const UPLOAD_DIR = path.join(__dirname, "../../uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "text/csv" || file.originalname.endsWith(".csv")) {
      cb(null, true);
    } else {
      cb(new Error("Solo se permiten archivos CSV"));
    }
  },
});

export async function uploadDatasetHandler(req: Request, res: Response) {
  if (!req.file) {
    throw new ApiError(400, "No se proporcionó ningún archivo");
  }

  const { name } = req.body;
  const uploadedBy = (req as any).user?.userId || "system";

  const result = await uploadDataset(req.file.path, name || req.file.originalname, uploadedBy);

  if (!result.success) {
    throw new ApiError(400, result.error || "Error al procesar el dataset");
  }

  res.status(201).json({ dataset: result.dataset });
}

export async function listDatasetsHandler(_req: Request, res: Response) {
  const datasets = await listDatasets();
  res.json({ datasets });
}

export async function getDatasetPreviewHandler(req: Request, res: Response) {
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
  const result = await getDatasetPreview(req.params.id, limit);
  res.json(result);
}

export async function deleteDatasetHandler(req: Request, res: Response) {
  await deleteDataset(req.params.id);
  res.json({ message: "Dataset eliminado exitosamente" });
}

export async function trainModelHandler(req: Request, res: Response) {
  const { datasetId, algorithm } = req.body as { datasetId: string; algorithm: "linear_regression" | "random_forest" };

  if (!datasetId || !algorithm) {
    throw new ApiError(400, "Se requieren datasetId y algorithm");
  }

  const model = await trainModel(datasetId, algorithm);
  res.status(201).json({ model });
}

export async function listModelsHandler(_req: Request, res: Response) {
  const models = await listModels();
  res.json({ models });
}

export async function activateModelHandler(req: Request, res: Response) {
  const model = await activateModel(req.params.id);
  res.json({ model });
}

export async function getHourlyForecastHandler(req: Request, res: Response) {
  const dateParam = req.query.date as string | undefined;
  const date = dateParam ? new Date(dateParam) : undefined;

  const result = await forecastDemandByHour(date);
  res.json(result);
}

export async function getProductForecastHandler(req: Request, res: Response) {
  const dateParam = req.query.date as string | undefined;
  const date = dateParam ? new Date(dateParam) : undefined;

  const result = await forecastDemandByProduct(date);
  res.json(result);
}

export async function getForecastAccuracyHandler(req: Request, res: Response) {
  const modelId = req.query.modelId as string | undefined;
  const accuracy = await getForecastAccuracy(modelId);
  res.json(accuracy);
}

export async function backfillActualOrdersHandler(req: Request, res: Response) {
  const dateParam = req.query.date as string;
  if (!dateParam) {
    throw new ApiError(400, "Se requiere el parámetro date");
  }

  const date = new Date(dateParam);
  const result = await backfillActualOrders(date);
  res.json(result);
}

export const uploadMiddleware = upload.single("file");
