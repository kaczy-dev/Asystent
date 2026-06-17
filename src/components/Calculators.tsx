import React, { useState } from "react";
import { Wrench, Flame, HelpCircle, Thermometer, Layers, ShieldCheck, Ruler, Info, ShoppingCart, Sparkles } from "lucide-react";

export default function Calculators() {
  // Calculator 1: Heater Sizing (Dobór grzejnika)
  const [width, setWidth] = useState<number>(4);
  const [length, setLength] = useState<number>(5);
  const [height, setHeight] = useState<number>(2.6);
  const [roomType, setRoomType] = useState<string>("pokoj"); // pokoj (40 W/m³), lazienka (50 W/m³), piwnica (30 W/m³)
  const [insulation, setInsulation] = useState<string>("srednia"); // dobra (x0.8), srednia (x1.0), slaba (x1.4)

  // Calculator 2: Slope & Diameters (Spadki i Średnice)
  const [drainType, setDrainType] = useState<string>("umywalka");

  // Calculator 3: Expansion Vessel Sizing (Naczynie wzbiorcze CO)
  const [installationVolume, setInstallationVolume] = useState<number>(150); // Liters
  const [maxTemp, setMaxTemp] = useState<number>(80); // °C (70, 80, 90)
  const [staticHeight, setStaticHeight] = useState<number>(6); // Meters

  // Calculator 4: Styrofoam Underfloor Heating (Kalkulator styropianu pod podłogówkę)
  const [areaMode, setAreaMode] = useState<"dims" | "manual">("dims");
  const [styroWidth, setStyroWidth] = useState<number>(8);
  const [styroLength, setStyroLength] = useState<number>(10);
  const [styroManualArea, setStyroManualArea] = useState<number>(80);
  const [floorType, setFloorType] = useState<string>("ground"); // "ground", "basement", "strop"
  const [styroQuality, setStyroQuality] = useState<string>("graphite"); // "white", "graphite"
  const [styroThickness, setStyroThickness] = useState<number>(10); // cm
  const [wasteMargin, setWasteMargin] = useState<number>(8); // percentage
  const [pricePerCubic, setPricePerCubic] = useState<number>(290); // zł / m³
  const [pipeSpacing, setPipeSpacing] = useState<number>(15); // cm spacing

  // Sizing formula outputs for Heater Sizing
  const kubatura = width * length * height;
  let baseWattsPerCubic = 40;
  if (roomType === "lazienka") baseWattsPerCubic = 50;
  if (roomType === "piwnica") baseWattsPerCubic = 30;

  let multiplier = 1.0;
  if (insulation === "dobra") multiplier = 0.75; // Passive / modern isolation
  if (insulation === "slaba") multiplier = 1.45; // Old brick drafty house

  const recommendedPower = Math.round(kubatura * baseWattsPerCubic * multiplier);

  // Slope standard table
  const slopeTable: { [key: string]: { name: string; diameter: string; slopeMin: string; desc: string } } = {
    umywalka: { name: "Podejście do umywalki / bidetu", diameter: "Fi 32 - Fi 40 mm", slopeMin: "2.0% - 3.0%", desc: "Dla małych przepływów zaleca się duży spadek minimum 2%, aby osady zostały spłukane." },
    zlew: { name: "Podejście pod zlew kuchenny / zmywarkę", diameter: "Fi 50 mm", slopeMin: "2.0%", desc: "Zalecana średnica 50mm ze względu na tłuszcz i odpady kuchenne." },
    wanna: { name: "Odpływ wanny / brodzika prysznica", diameter: "Fi 50 mm", slopeMin: "1.5% - 2.0%", desc: "Zadbaj o niski syfon czyszczony od góry ze spadkiem min. 1.5%." },
    wc: { name: "Podejście pod WC", diameter: "Fi 110 mm", slopeMin: "1.5% - 2.0%", desc: "Maksymalny odcinek podejścia bez odpowietrzenia to 3 metry." },
    pion: { name: "Pion kanalizacyjny wewnętrzny", diameter: "Fi 110 mm (lub Fi 75)", slopeMin: "1.0% - 2.0%", desc: "Konieczne napowietrzenie u szczytu pionu zaworem lub rurą wywiewną." },
    poziom: { name: "Poziom zbiorczy (leżak w piwnicy / gruncie)", diameter: "Fi 110 - Fi 160 mm", slopeMin: "1.5% - 2.5%", desc: "Spadek powyżej 5% nie jest zalecany ze względu na ryzyko spływania wody bez zanieczyszczeń." }
  };

  const selectedSlope = slopeTable[drainType] || slopeTable.umywalka;

  // Expansion Vessel calculations CO
  // Water expansion factor based on max temperature
  let expansionCoefficient = 0.029; // 80°C default
  if (maxTemp <= 70) expansionCoefficient = 0.0228;
  else if (maxTemp >= 90) expansionCoefficient = 0.0359;

  const staticPressure = staticHeight / 10; // 10m static height = 1bar water pressure
  const preChargePressure = Math.max(0.5, parseFloat((staticPressure + 0.2).toFixed(1))); // p0 = pst + 0.2 bar
  const safetyValvePressure = 3.0; // Standard for central heating (CO)
  const maxOperatingPressure = safetyValvePressure - 0.5; // p_max = p_sv - 0.5

  // Sizing formula: Vn = Ve * (pe + 1) / (pe - p0)
  // Ve = installationVolume * expansionCoefficient
  const expansionVolume = installationVolume * expansionCoefficient;
  const numerator = maxOperatingPressure + 1;
  const denominator = maxOperatingPressure - preChargePressure;
  
  let suggestedVesselSize = 0;
  if (denominator > 0) {
    suggestedVesselSize = expansionVolume * (numerator / denominator);
    // Add safety overhead factor of 1.15
    suggestedVesselSize = Math.round(suggestedVesselSize * 1.15);
  }

  // Standard vessel nominal sizes available in plumbing stores
  const nominalSizes = [5, 8, 12, 18, 24, 35, 50, 80, 100, 150];
  const matchedSize = nominalSizes.find(size => size >= suggestedVesselSize) || nominalSizes[nominalSizes.length - 1];

  // Calculations for Styrofoam Underfloor Heating
  const calculatedStyroArea = areaMode === "dims" ? styroWidth * styroLength : styroManualArea;
  const grossStyroArea = calculatedStyroArea * (1 + wasteMargin / 100);
  const totalVolumeCubic = grossStyroArea * (styroThickness / 100); // m³
  const totalStyroCost = totalVolumeCubic * pricePerCubic;

  const lambda = styroQuality === "graphite" ? 0.031 : 0.038;
  const thermalResistanceR = (styroThickness / 100) / lambda; // R = d/lambda
  const heatTransmittanceU = 1 / (0.17 + thermalResistanceR); // U = 1 / (Rsi + R + Rse)

  let isWT2021Compliant = false;
  let complianceSlogan = "";
  let hintMsg = "";

  if (floorType === "ground") {
    isWT2021Compliant = heatTransmittanceU <= 0.30;
    complianceSlogan = isWT2021Compliant 
      ? "Spełnia normy WT 2021 dla podłóg na gruncie (U ≤ 0.30 W/m²K)" 
      : "Zbyt duże straty! WT 2021 wymaga dla podłóg na gruncie przenikalności U ≤ 0.30 W/m²K.";
    hintMsg = "Dla podłóg stykających się z gruntem bezwzględnie zaleca się min. 10-12 cm grafitu lub 15 cm białego styropianu.";
  } else if (floorType === "basement") {
    isWT2021Compliant = heatTransmittanceU <= 0.30;
    complianceSlogan = isWT2021Compliant 
      ? "Spełnia normy WT 2021 nad nieogrzewanymi przestrzeniami" 
      : "Za cienki styropian! WT 2021 wymaga U ≤ 0.30 W/m²K nad piwnicą/garażem.";
    hintMsg = "Nad zimną, nieogrzewaną piwnicą lub gruntem należy dążyć do uzyskania niskiego współczynnika przeniakania ciepła.";
  } else {
    isWT2021Compliant = thermalResistanceR >= 0.75;
    complianceSlogan = isWT2021Compliant 
      ? "Spełnia normę PN-EN 1264 dla stropu nad pomieszczeniem ogrzewanym (R ≥ 0.75 m²K/W)" 
      : "Zbyt mały opór cieplny! PN-EN 1264 wymaga R ≥ 0.75 m²K/W między kondygnacjami.";
    hintMsg = "Pomiędzy ogrzewanymi mieszkaniami wystarczy 3-5 cm. Tutaj kluczowa bywa też akustyka stropu.";
  }

  // Paczkowanie: standard płyta 100x50 cm (0.5 m²). Przyjmując paczkę standardową ok. 0.3 m³:
  const singleSheetVol = 0.5 * (styroThickness / 100);
  const sheetsCountInPacket = Math.max(1, Math.floor(0.30 / singleSheetVol));
  const m2InPacket = sheetsCountInPacket * 0.5;
  const packagesQtyNeeded = Math.ceil(grossStyroArea / m2InPacket);
  const totalSheetsNeeded = Math.ceil(grossStyroArea / 0.5);

  // Akcesoria
  let pipeFactor = 6.7; // default 15cm
  if (pipeSpacing === 10) pipeFactor = 10;
  else if (pipeSpacing === 12.5) pipeFactor = 8;
  else if (pipeSpacing === 15) pipeFactor = 6.7;
  else if (pipeSpacing === 20) pipeFactor = 5;

  const estimatedPipeLength = calculatedStyroArea * pipeFactor;
  const calculatedRoomPerimeter = areaMode === "dims" 
    ? 2 * (styroWidth + styroLength) 
    : 4 * Math.sqrt(styroManualArea);
  
  const marginalWallTapeRequired = calculatedRoomPerimeter * 1.1; // +10% marginal
  const expansionTapeRollsNeeded = Math.ceil(marginalWallTapeRequired / 25); // 25 m roll

  const spikesTotal = Math.ceil(estimatedPipeLength * 3.5); // ~3.5 clips per meter
  const spikesBoxesQty = Math.ceil(spikesTotal / 250); // box of 250 clips

  const screenFoilRollsQty = Math.ceil(grossStyroArea / 50); // 50m² roll

  return (
    <div className="space-y-6">
      {/* Tab Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-white flex items-center space-x-3">
        <div className="p-3 bg-blue-600 rounded-xl">
          <Wrench className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold tracking-tight">Kalkulatory Hydrauliczne</h2>
          <p className="text-xs text-slate-400">Rzetelne obliczenia na budowie według norm</p>
        </div>
      </div>

      {/* 1. Heater Calculator */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs">
        <div className="flex items-center space-x-2 text-blue-600 border-b border-slate-100 pb-3 mb-4">
          <Flame className="h-5 w-5" />
          <h3 className="font-bold text-slate-900">Dobór Mocy Grzejników</h3>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">Szerokość (m)</label>
              <input
                type="number"
                step="0.1"
                min="1"
                value={width}
                onChange={(e) => setWidth(parseFloat(e.target.value) || 0)}
                className="w-full text-sm font-semibold p-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-center"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">Długość (m)</label>
              <input
                type="number"
                step="0.1"
                min="1"
                value={length}
                onChange={(e) => setLength(parseFloat(e.target.value) || 0)}
                className="w-full text-sm font-semibold p-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-center"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">Wysokość (m)</label>
              <input
                type="number"
                step="0.1"
                min="1"
                value={height}
                onChange={(e) => setHeight(parseFloat(e.target.value) || 0)}
                className="w-full text-sm font-semibold p-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-center"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Typ pomieszczenia</label>
              <select
                value={roomType}
                onChange={(e) => setRoomType(e.target.value)}
                className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-medium"
              >
                <option value="pokoj">Pokój / Salon (40 W/m³)</option>
                <option value="lazienka">Łazienka (50 W/m³)</option>
                <option value="piwnica">Piwnica / Garaż (30 W/m³)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Klasa ocieplenia budynku</label>
              <select
                value={insulation}
                onChange={(e) => setInsulation(e.target.value)}
                className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-medium"
              >
                <option value="dobra">B. dobra (nowy ocieplony)</option>
                <option value="srednia">Średnia (starszy ocieplony)</option>
                <option value="slaba">Słaba (brak ocieplenia)</option>
              </select>
            </div>
          </div>

          {/* Sizing result display */}
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 flex justify-between items-center mt-2">
            <div>
              <p className="text-xs font-semibold text-blue-700">Kubatura pomieszczenia:</p>
              <p className="text-lg font-extrabold text-blue-900">{kubatura.toFixed(1)} m³</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-blue-700">Dobrana moc grzejnika:</p>
              <p className="text-xl font-black text-blue-900">{recommendedPower} Watów (W)</p>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 leading-normal flex items-start gap-1">
            <HelpCircle className="h-3 w-3 shrink-0 text-slate-400 mt-0.5" />
            Obliczenia opierają się na polskim standardzie zapotrzebowania cieplnego przy temperaturze zasilania instalacji parametrów wysokotemperaturowych.
          </p>
        </div>
      </div>

      {/* 2. Slope & diameter standards */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs">
        <div className="flex items-center space-x-2 text-emerald-600 border-b border-slate-100 pb-3 mb-4">
          <Wrench className="h-5 w-5" />
          <h3 className="font-bold text-slate-900">Normy Średnic i Spadków Odpływów</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Wybierz element przyboru sanitarnego</label>
            <select
              value={drainType}
              onChange={(e) => setDrainType(e.target.value)}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 font-medium"
            >
              <option value="umywalka">Umywalka / bidet (Fi 32 - 40)</option>
              <option value="zlew">Zlew kuchenny / zmywarka (Fi 50)</option>
              <option value="wanna">Wanna / prysznic (Fi 50)</option>
              <option value="wc">Muszla klozetowa WC (Fi 110)</option>
              <option value="pion">Pion wewnętrzny (Fi 75 - 110)</option>
              <option value="poziom">Poziom zbiorczy (leżak wejściowy Fi 110 - 160)</option>
            </select>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 grid grid-cols-2 gap-4">
            <div>
              <p className="text-[11px] font-semibold text-slate-500">ZALECANA ŚREDNICA:</p>
              <p className="text-base font-extrabold text-slate-800 mt-0.5">{selectedSlope.diameter}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500">ZALECANY SPADEK MINIMALNY:</p>
              <p className="text-base font-extrabold text-emerald-700 mt-0.5">{selectedSlope.slopeMin}</p>
            </div>
          </div>

          <div className="bg-emerald-50 rounded-xl p-3.5 border border-emerald-100 text-xs text-emerald-800 leading-relaxed font-medium">
            💡 <strong className="text-emerald-950">Porada mistrza: </strong> {selectedSlope.desc}
          </div>
        </div>
      </div>

      {/* 3. Expansion Vessel sizing (Naczynia przeponowe) */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs">
        <div className="flex items-center space-x-2 text-violet-600 border-b border-slate-100 pb-3 mb-4">
          <Thermometer className="h-5 w-5 animate-pulse" />
          <h3 className="font-bold text-slate-900">Dobór Naczynia Przeponowego C.O.</h3>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Objętość wody w C.O. (litry)</label>
              <input
                type="number"
                min="10"
                value={installationVolume}
                onChange={(e) => setInstallationVolume(parseInt(e.target.value) || 0)}
                className="w-full text-sm font-bold p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-violet-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Max Temp. (°C)</label>
              <select
                value={maxTemp}
                onChange={(e) => setMaxTemp(parseInt(e.target.value) || 80)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-violet-500 font-medium"
              >
                <option value="70">70°C (niskotemp)</option>
                <option value="80">80°C (standard)</option>
                <option value="90">90°C (wysoka)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Wysokość statyczna najwyższego punktu grzejnego (m): <span className="font-bold text-violet-700">{staticHeight}m</span>
            </label>
            <input
              type="range"
              min="2"
              max="25"
              value={staticHeight}
              onChange={(e) => setStaticHeight(parseInt(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-violet-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>Parter (2m)</span>
              <span>1 piętro (~5m)</span>
              <span>Dom parter+podwórko (~10m)</span>
              <span>Kamienica / Blok (25m)</span>
            </div>
          </div>

          <div className="bg-violet-50 rounded-xl p-4 border border-violet-100 grid grid-cols-2 gap-3 mt-2">
            <div>
              <p className="text-[11px] font-semibold text-violet-700">Ciśnienie wstępne gazu (p0):</p>
              <p className="text-base font-extrabold text-violet-900 mt-0.5">{preChargePressure} bar</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-violet-700">Masa wody do przyjęcia (Ve):</p>
              <p className="text-base font-extrabold text-violet-900 mt-0.5">{expansionVolume.toFixed(2)} litra</p>
            </div>
          </div>

          <div className="bg-violet-950 rounded-xl p-4 text-white text-center">
            <p className="text-xs text-violet-300 font-semibold tracking-wide uppercase">REKOMENDOWANY STANDARD NACZYNIA C.O.</p>
            <p className="text-2xl font-black mt-1 text-yellow-300">{matchedSize} LITRÓW (L)</p>
            <p className="text-[11px] text-violet-200 mt-1">Sugerowany nabój azotu przed napełnieniem: {preChargePressure} bar</p>
          </div>
        </div>
      </div>

      {/* 4. Styrofoam Underfloor Heating & Accessories Calculator */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs">
        <div className="flex items-center space-x-2 text-indigo-600 border-b border-slate-100 pb-3 mb-4">
          <Layers className="h-5 w-5 text-indigo-600 animate-pulse" />
          <h3 className="font-extrabold text-slate-900 text-base">Kalkulator Izolacji Podłogówki (Styropianu)</h3>
        </div>

        <div className="space-y-5">
          {/* Section 1: Area specifications */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-700">Wprowadzenie powierzchni inwestycji:</label>
              <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => setAreaMode("dims")}
                  className={`px-2.5 py-1 text-[10px] font-extrabold rounded-md transition-all cursor-pointer ${
                    areaMode === "dims" 
                      ? "bg-white text-indigo-700 shadow-2xs" 
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Wymiary pokoju
                </button>
                <button
                  type="button"
                  onClick={() => setAreaMode("manual")}
                  className={`px-2.5 py-1 text-[10px] font-extrabold rounded-md transition-all cursor-pointer ${
                    areaMode === "manual" 
                      ? "bg-white text-indigo-700 shadow-2xs" 
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Ręczny metraż (cały dom)
                </button>
              </div>
            </div>

            {areaMode === "dims" ? (
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1">
                    Szerokość pokoju (m)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    value={styroWidth}
                    onChange={(e) => setStyroWidth(Math.max(0.1, parseFloat(e.target.value) || 0))}
                    className="w-full text-xs font-bold p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-center text-slate-800 min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1">
                    Długość pokoju (m)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    value={styroLength}
                    onChange={(e) => setStyroLength(Math.max(0.1, parseFloat(e.target.value) || 0))}
                    className="w-full text-xs font-bold p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-center text-slate-800 min-h-[44px]"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1">
                  Łączna powierzchnia ogrzewana netto (m²)
                </label>
                <input
                  type="number"
                  min="1"
                  value={styroManualArea}
                  onChange={(e) => setStyroManualArea(Math.max(1, parseFloat(e.target.value) || 0))}
                  className="w-full text-xs font-bold p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-800 min-h-[44px]"
                />
              </div>
            )}
          </div>

          {/* Section 2: Building level/standards & Material type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Podłoże pod wylewką:</label>
              <select
                value={floorType}
                onChange={(e) => {
                  const val = e.target.value;
                  setFloorType(val);
                  // Adjust defaults dynamically for fantastic UX experience
                  if (val === "ground") {
                    setStyroThickness(15);
                  } else if (val === "basement") {
                    setStyroThickness(10);
                  } else {
                    setStyroThickness(5); // thin floor for ceilings
                  }
                }}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 font-medium text-slate-700 min-h-[44px]"
              >
                <option value="ground">Podłoga na gruncie (WT 2021)</option>
                <option value="basement">Nad piwnicą nieogrzewaną / garażem</option>
                <option value="strop">Strop międzykondygnacyjny (ogrzewany)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Rodzaj izolatora (Lambda λ):</label>
              <select
                value={styroQuality}
                onChange={(e) => setStyroQuality(e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 font-medium text-slate-700 min-h-[44px]"
              >
                <option value="graphite">Styropian Grafitowy (λ = 0.031 W/mK) - Wysoka wydajność</option>
                <option value="white">Styropian Biały Standard (λ = 0.038 W/mK) - Tradycyjny</option>
              </select>
            </div>
          </div>

          {/* Section 3: Styrofoam Thickness Controls */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-700">Dedykowana grubość styropianu:</span>
              <span className="bg-indigo-100 text-indigo-900 font-mono font-black border border-indigo-200 px-3 py-1 rounded-xl">
                {styroThickness} cm ({styroThickness * 10} mm)
              </span>
            </div>
            
            <input
              type="range"
              min="2"
              max="24"
              step="1"
              value={styroThickness}
              onChange={(e) => setStyroThickness(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none py-2"
            />
            
            {/* Quick-select helper buttons with Touch Target standard (>=44px clickable box with margin) */}
            <div className="grid grid-cols-5 gap-1.5 pt-1">
              {[2, 5, 10, 12, 15].map((thicknessValue) => (
                <button
                  key={thicknessValue}
                  type="button"
                  onClick={() => setStyroThickness(thicknessValue)}
                  className={`py-2 text-[10px] font-extrabold rounded-lg cursor-pointer transition-all border ${
                    styroThickness === thicknessValue 
                      ? "bg-indigo-600 text-white border-indigo-700" 
                      : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200"
                  }`}
                >
                  {thicknessValue} cm
                </button>
              ))}
            </div>
          </div>

          {/* Section 4: Physical Calculations (Compliance WT 2021 with dynamic alert badges) */}
          <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl space-y-3.5">
            <span className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">
              Charakterystyka termofizyczna warstwy:
            </span>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white border border-slate-100/80 p-3 rounded-xl shadow-2xs">
                <p className="text-[10px] font-bold text-slate-400 uppercase leading-none">Opór cieplny (R):</p>
                <p className="text-sm font-black text-slate-800 mt-1 font-mono">
                  {thermalResistanceR.toFixed(3)} <span className="text-[10px] font-semibold text-slate-400">m²K/W</span>
                </p>
              </div>

              <div className="bg-white border border-slate-100/80 p-3 rounded-xl shadow-2xs">
                <p className="text-[10px] font-bold text-slate-400 uppercase leading-none">Przenikalność cieplna (U):</p>
                <p className="text-sm font-black text-indigo-900 mt-1 font-mono">
                  {heatTransmittanceU.toFixed(3)} <span className="text-[10px] font-semibold text-slate-400">W/m²K</span>
                </p>
              </div>
            </div>

            {/* Compliance verification alertbox */}
            <div className={`p-3 rounded-xl border flex items-start gap-2.5 text-[11px] ${
              isWT2021Compliant 
                ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
                : "bg-rose-50/50 border-rose-200 text-rose-800"
            }`}>
              <ShieldCheck className={`h-4.5 w-4.5 shrink-0 mt-0.5 ${
                isWT2021Compliant ? "text-emerald-600 animate-pulse" : "text-rose-500"
              }`} />
              <div>
                <p className="font-extrabold uppercase tracking-wide text-[9px] mb-0.5">
                  Weryfikacja Norm Budowlanych:
                </p>
                <p className="font-bold leading-tight">{complianceSlogan}</p>
                <p className="text-[10px] text-slate-500 mt-1 leading-snug font-medium">
                  {hintMsg}
                </p>
              </div>
            </div>
          </div>

          {/* Section 5: Dynamic Material quantities details */}
          <div className="space-y-3.5">
            <span className="block text-xs font-bold text-slate-800">
              Zestawienie Materiału izolacyjnego (Styropianu EPS 100):
            </span>

            {/* Customizer row */}
            <div className="grid grid-cols-2 gap-3 pb-1">
              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-0.5">
                  Naddatek / Docinki (%)
                </label>
                <select
                  value={wasteMargin}
                  onChange={(e) => setWasteMargin(parseInt(e.target.value) || 0)}
                  className="w-full text-xs font-bold p-2 bg-slate-5 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-700"
                >
                  <option value="0">0% (Idealnie na styk)</option>
                  <option value="5">5% (Standard proste pokoje)</option>
                  <option value="8">8% (Zalecany średni)</option>
                  <option value="12">12% (Skomplikowane skosy / łuki)</option>
                  <option value="15">15% (Duża odpadowość)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-0.5">
                  Cena szacowana (zł / m³)
                </label>
                <input
                  type="number"
                  min="50"
                  value={pricePerCubic}
                  onChange={(e) => setPricePerCubic(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-full text-xs font-bold p-2 bg-slate-5 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-700 text-center"
                />
              </div>
            </div>

            {/* Core Styrofoam Output stats */}
            <div className="grid grid-cols-2 xs:grid-cols-4 gap-2">
              <div className="bg-slate-50 p-2.5 rounded-xl text-center border border-slate-100">
                <span className="block text-[9px] font-bold text-slate-400 uppercase">Pow. Brutto:</span>
                <span className="block text-sm font-black text-slate-800 font-mono mt-0.5">{grossStyroArea.toFixed(1)} m²</span>
                <span className="block text-[8px] text-slate-400 mt-0.5">Netto: {calculatedStyroArea.toFixed(1)} m²</span>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-xl text-center border border-slate-100">
                <span className="block text-[9px] font-bold text-slate-400 uppercase">Objętość:</span>
                <span className="block text-sm font-black text-slate-800 font-mono mt-0.5">{totalVolumeCubic.toFixed(2)} m³</span>
                <span className="block text-[8px] text-slate-400 mt-0.5">Styropianu EPS</span>
              </div>

              <div className="bg-indigo-50 p-2.5 rounded-xl text-center border border-indigo-100">
                <span className="block text-[9px] font-black text-indigo-700 uppercase">Płyty (szt):</span>
                <span className="block text-sm font-black text-indigo-900 font-mono mt-0.5">{totalSheetsNeeded} szt</span>
                <span className="block text-[8px] text-indigo-500 mt-0.5">Rozmiar 50x100cm</span>
              </div>

              <div className="bg-indigo-50 p-2.5 rounded-xl text-center border border-indigo-100">
                <span className="block text-[9px] font-black text-indigo-700 uppercase">Paczki (szt):</span>
                <span className="block text-sm font-black text-indigo-900 font-mono mt-0.5">{packagesQtyNeeded} paczek</span>
                <span className="block text-[8px] text-indigo-500 mt-0.5">Wzór: ~0.3 m³/paczka</span>
              </div>
            </div>

            {/* Budget estimate warning */}
            <div className="bg-indigo-950 p-3.5 rounded-xl text-white flex justify-between items-center shadow-xs">
              <div>
                <p className="text-[9px] text-indigo-300 font-bold uppercase tracking-widest leading-none">Orientacyjny Koszt Styropianu (Netto)</p>
                <p className="text-[10px] text-indigo-200 mt-0.5 font-medium">EPS-100 Dach/Podłoga (min. 100 kPa)</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-black text-yellow-300 font-mono">
                  {Math.round(totalStyroCost).toLocaleString("pl-PL")} zł
                </p>
              </div>
            </div>
          </div>

          {/* Section 6: Necessary installation accessories checklist (The Master touch!) */}
          <div className="pt-2 border-t border-slate-100 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">
                Sugerowane akcesoria instalacyjne (Wykaz):
              </span>
              
              <div className="flex items-center space-x-1 bg-slate-50 p-1 rounded-lg border border-slate-200">
                <span className="text-[9px] font-bold text-slate-500 pl-1">Rozstaw rur:</span>
                <select
                  value={pipeSpacing}
                  onChange={(e) => setPipeSpacing(parseInt(e.target.value) || 15)}
                  className="text-[9px] font-black bg-white focus:outline-none border-none p-0.5 text-indigo-600 rounded-md cursor-pointer"
                >
                  <option value="10">co 10 cm</option>
                  <option value="12">co 12.5 cm</option>
                  <option value="15">co 15 cm</option>
                  <option value="20">co 20 cm</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {/* Accessory Card 1: Pipe */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/50 flex gap-2.5 items-start">
                <div className="p-1 px-1.5 bg-blue-100 text-blue-700 font-black rounded-lg text-[9px] tracking-wide shrink-0">PEX</div>
                <div>
                  <h5 className="font-bold text-slate-800 leading-tight">Rura grzewcza PEX 16 mm</h5>
                  <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Sugerowanie: <span className="font-bold text-slate-800">{Math.round(estimatedPipeLength)} m</span></p>
                  <p className="text-[9px] text-slate-400 leading-snug mt-1">Przy rozstawie co {pipeSpacing} cm potrzeba ok. {pipeFactor} m/m² rury podłogowej.</p>
                </div>
              </div>

              {/* Accessory Card 2: Boundary Tape */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/50 flex gap-2.5 items-start">
                <div className="p-1 px-1.5 bg-rose-100 text-rose-700 font-black rounded-lg text-[9px] tracking-wide shrink-0">TAPE</div>
                <div>
                  <h5 className="font-bold text-slate-800 leading-tight">Taśma przyścienna brzeżna</h5>
                  <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Zapotrzebowanie: <span className="font-bold text-slate-800">{Math.round(marginalWallTapeRequired)} mb</span> (<strong className="text-indigo-600">{expansionTapeRollsNeeded}</strong> rolka {expansionTapeRollsNeeded === 1 ? "25m" : "25m"})</p>
                  <p className="text-[9px] text-slate-400 leading-snug mt-1">Niezbędna dylatacja wzdłuż całości ścian zewnętrznych i wewnętrznych.</p>
                </div>
              </div>

              {/* Accessory Card 3: Clips */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/50 flex gap-2.5 items-start">
                <div className="p-1 px-1.5 bg-indigo-100 text-indigo-700 font-black rounded-lg text-[9px] tracking-wide shrink-0">CLIPS</div>
                <div>
                  <h5 className="font-bold text-slate-800 leading-tight">Klipsy montażowe do tackera</h5>
                  <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Zalecana ilość: <span className="font-bold text-slate-800">{spikesTotal} szt</span> (<strong className="text-indigo-600">{spikesBoxesQty}</strong> kartony 250szt)</p>
                  <p className="text-[9px] text-slate-400 leading-snug mt-1">Przeciętne zużycie to ok. 3.5 spinki na każdy metr bieżący rury Al-PEX.</p>
                </div>
              </div>

              {/* Accessory Card 4: Grid Foil */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/50 flex gap-2.5 items-start">
                <div className="p-1 px-1.5 bg-emerald-100 text-emerald-700 font-black rounded-lg text-[9px] tracking-wide shrink-0">FOIL</div>
                <div>
                  <h5 className="font-bold text-slate-800 leading-tight">Folia metalizowana z rastrem</h5>
                  <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Zamówienie: <span className="font-bold text-slate-800">{grossStyroArea.toFixed(1)} m²</span> (<strong className="text-indigo-600">{screenFoilRollsQty}</strong> rolki 50m²)</p>
                  <p className="text-[9px] text-slate-400 leading-snug mt-1">Zapewnia ekranowanie promieniowania cieplnego w górę i nadrukowaną siatkę.</p>
                </div>
              </div>
            </div>

            <p className="text-[10px] font-medium text-slate-400 mt-2 italic leading-relaxed">
              * Powyższe rekomendacje są oparte na rzemieślniczym standardzie pracy instalatorów systemów ogrzewania podłogowego i normie PN-EN 1264.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
