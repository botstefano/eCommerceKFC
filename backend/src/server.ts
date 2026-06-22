import { createApp } from "./app";

const PORT = Number(process.env.PORT) || 5000;

export function startServer() {
  const app = createApp();
  return app.listen(PORT, () => {
    console.log(`🍗 KFC E-commerce API escuchando en el puerto ${PORT}`);
  });
}
