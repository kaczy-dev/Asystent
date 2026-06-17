import React, { useState } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { MaterialItem, ServiceItem } from "../types";
import { Info, ShoppingCart, Milestone, Receipt } from "lucide-react";

interface CostPieChartProps {
  materials: MaterialItem[];
  services: ServiceItem[];
}

export default function CostPieChart({ materials, services }: CostPieChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // Calculate gross materials cost
  let matNetTotal = 0;
  let matVatTotal = 0;
  let matGrossTotal = 0;

  materials.forEach((m) => {
    const unitWithMarkupNet = m.cenaBazowaNetto * (1 + m.marzaProcent / 100);
    const itemNetTotal = unitWithMarkupNet * m.ilosc;
    const itemVatAmount = itemNetTotal * (m.vat / 100);
    const itemGrossTotal = itemNetTotal + itemVatAmount;

    matNetTotal += itemNetTotal;
    matVatTotal += itemVatAmount;
    matGrossTotal += itemGrossTotal;
  });

  // Calculate gross services cost
  let srvNetTotal = 0;
  let srvVatTotal = 0;
  let srvGrossTotal = 0;

  services.forEach((s) => {
    const itemNetTotal = s.cenaNetto * s.ilosc;
    const itemVatAmount = itemNetTotal * (s.vat / 100);
    const itemGrossTotal = itemNetTotal + itemVatAmount;

    srvNetTotal += itemNetTotal;
    srvVatTotal += itemVatAmount;
    srvGrossTotal += itemGrossTotal;
  });

  const grandNetTotal = matNetTotal + srvNetTotal;
  const grandVatTotal = matVatTotal + srvVatTotal;
  const grandGrossTotal = matGrossTotal + srvGrossTotal;

  // Empty state handling
  if (grandGrossTotal === 0) {
    return (
      <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs text-center space-y-3">
        <div className="mx-auto w-12 h-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center">
          <Info className="h-6 w-6" />
        </div>
        <p className="text-xs font-bold text-slate-800">Wizualizacja Podziału Budżetu</p>
        <p className="text-[11px] text-slate-400 leading-relaxed font-semibold max-w-xs mx-auto">
          Dodaj materiały w dziale <strong className="text-blue-600">Materiały</strong> lub pozycje robocizny w dziale <strong className="text-emerald-600">Usługi</strong>, aby zobaczyć dynamiczny, kołowy rozkład kosztów na pulpicie.
        </p>
      </div>
    );
  }

  // Prepare data for recharts
  const chartData = [
    {
      name: "Materiały",
      value: Math.round(matGrossTotal),
      net: Math.round(matNetTotal),
      vat: Math.round(matVatTotal),
      percentage: ((matGrossTotal / grandGrossTotal) * 100).toFixed(1),
      color: "#2563eb", // blue-600
      hoverColor: "#1d4ed8", // blue-700
      icon: ShoppingCart,
    },
    {
      name: "Robocizna",
      value: Math.round(srvGrossTotal),
      net: Math.round(srvNetTotal),
      vat: Math.round(srvVatTotal),
      percentage: ((srvGrossTotal / grandGrossTotal) * 100).toFixed(1),
      color: "#10b981", // emerald-500
      hoverColor: "#047857", // emerald-700
      icon: Milestone,
    }
  ].filter(item => item.value > 0); // Keep only categories with positive cost

  // Custom tooltips
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl border border-slate-800 shadow-md text-[11px]">
          <p className="font-extrabold flex items-center gap-1.5 mb-1 text-xs">
            <span 
              className="w-2.5 h-2.5 rounded-full inline-block" 
              style={{ backgroundColor: data.color }}
            />
            {data.name} ({data.percentage}%)
          </p>
          <div className="space-y-0.5 font-medium text-slate-300">
            <p>Brutto: <strong className="text-white font-mono">{data.value.toLocaleString("pl-PL")} zł</strong></p>
            <p>Netto: <span className="font-mono">{data.net.toLocaleString("pl-PL")} zł</span></p>
            <p>VAT: <span className="font-mono">{data.vat.toLocaleString("pl-PL")} zł</span></p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center space-x-2">
          <div className="p-1 px-2 bg-indigo-50 text-indigo-700 rounded-lg text-[10px] font-black shrink-0 tracking-wider">
            RECHARTS
          </div>
          <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest leading-none">
            Struktura Budżetu Inwestycji
          </h4>
        </div>
        <span className="text-[10px] font-bold text-slate-400">
          Łącznie brutto
        </span>
      </div>

      {/* Main presentation split: Chart left/above, Detailed legend / stats right/below */}
      <div className="flex flex-col xs:flex-row items-center justify-between gap-4">
        {/* Responsive Pie Chart */}
        <div className="w-[150px] h-[150px] shrink-0 relative flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={65}
                paddingAngle={4}
                dataKey="value"
                onMouseEnter={(_, index) => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
                cursor="pointer"
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={activeIndex === index ? entry.hoverColor : entry.color} 
                    className="transition-colors duration-150 focus:outline-none"
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          
          {/* Central Percentage label of active or dominant item */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[9px] font-bold uppercase text-slate-400 tracking-wider leading-none">
              {activeIndex !== null ? chartData[activeIndex].name : "Zestaw"}
            </span>
            <span className="text-lg font-black text-slate-800 font-mono mt-0.5 leading-none">
              {activeIndex !== null 
                ? `${chartData[activeIndex].percentage}%` 
                : `${((matGrossTotal / grandGrossTotal) * 100).toFixed(0)}%`
              }
            </span>
            {activeIndex === null && (
              <span className="text-[8px] font-bold text-slate-400 leading-none mt-0.5">materiały</span>
            )}
          </div>
        </div>

        {/* Legend stats table */}
        <div className="flex-1 w-full space-y-2.5">
          {chartData.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div 
                key={item.name}
                onMouseEnter={() => setActiveIndex(idx)}
                onMouseLeave={() => setActiveIndex(null)}
                className={`p-2.5 rounded-xl border transition-all text-xs flex gap-2 w-full ${
                  activeIndex === idx 
                    ? "bg-slate-50 border-slate-200 shadow-3xs" 
                    : "bg-white border-slate-100/60"
                }`}
              >
                <div 
                  className="p-1.5 rounded-lg text-white shrink-0 shadow-2xs"
                  style={{ backgroundColor: item.color }}
                >
                  <Icon className="h-3.5 w-3.5" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center text-[11px] font-bold text-slate-700">
                    <span className="truncate">{item.name}</span>
                    <span className="font-mono ml-1 shrink-0">{item.percentage}%</span>
                  </div>
                  <div className="flex justify-between items-baseline mt-0.5 text-[10px] text-slate-500 font-medium font-mono">
                    <span>Brutto: <strong className="text-slate-800 font-black">{item.value.toLocaleString("pl-PL")} zł</strong></span>
                    <span className="text-[9px] text-slate-400">Netto: {item.net.toLocaleString("pl-PL")} zł</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mini tax overview strip */}
      <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl flex justify-between items-center text-[10px] font-bold text-slate-600">
        <span className="flex items-center gap-1.5 text-slate-500 leading-none">
          <Receipt className="h-3.5 w-3.5 text-slate-400" />
          Koszty podatkowe kosztorysu:
        </span>
        <div className="space-x-3 text-right font-mono text-[9px] text-slate-500">
          <span>Suma Netto: <strong className="text-slate-800 text-[10px]">{Math.round(grandNetTotal).toLocaleString("pl-PL")} zł</strong></span>
          <span>Podatek VAT: <strong className="text-slate-800 text-[10px]">{Math.round(grandVatTotal).toLocaleString("pl-PL")} zł</strong></span>
        </div>
      </div>
    </div>
  );
}
