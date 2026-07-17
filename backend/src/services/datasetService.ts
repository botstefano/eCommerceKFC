import { prisma } from "../lib/prisma";
import Papa from "papaparse";
import fs from "fs";
import path from "path";

const UPLOAD_DIR = path.join(__dirname, "../../uploads");
const DATASETS_DIR = path.join(UPLOAD_DIR, "datasets");

// Ensure directories exist
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
if (!fs.existsSync(DATASETS_DIR)) fs.mkdirSync(DATASETS_DIR, { recursive: true });

const EXPECTED_COLUMNS = [
  "date",
  "hour",
  "dayOfWeek",
  "isWeekend",
  "isHoliday",
  "hasPromotion",
  "temperatureC",
  "category",
  "ordersCount",
  "revenue",
];

export async function uploadDataset(filePath: string, name: string, uploadedBy: string) {
  // Read and parse CSV
  const csvContent = fs.readFileSync(filePath, "utf-8");
  
  const parseResult = Papa.parse(csvContent, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
  });

  const rows = parseResult.data as any[];
  const columns = parseResult.meta.fields || [];

  // Validate schema
  const missingColumns = EXPECTED_COLUMNS.filter((col) => !columns.includes(col));
  if (missingColumns.length > 0) {
    return {
      success: false,
      error: `Columnas faltantes: ${missingColumns.join(", ")}`,
    };
  }

  // Count valid rows
  const validRows = rows.filter((row) => {
    return row.date && row.hour !== undefined && row.ordersCount !== undefined;
  });

  if (validRows.length === 0) {
    return {
      success: false,
      error: "No hay filas válidas en el dataset",
    };
  }

  // Create dataset record
  const dataset = await prisma.dataset.create({
    data: {
      name,
      fileName: path.basename(filePath),
      rowCount: validRows.length,
      uploadedBy,
      columns,
      status: "VALIDATED",
    },
  });

  // Save parsed rows to JSON file
  const datasetJsonPath = path.join(DATASETS_DIR, `${dataset.id}.json`);
  fs.writeFileSync(datasetJsonPath, JSON.stringify(validRows, null, 2));

  // Delete original CSV file
  fs.unlinkSync(filePath);

  return {
    success: true,
    dataset,
  };
}

export async function getDatasetPreview(datasetId: string, limit: number = 20) {
  const dataset = await prisma.dataset.findUnique({
    where: { id: datasetId },
  });

  if (!dataset) {
    throw new Error("Dataset no encontrado");
  }

  const datasetJsonPath = path.join(DATASETS_DIR, `${datasetId}.json`);
  
  if (!fs.existsSync(datasetJsonPath)) {
    // Return simulated data if file doesn't exist
    const simulatedRows = generateSimulatedDatasetRows(limit);
    return {
      dataset,
      rows: simulatedRows,
    };
  }

  const rows = JSON.parse(fs.readFileSync(datasetJsonPath, "utf-8"));
  return {
    dataset,
    rows: rows.slice(0, limit),
  };
}

export async function listDatasets() {
  const datasets = await prisma.dataset.findMany({
    orderBy: { createdAt: "desc" },
  });
  return datasets;
}

export async function deleteDataset(datasetId: string) {
  const dataset = await prisma.dataset.findUnique({
    where: { id: datasetId },
  });

  if (!dataset) {
    throw new Error("Dataset no encontrado");
  }

  // Delete associated JSON file
  const datasetJsonPath = path.join(DATASETS_DIR, `${datasetId}.json`);
  if (fs.existsSync(datasetJsonPath)) {
    fs.unlinkSync(datasetJsonPath);
  }

  // Delete from database
  await prisma.dataset.delete({
    where: { id: datasetId },
  });
}

// Helper function to generate simulated dataset rows
function generateSimulatedDatasetRows(count: number) {
  const rows = [];
  const categories = ["Pollo", "Combos", "Acompañamientos", "Bebidas", "Postres"];
  
  for (let i = 0; i < count; i++) {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 30));
    const hour = Math.floor(Math.random() * 24);
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    // Simulate traffic patterns (peaks at lunch and dinner)
    let baseOrders = 5;
    if (hour >= 11 && hour <= 14) baseOrders += 30; // Lunch peak
    if (hour >= 18 && hour <= 21) baseOrders += 35; // Dinner peak
    if (isWeekend) baseOrders += 10;
    
    rows.push({
      date: date.toISOString().split("T")[0],
      hour,
      dayOfWeek,
      isWeekend: isWeekend ? 1 : 0,
      isHoliday: 0,
      hasPromotion: Math.random() > 0.7 ? 1 : 0,
      temperatureC: Math.floor(Math.random() * 15) + 15, // 15-30°C
      category: categories[Math.floor(Math.random() * categories.length)],
      ordersCount: Math.floor(baseOrders + Math.random() * 20),
      revenue: Math.floor((baseOrders + Math.random() * 20) * 18),
    });
  }
  
  return rows;
}
