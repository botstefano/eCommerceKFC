import { prisma } from "../lib/prisma";

export async function trainModel(datasetId: string, algorithm: "linear_regression" | "random_forest") {
  const dataset = await prisma.dataset.findUnique({
    where: { id: datasetId },
  });

  if (!dataset) {
    throw new Error("Dataset no encontrado");
  }

  // Simulated training process
  // In a real implementation, this would:
  // 1. Load dataset rows from JSON file
  // 2. Split 80/20 train/validation
  // 3. Build feature matrix X and target vector y
  // 4. Train the model with the chosen library
  // 5. Evaluate on validation set (MAE, RMSE, R²)
  // 6. Serialize model parameters

  // Simulated metrics (random but reasonable values)
  const trainRowCount = Math.floor(dataset.rowCount * 0.8);
  const validationRowCount = dataset.rowCount - trainRowCount;
  
  const mae = 2.5 + Math.random() * 3; // 2.5 - 5.5
  const rmse = 3.0 + Math.random() * 4; // 3.0 - 7.0
  const r2Score = 0.75 + Math.random() * 0.2; // 0.75 - 0.95

  // Simulated model parameters (placeholder)
  const parameters = {
    coefficients: Array(10).fill(0).map(() => Math.random()),
    intercept: Math.random() * 10,
    featureNames: ["hour", "dayOfWeek", "isWeekend", "isHoliday", "hasPromotion", "temperatureC"],
  };

  // Create model record
  const model = await prisma.demandModel.create({
    data: {
      datasetId,
      algorithm,
      version: 1,
      parameters,
      featureColumns: parameters.featureNames,
      targetColumn: "ordersCount",
      mae,
      rmse,
      r2Score,
      trainRowCount,
      validationRowCount,
      isActive: true,
    },
  });

  // Deactivate previous active models
  await prisma.demandModel.updateMany({
    where: {
      id: { not: model.id },
      isActive: true,
    },
    data: {
      isActive: false,
    },
  });

  return model;
}

export async function predictWithModel(modelId: string, inputFeatures: any) {
  const model = await prisma.demandModel.findUnique({
    where: { id: modelId },
  });

  if (!model) {
    throw new Error("Modelo no encontrado");
  }

  // Simulated prediction
  // In a real implementation, this would:
  // 1. Deserialize model parameters
  // 2. Apply the model to inputFeatures
  // 3. Return the prediction

  const parameters = model.parameters as any;
  const coefficients = parameters.coefficients || [];
  
  // Simple linear combination for simulation
  let prediction = parameters.intercept || 0;
  const featureValues = [
    inputFeatures.hour || 12,
    inputFeatures.dayOfWeek || 1,
    inputFeatures.isWeekend ? 1 : 0,
    inputFeatures.isHoliday ? 1 : 0,
    inputFeatures.hasPromotion ? 1 : 0,
    (inputFeatures.temperatureC || 20) / 30,
  ];
  
  for (let i = 0; i < Math.min(coefficients.length, featureValues.length); i++) {
    prediction += coefficients[i] * featureValues[i];
  }

  // Add some randomness for simulation
  prediction += Math.random() * 5 - 2.5;

  return Math.max(0, prediction);
}

export async function getActiveModel() {
  const activeModel = await prisma.demandModel.findFirst({
    where: { isActive: true },
    orderBy: { trainedAt: "desc" },
  });

  return activeModel;
}

export async function listModels() {
  const models = await prisma.demandModel.findMany({
    include: {
      dataset: {
        select: {
          name: true,
        },
      },
    },
    orderBy: { trainedAt: "desc" },
  });

  return models;
}

export async function activateModel(modelId: string) {
  const model = await prisma.demandModel.findUnique({
    where: { id: modelId },
  });

  if (!model) {
    throw new Error("Modelo no encontrado");
  }

  // Deactivate all models
  await prisma.demandModel.updateMany({
    data: { isActive: false },
  });

  // Activate the selected model
  const updatedModel = await prisma.demandModel.update({
    where: { id: modelId },
    data: { isActive: true },
  });

  return updatedModel;
}
