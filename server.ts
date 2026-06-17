import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Set up body parsers with limits for large images (invoice receipts)
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ limit: "25mb", extended: true }));

// Initialize Gemini SDK with User-Agent required for telemetry
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not defined in environment variables.");
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

// API routes FIRST
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", mode: process.env.NODE_ENV || "development" });
});

// Invoice scanner OCR API using gemini-3.5-flash
app.post("/api/scan-invoice", async (req, res) => {
  try {
    const { imageBase64, mimeType } = req.body;
    if (!imageBase64 || !mimeType) {
      return res.status(400).json({ error: "Brak danych obrazu faktury (imageBase64) lub typu MIME." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.log("GEMINI_API_KEY is not defined. Using smart local fallback for the invoice scanner.");
      
      // Simulate typical wholesale invoice data of high quality 
      const mockResult = {
        sprzedawca: "HYDROSOLAR Sp. z o.o. (Tryb Demonstracyjny)",
        dataZakupu: new Date().toISOString().substring(0, 10),
        sumaBrutto: 853.48,
        isDemoFallback: true,
        pozycje: [
          {
            nazwa: "Rura wielowarstwowa PEX-Al-PEX 16x2.0 (m)",
            ilosc: 100,
            jednostka: "m",
            cenaJednostkowaNetto: 3.90,
            vat: 23,
            brutto: 479.70
          },
          {
            nazwa: "Zawór kulowy wodny z dławikiem Calido 1/2'' (szt)",
            ilosc: 6,
            jednostka: "szt",
            cenaJednostkowaNetto: 19.80,
            vat: 23,
            brutto: 146.12
          },
          {
            nazwa: "Złączka zaciskowa PEX Eurokonus 16x3/4'' (szt)",
            ilosc: 16,
            jednostka: "szt",
            cenaJednostkowaNetto: 9.80,
            vat: 23,
            brutto: 192.83
          },
          {
            nazwa: "Taśma teflonowa profesjonalna uszczelniająca",
            ilosc: 4,
            jednostka: "szt",
            cenaJednostkowaNetto: 3.80,
            vat: 23,
            brutto: 18.70
          },
          {
            nazwa: "Rura PVC kanalizacyjna Fi 50 L=1000",
            ilosc: 1,
            jednostka: "szt",
            cenaJednostkowaNetto: 11.20,
            vat: 23,
            brutto: 13.78
          }
        ]
      };
      
      // Artificial delay to mimic actual scanning
      await new Promise(resolve => setTimeout(resolve, 2000));
      return res.json(mockResult);
    }

    const ai = getGeminiClient();

    const systemPrompt = `Jesteś ekspertem w dziedzinie księgowości i hydrauliki w Polsce.
Twój cel to przeczytanie zdjęcia faktury lub paragonu zakupowego z hurtowni instalacyjnej/hydraulicznej i dokładne wyekstrahowanie pozycji asortymentowych, które zakupił hydraulik.
Odczytaj nazwę sprzedawcy, datę zakupu oraz wszystkie pozycje na fakturze. Jeśli nazwa pozycji jest skrótem (np. "Rura PEX-AL-PEX 16x2.0"), postaraj się ją czytelnie sformatować do postaci zrozumiałej dla klienta końcowego.
Dla każdej pozycji wyciągnij:
1. Nazwę materiału (nazwa)
2. Ilość (ilosc)
3. Jednostkę miary, np. szt, m, kpl (jednostka)
4. Cenę jednostkową netto (cenaJednostkowaNetto)
5. Stawkę podatku VAT w % jako liczbę, np. 23 (vat)
6. Wartość łączną brutto danej pozycji (brutto)

Zwróć odpowiedź wyłącznie jako poprawny format JSON zgodny ze wskazanym schematem.`;

    const imagePart = {
      inlineData: {
        mimeType: mimeType,
        data: imageBase64,
      },
    };

    const textPart = {
      text: "Przeanalizuj to zdjęcie faktury/paragonu i zwróć rzetelne, szczegółowe dane w strukturze JSON.",
    };

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [imagePart, textPart],
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            sprzedawca: {
              type: Type.STRING,
              description: "Nazwa hurtowni lub sprzedawcy (np. Castorama, Hydrosolar, Leroy Merlin, Onninen itp.)",
            },
            dataZakupu: {
              type: Type.STRING,
              description: "Data zakupu wyekstrahowana z dokumentu (format RRRR-MM-DD)",
            },
            sumaBrutto: {
              type: Type.NUMBER,
              description: "Łączna suma brutto z dokumentu",
            },
            pozycje: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  nazwa: { type: Type.STRING, description: "Pełna handlowa nazwa towaru (np. Zawór kulowy 1/2 z dławikiem)" },
                  ilosc: { type: Type.NUMBER, description: "Ilość zakupionych sztuk lub metrów" },
                  jednostka: { type: Type.STRING, description: "Jednostka miary, np. szt, m, kpl, opak" },
                  cenaJednostkowaNetto: { type: Type.NUMBER, description: "Cena jednostkowa netto po ewentualnych rabatach" },
                  vat: { type: Type.NUMBER, description: "Stawka podatku VAT w %, np. 23" },
                  brutto: { type: Type.NUMBER, description: "Wartość brutto łączna za całą tę pozycję" }
                },
                required: ["nazwa", "ilosc", "cenaJednostkowaNetto", "brutto"]
              }
            }
          },
          required: ["sprzedawca", "pozycje"]
        }
      }
    });

    const parsedText = response.text;
    if (!parsedText) {
      throw new Error("Pusta odpowiedź od modelu Gemini.");
    }

    const data = JSON.parse(parsedText);
    res.json(data);
  } catch (error: any) {
    console.error("Błąd podczas skanowania faktury przez Gemini API:", error);
    res.status(500).json({
      error: "Nie udało się poprawnie zeskanować faktury. Spróbuj powtórzyć zdjęcie lub upewnij się, że plik jest czytelny.",
      details: error.message
    });
  }
});

// Setup Vite Dev server or Serve Static files in Production
const startServer = async () => {
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
    console.log(`Server running on port ${PORT}`);
  });
};

startServer().catch((err) => {
  console.error("Błąd podczas uruchamiania serwera aplikacji:", err);
});
