import React, { useState, useRef } from "react";
import { MaterialItem, ServiceItem, CostEstimateInfo } from "../types";
import { 
  FileJson, 
  Download, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle,
  RefreshCw,
  Copy,
  Check
} from "lucide-react";

interface DataBackupProps {
  materials: MaterialItem[];
  services: ServiceItem[];
  estimateInfo: CostEstimateInfo;
  onImportData: (
    data: {
      materials: MaterialItem[];
      services: ServiceItem[];
      estimateInfo?: CostEstimateInfo;
    },
    merge: boolean
  ) => void;
}

export default function DataBackup({
  materials,
  services,
  estimateInfo,
  onImportData,
}: DataBackupProps) {
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper: Export JSON script trigger
  const handleExport = () => {
    try {
      const exportPayload = {
        version: "2.1",
        appName: "Asystent Hydraulika",
        exportedAt: new Date().toISOString(),
        tytulProjektu: estimateInfo.tytulProjektu || "Kosztorys_hydrauliczny",
        estimateInfo: estimateInfo,
        materials: materials,
        services: services,
      };

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
      const downloadAnchor = document.createElement("a");
      
      const safeTitle = (estimateInfo.tytulProjektu || "kosztorys")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "_")
        .substring(0, 30);
      
      const filename = `AsystentHydraulika_${estimateInfo.numerKosztorysu.replace(/\//g, "-")}_${safeTitle}.json`;
      
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", filename);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      setSuccessMsg("Pomyślnie wyeksportowano plik kopii zapasowej!");
      setErrorMsg(null);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg("Nie udało się przygotować pliku eksportu.");
    }
  };

  // Helper: Copy stringified schema directly to clipboard for quick copying or WhatsApp/E-mail pacing
  const handleCopyToClipboard = () => {
    try {
      const exportPayload = {
        version: "2.1",
        appName: "Asystent Hydraulika",
        exportedAt: new Date().toISOString(),
        estimateInfo: estimateInfo,
        materials: materials,
        services: services,
      };
      
      navigator.clipboard.writeText(JSON.stringify(exportPayload, null, 2));
      setCopied(true);
      setSuccessMsg("Skopiowano kod kosztorysu do schowka!");
      setErrorMsg(null);
      setTimeout(() => {
        setCopied(false);
        setSuccessMsg(null);
      }, 3000);
    } catch (err) {
      setErrorMsg("Przeglądarka zablokowała dostęp do schowka.");
    }
  };

  // Helper: File reader & verification validator
  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const jsonContent = event.target?.result as string;
        const parsed = JSON.parse(jsonContent);

        // Validation - ensure it contains either materials or services
        if (!parsed || (!Array.isArray(parsed.materials) && !Array.isArray(parsed.services))) {
          throw new Error("Plik nie zawiera poprawnej struktury kosztorysu.");
        }

        // Ask or notify user in nice UI
        const confirmMerge = window.confirm(
          `Wykryto prawidłową kopię zapasową!\n\nProjekt: "${parsed.estimateInfo?.tytulProjektu || parsed.tytulProjektu || "Bez nazwy"}"\n\nCzy chcesz DODAĆ (SCALIĆ) te dane do obecnego kosztorysu? \nKliknij 'OK' aby tylko dopisać nowe materiały i usługi.\nKliknij 'Anuluj' aby całkowicie zastąpić całe obecne dane.`
        );

        onImportData({
          materials: parsed.materials || [],
          services: parsed.services || [],
          estimateInfo: parsed.estimateInfo || undefined
        }, confirmMerge);

        setSuccessMsg(
          confirmMerge 
            ? "Materiały i usługi zostały pomyślnie dopisane do Twojej bazy!"
            : "Projekt został całkowicie nadpisany danymi z pliku kopii zapasowej!"
        );
        setErrorMsg(null);
        setTimeout(() => setSuccessMsg(null), 5000);
      } catch (err: any) {
        setErrorMsg("Błąd odczytu pliku: Upewnij się, że przesyłasz poprawny plik JSON z Asystenta Hydraulika.");
        setSuccessMsg(null);
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = ""; // clear input
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs space-y-4">
      {/* Title */}
      <div className="flex items-center space-x-2 text-indigo-600 border-b border-slate-100 pb-3">
        <FileJson className="h-5 w-5" />
        <h3 className="font-bold text-slate-900 text-sm">Kopia zapasowa i Wymiana danych</h3>
      </div>

      <p className="text-xs text-slate-500 leading-relaxed">
        Wyeksportuj całą bazę obecnej wyceny (materiały, stawki robocizny, dane klienta) do jednego pliku <strong className="text-slate-700">JSON</strong>. Możesz go zapisać na telefonie, wysłać na e-mail i wczytać na innym komputerze lub u klienta.
      </p>

      {/* Alert states */}
      {successMsg && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-start space-x-1.5 text-xs text-green-800 animate-fadeIn">
          <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
          <span className="font-medium">{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start space-x-1.5 text-xs text-red-800 animate-fadeIn">
          <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
          <span className="font-medium">{errorMsg}</span>
        </div>
      )}

      {/* Action Buttons list */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        {/* Export Button */}
        <button
          onClick={handleExport}
          className="flex items-center justify-center space-x-1.5 py-2.5 px-3 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
          title="Zapisz dane jako plik JSON na urządzeniu"
        >
          <Download className="h-4 w-4" />
          <span>Zapisz JSON</span>
        </button>

        {/* Copy raw code button (handy for WhatsApp sending) */}
        <button
          onClick={handleCopyToClipboard}
          className="flex items-center justify-center space-x-1.5 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 text-xs font-bold rounded-xl transition-all cursor-pointer"
          title="Skopiuj całą treść kosztorysu do schowka"
        >
          {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4 text-slate-600" />}
          <span>Kopiuj kod</span>
        </button>

        {/* Import Input File hidden & custom button */}
        <div className="col-span-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileImport}
            accept=".json,application/json"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center space-x-2 py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl text-xs transition-all cursor-pointer"
            title="Prześlij i wgraj plik kosztorysu JSON"
          >
            <Upload className="h-4 w-4" />
            <span>Wczytaj plik (Import JSON)</span>
          </button>
        </div>
      </div>

      <div className="text-[10px] text-slate-400 bg-slate-50/50 p-2.5 rounded-xl flex items-start gap-1 leading-normal">
        <HelpCircle className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
        <span>
          <strong>Wskazówka:</strong> Podczas wczytywania możesz wybrać czy chcesz połączyć materiały z bieżącym arkuszem (Scenariusz szablonu), czy całkowicie go nadpisać.
        </span>
      </div>
    </div>
  );
}
