import React, { useState } from "react";
import { ServiceItem, MaterialItem, CostEstimateInfo } from "../types";
import { generatePlumbingPDF } from "../utils/pdfGenerator";
import { FileText, Plus, Trash2, Milestone, Download, Calculator, UserCheck, Briefcase, Percent, Save, Users, FileJson, Search, X, Share2, Copy, MessageSquare, Check, ExternalLink, Phone, Mail, Sparkles } from "lucide-react";
import { INITIAL_SERVICES } from "../constants";
import { useToast } from "../context/ToastContext";
import { suggestVatRate, getVatReason } from "../utils/vatSuggester";

interface CostEstimateProps {
  materials: MaterialItem[];
  setMaterials: React.Dispatch<React.SetStateAction<MaterialItem[]>>;
  services: ServiceItem[];
  setServices: React.Dispatch<React.SetStateAction<ServiceItem[]>>;
  estimateInfo: CostEstimateInfo;
  setEstimateInfo: React.Dispatch<React.SetStateAction<CostEstimateInfo>>;
}

export default function CostEstimate({
  materials,
  setMaterials,
  services,
  setServices,
  estimateInfo,
  setEstimateInfo,
}: CostEstimateProps) {
  const { showToast } = useToast();

  // New Labor item form state
  const [newServiceName, setNewServiceName] = useState("");
  const [newServicePrice, setNewServicePrice] = useState(150.00);
  const [newServiceQty, setNewServiceQty] = useState(2);
  const [newServiceUnit, setNewServiceUnit] = useState("pkt");
  const [newServiceVat, setNewServiceVat] = useState(8);

  const [vatAlertMessage, setVatAlertMessage] = useState<string | null>(null);
  const [clientAlertMessage, setClientAlertMessage] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  // Search states for active and preset labor items
  const [addedServicesSearchTerm, setAddedServicesSearchTerm] = useState("");
  const [presetsSearchTerm, setPresetsSearchTerm] = useState("");

  interface SavedClient {
    id: string;
    klientNazwa: string;
    klientAdres: string;
    klientTelefon: string;
  }

  const [savedClients, setSavedClients] = useState<SavedClient[]>(() => {
    try {
      const stored = localStorage.getItem("asystent_hydraulika_klienci");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const handleSaveCurrentClient = () => {
    if (!estimateInfo.klientNazwa.trim()) {
      alert("Najpierw uzupełnij imię i nazwisko lub nazwę klienta!");
      return;
    }

    const newProfile: SavedClient = {
      id: "client-" + Date.now(),
      klientNazwa: estimateInfo.klientNazwa,
      klientAdres: estimateInfo.klientAdres,
      klientTelefon: estimateInfo.klientTelefon,
    };

    setSavedClients(prev => {
      const filtered = prev.filter(c => c.klientNazwa.toLowerCase() !== newProfile.klientNazwa.toLowerCase());
      const updated = [newProfile, ...filtered];
      localStorage.setItem("asystent_hydraulika_klienci", JSON.stringify(updated));
      return updated;
    });

    setClientAlertMessage(`Pomyślnie zapisano profil: "${newProfile.klientNazwa}"`);
    showToast(`Zapisano profil klienta: ${newProfile.klientNazwa}`, "success");
    setTimeout(() => {
      setClientAlertMessage(null);
    }, 4000);
  };

  const handleSelectClient = (client: SavedClient) => {
    setEstimateInfo(prev => ({
      ...prev,
      klientNazwa: client.klientNazwa,
      klientAdres: client.klientAdres,
      klientTelefon: client.klientTelefon
    }));
    
    setClientAlertMessage(`Wczytano dane klienta: "${client.klientNazwa}"`);
    showToast(`Wczytano dane klienta: ${client.klientNazwa}`, "info");
    setTimeout(() => {
      setClientAlertMessage(null);
    }, 3000);
  };

  const handleDeleteSavedClient = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Czy na pewno chcesz trwale usunąć ten profil klienta?")) return;
    setSavedClients(prev => {
      const updated = prev.filter(c => c.id !== id);
      localStorage.setItem("asystent_hydraulika_klienci", JSON.stringify(updated));
      return updated;
    });
    showToast("Usunięto profil klienta", "warning");
  };

  const applyGlobalVat = (rate: number) => {
    let matsUpdated = 0;
    let srvsUpdated = 0;

    setMaterials(prev => {
      const updated = prev.map(m => {
        if (m.vat !== rate) {
          matsUpdated++;
          return { ...m, vat: rate };
        }
        return m;
      });
      return updated;
    });

    setServices(prev => {
      const updated = prev.map(s => {
        if (s.vat !== rate) {
          srvsUpdated++;
          return { ...s, vat: rate };
        }
        return s;
      });
      return updated;
    });

    setVatAlertMessage(`Zmieniono VAT na ${rate}% dla instalacji (${matsUpdated} mat, ${srvsUpdated} usług)`);
    showToast(`Stawka VAT zmieniona na ${rate}% dla całego kosztorysu!`, "success");
    setTimeout(() => {
      setVatAlertMessage(null);
    }, 4500);
  };

  const handleAddService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName.trim()) return;

    const newItem: ServiceItem = {
      id: "srv-" + Date.now(),
      nazwa: newServiceName,
      ilosc: newServiceQty,
      jednostka: newServiceUnit,
      cenaNetto: newServicePrice,
      vat: newServiceVat,
    };

    setServices(prev => [...prev, newItem]);
    showToast(`Dodano robociznę: ${newServiceName}!`, "success");
    setNewServiceName("");
    setNewServiceQty(1);
    setNewServicePrice(150);
  };

  const addServicePreset = (preset: ServiceItem) => {
    const existing = services.find(s => s.nazwa.toLowerCase() === preset.nazwa.toLowerCase());
    if (existing) {
      setServices(prev => prev.map(s => s.id === existing.id ? { ...s, ilosc: s.ilosc + 1 } : s));
      showToast(`Zwiększono roboczogodziny/miarę dla: ${preset.nazwa}`, "info");
    } else {
      const newItem: ServiceItem = {
        ...preset,
        id: "srv-preset-" + Date.now()
      };
      setServices(prev => [...prev, newItem]);
      showToast(`Dodano usługę taryfową: ${preset.nazwa}!`, "success");
    }
  };

  const updateServiceQty = (id: string, qty: number) => {
    if (qty < 1) return;
    setServices(prev => prev.map(s => s.id === id ? { ...s, ilosc: qty } : s));
  };

  const updateServicePrice = (id: string, price: number) => {
    setServices(prev => prev.map(s => s.id === id ? { ...s, cenaNetto: Math.max(0, parseFloat(price.toFixed(2))) } : s));
  };

  const deleteService = (id: string) => {
    const srv = services.find(s => s.id === id);
    setServices(prev => prev.filter(s => s.id !== id));
    if (srv) {
      showToast(`Usunięto pozycję prac: ${srv.nazwa}`, "warning");
    }
  };

  const duplicateService = (id: string) => {
    const srv = services.find(s => s.id === id);
    if (!srv) return;
    const duplicated: ServiceItem = {
      ...srv,
      id: "srv-dup-" + Date.now() + "-" + Math.random().toString(36).substring(2, 5),
      nazwa: `${srv.nazwa} (Kopia)`
    };
    setServices(prev => [...prev, duplicated]);
    showToast(`Zduplikowano usługę: ${srv.nazwa}`, "success");
  };

  const updateServiceVat = (id: string, vat: number) => {
    setServices(prev => prev.map(s => s.id === id ? { ...s, vat } : s));
  };

  const handleSmartVatForAddedService = (srv: ServiceItem) => {
    const suggested = suggestVatRate(srv.nazwa, true);
    const reason = getVatReason(srv.nazwa, true);
    updateServiceVat(srv.id, suggested);
    showToast(`Intelektualny słownik: zastosowano stawkę ${suggested}% VAT dla "${srv.nazwa}". Powód: ${reason}`, "info");
  };

  const filteredServices = services.filter(s =>
    s.nazwa.toLowerCase().includes(addedServicesSearchTerm.toLowerCase())
  );

  const filteredPresets = INITIAL_SERVICES.filter(preset =>
    preset.nazwa.toLowerCase().includes(presetsSearchTerm.toLowerCase())
  );

  // Financial Sum calculations
  let matTotalNet = 0;
  let matTotalGross = 0;
  materials.forEach(m => {
    const priceWithMarkup = m.cenaBazowaNetto * (1 + m.marzaProcent / 100);
    const lineNet = priceWithMarkup * m.ilosc;
    const lineGross = lineNet * (1 + m.vat / 100);
    matTotalNet += lineNet;
    matTotalGross += lineGross;
  });

  let srvTotalNet = 0;
  let srvTotalGross = 0;
  services.forEach(s => {
    const lineNet = s.cenaNetto * s.ilosc;
    const lineGross = lineNet * (1 + s.vat / 100);
    srvTotalNet += lineNet;
    srvTotalGross += lineGross;
  });

  const grandTotalNet = matTotalNet + srvTotalNet;
  const grandTotalGross = matTotalGross + srvTotalGross;
  const grandTotalVat = grandTotalGross - grandTotalNet;

  const handleGeneratePDF = () => {
    showToast("Generowanie profesjonalnego dokumentu PDF...", "info");
    generatePlumbingPDF(estimateInfo, materials, services, 0);
  };

  const handleExportJSON = () => {
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
      
      const filename = `Kosztorys_${estimateInfo.numerKosztorysu.replace(/\//g, "-")}_${safeTitle}.json`;
      
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", filename);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      setExportSuccess(true);
      showToast("Pomyślnie wyeksportowano kosztorys do pliku JSON!", "success");
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (err) {
      showToast("Błąd podczas generowania pliku JSON.", "error");
    }
  };

  const generateTextMessage = (): string => {
    const formatCurrency = (val: number) => val.toFixed(2) + " zł";
    let msg = `⚙️ KOSZTORYS INSTALACJI HYDRAULICZNEJ\n`;
    msg += `----------------------------------------\n`;
    msg += `Nr kosztorysu: ${estimateInfo.numerKosztorysu || "-"}\n`;
    if (estimateInfo.tytulProjektu) {
      msg += `Inwestycja: ${estimateInfo.tytulProjektu}\n`;
    }
    msg += `Data wystawienia: ${estimateInfo.dataWystawienia}\n`;
    msg += `Ważna do: ${estimateInfo.dataWaznosci}\n\n`;

    msg += `👤 INWESTOR:\n`;
    msg += `Nazwa/Imię: ${estimateInfo.klientNazwa || "Brak danych"}\n`;
    if (estimateInfo.klientTelefon) {
      msg += `Telefon: ${estimateInfo.klientTelefon}\n`;
    }
    if (estimateInfo.klientAdres) {
      msg += `Lokalizacja: ${estimateInfo.klientAdres}\n`;
    }
    msg += `\n`;

    msg += `👨‍🔧 WYKONAWCA:\n`;
    const firmaOrNazwa = estimateInfo.hydraulikFirma || estimateInfo.hydraulikNazwa || "Instalator hydrauliczny";
    msg += `${firmaOrNazwa}\n`;
    if (estimateInfo.hydraulikNip) msg += `NIP: ${estimateInfo.hydraulikNip}\n`;
    if (estimateInfo.hydraulikTelefon) msg += `Tel: ${estimateInfo.hydraulikTelefon}\n`;
    if (estimateInfo.hydraulikEmail) msg += `E-mail: ${estimateInfo.hydraulikEmail}\n`;
    msg += `\n`;

    if (materials.length > 0) {
      msg += `📦 MATERIAŁY (${materials.length} poz.):\n`;
      materials.slice(0, 3).forEach(m => {
        const itemPriceNet = m.cenaBazowaNetto * (1 + m.marzaProcent / 100);
        const itemPriceGross = itemPriceNet * (1 + m.vat / 100);
        msg += `- ${m.nazwa} (${m.ilosc} ${m.jednostka}) - ${formatCurrency(itemPriceGross * m.ilosc)} brutto\n`;
      });
      if (materials.length > 3) {
        msg += `- ... i ${materials.length - 3} innych pozycji materiałowych\n`;
      }
      msg += `Suma materiałów: ${formatCurrency(matTotalGross)} (brutto)\n\n`;
    }

    if (services.length > 0) {
      msg += `🔧 PRACE I USŁUGI (${services.length} poz.):\n`;
      services.slice(0, 3).forEach(s => {
        msg += `- ${s.nazwa} (${s.ilosc} ${s.jednostka}) - ${formatCurrency(s.cenaNetto * s.ilosc * (1 + s.vat/100))} brutto\n`;
      });
      if (services.length > 3) {
        msg += `- ... i ${services.length - 3} innych pozycji robocizny\n`;
      }
      msg += `Suma robocizny: ${formatCurrency(srvTotalGross)} (brutto)\n\n`;
    }

    msg += `📊 PODSUMOWANIE FINANSOWE:\n`;
    msg += `Suma Netto: ${formatCurrency(grandTotalNet)}\n`;
    msg += `Podatek VAT: ${formatCurrency(grandTotalVat)}\n`;
    msg += `⭐️ DO ZAPŁATY: ${formatCurrency(grandTotalGross)} (brutto)\n\n`;

    if (estimateInfo.notatki) {
      msg += `📝 Notatki / Warunki:\n${estimateInfo.notatki}\n\n`;
    }

    msg += `_Wygenerowano w aplikacji Asystent Hydraulika_`;
    return msg;
  };

  const handleSystemShare = async () => {
    const text = generateTextMessage();
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Kosztorys ${estimateInfo.numerKosztorysu}`,
          text: text,
        });
        showToast("Pomyślnie udostępniono kosztorys systemowo!", "success");
      } catch (err: any) {
        if (err.name !== "AbortError") {
          showToast("Systemowe udostępnianie nie powiodło się.", "warning");
        }
      }
    } else {
      showToast("Twoja przeglądarka nie obsługuje udostępniania systemowego. Skorzystaj z opcji kopiowania tekstu lub WhatsApp.", "info");
    }
  };

  const handleWhatsAppShare = () => {
    const text = generateTextMessage();
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    showToast("Otwieranie aplikacji WhatsApp...", "info");
  };

  const handleCopyText = async () => {
    const text = generateTextMessage();
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(true);
      showToast("Skopiowano tekst kosztorysu do schowka!", "success");
      setTimeout(() => setCopiedText(false), 3000);
    } catch (err) {
      showToast("Nie udało się skopiować tekstu do schowka.", "error");
    }
  };

  const updateInfoField = (field: keyof CostEstimateInfo, value: string) => {
    setEstimateInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="space-y-6">
      {/* 1. Services Configuration Card */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center space-x-2">
            <Milestone className="h-5 w-5 text-blue-600" />
            <h3 className="font-bold text-slate-900 text-base">Robocizna i Usługi</h3>
          </div>
          <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-1 rounded-full font-bold">
            {services.length} usług
          </span>
        </div>

        {/* Real-time search bar for added services */}
        {services.length > 0 && (
          <div className="relative mb-4">
            <input
              type="text"
              placeholder="Szukaj dodanych prac, robocizny..."
              value={addedServicesSearchTerm}
              onChange={(e) => setAddedServicesSearchTerm(e.target.value)}
              className="w-full text-xs pl-9 pr-16 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-slate-800"
            />
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            {addedServicesSearchTerm && (
              <button 
                onClick={() => setAddedServicesSearchTerm("")} 
                className="absolute right-3 top-2.5 px-2 py-0.5 bg-slate-200 hover:bg-slate-300 rounded text-[9px] text-slate-600 font-bold uppercase tracking-tight transition-colors cursor-pointer"
              >
                wyczyść
              </button>
            )}
          </div>
        )}

        {/* List of active services */}
        {services.length === 0 ? (
          <div className="text-center py-6 text-slate-400 italic text-xs">
            Brak prac montażowych w cenniku. Wybierz gotowe usługi z listy na dole lub dodaj własną.
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <p className="text-sm font-semibold">Brak wyników wyszukiwania</p>
            <p className="text-xs mt-1">Żadna z dodanych prac nie pasuje do "{addedServicesSearchTerm}".</p>
            <button
              onClick={() => setAddedServicesSearchTerm("")}
              className="mt-3 text-xs font-bold text-blue-600 hover:underline cursor-pointer"
            >
              Pokaż wszystkie usługi
            </button>
          </div>
        ) : (
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
            {filteredServices.map(s => {
              const lineNet = s.cenaNetto * s.ilosc;
              const lineGross = lineNet * (1 + s.vat / 100);

              return (
                <div key={s.id} className="border border-slate-100 rounded-xl p-3 bg-slate-50 relative">
                  <div className="absolute top-2 right-2 flex items-center space-x-1">
                    <button
                      onClick={() => duplicateService(s.id)}
                      className="p-1 text-slate-400 hover:text-blue-500 rounded-lg cursor-pointer"
                      title="Duplikuj pozycję"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteService(s.id)}
                      className="p-1 text-slate-400 hover:text-red-500 rounded-lg cursor-pointer"
                      title="Usuń pozycję"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <p className="font-bold text-xs text-slate-800 pr-16">{s.nazwa}</p>

                  <div className="grid grid-cols-2 gap-3 mt-2 text-xs">
                    <div className="flex items-center space-x-1">
                      <span className="text-slate-400">Ilość:</span>
                      <input
                        type="number"
                        min="1"
                        value={s.ilosc}
                        onChange={(e) => updateServiceQty(s.id, parseInt(e.target.value) || 0)}
                        className="w-10 p-1 bg-white border border-slate-200 rounded-md font-bold text-center text-xs text-slate-800"
                      />
                      <span className="text-slate-500">{s.jednostka}</span>
                    </div>

                    <div className="flex items-center space-x-1 justify-end">
                      <span className="text-slate-400">Stawka netto:</span>
                      <input
                        type="number"
                        step="10"
                        value={s.cenaNetto}
                        onChange={(e) => updateServicePrice(s.id, parseInt(e.target.value) || 0)}
                        className="w-16 p-1 bg-white border border-slate-200 rounded-md font-semibold text-right text-xs text-slate-800"
                      />
                      <span className="text-slate-500">zł</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[11px] text-slate-500 mt-2 border-t border-slate-100/60 pt-1.5">
                    <div className="flex items-center space-x-1">
                      <span>VAT:</span>
                      <select
                        value={s.vat}
                        onChange={(e) => updateServiceVat(s.id, parseInt(e.target.value))}
                        className="bg-transparent font-semibold text-slate-600 dark:text-slate-300 focus:outline-none text-[10px] border border-slate-200/50 rounded-sm px-1 py-0"
                      >
                        <option value="8">8%</option>
                        <option value="23">23%</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => handleSmartVatForAddedService(s)}
                        className="p-0.5 text-slate-400 hover:text-blue-500 rounded-lg cursor-pointer"
                        title="Inteligentne sugerowanie VAT dla tej usługi robocizny"
                      >
                        <Sparkles className="h-3 w-3" />
                      </button>
                    </div>
                    <div>
                      Wartość brutto: <span className="font-bold text-slate-800 dark:text-slate-200">{lineGross.toFixed(2)} zł</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Add New Custom service labor */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs">
        <h4 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-1 text-blue-600">
          <Plus className="h-4 w-4" /> Wpisz własną usługę robocizny
        </h4>
        
        <form onSubmit={handleAddService} className="space-y-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1">Opis prac / nazwa usługi</label>
            <input
              type="text"
              placeholder="np. Montaż stacji zmiękczania wody"
              value={newServiceName}
              onChange={(e) => {
                const val = e.target.value;
                setNewServiceName(val);
                if (val.trim()) {
                  setNewServiceVat(suggestVatRate(val, true));
                }
              }}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-slate-800"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">Cena netto (Za 1 jm)</label>
              <input
                type="number"
                step="10"
                value={newServicePrice}
                onChange={(e) => setNewServicePrice(parseFloat(e.target.value) || 0)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-slate-800 text-center"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">Ilość</label>
              <input
                type="number"
                value={newServiceQty}
                onChange={(e) => setNewServiceQty(parseFloat(e.target.value) || 0)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-slate-800 text-center"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">Jednostka (JM)</label>
              <select
                value={newServiceUnit}
                onChange={(e) => setNewServiceUnit(e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-slate-800 font-medium"
              >
                <option value="pkt">punkt</option>
                <option value="szt">szt.</option>
                <option value="m²">m²</option>
                <option value="kpl">komplet</option>
                <option value="godz">godzina</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2 items-center justify-between pt-1">
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <span className="text-[11px] font-bold text-slate-400">VAT dla usług:</span>
              <button
                type="button"
                onClick={() => setNewServiceVat(8)}
                className={`px-2 py-1 text-[10px] font-bold rounded-lg ${newServiceVat === 8 ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"}`}
                title="Stawka preferencyjna 8% na usługi budowlano-montażowe w budynkach mieszkalnych"
              >
                8% (Mieszkania)
              </button>
              <button
                type="button"
                onClick={() => setNewServiceVat(23)}
                className={`px-2 py-1 text-[10px] font-bold rounded-lg ${newServiceVat === 23 ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"}`}
                title="Standardowa stawka 23% dla firm i lokali komercyjnych"
              >
                23% (Komercja)
              </button>
              {newServiceName.trim() && (
                <button
                  type="button"
                  onClick={() => {
                    const suggested = suggestVatRate(newServiceName, true);
                    const reason = getVatReason(newServiceName, true);
                    setNewServiceVat(suggested);
                    showToast(`Słownik: Wykryto stawkę ${suggested}% VAT dla "${newServiceName}". ${reason}`, "info");
                  }}
                  className="px-2 py-0.5 text-[10px] font-bold rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400 flex items-center gap-1 cursor-pointer transition-all border border-blue-200/30"
                  title="Wymuś automatyczne rozpoznanie stawki VAT robocizny na podstawie opisu"
                >
                  <Sparkles className="h-3.5 w-3.5 text-blue-500" />
                  <span>Sugeruj VAT</span>
                </button>
              )}
            </div>

            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" /> Dodaj usługę
            </button>
          </div>
        </form>
      </div>

      {/* 3. Catalog labor presets selection */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs">
        <h4 className="font-bold text-slate-900 text-sm mb-1.5">Taryfikator typowych prac instalacyjnych</h4>
        <p className="text-xs text-slate-500 mb-3 block">Wyszukaj i dodaj typowe usługi hydrauliczne z bazy taryfowej.</p>
        
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="Wyszukaj usługę np. pętla, stelaż, grzejnik, kotłownia..."
            value={presetsSearchTerm}
            onChange={(e) => setPresetsSearchTerm(e.target.value)}
            className="w-full text-xs pl-9 pr-16 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-slate-800"
          />
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          {presetsSearchTerm && (
            <button 
              onClick={() => setPresetsSearchTerm("")} 
              className="absolute right-3 top-2.5 px-2 py-0.5 bg-slate-200 hover:bg-slate-300 rounded text-[9px] text-slate-600 font-bold uppercase tracking-tight transition-colors cursor-pointer"
            >
              wyczyść
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-2 max-h-[320px] overflow-y-auto pr-1">
          {filteredPresets.map(srv => (
            <div key={srv.id} className="flex justify-between items-center text-xs p-2.5 border border-slate-100 hover:border-slate-200 rounded-xl hover:bg-slate-50/50 transition-all">
              <div className="text-left pr-2">
                <p className="font-bold text-slate-800 leading-tight">{srv.nazwa}</p>
                <p className="text-[10px] text-slate-400 font-medium">Stawka sugerowana: {srv.cenaNetto} zł / {srv.jednostka} (+ {srv.vat}% VAT)</p>
              </div>
              <button
                onClick={() => addServicePreset(srv)}
                className="shrink-0 p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[10px] rounded-lg cursor-pointer flex items-center gap-1 transition-all"
              >
                <Plus className="h-3 w-3" />
                <span>Dodaj</span>
              </button>
            </div>
          ))}

          {filteredPresets.length === 0 && (
            <p className="text-center py-4 text-xs text-slate-400 italic">Brak pasujących pozycji w taryfikatorze.</p>
          )}
        </div>
      </div>

      {/* 4. Cost Estimate Info form (Inwestor / Hydraulik info) */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs space-y-4">
        {/* Project details */}
        <div>
          <h4 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-1.5 text-blue-600 border-b border-slate-100 pb-2">
            <Briefcase className="h-4 w-4" /> Dane Projektu i Kosztorysu
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">Numer kosztorysu</label>
              <input
                type="text"
                value={estimateInfo.numerKosztorysu}
                onChange={(e) => updateInfoField("numerKosztorysu", e.target.value)}
                className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">Tytuł inwestycji</label>
              <input
                type="text"
                value={estimateInfo.tytulProjektu}
                onChange={(e) => updateInfoField("tytulProjektu", e.target.value)}
                className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">Data wystawienia</label>
              <input
                type="date"
                value={estimateInfo.dataWystawienia}
                onChange={(e) => updateInfoField("dataWystawienia", e.target.value)}
                className="w-full text-sm font-semibold p-1.5 bg-slate-50 border border-slate-200 rounded-xl text-center"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">Ważność oferty do</label>
              <input
                type="date"
                value={estimateInfo.dataWaznosci}
                onChange={(e) => updateInfoField("dataWaznosci", e.target.value)}
                className="w-full text-sm font-semibold p-1.5 bg-slate-50 border border-slate-200 rounded-xl text-center"
              />
            </div>
          </div>
        </div>

        {/* Global VAT Changer Tool */}
        <div className="border-t border-slate-100 pt-4 mt-2">
          <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wide mb-1">
            Globalna zmiana stawki VAT
          </label>
          <p className="text-[10px] text-slate-400 mb-2 leading-relaxed">
            Przebuduj stawki podatku VAT (8% dla domów i mieszkań vs 23% dla firm/części komercyjnych) we wszystkich aktualnie dodanych towarach i pracach:
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => applyGlobalVat(8)}
              className="flex-1 py-2 px-2 bg-blue-50 hover:bg-blue-100 text-blue-700 active:scale-[0.98] text-[10px] font-extrabold rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer"
              title="Ustaw 8% VAT dla wszystkich dodanych usług i materiałów"
            >
              <Percent className="h-3 w-3 shrink-0" />
              <span>Grupowo 8% (Mieszkalne)</span>
            </button>
            <button
              type="button"
              onClick={() => applyGlobalVat(23)}
              className="flex-1 py-2 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 active:scale-[0.98] text-[10px] font-extrabold rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer"
              title="Ustaw 23% VAT dla wszystkich dodanych usług i materiałów"
            >
              <Percent className="h-3 w-3 shrink-0" />
              <span>Grupowo 23% (Komercyjne)</span>
            </button>
          </div>

          {vatAlertMessage && (
            <div className="mt-2 text-[10px] bg-emerald-50 text-emerald-800 font-bold p-2 rounded-xl text-center border border-emerald-100 animate-pulse">
              {vatAlertMessage}
            </div>
          )}
        </div>

        {/* Contractor Profile */}
        <div>
          <h4 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-1.5 text-blue-600 border-b border-slate-100 pb-2">
            <UserCheck className="h-4 w-4" /> Twoje Dane (Wykonawca)
          </h4>
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Nazwa firmy</label>
                <input
                  type="text"
                  placeholder="Nazwa Twego przedsiębiorstwa"
                  value={estimateInfo.hydraulikFirma}
                  onChange={(e) => updateInfoField("hydraulikFirma", e.target.value)}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">NIP firmy</label>
                <input
                  type="text"
                  placeholder="np. 9531234567"
                  value={estimateInfo.hydraulikNip}
                  onChange={(e) => updateInfoField("hydraulikNip", e.target.value)}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-1">
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Imię i nazwisko</label>
                <input
                  type="text"
                  value={estimateInfo.hydraulikNazwa}
                  onChange={(e) => updateInfoField("hydraulikNazwa", e.target.value)}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Telefon kontaktowy</label>
                <input
                  type="text"
                  value={estimateInfo.hydraulikTelefon}
                  onChange={(e) => updateInfoField("hydraulikTelefon", e.target.value)}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">E-mail</label>
                <input
                  type="text"
                  value={estimateInfo.hydraulikEmail}
                  onChange={(e) => updateInfoField("hydraulikEmail", e.target.value)}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Client details */}
        <div>
          <h4 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-1.5 text-blue-600 border-b border-slate-100 pb-2">
            <Milestone className="h-4 w-4" /> Dane Inwestora (Klienta)
          </h4>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Imię / Nazwisko / Nazwa klienta</label>
                <input
                  type="text"
                  placeholder="np. Kowalski Jan, Spółka ABC"
                  value={estimateInfo.klientNazwa}
                  onChange={(e) => updateInfoField("klientNazwa", e.target.value)}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Telefon klienta</label>
                <input
                  type="text"
                  placeholder="Telefon"
                  value={estimateInfo.klientTelefon}
                  onChange={(e) => updateInfoField("klientTelefon", e.target.value)}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Adres inwestycji / lokalizacji</label>
                <input
                  type="text"
                  placeholder="np. ul. Lipowa 12, Warszawa"
                  value={estimateInfo.klientAdres}
                  onChange={(e) => updateInfoField("klientAdres", e.target.value)}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">E-mail klienta</label>
                <input
                  type="email"
                  placeholder="np. jan@poczta.pl"
                  value={estimateInfo.klientEmail || ""}
                  onChange={(e) => updateInfoField("klientEmail", e.target.value)}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            {/* Quick Actions (Call / E-mail direct launch) */}
            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-2.5 rounded-xl space-y-2">
              <span className="block text-[9px] font-extrabold uppercase text-slate-400 tracking-wider">
                ⚡ Szybki kontakt z inwestorem:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={estimateInfo.klientTelefon ? `tel:${estimateInfo.klientTelefon.replace(/\s+/g, '')}` : "#"}
                  onClick={(e) => {
                    if (!estimateInfo.klientTelefon) {
                      e.preventDefault();
                      showToast("Wprowadź numer telefonu klienta!", "warning");
                    } else {
                      showToast(`Uruchamianie połączenia: ${estimateInfo.klientTelefon}...`, "info");
                    }
                  }}
                  className={`py-2 px-3 rounded-lg text-[10px] font-extrabold flex items-center justify-center gap-1.5 transition-all text-center select-none active:scale-[0.98] ${
                    estimateInfo.klientTelefon 
                      ? "bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-xs border border-emerald-500/30" 
                      : "bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-600 cursor-not-allowed border dark:border-slate-800"
                  }`}
                >
                  <Phone className="h-3.5 w-3.5" />
                  <span>Zadzwoń do klienta</span>
                </a>

                <a
                  href={estimateInfo.klientEmail ? `mailto:${estimateInfo.klientEmail}?subject=${encodeURIComponent(`Kosztorys ${estimateInfo.numerKosztorysu}`)}&body=${encodeURIComponent(`Dzień dobry,\n\nPrzesyłam w załączniku kosztorys nr ${estimateInfo.numerKosztorysu} dotyczący inwestycji: "${estimateInfo.tytulProjektu}".\n\nZ poważaniem,\n${estimateInfo.hydraulikNazwa}\n${estimateInfo.hydraulikFirma}`)}` : "#"}
                  onClick={(e) => {
                    if (!estimateInfo.klientEmail) {
                      e.preventDefault();
                      showToast("Wprowadź adres e-mail klienta!", "warning");
                    } else {
                      showToast(`Tworzenie wiadomości e-mail do: ${estimateInfo.klientEmail}...`, "info");
                    }
                  }}
                  className={`py-2 px-3 rounded-lg text-[10px] font-extrabold flex items-center justify-center gap-1.5 transition-all text-center select-none active:scale-[0.98] ${
                    estimateInfo.klientEmail 
                      ? "bg-blue-600 hover:bg-blue-500 text-white cursor-pointer shadow-xs border border-blue-500/30" 
                      : "bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-600 cursor-not-allowed border dark:border-slate-800"
                  }`}
                >
                  <Mail className="h-3.5 w-3.5" />
                  <span>Wyślij e-mail</span>
                </a>
              </div>
            </div>

            {/* Quick Action buttons */}
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={handleSaveCurrentClient}
                className="py-1.5 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-[10px] rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                title="Zapisz obecne dane klienta do pamięci telefonu/komputera"
              >
                <Save className="h-3 w-3" />
                <span>Zapisz dane jako szablon</span>
              </button>
            </div>

            {clientAlertMessage && (
              <div className="mt-1 text-[10px] bg-slate-100 text-indigo-800 font-bold p-1 px-2.5 rounded-lg border border-slate-200 animate-pulse">
                {clientAlertMessage}
              </div>
            )}

            {/* Render saved templates list if any */}
            {savedClients.length > 0 && (
              <div className="mt-3 bg-slate-50 border border-slate-100 p-2.5 rounded-xl space-y-1.5">
                <span className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  <Users className="h-3 w-3" /> Szybki wybór zapisanego klienta ({savedClients.length}):
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-[85px] overflow-y-auto pr-1 pt-0.5">
                  {savedClients.map(client => (
                    <div
                      key={client.id}
                      onClick={() => handleSelectClient(client)}
                      className="group flex items-center gap-1.5 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 px-2.5 py-1 rounded-lg text-[10px] text-slate-700 cursor-pointer transition-all"
                      title={`Kliknij aby załadować: ${client.klientNazwa}`}
                    >
                      <span className="font-bold truncate max-w-[80px]">{client.klientNazwa}</span>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteSavedClient(client.id, e)}
                        className="text-slate-300 hover:text-red-500 font-extrabold px-0.5 text-xs focus:outline-none"
                        title="Usuń ten profil"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Technical Notes / Comments for client */}
        <div>
          <h4 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-1.5 text-blue-600 border-b border-slate-100 pb-2">
            <FileText className="h-4 w-4" /> Notatki techniczne i uwagi dla klienta
          </h4>
          <p className="text-[10px] text-slate-400 mb-2 leading-relaxed">
            Dodaj dodatkowe warunki gwarancji, zakres dopuszczalnych zmian projektowych lub adnotacje techniczne (np. głębokość wykopów, próby ciśnieniowe). Zostaną nadrukowane w pliku PDF.
          </p>
          <textarea
            rows={3}
            placeholder="np. Cena obejmuje próbę ciśnieniową szczelności instalacji CO oraz próbę wodną kanalizacji sanitarnej. Gwarancja na wykonanie wynosi 5 lat od daty uruchomienia..."
            value={estimateInfo.notatki || ""}
            onChange={(e) => updateInfoField("notatki", e.target.value)}
            className="w-full text-xs p-3 bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl focus:outline-none leading-relaxed text-slate-700"
          />
        </div>
      </div>

      {/* 5. Cost Summary & PDF Download trigger banner */}
      <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl p-5 space-y-4">
        <h3 className="font-black text-lg tracking-tight text-white flex items-center gap-2">
          <Calculator className="h-5 w-5 text-yellow-400" /> Podsumowanie Finansowe
        </h3>

        <div className="grid grid-cols-2 gap-4 text-xs border-b border-slate-800 pb-4">
          <div>
            <p className="text-slate-400 font-medium">Łącznie materiały (brutto):</p>
            <p className="text-base font-extrabold text-slate-100">{matTotalGross.toFixed(2)} zł</p>
          </div>
          <div>
            <p className="text-slate-400 font-medium">Łącznie robocizna (brutto):</p>
            <p className="text-base font-extrabold text-slate-100">{srvTotalGross.toFixed(2)} zł</p>
          </div>
          <div>
            <p className="text-slate-400 font-medium font-medium">Suma netto kosztorysu:</p>
            <p className="text-sm font-extrabold text-slate-300">{grandTotalNet.toFixed(2)} zł</p>
          </div>
          <div>
            <p className="text-slate-400 font-medium">Wartość podatku VAT:</p>
            <p className="text-sm font-extrabold text-slate-300">{grandTotalVat.toFixed(2)} zł</p>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between text-center pt-2 space-y-3">
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide">DO ZAPŁATY PRZEZ INWESTORA</p>
            <p className="text-3xl font-black text-green-400 mt-1">{grandTotalGross.toFixed(2)} PLN</p>
          </div>

          {exportSuccess && (
            <p className="text-[11px] font-bold text-center text-emerald-400 animate-pulse">
              Pomyślnie wyeksportowano plik kopii zapasowej kosztorysu! (.json)
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
            <button
              onClick={handleGeneratePDF}
              className="py-3.5 bg-yellow-400 hover:bg-yellow-500 text-slate-950 font-black rounded-xl text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-lg hover:scale-[1.01] transition-all cursor-pointer"
            >
              <Download className="h-4.5 w-4.5 stroke-[2.5]" />
              <span>POBIERZ DRUK PDF</span>
            </button>

            <button
              onClick={handleExportJSON}
              className="py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-black rounded-xl text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-lg hover:scale-[1.01] border border-slate-700/60 transition-all cursor-pointer"
              title="Pobierz kompletny stan projektu w formacie JSON do ponownego wczytania"
            >
              <FileJson className="h-4.5 w-4.5" />
              <span>ZAPISZ PROJEKT (JSON)</span>
            </button>
          </div>

          {/* Share/Send via Messenger & WhatsApp */}
          <div className="w-full pt-1">
            <button
              onClick={() => setIsShareOpen(!isShareOpen)}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-md hover:scale-[1.005] transition-all cursor-pointer border border-emerald-500/30"
              title="Wygeneruj tekst podsumowania gotowy do przesłania na WhatsApp, Messenger lub skopiowania"
            >
              <Share2 className="h-4 w-4" />
              <span>{isShareOpen ? "UKRYJ OPCJE UDOSTĘPNIANIA" : "UDOSTĘPNIJ KOSZTORYS (TEXT / WHATSAPP / CO)"}</span>
            </button>

            {isShareOpen && (
              <div className="mt-3 bg-slate-800/80 border border-slate-700/60 rounded-xl p-4 text-left space-y-3.5 animate-fadeIn">
                <p className="text-[11px] text-slate-200 font-semibold leading-relaxed">
                  Poniżej znajduje się wygenerowane zestawienie kosztorysu. Możesz je bezpośrednio udostępnić lub skopiować do wysłania na dowolnym komunikatorze:
                </p>

                {/* Pre-formatted preview */}
                <div className="bg-slate-950 border border-slate-800 p-3 rounded-lg text-[10px] font-mono text-slate-350 max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed select-all">
                  {generateTextMessage()}
                </div>

                {/* Sharing actions */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                  <button
                    onClick={handleCopyText}
                    className="py-2.5 bg-slate-900 hover:bg-slate-850 text-slate-100 font-bold rounded-lg text-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer border border-slate-700/70"
                  >
                    {copiedText ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-slate-400" />}
                    <span>{copiedText ? "Skopiowano!" : "Skopiuj tekst"}</span>
                  </button>

                  <button
                    onClick={handleWhatsAppShare}
                    className="py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold rounded-lg text-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer border border-emerald-500/20"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>WhatsApp</span>
                  </button>

                  <button
                    onClick={handleSystemShare}
                    className="py-2.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 font-bold rounded-lg text-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer border border-blue-500/20"
                  >
                    <Share2 className="h-3.5 w-3.5" />
                    <span>Inne / System</span>
                  </button>
                </div>

                <p className="text-[9px] text-slate-400 text-center leading-snug">
                  Wskazówka: Wybierz <strong>Skopiuj tekst</strong>, a następnie wklej go bezpośrednio w oknie chatu <strong>Messenger / SMS / Viber / Mail</strong>.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
