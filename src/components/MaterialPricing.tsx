import React, { useState } from "react";
import { MaterialItem } from "../types";
import { Plus, Trash2, ShoppingCart, Percent, TrendingUp, Search, X, Minus, Sparkles } from "lucide-react";
import { INITIAL_MATERIALS } from "../constants";

interface MaterialPricingProps {
  materials: MaterialItem[];
  setMaterials: React.Dispatch<React.SetStateAction<MaterialItem[]>>;
}

export default function MaterialPricing({ materials, setMaterials }: MaterialPricingProps) {
  // Local states for adding a custom item
  const [newMaterialName, setNewMaterialName] = useState("");
  const [newMaterialQty, setNewMaterialQty] = useState(1);
  const [newMaterialUnit, setNewMaterialUnit] = useState("szt");
  const [newMaterialPrice, setNewMaterialPrice] = useState(5.00);
  const [newMaterialVat, setNewMaterialVat] = useState(23);

  // Search in added materials
  const [addedSearchTerm, setAddedSearchTerm] = useState("");

  // Search/Add preset states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVatFilter, setSelectedVatFilter] = useState("all");

  // Local global markup adjustor state
  const [globalMarkup, setGlobalMarkup] = useState(15); // Default 15%

  // Quick modal states
  const [isQuickAdderOpen, setIsQuickAdderOpen] = useState(false);
  const [quickSearch, setQuickSearch] = useState("");
  const [quickCategory, setQuickCategory] = useState("all");

  // Update global markup on the current set of materials
  const applyGlobalMarkup = (markupValue: number) => {
    setGlobalMarkup(markupValue);
    setMaterials(prev => prev.map(m => ({
      ...m,
      marzaProcent: markupValue
    })));
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMaterialName.trim()) return;

    const newItem: MaterialItem = {
      id: "custom-" + Date.now(),
      nazwa: newMaterialName,
      ilosc: newMaterialQty,
      jednostka: newMaterialUnit,
      cenaBazowaNetto: newMaterialPrice,
      marzaProcent: globalMarkup,
      vat: newMaterialVat,
    };

    setMaterials(prev => [...prev, newItem]);
    // reset form
    setNewMaterialName("");
    setNewMaterialQty(1);
    setNewMaterialPrice(10);
  };

  const addPreset = (preset: MaterialItem) => {
    // Check if copy already exists in current sheet to append quantity
    const existing = materials.find(m => m.nazwa.toLowerCase() === preset.nazwa.toLowerCase());
    if (existing) {
      setMaterials(prev => prev.map(m => m.id === existing.id ? { ...m, ilosc: m.ilosc + 1 } : m));
    } else {
      const newItem: MaterialItem = {
        ...preset,
        id: "preset-copy-" + Date.now(),
        marzaProcent: globalMarkup // Apply current global markup
      };
      setMaterials(prev => [...prev, newItem]);
    }
  };

  const updateQty = (id: string, newQty: number) => {
    if (newQty < 0.1) return;
    setMaterials(prev => prev.map(m => m.id === id ? { ...m, ilosc: parseFloat(newQty.toFixed(2)) } : m));
  };

  const updateItemMarkup = (id: string, value: number) => {
    setMaterials(prev => prev.map(m => m.id === id ? { ...m, marzaProcent: value } : m));
  };

  const updateItemPrice = (id: string, price: number) => {
    setMaterials(prev => prev.map(m => m.id === id ? { ...m, cenaBazowaNetto: Math.max(0, parseFloat(price.toFixed(2))) } : m));
  };

  const deleteItem = (id: string) => {
    setMaterials(prev => prev.filter(m => m.id !== id));
  };

  // Categorize predefined materials
  const getMaterialCategory = (name: string): "pipes" | "valves" | "acc" => {
    const lowercase = name.toLowerCase();
    if (lowercase.includes("rura") || lowercase.includes("miedziana") || lowercase.includes("pvc") || lowercase.includes("kanalizacyjna")) {
      return "pipes";
    }
    if (lowercase.includes("zawór") || lowercase.includes("rozdzielacz") || lowercase.includes("pompa") || lowercase.includes("filtr")) {
      return "valves";
    }
    return "acc";
  };

  // Adjust material quantity/presence from the quick modal instantly
  const handleModifyQtyInQuickAdder = (preset: MaterialItem, delta: number) => {
    const existing = materials.find(m => m.nazwa.toLowerCase() === preset.nazwa.toLowerCase());
    if (existing) {
      const newQty = Math.max(0, existing.ilosc + delta);
      if (newQty === 0) {
        setMaterials(prev => prev.filter(m => m.id !== existing.id));
      } else {
        setMaterials(prev => prev.map(m => m.id === existing.id ? { ...m, ilosc: parseFloat(newQty.toFixed(2)) } : m));
      }
    } else {
      if (delta > 0) {
        const newItem: MaterialItem = {
          ...preset,
          id: "preset-copy-" + Date.now(),
          ilosc: delta,
          marzaProcent: globalMarkup // Apply current global markup
        };
        setMaterials(prev => [...prev, newItem]);
      }
    }
  };

  // Filter added materials
  const filteredAddedMaterials = materials.filter(m =>
    m.nazwa.toLowerCase().includes(addedSearchTerm.toLowerCase())
  );

  // Filter presets
  const filteredPresets = INITIAL_MATERIALS.filter(p => 
    p.nazwa.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* 1. Global Markup Card */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-md">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center space-x-2">
            <Percent className="h-5 w-5 text-blue-400" />
            <h3 className="font-bold text-base">Globalna marża na materiały</h3>
          </div>
          <span className="text-xl font-black text-yellow-300">+{globalMarkup}%</span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed mb-4">
          Większość instalatorów kupuje towary w hurtowniach z wysokim rabatem, a klientowi wycenia je z narzutem. Przypisz globalną marżę do wszystkich pozycji w kosztorysie jednym suwakiem.
        </p>

        <div className="flex items-center space-x-4">
          <span className="text-xs font-semibold text-slate-400">0%</span>
          <input
            type="range"
            min="0"
            max="50"
            value={globalMarkup}
            onChange={(e) => applyGlobalMarkup(parseInt(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <span className="text-xs font-semibold text-slate-400">50%</span>
        </div>
      </div>

      {/* 2. Materials selection & list */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4 flex-wrap gap-2">
          <div className="flex items-center space-x-2">
            <ShoppingCart className="h-5 w-5 text-blue-600" />
            <h3 className="font-bold text-slate-900 text-base">Wykaz Materiałów</h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => {
                setQuickSearch("");
                setQuickCategory("all");
                setIsQuickAdderOpen(true);
              }}
              className="py-1.5 px-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-[11px] rounded-xl flex items-center gap-1 cursor-pointer transition-all active:scale-[0.97] shadow-xs"
              title="Szybkie grupowe dodawanie asortymentów"
            >
              <Sparkles className="h-3.5 w-3.5 text-yellow-200 animate-pulse" />
              <span>Szybki dodawacz</span>
            </button>
            <span className="bg-blue-100 text-blue-800 text-xs px-2.5 py-1 rounded-full font-bold font-mono">
              {materials.length} poz
            </span>
          </div>
        </div>

        {/* Real-time search bar for added materials */}
        {materials.length > 0 && (
          <div className="relative mb-4">
            <input
              type="text"
              placeholder="Szukaj dodanych rur, złączek..."
              value={addedSearchTerm}
              onChange={(e) => setAddedSearchTerm(e.target.value)}
              className="w-full text-xs pl-9 pr-16 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-slate-800"
            />
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            {addedSearchTerm && (
              <button 
                onClick={() => setAddedSearchTerm("")} 
                className="absolute right-3 top-2.5 px-2 py-0.5 bg-slate-200 hover:bg-slate-300 rounded text-[9px] text-slate-600 font-bold uppercase tracking-tight transition-colors cursor-pointer"
              >
                wyczyść
              </button>
            )}
          </div>
        )}

        {materials.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <p className="text-sm">Kosztorys materiałowy jest pusty.</p>
            <p className="text-xs mt-1">Skanuj fakturę, dodaj gotowe asortymenty z listy poniżej lub wpisz własne ręcznie.</p>
          </div>
        ) : filteredAddedMaterials.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <p className="text-sm font-semibold">Brak wyników wyszukiwania</p>
            <p className="text-xs mt-1">Żaden z dodanych towarów nie pasuje do "{addedSearchTerm}".</p>
            <button
              onClick={() => setAddedSearchTerm("")}
              className="mt-3 text-xs font-bold text-blue-600 hover:underline cursor-pointer"
            >
              Pokaż wszystkie materiały
            </button>
          </div>
        ) : (
          <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
            {filteredAddedMaterials.map((m) => {
              const unitPriceWithMarkup = m.cenaBazowaNetto * (1 + m.marzaProcent / 100);
              const totalNet = unitPriceWithMarkup * m.ilosc;
              const totalGross = totalNet * (1 + m.vat / 100);

              return (
                <div key={m.id} className="border border-slate-100 rounded-xl p-3 bg-slate-50 relative group">
                  <button 
                    onClick={() => deleteItem(m.id)}
                    className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 cursor-pointer"
                    title="Usuń pozycję"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>

                  <p className="font-bold text-xs text-slate-800 pr-8">{m.nazwa}</p>

                  <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                    {/* Quantity edit */}
                    <div className="flex items-center space-x-1.5">
                      <span className="text-slate-500">Ilość:</span>
                      <input
                        type="number"
                        step="0.1"
                        value={m.ilosc}
                        onChange={(e) => updateQty(m.id, parseFloat(e.target.value) || 0)}
                        className="w-12 p-1 bg-white border border-slate-200 rounded-md font-bold text-center text-xs text-slate-800"
                      />
                      <span className="text-slate-400">{m.jednostka}</span>
                    </div>

                    {/* Price edit */}
                    <div className="flex items-center space-x-1.5 justify-end">
                      <span className="text-slate-500">Hurt (netto):</span>
                      <input
                        type="number"
                        step="0.01"
                        value={m.cenaBazowaNetto}
                        onChange={(e) => updateItemPrice(m.id, parseFloat(e.target.value) || 0)}
                        className="w-16 p-1 bg-white border border-slate-200 rounded-md font-semibold text-right text-xs text-slate-800"
                      />
                      <span className="text-slate-400">zł</span>
                    </div>
                  </div>

                  <div className="border-t border-slate-200/50 my-2 pt-2 grid grid-cols-3 gap-1 items-center text-[11px]">
                    <div>
                      <span className="text-slate-500">Marża:</span>
                      <select 
                        value={m.marzaProcent} 
                        onChange={(e) => updateItemMarkup(m.id, parseInt(e.target.value))}
                        className="ml-1 bg-transparent font-semibold text-blue-600 focus:outline-none"
                      >
                        <option value="0">0%</option>
                        <option value="5">5%</option>
                        <option value="10">10%</option>
                        <option value="15">15%</option>
                        <option value="20">20%</option>
                        <option value="25">25%</option>
                        <option value="30">30%</option>
                      </select>
                    </div>

                    <div className="col-span-2 text-right">
                      <span className="text-slate-500">Razem dla klienta:</span>
                      <span className="font-extrabold text-slate-900 ml-1">
                        {totalGross.toFixed(2)} zł <span className="text-[9px] text-slate-400">({m.vat}% VAT)</span>
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Add Custom Material Form */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs">
        <h4 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-1.5 text-blue-600">
          <Plus className="h-4 w-4" /> Wpisz własny materiał
        </h4>

        <form onSubmit={handleAddCustom} className="space-y-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1">Nazwa materiału / złączki / rury</label>
            <input
              type="text"
              placeholder="np. Kolano PEX zaprasowywane 16x16"
              value={newMaterialName}
              onChange={(e) => setNewMaterialName(e.target.value)}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-slate-800"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">Cena netto (Hurt)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={newMaterialPrice}
                onChange={(e) => setNewMaterialPrice(parseFloat(e.target.value) || 0)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-slate-800 text-center"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">Ilość</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={newMaterialQty}
                onChange={(e) => setNewMaterialQty(parseFloat(e.target.value) || 0)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-slate-800 text-center"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">Jednostka</label>
              <select
                value={newMaterialUnit}
                onChange={(e) => setNewMaterialUnit(e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-slate-800 font-medium"
              >
                <option value="szt">szt.</option>
                <option value="m">m</option>
                <option value="kpl">kpl.</option>
                <option value="kg">kg</option>
                <option value="opak">opak.</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2 items-center justify-between pt-1">
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-bold text-slate-500">VAT:</span>
              <button
                type="button"
                onClick={() => setNewMaterialVat(23)}
                className={`px-2 py-1 text-[10px] font-bold rounded-lg ${newMaterialVat === 23 ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"}`}
              >
                23%
              </button>
              <button
                type="button"
                onClick={() => setNewMaterialVat(8)}
                className={`px-2 py-1 text-[10px] font-bold rounded-lg ${newMaterialVat === 8 ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"}`}
              >
                8%
              </button>
            </div>

            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Plus className="h-4 w-4" /> Dodaj do spisu
            </button>
          </div>
        </form>
      </div>

      {/* 4. Wholesalers database defaults selection catalogue */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs">
        <h4 className="font-bold text-slate-900 text-sm mb-1.5 flex items-center gap-1.5">
          <TrendingUp className="h-4 w-4 text-emerald-600" /> Katalog asortymentów hurtowych
        </h4>
        <p className="text-xs text-slate-500 mb-3">Szybki dostęp do cen rynkowych standardowych materiałów instalacyjnych w Polsce.</p>
        
        <input
          type="text"
          placeholder="Wyszukaj np. rura, zawór, filtr..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 mb-4 text-slate-800"
        />

        <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
          {filteredPresets.map((preset) => (
            <div key={preset.id} className="flex justify-between items-center text-xs p-2.5 border border-slate-100 hover:border-slate-200 rounded-xl hover:bg-slate-50/50 transition-all">
              <div className="pr-2">
                <p className="font-bold text-slate-800 leading-tight">{preset.nazwa}</p>
                <p className="text-[10px] text-slate-400 font-medium">Baza netto hurt: {preset.cenaBazowaNetto.toFixed(2)} zł / {preset.jednostka}</p>
              </div>
              <button
                onClick={() => addPreset(preset)}
                className="shrink-0 p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 hover:text-emerald-800 rounded-lg cursor-pointer flex items-center space-x-1 font-bold text-[10px] transition-all"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Dodaj</span>
              </button>
            </div>
          ))}

          {filteredPresets.length === 0 && (
            <p className="text-center py-4 text-xs text-slate-400 italic">Brak wyników wyszukiwania.</p>
          )}
        </div>
      </div>

      {/* Szybki Dodawacz Modal */}
      {isQuickAdderOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-all duration-300">
          <div 
            className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-2xl overflow-hidden max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-5 flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="h-5 w-5 text-yellow-300" />
                  <h3 className="font-extrabold text-lg tracking-tight">Szybki dodawacz materiałów</h3>
                </div>
                <p className="text-xs text-blue-100">
                  Użyj tego panelu do błyskawicznego kompletowania materiałów jednym kliknięciem.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsQuickAdderOpen(false)}
                className="p-1.5 text-blue-100 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal search and filter segment */}
            <div className="p-4 bg-slate-50 border-b border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-2 items-center">
              <div className="relative md:col-span-2">
                <input
                  type="text"
                  placeholder="Wyszukaj szybko produkt..."
                  value={quickSearch}
                  onChange={(e) => setQuickSearch(e.target.value)}
                  className="w-full text-xs pl-8 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-slate-800"
                />
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              </div>
              <div>
                <select
                  value={quickCategory}
                  onChange={(e) => setQuickCategory(e.target.value)}
                  className="w-full text-xs p-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-semibold text-slate-700"
                >
                  <option value="all">Wszystkie grupy</option>
                  <option value="pipes">Tuby i Kanalizacja</option>
                  <option value="valves">Zawory i Armatura</option>
                  <option value="acc">Złączki i Akcesoria</option>
                </select>
              </div>
            </div>

            {/* Modal Body - Predefined list */}
            <div className="p-4 overflow-y-auto space-y-3 flex-1 bg-white">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {INITIAL_MATERIALS.filter((item) => {
                  const matchSearch = item.nazwa.toLowerCase().includes(quickSearch.toLowerCase());
                  const itemCat = getMaterialCategory(item.nazwa);
                  const matchCat = quickCategory === "all" || itemCat === quickCategory;
                  return matchSearch && matchCat;
                }).map((item) => {
                  const currentItemInEstimate = materials.find((m) => m.nazwa.toLowerCase() === item.nazwa.toLowerCase());
                  const qtyInEstimate = currentItemInEstimate ? currentItemInEstimate.ilosc : 0;

                  return (
                    <div 
                      key={item.id} 
                      className={`p-3 rounded-2xl border transition-all flex flex-col justify-between ${
                        qtyInEstimate > 0 
                          ? "bg-indigo-50/40 border-indigo-200/80 shadow-xs animate-pulse" 
                          : "bg-slate-50/45 border-slate-100 hover:border-slate-200"
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-start gap-1">
                          <span className="font-bold text-xs text-slate-800 leading-snug line-clamp-2">
                            {item.nazwa}
                          </span>
                          {qtyInEstimate > 0 && (
                            <span className="shrink-0 bg-indigo-600 text-white font-extrabold text-[9px] px-1.5 py-0.5 rounded-full">
                              {qtyInEstimate} {item.jednostka}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 font-medium">
                          Cena hurt: <span className="font-bold text-slate-600">{item.cenaBazowaNetto.toFixed(2)} zł</span> / {item.jednostka}
                        </p>
                      </div>

                      {/* Modal action buttons */}
                      <div className="mt-3 pt-2.5 border-t border-slate-100/70 flex gap-1.5 items-center justify-between">
                        {qtyInEstimate === 0 ? (
                          <div className="flex gap-1 w-full justify-end">
                            <button
                              type="button"
                              onClick={() => handleModifyQtyInQuickAdder(item, 1)}
                              className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-extrabold text-[10px] rounded-lg cursor-pointer transition-colors"
                              title="Dodaj 1 szt"
                            >
                              +1 {item.jednostka}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleModifyQtyInQuickAdder(item, item.ilosc)}
                              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[10px] rounded-lg cursor-pointer transition-colors"
                              title={`Uruchom standardową paczkę: ${item.ilosc} ${item.jednostka}`}
                            >
                              + Pakiet ({item.ilosc})
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between w-full">
                            {/* Decrease / Delete button */}
                            <button
                              type="button"
                              onClick={() => {
                                // Default decrease: minus 1 unit, or minus 10 units if it's high
                                const step = item.ilosc >= 50 ? 10 : 1;
                                handleModifyQtyInQuickAdder(item, -step);
                              }}
                              className="p-1 px-2 bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 rounded-lg cursor-pointer flex items-center gap-0.5 transition-colors text-[9px] font-bold"
                            >
                              <Minus className="h-3 w-3 shrink-0" />
                              <span>-{item.ilosc >= 50 ? 10 : 1}</span>
                            </button>

                            {/* Increment customized buttons */}
                            <div className="flex gap-1">
                              <button
                                type="button"
                                onClick={() => handleModifyQtyInQuickAdder(item, 1)}
                                className="px-2 py-0.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-bold text-[9px] rounded-md cursor-pointer transition-colors"
                              >
                                +1
                              </button>
                              {item.ilosc > 5 && (
                                <button
                                  type="button"
                                  onClick={() => handleModifyQtyInQuickAdder(item, item.ilosc >= 50 ? 50 : 5)}
                                  className="px-2 py-0.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-bold text-[9px] rounded-md cursor-pointer transition-colors"
                                >
                                  +{item.ilosc >= 50 ? 50 : 5}
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 p-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Marża globalna: <span className="text-blue-600">+{globalMarkup}%</span>
              </span>
              <button
                type="button"
                onClick={() => setIsQuickAdderOpen(false)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl cursor-pointer transition-all active:scale-[0.98] shadow-xs"
              >
                Zamknij i powróć
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
