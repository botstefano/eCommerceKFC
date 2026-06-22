import { useEffect, useRef, useState } from "react";
import { ChevronDown, Send, LifeBuoy } from "lucide-react";
import api from "../services/api";
import { useAuthStore } from "../store/authStore";

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

interface ChatMessage {
  from: "user" | "bot";
  text: string;
}

export default function SupportPage() {
  const [faq, setFaq] = useState<FaqItem[]>([]);
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { from: "bot", text: "¡Hola! Soy el asistente de soporte KFC. ¿En qué puedo ayudarte?" },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [ticketSent, setTicketSent] = useState(false);
  const user = useAuthStore((s) => s.user);
  const [ticketForm, setTicketForm] = useState({ name: user?.name || "", email: user?.email || "", subject: "", message: "" });
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.get("/support/faq").then(({ data }) => setFaq(data.faq));
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendChat() {
    if (!chatInput.trim()) return;
    const userMessage = chatInput;
    setMessages((prev) => [...prev, { from: "user", text: userMessage }]);
    setChatInput("");
    const { data } = await api.post("/support/chat", { message: userMessage });
    setMessages((prev) => [...prev, { from: "bot", text: data.reply }]);
  }

  async function submitTicket(e: React.FormEvent) {
    e.preventDefault();
    await api.post("/support/tickets", ticketForm);
    setTicketSent(true);
    setTicketForm({ name: user?.name || "", email: user?.email || "", subject: "", message: "" });
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="section-title mb-6">Soporte y ayuda</h1>

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h2 className="font-display font-semibold text-lg mb-3">Preguntas frecuentes</h2>
          <div className="flex flex-col gap-2 mb-8">
            {faq.map((item) => (
              <div key={item.id} className="card overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === item.id ? null : item.id)}
                  className="w-full flex items-center justify-between p-4 text-left text-sm font-semibold"
                >
                  {item.question}
                  <ChevronDown size={16} className={`transition-transform ${openFaq === item.id ? "rotate-180" : ""}`} />
                </button>
                {openFaq === item.id && <p className="px-4 pb-4 text-sm text-black/60">{item.answer}</p>}
              </div>
            ))}
          </div>

          <h2 className="font-display font-semibold text-lg mb-3 flex items-center gap-2">
            <LifeBuoy size={18} /> Crear ticket de soporte
          </h2>
          {ticketSent ? (
            <div className="card p-4 text-sm text-green-700 bg-green-50 border-green-200">
              ¡Tu ticket fue enviado! Te responderemos a la brevedad.
            </div>
          ) : (
            <form onSubmit={submitTicket} className="card p-4 flex flex-col gap-3">
              <input
                required
                placeholder="Nombre"
                value={ticketForm.name}
                onChange={(e) => setTicketForm({ ...ticketForm, name: e.target.value })}
                className="input-field"
              />
              <input
                required
                type="email"
                placeholder="Correo"
                value={ticketForm.email}
                onChange={(e) => setTicketForm({ ...ticketForm, email: e.target.value })}
                className="input-field"
              />
              <input
                required
                placeholder="Asunto"
                value={ticketForm.subject}
                onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                className="input-field"
              />
              <textarea
                required
                placeholder="Mensaje"
                value={ticketForm.message}
                onChange={(e) => setTicketForm({ ...ticketForm, message: e.target.value })}
                className="input-field"
                rows={3}
              />
              <button type="submit" className="btn-primary">
                Enviar ticket
              </button>
            </form>
          )}
        </div>

        <div>
          <h2 className="font-display font-semibold text-lg mb-3">Chat de soporte</h2>
          <div className="card flex flex-col h-[500px]">
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${
                    m.from === "user" ? "bg-kfc-red text-white self-end" : "bg-black/5 self-start"
                  }`}
                >
                  {m.text}
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <div className="border-t border-black/10 p-3 flex gap-2">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendChat()}
                placeholder="Escribe tu mensaje..."
                className="input-field"
              />
              <button onClick={sendChat} className="btn-primary px-4">
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
