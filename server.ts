import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();
const GEMINI_API_KEY = "AQ.Ab8RN6LoY1k5cnHVzomKtQRlc2EhtLDtRkW0e4F6resmr0K5bA";
async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for AI GTO Coach Analysis
  app.post("/api/analyze-hand", async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === "AQ.Ab8RN6LoY1k5cnHVzomKtQRlc2EhtLDtRkW0e4F6resmr0K5bA") {
        return res.status(400).json({
          error: "API Key do Gemini não configurada. Por favor, adicione a chave 'GEMINI_API_KEY' nas configurações da aplicação (Secrets).",
        });
      }

      const { situation, cards, history, focus } = req.body;
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const prompt = `Você é um Treinador de Poker Profissional e Especialista em Teoria dos Jogos Ótimos (GTO).
Analise com precisão técnica a seguinte situação na mesa de poker e dê conselhos práticos e objetivos.

DADOS DA MÃO / SITUAÇÃO:
- Tipo de Jogo: Texas Hold'em
- Etapa/Situação: ${situation || "N/A"}
- Cartas Conhecidas (Sua mão ou Board): ${cards || "N/A"}
- Histórico de Apostas / Ação até aqui: ${history || "N/A"}
- Foco Principal: ${focus || "Decisão Ótima GTO"}

Por favor, forneça uma análise estruturada contendo:
1. **Decisão Recomendada (GTO)**: O que fazer (Fold, Call, Raise, Check) e as frequências sugeridas para equilibrar o range.
2. **Raciocínio Teórico**: Explicação concisa baseada em ranges de vantagem, textura do bordo e equidade.
3. **Adaptações Explorativas**: Dicas de como explorar erros comuns de oponentes reais nesta situação (ex: se pagam demais ou blefam de menos).
4. **Calculadora e Regras de Ouro**: Pontos rápidos sobre pot odds, SPR (Stack-to-Pot Ratio) ou equidade.

Responda em PORTUGUÊS brasileiro de forma clara, altamente instrutiva e objetiva, ideal para leitura rápida enquanto joga. Usa formatação Markdown elegante.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      res.json({ analysis: response.text });
    } catch (error: any) {
      console.error("Erro no processador Gemini:", error);
      res.status(500).json({ error: error.message || "Erro interno na análise com IA." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
