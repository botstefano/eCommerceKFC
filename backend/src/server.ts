import { createApp } from "./app";
import { checkReorderThresholds } from "./services/inventoryService";

const PORT = Number(process.env.PORT) || 5000;

export function startServer() {
  const app = createApp();
  const server = app.listen(PORT, () => {
    console.log(`🍗 KFC E-commerce API escuchando en el puerto ${PORT}`);
  });

  // Scheduled task: check reorder thresholds every 15 minutes
  const CHECK_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes
  
  setInterval(async () => {
    try {
      console.log("🔄 Ejecutando verificación de umbrales de reorden...");
      await checkReorderThresholds();
      console.log("✅ Verificación de umbrales de reorden completada");
    } catch (error) {
      console.error("❌ Error en verificación de umbrales de reorden:", error);
      // Don't crash the server on error
    }
  }, CHECK_INTERVAL_MS);

  return server;
}
