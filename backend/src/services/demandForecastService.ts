import { prisma } from "../lib/prisma";
import { getActiveModel, predictWithModel } from "./mlTrainingService";
import { simulateTrafficByHour } from "./simulationService";

export async function forecastDemandByHour(date?: Date) {
  const targetDate = date || new Date();
  const activeModel = await getActiveModel();

  const forecasts = [];

  for (let hour = 0; hour < 24; hour++) {
    let predictedOrders: number;
    let source: string;
    let modelId: string | null = null;
    let algorithm: string | null = null;

    if (activeModel) {
      // Use ML model for prediction
      const dayOfWeek = targetDate.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      
      const inputFeatures = {
        hour,
        dayOfWeek,
        isWeekend,
        isHoliday: 0, // Could check against a holidays table
        hasPromotion: Math.random() > 0.7 ? 1 : 0, // Could check active promotions
        temperatureC: 22, // Default temperature
      };

      predictedOrders = await predictWithModel(activeModel.id, inputFeatures);
      source = "ml_model";
      modelId = activeModel.id;
      algorithm = activeModel.algorithm;
    } else {
      // Fallback to heuristic
      const trafficData = await simulateTrafficByHour();
      const hourData = trafficData.hours.find((h: any) => h.hour === hour);
      predictedOrders = hourData ? hourData.weekdayOrders : 5;
      source = "heuristic_fallback";
    }

    // Persist forecast
    const forecast = await prisma.demandForecast.create({
      data: {
        modelId,
        forDate: targetDate,
        hour,
        predictedOrders,
        source,
      },
    });

    forecasts.push({
      hour,
      predictedOrders,
      source,
      modelId,
      algorithm,
    });
  }

  return {
    date: targetDate.toISOString().split("T")[0],
    forecasts,
    source: activeModel ? "ml_model" : "heuristic_fallback",
    modelId: activeModel?.id || null,
    algorithm: activeModel?.algorithm || null,
  };
}

export async function forecastDemandByProduct(date?: Date) {
  const targetDate = date || new Date();
  const activeModel = await getActiveModel();

  const categories = ["Pollo", "Combos", "Acompañamientos", "Bebidas", "Postres"];
  const forecasts = [];

  for (const category of categories) {
    let predictedOrders: number;
    let source: string;
    let modelId: string | null = null;
    let algorithm: string | null = null;

    if (activeModel) {
      // Use ML model for prediction (simplified - in real implementation would use category-specific features)
      const dayOfWeek = targetDate.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      
      const inputFeatures = {
        hour: 12, // Peak hour for simplicity
        dayOfWeek,
        isWeekend,
        isHoliday: 0,
        hasPromotion: Math.random() > 0.7 ? 1 : 0,
        temperatureC: 22,
      };

      predictedOrders = await predictWithModel(activeModel.id, inputFeatures);
      // Adjust by category (simplified)
      const categoryMultiplier = {
        "Pollo": 1.0,
        "Combos": 0.8,
        "Acompañamientos": 0.6,
        "Bebidas": 0.9,
        "Postres": 0.4,
      }[category] || 1.0;
      
      predictedOrders *= categoryMultiplier;
      source = "ml_model";
      modelId = activeModel.id;
      algorithm = activeModel.algorithm;
    } else {
      // Fallback to heuristic
      const baseOrders = 10 + Math.random() * 20;
      predictedOrders = baseOrders;
      source = "heuristic_fallback";
    }

    forecasts.push({
      category,
      predictedOrders,
      source,
      modelId,
      algorithm,
    });
  }

  return {
    date: targetDate.toISOString().split("T")[0],
    forecasts,
    source: activeModel ? "ml_model" : "heuristic_fallback",
    modelId: activeModel?.id || null,
    algorithm: activeModel?.algorithm || null,
  };
}

export async function getForecastAccuracy(modelId?: string) {
  const where = modelId ? { modelId } : {};
  
  const forecasts = await prisma.demandForecast.findMany({
    where: {
      ...where,
      actualOrders: { not: null },
    },
    include: {
      model: true,
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  if (forecasts.length === 0) {
    return {
      mae: null,
      rmse: null,
      r2Score: null,
      sampleSize: 0,
    };
  }

  // Calculate accuracy metrics
  const errors: number[] = [];
  const actuals: number[] = [];
  const predicted: number[] = [];

  for (const forecast of forecasts) {
    const error = Math.abs(forecast.predictedOrders - (forecast.actualOrders || 0));
    errors.push(error);
    actuals.push(forecast.actualOrders || 0);
    predicted.push(forecast.predictedOrders);
  }

  const mae = errors.reduce((a, b) => a + b, 0) / errors.length;
  const rmse = Math.sqrt(errors.reduce((a, b) => a + b * b, 0) / errors.length);
  
  // Calculate R²
  const meanActual = actuals.reduce((a, b) => a + b, 0) / actuals.length;
  const ssRes = actuals.reduce((sum, actual, i) => sum + Math.pow(actual - predicted[i], 2), 0);
  const ssTot = actuals.reduce((sum, actual) => sum + Math.pow(actual - meanActual, 2), 0);
  const r2Score = ssTot === 0 ? 1 : 1 - (ssRes / ssTot);

  return {
    mae,
    rmse,
    r2Score,
    sampleSize: forecasts.length,
  };
}

export async function backfillActualOrders(date: Date) {
  // In a real implementation, this would:
  // 1. Query actual orders from the Order table for the given date
  // 2. Aggregate by hour and category
  // 3. Update DemandForecast records with actualOrders
  
  // Simulated implementation
  const forecasts = await prisma.demandForecast.findMany({
    where: {
      forDate: date,
    },
  });

  for (const forecast of forecasts) {
    const actualOrders = Math.floor(forecast.predictedOrders * (0.8 + Math.random() * 0.4)); // Simulate actual orders within 80-120% of prediction
    
    await prisma.demandForecast.update({
      where: { id: forecast.id },
      data: { actualOrders },
    });
  }

  return {
    date: date.toISOString().split("T")[0],
    updatedCount: forecasts.length,
  };
}
