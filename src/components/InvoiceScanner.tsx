import React, { useState, useEffect, useRef } from "react";
import { MaterialItem, ScannedInvoiceItem } from "../types";
import { 
  Upload, 
  FileSpreadsheet, 
  CheckSquare, 
  Square, 
  RefreshCw, 
  AlertCircle, 
  Sparkles, 
  CheckCircle2, 
  Clipboard, 
  ChevronRight, 
  Plus, 
  Minus, 
  Trash2, 
  Search, 
  HelpCircle, 
  Coins, 
  Check, 
  BookOpen 
} from "lucide-react";
import { PLUMBER_WISDOM } from "../constants";

interface InvoiceScannerProps {
  onImportMaterials: (itemsToAdd: MaterialItem[]) => void;
}

export default function InvoiceScanner({ onImportMaterials }: InvoiceScannerProps) {
  // Mode selection: "camera" or "paste"
  const [scanMode, setScanMode] = useState<"camera" | "paste">("camera");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // States of parsed invoice
  const [sprzedawca, setSprzedawca] = useState("");
  const [dataZakupu, setDataZakupu] = useState("");
  const [parsedItems, setParsedItems] = useState<ScannedInvoiceItem[]>([]);
  const [selectedAll, setSelectedAll] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  // Search filter for parsed results
  const [resultsSearch, setResultsSearch] = useState("");

  // Raw text input state (for Paste Text Mode)
  const [rawText, setRawText] = useState("");

  // Comical plumbing tips rotating loop during Gemini latency
  const [currentTip, setCurrentTip] = useState(PLUMBER_WISDOM[0]);
  const tipInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (loading) {
      tipInterval.current = setInterval(() => {
        const randomIdx = Math.floor(Math.random() * PLUMBER_WISDOM.length);
        setCurrentTip(PLUMBER_WISDOM[randomIdx]);
      }, 4000);
    } else {
      if (tipInterval.current) {
        clearInterval(tipInterval.current);
      }
    }
    return () => {
      if (tipInterval.current) clearInterval(tipInterval.current);
    };
  }, [loading]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const processFile = (file: File) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    setParsedItems([]);
    setIsDemo(false);

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64String = (reader.result as string).split(",")[1];
        const mimeType = file.type || "image/jpeg";

        const response = await fetch("/api/scan-invoice", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            imageBase64: base64String,
            mimeType: mimeType,
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Wystąpił błąd podczas analizowania faktury.");
        }

        setSprzedawca(data.sprzedawca || "Nieznana hurtownia");
        setDataZakupu(data.dataZakupu || new Date().toISOString().substring(0, 10));
        setIsDemo(!!data.isDemoFallback);
        
        if (data.pozycje && Array.isArray(data.pozycje)) {
          const items: ScannedInvoiceItem[] = data.pozycje.map((item: any) => {
            const qty = typeof item.ilosc === "number" ? item.ilosc : 1;
            const price = typeof item.cenaJednostkowaNetto === "number" ? item.cenaJednostkowaNetto : (item.brutto || 0) / qty;
            const vatVal = typeof item.vat === "number" ? item.vat : 23;
            return {
              nazwa: item.nazwa,
              ilosc: qty,
              jednostka: item.jednostka || "szt",
              cenaJednostkowaNetto: parseFloat(price.toFixed(2)),
              vat: vatVal,
              brutto: parseFloat((price * qty * (1 + vatVal / 100)).toFixed(2)),
              wybrana: true,
            };
          });
          setParsedItems(items);
          if (data.isDemoFallback) {
            setSuccess(`Wczytano przykładowy dokument (tryb demonstracyjny - brak klucza API).`);
          } else {
            setSuccess(`Pomyślnie przeanalizowano dokument sprzedawcy "${data.sprzedawca}" poprzez darmowy model AI!`);
          }
        } else {
          throw new Error("Nie odnaleziono czytelnych pozycji materiałowych na dokumencie.");
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Błąd połączenia z serwerem scan-invoice. Spróbuj powtórzyć.");
      } finally {
        setLoading(false);
      }
    };

    reader.onerror = () => {
      setError("Nie udało się odczytać wybranego pliku.");
      setLoading(false);
    };

    reader.readAsDataURL(file);
  };

  // Client-Side 100% Free / Offline text parser
  const handleParseRawText = () => {
    if (!rawText.trim()) {
      setError("Proszę wkleić tekst ze schowka lub wpisać wykaz materiałów.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    setParsedItems([]);
    setIsDemo(false);

    // Artificial tiny timeout for nice UI feedback
    setTimeout(() => {
      try {
        const lines = rawText.split("\n");
        const itemsList: ScannedInvoiceItem[] = [];

        // Simple Regex rules & Polish text heuristics
        lines.forEach(rawLine => {
          const line = rawLine.trim();
          if (!line || line.length < 4) return;

          // Exclude absolute totals or obvious headers
          const lower = line.toLowerCase();
          if (lower.includes("razem") || lower.includes("podsumowanie") || lower.includes("fv") || lower.includes("konto bankowe") || lower.includes("nip:") || lower.includes("odbiorca") || lower.includes("sprzedawca")) {
            return;
          }

          // Try to clean row index numbers (e.g. "1. Rura" or "2) Rura")
          let cleanLine = line.replace(/^\d+[\.\)\s-]+\s*/, "").trim();

          // Regex to search match quantities and unit
          // Extracts: pattern like "12 szt", "100m", "5 kpl"
          const unitMatch = cleanLine.match(/(\d+(?:[\.,]\d+)?)\s*(szt\.?|m\.?|kpl\.?|opak\.?|sztuk|metrów|mb\.?)/i);
          
          let ilosc = 1;
          let jednostka = "szt";
          let nazwaStr = cleanLine;

          if (unitMatch) {
            ilosc = parseFloat(unitMatch[1].replace(",", "."));
            jednostka = unitMatch[2].toLowerCase().replace(/\./g, "");
            if (jednostka.startsWith("metr") || jednostka === "mb") jednostka = "m";
            if (jednostka.startsWith("szt")) jednostka = "szt";
            
            // Remove the quantity and unit from the string to help carve out name and price
            nazwaStr = cleanLine.replace(unitMatch[0], "").trim();
          } else {
            // Check alternative pattern: simple multipliers like "2x" or "10x" or "4 szt." at the beginning
            const prefixMatch = cleanLine.match(/^(\d+)\s*[x*×]\s*/i);
            if (prefixMatch) {
              ilosc = parseFloat(prefixMatch[1]);
              nazwaStr = cleanLine.replace(prefixMatch[0], "").trim();
            }
          }

          // Try to extract price or decimals
          // Look for patterns like "29,50 zł" or "29.50" or "45 zl" at the end of the string
          const priceMatch = nazwaStr.match(/(\d+(?:[\.,]\d{2})?)\s*(zł|zl|pln)?\s*$/i);
          let cenaBazowaNetto = 10.00; // default safe fallback if none found
          
          if (priceMatch) {
            cenaBazowaNetto = parseFloat(priceMatch[1].replace(",", "."));
            nazwaStr = nazwaStr.replace(priceMatch[0], "").trim();
          } else {
            // Find any decimals inside the text
            const innerPriceMatch = nazwaStr.match(/(\d+[\.,]\d{2})/);
            if (innerPriceMatch) {
              cenaBazowaNetto = parseFloat(innerPriceMatch[1].replace(",", "."));
              nazwaStr = nazwaStr.replace(innerPriceMatch[0], "").trim();
            }
          }

          // Clean up floating separators and dashes at the ends of remaining name
          const finalName = nazwaStr.replace(/^[\s\-x*×:|,]+|[\s\-x*×:|,]+$/g, "").trim() || "Materiał hydrauliczny";

          itemsList.push({
            nazwa: finalName,
            ilosc: ilosc,
            jednostka: jednostka,
            cenaJednostkowaNetto: cenaBazowaNetto,
            vat: 23, // Polish standard standard
            brutto: parseFloat((cenaBazowaNetto * ilosc * 1.23).toFixed(2)),
            wybrana: true,
          });
        });

        if (itemsList.length > 0) {
          setSprzedawca("Wklejona Kopia Zlecenia (Lokalny Parser)");
          setDataZakupu(new Date().toISOString().substring(0, 10));
          setParsedItems(itemsList);
          setSuccess(`Darmowy parser lokalny odczytał pomyślnie ${itemsList.length} pozycji! Zweryfikuj i zatwierdź.`);
        } else {
          setError("Nie udało się rozpoznać rzetelnych materiałów i cen. Spróbuj zmienić format tekstu (np. wpisz: Rura PEX 100m 3.90).");
        }
      } catch (err) {
        setError("Wystąpił nieznany błąd podczas dekodowania tekstu.");
      } finally {
        setLoading(false);
      }
    }, 700);
  };

  // Pre-load example text patterns for great customer experience
  const loadExampleSnippet = (idx: number) => {
    const examples = [
      "1. Rura miedziana sztanga Fi 15mm - 12m - po 29.50 zł\n2. Zawór kulowy wodny Calido 1/2'' - 6 sztuk x 19,80 zł\n3. Taśma teflonowa uszczelniająca - 4 szt za 3,80/szt\n4. Rozdzielacz do podłogówki mosiężny - 1 szt. - 650.00 zł",
      "Stelaż podtynkowy WC Geberit Duofix (szt) | Ilość: 2 | Cena netto: 720.00\nPianka dylatacyjna przyścienna EPS (m) | Ilość: 50 | Cena netto: 1.20\nRura PVC kanalizacyjna Fi 110 L=1000 (szt) | Ilość: 5 | Cena netto: 24.50",
      "Złączka zaciskowa PEX 16 szt - 9.80 zł\nKolebka rury PEX 20 szt - 2.50\nPompa obiegowa elektroniczna 1 szt - 340.00 zl\nKolektor / filtr magnetyczny C.O. - 1 szt - 260.00 PLN"
    ];
    setRawText(examples[idx]);
    setSuccess(`Załadowano przykładowy tekst nr ${idx + 1}. Możesz go teraz przetestować!`);
  };

  // Modify individual cells of parsed items
  const handleUpdateItemValue = (index: number, field: keyof ScannedInvoiceItem, value: any) => {
    setParsedItems(prev => prev.map((item, idx) => {
      if (idx === index) {
        const updated = { ...item, [field]: value };
        // Recalculate gross
        const totalNet = updated.cenaJednostkowaNetto * updated.ilosc;
        updated.brutto = parseFloat((totalNet * (1 + updated.vat / 100)).toFixed(2));
        return updated;
      }
      return item;
    }));
  };

  const handleAdjustQty = (index: number, delta: number) => {
    const item = parsedItems[index];
    const newQty = Math.max(0.1, item.ilosc + delta);
    handleUpdateItemValue(index, "ilosc", parseFloat(newQty.toFixed(1)));
  };

  const toggleItemSelect = (index: number) => {
    setParsedItems(prev => prev.map((item, idx) => 
      idx === index ? { ...item, wybrana: !item.wybrana } : item
    ));
  };

  const toggleSelectAll = () => {
    const nextState = !selectedAll;
    setSelectedAll(nextState);
    setParsedItems(prev => prev.map(item => ({ ...item, wybrana: nextState })));
  };

  const handleDeleteItem = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setParsedItems(prev => prev.filter((_, idx) => idx !== index));
    setSuccess("Usunięto pozycję z tymczasowego zestawienia.");
  };

  const handleImport = () => {
    const selected = parsedItems.filter(item => item.wybrana);
    if (selected.length === 0) {
      setError("Zaznacz co najmniej jedną pozycję przed importem.");
      return;
    }

    const itemsToImport: MaterialItem[] = selected.map((item, index) => ({
      id: "scan-" + index + "-" + Date.now(),
      nazwa: item.nazwa,
      ilosc: item.ilosc,
      jednostka: item.jednostka,
      cenaBazowaNetto: item.cenaJednostkowaNetto,
      marzaProcent: 15, // default markup suggested
      vat: item.vat
    }));

    onImportMaterials(itemsToImport);
    setSuccess(`Poprawnie zaimportowano ${selected.length} materiałów do kosztorysu głównego!`);
    setParsedItems([]); // clear after import
    setSprzedawca("");
  };

  // Filter parsed items dynamically close to matching criteria
  const visibleParsedItems = parsedItems.filter(item => 
    item.nazwa.toLowerCase().includes(resultsSearch.toLowerCase())
  );

  return (
    <div className="space-y-4 md:space-y-6 pb-12">
      {/* Visual Hub Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 text-white shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-blue-500/20 to-indigo-600/10 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none"></div>
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
          <div className="flex items-center space-x-3.5">
            <div className="p-3.5 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shrink-0 shadow-lg border border-white/10">
              <Sparkles className="h-6 w-6 text-yellow-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg md:text-xl font-extrabold tracking-tight">Darmowe Skanowanie i Wklejacz</h2>
                <span className="bg-emerald-500 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider animate-bounce">
                  DARMOWY 100%
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 max-w-md">
                Wybierz skanowanie zdjęć za darmo (plan deweloperski Gemini AI) lub wklej bezpośrednio tekst z PDF dla bezbłędnej lokalnej konwersji offline.
              </p>
            </div>
          </div>
        </div>

        {/* Mode Selector - Highly Styled Tabs for Mobile Touch Target >= 44px */}
        <div className="grid grid-cols-2 bg-slate-800/60 p-1 rounded-2xl mt-5 border border-slate-700/60">
          <button
            type="button"
            onClick={() => {
              setScanMode("camera");
              setError(null);
              setSuccess(null);
            }}
            className={`py-3 px-4 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[44px] ${
              scanMode === "camera" 
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md" 
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Upload className="h-4 w-4 shrink-0" />
            <span>📸 Skanuj Foto / PDF</span>
          </button>
          
          <button
            type="button"
            onClick={() => {
              setScanMode("paste");
              setError(null);
              setSuccess(null);
            }}
            className={`py-3 px-4 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[44px] ${
              scanMode === "paste" 
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md" 
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Clipboard className="h-4 w-4 shrink-0" />
            <span>📋 Wklej Tekst z PDF</span>
          </button>
        </div>
      </div>

      {/* Notifications block */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start space-x-2 text-xs text-red-800 animate-in slide-in-from-top duration-200">
          <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-extrabold text-red-900 uppercase tracking-wide text-[10px]">Błąd Operacji</p>
            <p className="mt-0.5 leading-relaxed font-semibold">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start space-x-2 text-xs text-emerald-800 animate-in slide-in-from-top duration-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-extrabold text-emerald-900 uppercase tracking-wide text-[10px]">Wykonano Pomyślnie!</p>
            <p className="mt-0.5 leading-relaxed font-semibold">{success}</p>
          </div>
        </div>
      )}

      {/* Mode 1: Camera File Upload Zone */}
      {scanMode === "camera" && !loading && parsedItems.length === 0 && (
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xs space-y-4">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-200 hover:border-indigo-500 rounded-2xl p-8 bg-slate-50/50 text-center cursor-pointer hover:bg-slate-50 transition-all group"
            style={{ minHeight: "180px" }}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*,application/pdf"
              className="hidden"
            />
            <Upload className="h-10 w-10 text-slate-400 group-hover:text-indigo-600 mx-auto transition-all duration-300" />
            <p className="font-bold text-slate-700 text-sm mt-3.5">Prześlij plik lub zrób zdjęcie telefonem</p>
            <p className="text-[10px] text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
              Automatycznie wczyta fakturę z galerii aparatu. Obsługiwane pliki JPG, PNG, PDF (max 25MB)
            </p>
            <span className="inline-flex mt-4 px-3 py-1 bg-white border border-slate-200 hover:border-slate-300 text-slate-600 font-extrabold text-[10px] rounded-full gap-1 items-center shadow-2xs">
              <Sparkles className="h-3 w-3 text-yellow-500 shrink-0" />
              <span>Skanuj z planu deweloperskiego</span>
            </span>
          </div>

          <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100 flex items-start gap-2.5 text-[11px] text-slate-500 leading-relaxed">
            <HelpCircle className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-extrabold text-slate-700 block mb-0.5">Jak to działa i dlaczego jest darmowe?</span>
              Aplikacja łączy się bezpośrednio z Twoim bezpłatnym planem Gemini API. Jeśli nie posiadasz skonfigurowanego klucza, system automatycznie rozpozna dokument i wgra <strong>pełnowartościowe dane demonstracyjne</strong>, abyś mógł przetestować pełen workflow importu.
            </div>
          </div>
        </div>
      )}

      {/* Mode 2: Paste PDF Text Zone */}
      {scanMode === "paste" && !loading && parsedItems.length === 0 && (
        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-xs space-y-4">
          <div>
            <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1">
              Wklej tekst ze schowka lub wpisz odręcznie:
            </label>
            <p className="text-[10px] text-slate-400 mb-2 leading-relaxed">
              Jeśli masz fakturę w mailu lub pliku PDF, po prostu skopiuj i wklej jej zawartość. Nasz bezpłatny inteligentny algorytm lokalny odkoduje asortyment, ilości i rzetelne ceny!
            </p>
            <textarea
              rows={8}
              placeholder="np.&#10;Rura wielowarstwowa PEX 100m - 3.80 zl/m&#10;Zawór odcinający Calido 1/2'' - 6 sztuk x 19,80 zł&#10;Taśma teflonowa uszczelniająca - 4 szt za 3,80/szt"
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              className="w-full text-xs p-4 bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-2xl focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono leading-relaxed text-slate-700"
            />
          </div>

          {/* Quick interactive template tools */}
          <div className="border-t border-slate-100 pt-3">
            <span className="block text-[9px] font-black uppercase text-slate-400 tracking-wider mb-2 flex items-center gap-1">
              <BookOpen className="h-3 w-3 text-slate-400" /> Szybkie testowe szablony tekstu (kliknij aby załadować):
            </span>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => loadExampleSnippet(0)}
                className="flex-1 py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] rounded-lg text-left truncate cursor-pointer"
                title="Wczytaj przykład 1"
              >
                📝 Przykład 1 (Miedź i Zawory)
              </button>
              <button
                type="button"
                onClick={() => loadExampleSnippet(1)}
                className="flex-1 py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] rounded-lg text-left truncate cursor-pointer"
                title="Wczytaj przykład 2"
              >
                📝 Przykład 2 (Geberit i dylatacja)
              </button>
              <button
                type="button"
                onClick={() => loadExampleSnippet(2)}
                className="flex-1 py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] rounded-lg text-left truncate cursor-pointer"
                title="Wczytaj przykład 3"
              >
                📝 Przykład 3 (Pompa i osprzęt)
              </button>
            </div>
          </div>

          {/* Trigger button */}
          <button
            type="button"
            onClick={handleParseRawText}
            className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all active:scale-[0.98]"
          >
            <ChevronRight className="h-4 w-4 text-blue-100" />
            <span>Przetwórz wklejony tekst</span>
          </button>
        </div>
      )}

      {/* Loading animation with rotating plumber humor */}
      {loading && (
        <div className="bg-white border border-slate-100 rounded-3xl p-8 text-center space-y-6 shadow-xs animate-in fade-in zoom-in-95 duration-200">
          <div className="relative w-16 h-16 mx-auto">
            <RefreshCw className="h-16 w-16 text-indigo-600 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center font-black text-xs text-indigo-900">AI</div>
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm">Przetwarzanie dokumentu...</h3>
            <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
              Analizujemy linie asortymentowe, formatujemy skróty handlowe hurtowni do czytelnej formy...
            </p>
          </div>

          {/* Rotating Plumbers Wisdom Block - highly interactive */}
          <div className="bg-indigo-50/50 border border-indigo-100/50 rounded-2xl p-4 max-w-sm mx-auto text-center" style={{ minHeight: "85px" }}>
            <p className="text-[9px] font-extrabold text-indigo-500 tracking-wider uppercase">Porada z budowy:</p>
            <p className="text-xs text-indigo-800 font-bold italic mt-1.5 leading-relaxed">
              {currentTip}
            </p>
          </div>
        </div>
      )}

      {/* Results View - Compact and robust for mobile screens */}
      {parsedItems.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-100 p-4 md:p-5 shadow-xs space-y-4 animate-in slide-in-from-bottom duration-300">
          
          {/* Headline and demo banner if applicable */}
          <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row justify-between items-start gap-2">
            <div>
              <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Wystawca / Hurtownia</p>
              <h3 className="font-black text-slate-900 text-sm md:text-base flex items-center gap-1.5">
                {sprzedawca}
                {isDemo && (
                  <span className="bg-amber-100 text-amber-800 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Podgląd
                  </span>
                )}
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Zweryfikowana data: <span className="font-bold">{dataZakupu}</span></p>
            </div>
            
            <button 
              type="button"
              onClick={() => { 
                setParsedItems([]); 
                setSuccess(null); 
                setError(null);
              }}
              className="px-3 py-1.5 text-[10px] font-extrabold text-slate-600 hover:text-indigo-600 hover:bg-slate-50 border border-slate-200 hover:border-indigo-100 rounded-xl cursor-pointer transition-all self-stretch sm:self-auto text-center min-h-[36px]"
            >
              Wepchnij nowy/Ponowny skan
            </button>
          </div>

          {/* Warning about missing API keys so plumber knows they are in preview fallback mode */}
          {isDemo && (
            <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-3 flex gap-2 text-[10px] text-amber-900 leading-relaxed">
              <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-extrabold block">Brak klucza API (GEMINI_API_KEY)</span>
                Aplikacja działa w trybie offline-fallback. Powyższe pozycje to automatyczny, realistyczny szablon do celów demonstracyjnych. Dodaj klucz API w ustawieniach, aby dowolne zdjęcia faktur były skanowane na żywo!
              </div>
            </div>
          )}

          {/* Controller selectors */}
          <div className="flex flex-col sm:flex-row justify-between sm:items-center bg-slate-50 border border-slate-100 p-2.5 rounded-2xl gap-2 text-xs">
            <button 
              type="button"
              onClick={toggleSelectAll} 
              className="flex items-center space-x-2 font-extrabold text-slate-700 cursor-pointer min-h-[36px] px-2"
            >
              {selectedAll ? <CheckSquare className="h-4.5 w-4.5 text-indigo-600" /> : <Square className="h-4.5 w-4.5 text-slate-400" />}
              <span>Zaznacz wszystkie ({parsedItems.length})</span>
            </button>
            <div className="text-[10px] text-slate-400 font-bold self-start sm:self-auto px-2">
              Zweryfikuj ceny netto przed importem
            </div>
          </div>

          {/* Search bar inside scanned tools to quickly filter items */}
          <div className="relative">
            <input
              type="text"
              placeholder="Wyszukaj szybko element w wynikach..."
              value={resultsSearch}
              onChange={(e) => setResultsSearch(e.target.value)}
              className="w-full text-xs pl-8 pr-4 py-2 bg-slate-50 hover:bg-slate-100/70 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 test-slate-700"
            />
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            {resultsSearch && (
              <button
                type="button"
                onClick={() => setResultsSearch("")}
                className="absolute right-2.5 top-2 text-xs font-bold text-slate-400 hover:text-slate-600 focus:outline-none"
              >
                Wyczyść
              </button>
            )}
          </div>

          {/* Checklist list of extracted goods with smart interactive touch controls */}
          <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
            {visibleParsedItems.length === 0 ? (
              <p className="text-center py-6 text-xs text-slate-400">Brak pozycji spełniających kryteria wyszukiwania.</p>
            ) : (
              visibleParsedItems.map((item, originalIdx) => {
                // Since we could be filtering, map back to original indexes
                const idx = parsedItems.findIndex(p => p.nazwa === item.nazwa);
                
                return (
                  <div 
                    key={idx} 
                    className={`p-3.5 border rounded-2xl transition-all ${
                      item.wybrana 
                        ? "border-blue-200 bg-blue-50/20 shadow-2xs" 
                        : "border-slate-100 bg-white"
                    }`}
                  >
                    {/* Top line clickable info */}
                    <div className="flex gap-2.5 items-start">
                      <button
                        type="button"
                        onClick={() => toggleItemSelect(idx)}
                        className="mt-1 cursor-pointer focus:outline-none min-h-[32px] min-w-[32px] flex items-center justify-center p-1"
                      >
                        {item.wybrana ? (
                          <CheckSquare className="h-4.5 w-4.5 text-blue-600 shrink-0" />
                        ) : (
                          <Square className="h-4.5 w-4.5 text-slate-300 shrink-0" />
                        )}
                      </button>

                      {/* Header with name info */}
                      <div className="flex-1 min-w-0">
                        <input
                          type="text"
                          value={item.nazwa}
                          onChange={(e) => handleUpdateItemValue(idx, "nazwa", e.target.value)}
                          className="font-bold text-slate-800 text-xs w-full bg-transparent hover:bg-slate-50 border-b border-transparent focus:border-indigo-500 py-0.5 focus:outline-none"
                          title="Kliknij aby edytować nazwę"
                        />
                      </div>

                      {/* Delete icon */}
                      <button
                        type="button"
                        onClick={(e) => handleDeleteItem(idx, e)}
                        className="p-1 px-2 text-slate-300 hover:text-red-500 rounded-lg cursor-pointer transition-colors"
                        title="Usuń pozycję z listy"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Highly responsive grid with large 44px height inputs for mobile */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3.5 pt-2 border-t border-slate-100/70 items-center">
                      
                      {/* Qty controller adjustments */}
                      <div className="flex items-center gap-1">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase w-10 sm:hidden">Ilość:</label>
                        <div className="flex items-center border border-slate-200 rounded-xl bg-white p-1">
                          <button
                            type="button"
                            onClick={() => handleAdjustQty(idx, -1)}
                            className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 flex items-center justify-center font-extrabold transition-all cursor-pointer text-sm"
                            title="Mniej o 1"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          
                          <input
                            type="number"
                            step="any"
                            value={item.ilosc}
                            onChange={(e) => handleUpdateItemValue(idx, "ilosc", parseFloat(e.target.value) || 0)}
                            className="w-12 text-center text-xs font-bold text-slate-800 bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          
                          <button
                            type="button"
                            onClick={() => handleAdjustQty(idx, 1)}
                            className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 flex items-center justify-center font-extrabold transition-all cursor-pointer text-sm"
                            title="Więcej o 1"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        
                        <select
                          value={item.jednostka}
                          onChange={(e) => handleUpdateItemValue(idx, "jednostka", e.target.value)}
                          className="p-1.5 py-2 border border-slate-200 rounded-xl bg-white text-[11px] font-bold text-slate-600 focus:outline-none"
                        >
                          <option value="szt">szt</option>
                          <option value="m">m</option>
                          <option value="kpl">kpl</option>
                          <option value="opak">opak</option>
                          <option value="m²">m²</option>
                        </select>
                      </div>

                      {/* Net unit price field */}
                      <div className="flex items-center gap-1.5">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase w-10 sm:hidden">Cena j.:</label>
                        <div className="relative flex-1">
                          <input
                            type="number"
                            step="0.01"
                            value={item.cenaJednostkowaNetto}
                            onChange={(e) => handleUpdateItemValue(idx, "cenaJednostkowaNetto", parseFloat(e.target.value) || 0)}
                            className="w-full text-xs font-bold text-slate-800 p-2 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 pl-2 pr-6 bg-white"
                          />
                          <span className="absolute right-2 top-2 text-[10px] font-black text-slate-400">zł</span>
                        </div>
                      </div>

                      {/* VAT selection toggle and calculated gross total */}
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1">
                          <label className="text-[10px] font-extrabold text-slate-400 uppercase w-10 sm:hidden">VAT:</label>
                          <button
                            type="button"
                            onClick={() => handleUpdateItemValue(idx, "vat", item.vat === 23 ? 8 : 23)}
                            className={`p-1.5 px-2 text-[9px] font-black rounded-lg border transition-all cursor-pointer ${
                              item.vat === 23 
                                ? "bg-red-50 text-red-700 border-red-200/50" 
                                : "bg-blue-50 text-blue-700 border-blue-200/50"
                            }`}
                            title="Kliknij, aby zmienić stawkę VAT"
                          >
                            {item.vat}% VAT
                          </button>
                        </div>

                        {/* Gross value representing total */}
                        <div className="text-right">
                          <span className="block text-[8px] uppercase tracking-wide font-extrabold text-slate-400">Łącznie brutto</span>
                          <span className="font-extrabold text-xs text-indigo-900 font-mono">
                            {item.brutto.toFixed(2)} zł
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="border-t border-slate-100 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-center sm:text-left">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase block leading-none">Razem wybrane</span>
              <span className="font-black text-lg text-slate-800 font-mono">
                {parsedItems
                  .filter(i => i.wybrana)
                  .reduce((sum, i) => sum + i.brutto, 0)
                  .toFixed(2)}{" "}
                PLN
              </span>
            </div>

            <button
              type="button"
              onClick={handleImport}
              className="w-full sm:w-auto py-3 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold rounded-2xl text-xs flex items-center justify-center space-x-2 cursor-pointer shadow-md active:scale-[0.98] transition-all"
            >
              <FileSpreadsheet className="h-4.5 w-4.5 text-emerald-100" />
              <span>Importuj zaznaczone ({parsedItems.filter(i => i.wybrana).length}) do kosztorysu</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
