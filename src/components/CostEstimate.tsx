import React, { useState } from "react";
import { ServiceItem, MaterialItem, CostEstimateInfo } from "../types";
import { generatePlumbingPDF } from "../utils/pdfGenerator";
import { FileText, Plus, Trash2, Milestone, Download, Calculator, UserCheck, Briefcase, Percent, Save, Users, FileJson } from "lucide-react";
import { INITIAL_SERVICES } from "../constants";

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
  // New Labor item form state
  const [newServiceName, setNewServiceName] = useState("");
  const [newServicePrice, setNewServicePrice] = useState(150.00);
  const [newServiceQty, setNewServiceQty] = useState(2);
  const [newServiceUnit, setNewServiceUnit] = useState("pkt");
  const [newServiceVat, setNewServiceVat] = useState(8);

  const [vatAlertMessage, setVatAlertMessage] = useState<string | null>(null);
  const [clientAlertMessage, setClientAlertMessage] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState(false);

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
    setNewServiceName("");
    setNewServiceQty(1);
    setNewServicePrice(150);
  };

  const addServicePreset = (preset: ServiceItem) => {
    const existing = services.find(s => s.nazwa.toLowerCase() === preset.nazwa.toLowerCase());
    if (existing) {
      setServices(prev => prev.map(s => s.id === existing.id ? { ...s, ilosc: s.ilosc + 1 } : s));
    } else {
      const newItem: ServiceItem = {
        ...preset,
        id: "srv-preset-" + Date.now()
      };
      setServices(prev => [...prev, newItem]);
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
    setServices(prev => prev.filter(s => s.id !== id));
  };

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
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (err) {
      alert("Wystąpił błąd podczas generowania pliku JSON.");
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

        {/* List of active services */}
        {services.length === 0 ? (
          <div className="text-center py-6 text-slate-400 italic text-xs">
            Brak prac montażowych w cenniku. Wybierz gotowe usługi z listy na dole lub dodaj własną.
          </div>
        ) : (
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
            {services.map(s => {
              const lineNet = s.cenaNetto * s.ilosc;
              const lineGross = lineNet * (1 + s.vat / 100);

              return (
                <div key={s.id} className="border border-slate-100 rounded-xl p-3 bg-slate-50 relative">
                  <button
                    onClick={() => deleteService(s.id)}
                    className="absolute top-2 right-2 p-1 text-slate-400 hover:text-red-500 rounded-lg cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>

                  <p className="font-bold text-xs text-slate-800 pr-8">{s.nazwa}</p>

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

                  <div className="text-right text-[11px] text-slate-500 mt-1">
                    Wartość brutto: <span className="font-bold text-slate-800">{lineGross.toFixed(2)} zł</span> (z {s.vat}% VAT)
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
              onChange={(e) => setNewServiceName(e.target.value)}
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
            <div className="flex items-center space-x-2">
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
        <h4 className="font-bold text-slate-900 text-sm mb-3">Taryfikator typowych prac instalacyjnych</h4>
        <div className="grid grid-cols-1 gap-2">
          {INITIAL_SERVICES.map(srv => (
            <div key={srv.id} className="flex justify-between items-center text-xs p-2.5 border border-slate-100 hover:border-slate-200 rounded-xl hover:bg-slate-50/50 transition-all">
              <div className="text-left">
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
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">Adres inwestycji / lokalizacji budowy</label>
              <input
                type="text"
                placeholder="np. ul. Lipowa 12, 00-001 Warszawa"
                value={estimateInfo.klientAdres}
                onChange={(e) => updateInfoField("klientAdres", e.target.value)}
                className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
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
        </div>
      </div>
    </div>
  );
}
