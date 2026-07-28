import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import {
  fetchAIGeneratedResponse,
  getOfflineClinicalResponse,
  SYSTEM_INSTRUCTION,
} from "./src/data/clinicalEngine";

dotenv.config();

const app = express();
const PORT = 3000;

// Body parser
app.use(express.json({ limit: "20mb" }));

// API Health route
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", bot: "MediBot AI", model: "gemini-3.6-flash" });
});






// Chat API endpoint
app.post("/api/chat", async (req, res) => {
  try {
    const { prompt, history = [], imageAttachment, mode = "chat", language = "en" } = req.body;

    if (!prompt && !imageAttachment) {
      return res.status(400).json({ error: "Prompt or image is required." });
    }

    if (!process.env.GEMINI_API_KEY) {
      const missingKeyText = language === "ar"
        ? "⚠️ **مفتاح GEMINI_API_KEY غير متوفر.** يرجى التأكد من إضافة مفتاح API في الإعدادات."
        : "⚠️ **GEMINI_API_KEY is missing.** Please ensure your API key is configured in Settings > Secrets.";
      return res.json({ text: missingKeyText, groundingSources: [] });
    }

    // Build system instructions with language directive
    const langDirective = language === "ar"
      ? "\n\nCRITICAL LANGUAGE REQUIREMENT: The user has selected Arabic (العربية). You MUST respond ENTIRELY in clear, professional, empathetic Arabic. Use clear formatting, bullet points, and appropriate medical terminology in Arabic."
      : "\n\nCRITICAL LANGUAGE REQUIREMENT: Respond in clear, professional English.";

    const activeSystemInstruction = SYSTEM_INSTRUCTION + langDirective;

    // Build contents payload
    const contents: any[] = [];

    // Add previous history turns if provided
    if (Array.isArray(history) && history.length > 0) {
      for (const msg of history.slice(-6)) { // Keep last 6 messages for context
        contents.push({
          role: msg.sender === "user" ? "user" : "model",
          parts: [{ text: msg.text }],
        });
      }
    }

    // Prepare latest turn parts
    const currentTurnParts: any[] = [];

    if (imageAttachment) {
      // Remove base64 header if present
      const base64Data = imageAttachment.replace(/^data:image\/\w+;base64,/, "");
      let mimeType = "image/jpeg";
      if (imageAttachment.startsWith("data:image/png")) mimeType = "image/png";
      if (imageAttachment.startsWith("data:image/webp")) mimeType = "image/webp";

      currentTurnParts.push({
        inlineData: {
          mimeType,
          data: base64Data,
        },
      });
    }

    let queryText = prompt || "Please analyze this medication or pill image in detail.";
    if (mode === "interaction") {
      queryText = `[DRUG INTERACTION CHECK REQUEST]\n${queryText}`;
    } else if (mode === "pill") {
      queryText = `[PILL IDENTIFICATION & VERIFICATION REQUEST]\n${queryText}`;
    } else if (mode === "dosage") {
      queryText = `[DOSAGE & ADMINISTRATION GUIDELINE REQUEST]\n${queryText}`;
    }

    currentTurnParts.push({ text: queryText });

    contents.push({
      role: "user",
      parts: currentTurnParts,
    });

    const { text: replyText, groundingSources } = await fetchAIGeneratedResponse(
      contents,
      activeSystemInstruction,
      prompt || "",
      language,
      mode
    );

    return res.json({
      text: replyText,
      groundingSources,
    });
  } catch (error: any) {
    console.error("Error in /api/chat:", error);
    const fallbackText = getOfflineClinicalResponse(req.body?.prompt || "", req.body?.language || "en", req.body?.mode || "chat");
    return res.json({
      text: fallbackText,
      groundingSources: [],
    });
  }
});

// Specialized Drug Interaction Endpoint
app.post("/api/check-interactions", async (req, res) => {
  try {
    const { drugs, language = "en" } = req.body;
    if (!drugs || !Array.isArray(drugs) || drugs.length < 2) {
      return res.status(400).json({ error: "At least 2 drugs are required for interaction checking." });
    }

    const langDirective = language === "ar"
      ? "Respond entirely in clear Arabic."
      : "Respond in clear English.";

    const prompt = `Perform a rigorous, evidence-based drug-drug interaction analysis between the following medications: ${drugs.join(", ")}.
${langDirective}

Provide a structured clinical evaluation with:
1. Overall Risk Level: (No Known Significant Interaction / Mild / Moderate / Major / Contraindicated)
2. Detailed Pharmacology Rationale: Why do these drugs interact? (e.g. CYP3A4 inhibition, additive CNS depression, QT prolongation, GI bleeding risk)
3. Clinical Manifestations / Symptoms to Watch For
4. Recommended Patient Action / Management (e.g. spacing doses, dosage reduction, monitoring blood pressure/lab work, consulting prescriber)`;

    const contents = [{ role: "user", parts: [{ text: prompt }] }];
    const { text: replyText, groundingSources } = await fetchAIGeneratedResponse(
      contents,
      SYSTEM_INSTRUCTION,
      drugs.join(" "),
      language,
      "interaction"
    );

    return res.json({ text: replyText, groundingSources });
  } catch (error: any) {
    console.error("Error in /api/check-interactions:", error);
    const fallbackText = getOfflineClinicalResponse((req.body?.drugs || []).join(" "), req.body?.language || "en", "interaction");
    return res.json({ text: fallbackText, groundingSources: [] });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`MediBot AI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
