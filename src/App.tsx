import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Droplet, 
  Home, 
  ShoppingCart, 
  Milestone, 
  Camera, 
  Wrench, 
  FileText, 
  TrendingUp, 
  Calculator, 
  HelpCircle,
  Clock,
  Sparkles,
  Phone
} from "lucide-react";
import { MaterialItem, ServiceItem, CostEstimateInfo } from "./types";
import { INITIAL_MATERIALS, INITIAL_SERVICES, PLUMBER_WISDOM } from "./constants";

// Modular components
import Calculators from "./components/Calculators";
import MaterialPricing from "./components/MaterialPricing";
import CostEstimate from "./components/CostEstimate";
import InvoiceScanner from "./components/InvoiceScanner";
import DataBackup from "./components/DataBackup";
import CostPieChart from "./components/CostPieChart";

export default function App() {
  // Shared state of items and estimate settings
  const [materials, setMaterials] = useState<MaterialItem[]>(INITIAL_MATERIALS);
  const [services, setServices] = useState<ServiceItem[]>(INITIAL_SERVICES);

  // Random plumbers proverb state
  const [randomProverb, setRandomProverb] = useState("");

  const rollProverb = () => {
    const idx = Math.floor(Math.random() * PLUMBER_WISDOM.length);
    setRandomProverb(PLUMBER_WISDOM[idx]);
  };

  useEffect(() => {
    rollProverb();
  }, []);

  const [estimateInfo, setEstimateInfo] = useState<CostEstimateInfo>(() => {
    const todayStr = new Date().toISOString().substring(0, 10);
    const validStr = new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString().substring(0, 10);
    const dateNum = todayStr.replace(/-/g, "").substring(2);
    
    return {
      numerKosztorysu: `K-${dateNum}/01`,
      dataWystawienia: todayStr,
      dataWaznosci: validStr,
      hydraulikFirma: "MISTRZ-FLUX Systemy Sanitarne",
      hydraulikNip: "6571239854",
      hydraulikNazwa: "Andrzej Wiśniewski",
      hydraulikTelefon: "501 890 123",
      hydraulikEmail: "biuro@wisniewski-hydraulika.pl",
      klientNazwa: "Jan Kowalski",
      klientAdres: "ul. Kwiatowa 8, 05-800 Pruszków",
      klientTelefon: "602 456 789",
      tytulProjektu: "Ogrzewanie podłogowe i kotłownia gazowa - Pruszków",
      notatki: ""
    };
  });

  // Active tab state: dashboard, materials, services, scanner, calculators, report
  const [activeTab, setActiveTab] = useState<"dashboard" | "materials" | "services" | "scanner" | "calculators" | "report">("dashboard");

  // Sum valuations
  let matTotalGross = 0;
  materials.forEach(m => {
    const unitWithMarkup = m.cenaBazowaNetto * (1 + m.marzaProcent / 100);
    matTotalGross += unitWithMarkup * m.ilosc * (1 + m.vat / 100);
  });

  let srvTotalGross = 0;
  services.forEach(s => {
    srvTotalGross += s.cenaNetto * s.ilosc * (1 + s.vat / 100);
  });

  const aggregateGrandTotal = matTotalGross + srvTotalGross;

  // Import items from scanner appending them to material listing
  const handleImportMaterials = (itemsToAdd: MaterialItem[]) => {
    setMaterials(prev => {
      // Avoid duplicate names by incrementing if found
      let updated = [...prev];
      itemsToAdd.forEach(item => {
        const existingIdx = updated.findIndex(m => m.nazwa.toLowerCase() === item.nazwa.toLowerCase());
        if (existingIdx !== -1) {
          updated[existingIdx].ilosc += item.ilosc;
        } else {
          updated.push(item);
        }
      });
      return updated;
    });
    // Redirect to materials overview tab so plumber reviews imported pricing
    setActiveTab("materials");
  };

  // Import unified backup data (JSON import) replacing or merging items
  const handleImportData = (
    data: {
      materials: MaterialItem[];
      services: ServiceItem[];
      estimateInfo?: CostEstimateInfo;
    },
    merge: boolean
  ) => {
    if (merge) {
      if (data.materials && Array.isArray(data.materials)) {
        setMaterials(prev => {
          const merged = [...prev];
          data.materials.forEach(newMat => {
            const idx = merged.findIndex(m => m.nazwa.toLowerCase() === newMat.nazwa.toLowerCase());
            if (idx !== -1) {
              merged[idx].ilosc += newMat.ilosc;
            } else {
              const updatedMat = { ...newMat };
              if (merged.some(m => m.id === updatedMat.id)) {
                updatedMat.id = `import-${updatedMat.id}-${Date.now()}`;
              }
              merged.push(updatedMat);
            }
          });
          return merged;
        });
      }

      if (data.services && Array.isArray(data.services)) {
        setServices(prev => {
          const merged = [...prev];
          data.services.forEach(newSrv => {
            const idx = merged.findIndex(s => s.nazwa.toLowerCase() === newSrv.nazwa.toLowerCase());
            if (idx !== -1) {
              merged[idx].ilosc += newSrv.ilosc;
            } else {
              const updatedSrv = { ...newSrv };
              if (merged.some(s => s.id === updatedSrv.id)) {
                updatedSrv.id = `import-${updatedSrv.id}-${Date.now()}`;
              }
              merged.push(updatedSrv);
            }
          });
          return merged;
        });
      }

      if (data.estimateInfo) {
        setEstimateInfo(prev => ({
          ...prev,
          tytulProjektu: prev.tytulProjektu === "Ogrzewanie podłogowe i kotłownia gazowa - Pruszków" 
            ? data.estimateInfo!.tytulProjektu 
            : `${prev.tytulProjektu} | ${data.estimateInfo!.tytulProjektu}`
        }));
      }
    } else {
      // Complete reset/overwrite
      if (data.materials && Array.isArray(data.materials)) {
        setMaterials(data.materials);
      }
      if (data.services && Array.isArray(data.services)) {
        setServices(data.services);
      }
      if (data.estimateInfo) {
        setEstimateInfo(data.estimateInfo);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center py-0 sm:py-6 md:py-10">
      {/* Mobile viewport frame container */}
      <div className="w-full max-w-md bg-slate-50 min-h-screen sm:min-h-[850px] sm:max-h-[900px] sm:rounded-[40px] sm:shadow-2xl border-0 sm:border-8 border-slate-900 overflow-hidden flex flex-col relative text-slate-900">
        
        {/* Mobile Status Bar simulation */}
        <div className="hidden sm:flex bg-slate-950 text-slate-400 py-1 px-6 justify-between items-center text-[10px] font-bold">
          <div className="flex items-center space-x-1.5">
            <Clock className="h-3 w-3 text-slate-400" />
            <span>Asystent hydraulika v2.1</span>
          </div>
          <div className="w-20 h-4 bg-slate-900 rounded-full mx-auto hidden md:block"></div> {/* Speaker notch */}
          <div className="flex items-center space-x-1.5">
            <Droplet className="h-3 w-3 text-blue-500 fill-blue-500" />
            <span>Bateria: 100%</span>
          </div>
        </div>

        {/* Header App Bar */}
        <header className="bg-slate-950 text-white p-4 shrink-0 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-blue-600 rounded-lg shadow-md shrink-0">
              <Droplet className="h-5 w-5 text-white fill-blue-100 animate-bounce" />
            </div>
            <div>
              <h1 className="text-base font-black tracking-tight leading-none text-white">ASYSTENT HYDRAULIKA</h1>
              <p className="text-[10px] text-slate-400 font-semibold leading-none mt-1">Mobilny Organizer & Kosztorykant</p>
            </div>
          </div>

          <div className="flex items-center space-x-1 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[10px] font-bold text-slate-300">ONLINE</span>
          </div>
        </header>

        {/* Scrollable Main Area */}
        <main className="flex-1 overflow-y-auto p-4 pb-24">
          
          {/* Active stats badge directly at top */}
          <div className="mb-4 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-4 text-white shadow-md relative overflow-hidden">
            <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-2 translate-y-2 pointer-events-none">
              <Wrench className="h-28 w-28 text-white rotate-12" />
            </div>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] uppercase font-bold text-blue-100 tracking-wider">Aktywny Kosztorys</p>
                <h3 className="text-2xl font-black mt-0.5 tracking-tight">{aggregateGrandTotal.toFixed(2)} zł</h3>
                <p className="text-[10px] text-blue-200 mt-1 font-medium">{materials.length} materiałów | {services.length} usług</p>
              </div>
              <span className="bg-slate-950/20 text-white border border-white/20 text-[10px] font-bold px-2 py-1 rounded-lg">
                NIP: {estimateInfo.hydraulikNip}
              </span>
            </div>
          </div>

          {/* Render Tab Contents with Smooth Animated Transitions */}
          <AnimatePresence mode="wait">
            {activeTab === "dashboard" && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.16, ease: "easeOut" }}
                className="space-y-4"
              >
                {/* Plumbers proverbs carousel */}
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 relative">
                  <div className="absolute top-2 right-2 bg-amber-200/50 hover:bg-amber-200 text-amber-800 px-2 py-0.5 rounded-lg text-[9px] font-black cursor-pointer uppercase tracking-tight transition-colors" onClick={rollProverb}>
                    Losuj radę
                  </div>
                  <h4 className="text-xs font-black text-amber-800 flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5" /> MĄDROŚĆ HYDRAULICZNA MISTRZA:
                  </h4>
                  <p className="text-xs text-amber-900 font-medium italic mt-2 leading-relaxed pr-10">
                    {randomProverb}
                  </p>
                </div>

                {/* Grid of tools */}
                <h3 className="font-bold text-sm text-slate-500 uppercase tracking-wide px-1">Szybkie Skróty</h3>
                
                <div className="grid grid-cols-2 gap-3">
                  
                  {/* Scanner button */}
                  <button
                    onClick={() => setActiveTab("scanner")}
                    className="bg-white hover:bg-slate-50 border border-slate-100 rounded-2xl p-4 text-left shadow-xs transition-transform transform active:scale-95 flex flex-col justify-between h-28 cursor-pointer"
                  >
                    <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl w-10 h-10 flex items-center justify-center">
                      <Camera className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-xs text-slate-800">Skaner AI</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">Odczytuj faktury z hurtowni</p>
                    </div>
                  </button>

                  {/* Materials button */}
                  <button
                    onClick={() => setActiveTab("materials")}
                    className="bg-white hover:bg-slate-50 border border-slate-100 rounded-2xl p-4 text-left shadow-xs transition-transform transform active:scale-95 flex flex-col justify-between h-28 cursor-pointer"
                  >
                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl w-10 h-10 flex items-center justify-center">
                      <ShoppingCart className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-xs text-slate-800">Cennik pojęć</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">Skapuj towary z marżą</p>
                    </div>
                  </button>

                  {/* Services labor button */}
                  <button
                    onClick={() => setActiveTab("services")}
                    className="bg-white hover:bg-slate-50 border border-slate-100 rounded-2xl p-4 text-left shadow-xs transition-transform transform active:scale-95 flex flex-col justify-between h-28 cursor-pointer"
                  >
                    <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl w-10 h-10 flex items-center justify-center">
                      <Milestone className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-xs text-slate-800">Robocizna</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">Zarządzaj usługami</p>
                    </div>
                  </button>

                  {/* Sizing calc button */}
                  <button
                    onClick={() => setActiveTab("calculators")}
                    className="bg-white hover:bg-slate-50 border border-slate-100 rounded-2xl p-4 text-left shadow-xs transition-transform transform active:scale-95 flex flex-col justify-between h-28 cursor-pointer"
                  >
                    <div className="p-2.5 bg-violet-50 text-violet-600 rounded-xl w-10 h-10 flex items-center justify-center">
                      <Wrench className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-xs text-slate-800">Kalkulatory</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">Spadki, grzejniki i naczynia</p>
                    </div>
                  </button>

                </div>

                {/* Visualized cost breakdown chart using Recharts */}
                <CostPieChart materials={materials} services={services} />

                {/* Project summary card */}
                <div className="bg-white border border-slate-100 rounded-2xl p-4 space-y-3 shadow-xs">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Aktywne zlecenie:</h4>
                    <span className="text-[10px] text-slate-400 font-bold">{estimateInfo.numerKosztorysu}</span>
                  </div>
                  <p className="text-xs text-slate-900 font-extrabold pb-2 border-b border-slate-100">{estimateInfo.tytulProjektu}</p>
                  <div className="grid grid-cols-2 gap-2 text-[10px] pt-1">
                    <div>
                      <span className="text-slate-400 font-semibold block">Inwestor:</span>
                      <span className="font-bold text-slate-700">{estimateInfo.klientNazwa}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-semibold block">Wykonawca:</span>
                      <span className="font-bold text-slate-700">{estimateInfo.hydraulikFirma}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab("report")}
                    className="w-full mt-2 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1 cursor-pointer"
                  >
                    <FileText className="h-4 w-4" />
                    <span>Drukuj kosztorys i dane adresowe</span>
                  </button>
                </div>

                {/* Data Export / Import Tool */}
                <DataBackup 
                  materials={materials}
                  services={services}
                  estimateInfo={estimateInfo}
                  onImportData={handleImportData}
                />

                {/* Instructions banner */}
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-xs text-blue-800 leading-relaxed">
                  👉 <strong className="text-blue-950">Porada szybkiego startu:</strong> Kliknij przycisk <span className="font-bold text-blue-900">Skaner AI</span> powyżej i prześlij zdjęcie paragonu lub faktury lub stwórz koszty i dobierz grzejniki w dziale <span className="font-bold text-blue-900">Kalkulatory</span>. Wszystarzystkie wprowadzone dane zapiszą się do wspólnego formularza PDF.
                </div>
              </motion.div>
            )}

            {activeTab === "materials" && (
              <motion.div
                key="materials"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.16, ease: "easeOut" }}
              >
                <MaterialPricing 
                  materials={materials} 
                  setMaterials={setMaterials} 
                />
              </motion.div>
            )}

            {activeTab === "services" && (
              <motion.div
                key="services"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.16, ease: "easeOut" }}
              >
                <CostEstimate 
                  materials={materials}
                  setMaterials={setMaterials}
                  services={services}
                  setServices={setServices}
                  estimateInfo={estimateInfo}
                  setEstimateInfo={setEstimateInfo}
                />
              </motion.div>
            )}

            {activeTab === "scanner" && (
              <motion.div
                key="scanner"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.16, ease: "easeOut" }}
              >
                <InvoiceScanner 
                  onImportMaterials={handleImportMaterials} 
                />
              </motion.div>
            )}

            {activeTab === "calculators" && (
              <motion.div
                key="calculators"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.16, ease: "easeOut" }}
              >
                <Calculators />
              </motion.div>
            )}

            {activeTab === "report" && (
              <motion.div
                key="report"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.16, ease: "easeOut" }}
              >
                <CostEstimate 
                  materials={materials}
                  setMaterials={setMaterials}
                  services={services}
                  setServices={setServices}
                  estimateInfo={estimateInfo}
                  setEstimateInfo={setEstimateInfo}
                />
              </motion.div>
            )}
          </AnimatePresence>

        </main>

        {/* Global tab manager bottom navbar - ALWAYS ON TOP */}
        <nav className="absolute bottom-0 inset-x-0 bg-slate-950 border-t border-slate-800 py-2 px-1 text-white shrink-0 flex justify-around items-center z-50 shadow-[0_-8px_30px_rgba(2,6,23,0.6)]">
          <button 
            onClick={() => setActiveTab("dashboard")}
            className={`flex flex-col items-center space-y-1 text-[10px] w-14 cursor-pointer relative py-1 transition-colors ${activeTab === "dashboard" ? "text-blue-400 font-bold" : "text-slate-400 hover:text-slate-200"}`}
          >
            {activeTab === "dashboard" && (
              <motion.div 
                layoutId="activeTabPill" 
                className="absolute inset-x-0.5 inset-y-0.5 bg-blue-500/15 rounded-xl -z-10 border border-blue-500/20" 
                transition={{ type: "spring", stiffness: 380, damping: 28 }}
              />
            )}
            <Home className="h-5 w-5" />
            <span className="text-[9px] font-bold tracking-tight">Pulpit</span>
          </button>

          <button 
            onClick={() => setActiveTab("materials")}
            className={`flex flex-col items-center space-y-1 text-[10px] w-14 cursor-pointer relative py-1 transition-colors ${activeTab === "materials" ? "text-blue-400 font-bold" : "text-slate-400 hover:text-slate-200"}`}
          >
            {activeTab === "materials" && (
              <motion.div 
                layoutId="activeTabPill" 
                className="absolute inset-x-0.5 inset-y-0.5 bg-blue-500/15 rounded-xl -z-10 border border-blue-500/20" 
                transition={{ type: "spring", stiffness: 380, damping: 28 }}
              />
            )}
            <ShoppingCart className="h-5 w-5" />
            <span className="text-[9px] font-bold tracking-tight">Materiały</span>
          </button>

          <button 
            onClick={() => setActiveTab("services")}
            className={`flex flex-col items-center space-y-1 text-[10px] w-14 cursor-pointer relative py-1 transition-colors ${activeTab === "services" ? "text-blue-400 font-bold" : "text-slate-400 hover:text-slate-200"}`}
          >
            {activeTab === "services" && (
              <motion.div 
                layoutId="activeTabPill" 
                className="absolute inset-x-0.5 inset-y-0.5 bg-blue-500/15 rounded-xl -z-10 border border-blue-500/20" 
                transition={{ type: "spring", stiffness: 380, damping: 28 }}
              />
            )}
            <Milestone className="h-5 w-5" />
            <span className="text-[9px] font-bold tracking-tight">Usługi</span>
          </button>

          <button 
            onClick={() => setActiveTab("scanner")}
            className={`flex flex-col items-center space-y-1 text-[10px] w-14 cursor-pointer relative py-1 transition-colors ${activeTab === "scanner" ? "text-indigo-400 font-bold animate-pulse" : "text-slate-400 hover:text-slate-200"}`}
            title="Skaner Faktur AI"
          >
            {activeTab === "scanner" && (
              <motion.div 
                layoutId="activeTabPill" 
                className="absolute inset-x-0.5 inset-y-0.5 bg-indigo-500/15 rounded-xl -z-10 border border-indigo-500/20" 
                transition={{ type: "spring", stiffness: 380, damping: 28 }}
              />
            )}
            <Camera className="h-5 w-5" />
            <span className="text-[9px] font-bold tracking-tight">Skaner AI</span>
          </button>

          <button 
            onClick={() => setActiveTab("calculators")}
            className={`flex flex-col items-center space-y-1 text-[10px] w-14 cursor-pointer relative py-1 transition-colors ${activeTab === "calculators" ? "text-blue-400 font-bold" : "text-slate-400 hover:text-slate-200"}`}
          >
            {activeTab === "calculators" && (
              <motion.div 
                layoutId="activeTabPill" 
                className="absolute inset-x-0.5 inset-y-0.5 bg-blue-500/15 rounded-xl -z-10 border border-blue-500/20" 
                transition={{ type: "spring", stiffness: 380, damping: 28 }}
              />
            )}
            <Wrench className="h-5 w-5" />
            <span className="text-[9px] font-bold tracking-tight">Kalkulatory</span>
          </button>

          <button 
            onClick={() => setActiveTab("report")}
            className={`flex flex-col items-center space-y-1 text-[10px] w-14 cursor-pointer relative py-1 transition-colors ${activeTab === "report" ? "text-blue-400 font-bold" : "text-slate-400 hover:text-slate-200"}`}
          >
            {activeTab === "report" && (
              <motion.div 
                layoutId="activeTabPill" 
                className="absolute inset-x-0.5 inset-y-0.5 bg-blue-500/15 rounded-xl -z-10 border border-blue-500/20" 
                transition={{ type: "spring", stiffness: 380, damping: 28 }}
              />
            )}
            <FileText className="h-5 w-5" />
            <span className="text-[9px] font-bold tracking-tight">Raport</span>
          </button>
        </nav>

      </div>
    </div>
  );
}
