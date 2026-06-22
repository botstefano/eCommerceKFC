import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

const FAQ = [
  { id: "1", question: "¿Cuáles son los métodos de pago aceptados?", answer: "Aceptamos tarjetas de crédito/débito a través de Stripe, y pago en efectivo para pickup y drive-thru." },
  { id: "2", question: "¿Cuánto tiempo demora el delivery?", answer: "El tiempo estimado depende de tu zona, normalmente entre 20 y 45 minutos." },
  { id: "3", question: "¿Cómo funciona el programa de lealtad?", answer: "Ganas 1 punto por cada sol gastado. Acumulas niveles Silver, Gold y Platinum con beneficios crecientes." },
  { id: "4", question: "¿Puedo cancelar un pedido?", answer: "Puedes cancelar mientras el estado sea 'Pendiente'. Una vez en preparación, contacta a soporte." },
  { id: "5", question: "¿Tienen opciones sin picante?", answer: "Sí, puedes filtrar el menú por nivel de picante y alérgenos en la pantalla de Nutrición y Salud." },
  { id: "6", question: "¿Cómo canjeo mis puntos de lealtad?", answer: "Desde tu perfil, ve a 'Programa de lealtad' y selecciona una recompensa disponible." },
];

const CANNED_RESPONSES: { keywords: string[]; reply: string }[] = [
  { keywords: ["pedido", "orden", "delivery", "demora"], reply: "Puedes revisar el estado de tu pedido en tiempo real desde 'Seguimiento de pedido' en tu perfil." },
  { keywords: ["punto", "lealtad", "nivel"], reply: "Tus puntos de lealtad se acumulan automáticamente con cada compra. Revisa tu progreso en la sección de Lealtad." },
  { keywords: ["cupon", "cupón", "promo", "descuento"], reply: "Revisa la sección de Promociones para ver los cupones activos y aplicarlos en el carrito." },
  { keywords: ["pago", "tarjeta", "stripe"], reply: "Los pagos se procesan de forma segura mediante Stripe en modo de prueba." },
];

export async function getFaq(_req: Request, res: Response) {
  res.json({ faq: FAQ });
}

export async function chatSimulated(req: Request, res: Response) {
  const { message } = req.body as { message: string };
  const lower = (message || "").toLowerCase();
  const match = CANNED_RESPONSES.find((c) => c.keywords.some((k) => lower.includes(k)));
  const reply = match
    ? match.reply
    : "Gracias por tu mensaje. Un agente de soporte revisará tu consulta pronto. Mientras tanto, puedes revisar nuestras preguntas frecuentes.";
  res.json({ reply });
}

export async function createTicket(req: Request, res: Response) {
  const { name, email, subject, message } = req.body as { name: string; email: string; subject: string; message: string };
  const ticket = await prisma.supportTicket.create({
    data: { userId: (req as any).user?.userId, name, email, subject, message },
  });
  res.status(201).json({ ticket });
}

export async function listTickets(_req: Request, res: Response) {
  const tickets = await prisma.supportTicket.findMany({ orderBy: { createdAt: "desc" } });
  res.json({ tickets });
}

export async function updateTicketStatus(req: Request, res: Response) {
  const ticket = await prisma.supportTicket.update({
    where: { id: req.params.id },
    data: { status: req.body.status },
  });
  res.json({ ticket });
}
