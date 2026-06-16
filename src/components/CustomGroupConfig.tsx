/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { type CustomGroup } from '../types';
import { 
  FolderPlus, 
  HelpCircle, 
  Trash2, 
  Layers, 
  Check, 
  Plus,
  Compass,
  AlertTriangle
} from 'lucide-react';

interface CustomGroupConfigProps {
  availableColumns: string[];
  customGroups: CustomGroup[];
  onGroupsChange: (newGroups: CustomGroup[]) => void;
}

// Visual color options for grouping bars
const COLOR_PALETTE = [
  "#16a34a", // Green-600 (Agriculture)
  "#ca8a04", // Yellow-600 (Dry/Arid)
  "#2563eb", // Blue-600 (Irrigated)
  "#db2777", // Pink-600 (Fruits/Orchards)
  "#ea580c", // Orange-600 (Special)
  "#7c3aed", // Purple-600
  "#0891b2", // Cyan-600
  "#4b5563"  // Gray-600 (General)
];

const hexToRgb = (hex: string) => {
  const s = hex.replace("#", "");
  if (s.length === 3) {
    const r = parseInt(s[0] + s[0], 16) || 0;
    const g = parseInt(s[1] + s[1], 16) || 0;
    const b = parseInt(s[2] + s[2], 16) || 0;
    return { r, g, b };
  }
  const r = parseInt(s.substring(0, 2), 16) || 0;
  const g = parseInt(s.substring(2, 4), 16) || 0;
  const b = parseInt(s.substring(4, 6), 16) || 0;
  return { r, g, b };
};

const rgbToHex = (r: number, g: number, b: number) => {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const hexPart = (x: number) => {
    const h = clamp(x).toString(16);
    return h.length === 1 ? "0" + h : h;
  };
  return `#${hexPart(r)}${hexPart(g)}${hexPart(b)}`;
};

export default function CustomGroupConfig({ 
  availableColumns, 
  customGroups, 
  onGroupsChange 
}: CustomGroupConfigProps) {
  const [newGroupName, setNewGroupName] = useState("");
  const [selectedCols, setSelectedCols] = useState<string[]>([]);
  const [selectedColor, setSelectedColor] = useState(COLOR_PALETTE[0]);
  const [errorMsg, setErrorMsg] = useState("");

  // Toggle selection of standard column headers for a new group
  const handleToggleColumn = (colName: string) => {
    if (selectedCols.includes(colName)) {
      setSelectedCols(selectedCols.filter(c => c !== colName));
    } else {
      setSelectedCols([...selectedCols, colName]);
    }
  };

  // Add the newly configured group
  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const trimmedName = newGroupName.trim();
    if (!trimmedName) {
      setErrorMsg("Lütfen grup adı girin.");
      return;
    }

    if (customGroups.some(g => g.name.toUpperCase() === trimmedName.toUpperCase())) {
      setErrorMsg(`"${trimmedName}" adında bir grup zaten mevcut. Başka bir isim seçiniz.`);
      return;
    }

    if (selectedCols.length === 0) {
      setErrorMsg("Lütfen bu gruba dahil edilecek en az bir kolon seçin.");
      return;
    }

    const newGroup: CustomGroup = {
      id: `group-${Date.now()}`,
      name: trimmedName.toUpperCase(), // Normalize to UPPERCASE for professional reporting standard
      selectedColumns: [...selectedCols],
      color: selectedColor
    };

    onGroupsChange([...customGroups, newGroup]);
    
    // Reset state
    setNewGroupName("");
    setSelectedCols([]);
    // Assign a default color rotating from palette
    const nextColorIdx = (customGroups.length + 1) % COLOR_PALETTE.length;
    setSelectedColor(COLOR_PALETTE[nextColorIdx]);
  };

  // Delete matching custom group
  const handleDeleteGroup = (groupId: string) => {
    const updated = customGroups.filter(g => g.id !== groupId);
    onGroupsChange(updated);
  };

  // Select sample agriculture group for the user (shortcut!)
  const handleApplyShortcut = () => {
    // Look for typical turkish keywords representing agriculture / tarim
    const tarimMatches = availableColumns.filter(c => 
      c.toUpperCase().includes("TARIM") || 
      c.toUpperCase().includes("ARAZİ") || 
      c.toUpperCase().includes("MARJİNAL") ||
      c.toUpperCase().includes("DİKİLİ") ||
      c.toUpperCase().includes("SULU") ||
      c.toUpperCase().includes("KURU")
    );

    if (tarimMatches.length > 0) {
      setNewGroupName("TARIM ALANI");
      setSelectedCols(tarimMatches.slice(0, 3)); // select up to first 3 columns
      setErrorMsg("");
    } else {
      setErrorMsg("Sütun başlıklarında otomatik saptanan tarım alanları bulunamadı. Lütfen elle seçin.");
    }
  };

  return (
    <div id="custom-group-config-card" className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm text-slate-800">
      
      {/* Title block */}
      <div className="flex items-start justify-between border-b border-slate-100 pb-4 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-blue-50 rounded-lg text-blue-750">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 leading-tight">
              Özel Sütun Gruplandırma (Sanal Toplam)
            </h3>
            <p className="text-xs text-slate-500 font-sans mt-1">
              Farklı alansal sütunları (metrekare) seçip gruplayarak toplu sanal alanlar oluşturun
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Add New Group Form (7 cols) */}
        <div className="md:col-span-7 space-y-4">
          <form onSubmit={handleCreateGroup} className="space-y-4">
            
            {/* Input name and quick selector */}
            <div className="space-y-1.5">
              <label htmlFor="group-name-input" className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                1. Grup Adı Belirleyin:
              </label>
              <div className="flex gap-2">
                <input
                  id="group-name-input"
                  type="text"
                  placeholder="Örn: TARIM ALANI, ORMAN & MERA vb."
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="flex-1 text-xs border border-slate-305 rounded-lg px-3 py-2 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition-all font-sans uppercase"
                />
                <button
                  type="button"
                  id="quick-tarim-shortcut"
                  onClick={handleApplyShortcut}
                  className="px-2.5 py-2 border border-slate-300 bg-white hover:bg-slate-50 text-[11px] font-semibold text-slate-700 rounded-lg inline-flex items-center gap-1 transition-colors"
                  title="İlk birkaç tarım sütununu seç"
                >
                  <Compass className="w-3.5 h-3.5 text-blue-700" />
                  Tarım Sapta
                </button>
              </div>
            </div>

            {/* List checkboxes of available columns */}
            <div className="space-y-1.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  2. Bu Gruba Dahil Edilecek Kolonları Seçin:
                </label>
                <div className="flex items-center gap-2 text-[10px] font-bold font-sans">
                  <button 
                    type="button"
                    onClick={() => setSelectedCols(availableColumns)}
                    className="text-blue-600 hover:underline cursor-pointer"
                  >
                    Tümünü Seç
                  </button>
                  <span className="text-slate-300">|</span>
                  <button 
                    type="button"
                    onClick={() => setSelectedCols([])}
                    className="text-stone-500 hover:underline cursor-pointer"
                  >
                    Temizle
                  </button>
                  <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full font-mono text-slate-505 font-medium ml-1 shrink-0">
                    {selectedCols.length} seçildi
                  </span>
                </div>
              </div>

              {availableColumns.length === 0 ? (
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-center text-xs text-slate-500">
                  Gruplanacak nümerik veri kolonu bulunamadı. Lütfen sütunlardan alan içeriklerini kontrol edin.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-48 overflow-y-auto p-2 border border-slate-200 rounded-xl bg-slate-50/20">
                  {availableColumns.map((colName, cIdx) => {
                    const isChecked = selectedCols.includes(colName);
                    return (
                      <button
                        key={`${colName}-${cIdx}`}
                        id={`toggle-col-${colName.replace(/\s+/g, '-')}`}
                        type="button"
                        onClick={() => handleToggleColumn(colName)}
                        className={`text-left text-xs font-medium px-3 py-2 rounded-lg border flex items-center justify-between transition-all group ${
                          isChecked 
                            ? 'bg-blue-50/80 border-blue-500/80 text-blue-900 font-semibold' 
                            : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                        }`}
                      >
                        <span className="truncate pr-2">{colName}</span>
                        <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                          isChecked ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 group-hover:border-slate-400 bg-white'
                        }`}>
                          {isChecked && <Check className="w-3 h-3" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Color picker and submit */}
            {(() => {
              const rgb = hexToRgb(selectedColor);
              return (
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pt-3 border-t border-slate-100 mt-4">
                  <div className="space-y-2.5 w-full md:max-w-md">
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                      Grafik Sütun Rengi (RGB):
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex gap-1.5 bg-slate-50 p-1 rounded-lg border border-slate-100">
                        {COLOR_PALETTE.map((color) => (
                          <button
                            key={color}
                            type="button"
                            id={`color-circle-${color.replace('#', '')}`}
                            onClick={() => setSelectedColor(color)}
                            className={`w-6 h-6 rounded-full border transition-all cursor-pointer ${
                              selectedColor === color 
                                ? 'scale-110 border-slate-900 ring-2 ring-slate-900/10' 
                                : 'border-white hover:scale-105'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>

                      {/* HTML Color Picker */}
                      <input 
                        type="color"
                        value={selectedColor}
                        onChange={(e) => setSelectedColor(e.target.value)}
                        className="w-8 h-8 rounded border border-slate-200 cursor-pointer p-0 shrink-0 border-none bg-transparent"
                        title="Renk Seçici ile Özel Renk"
                      />
                      <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        {selectedColor.toUpperCase()}
                      </span>
                    </div>

                    {/* RGB Sliders */}
                    <div className="grid grid-cols-3 gap-2.5 p-2 px-3 border border-slate-100 rounded-lg bg-slate-50 text-[10px] font-mono w-full sm:max-w-xs">
                      {/* Red */}
                      <div className="space-y-1">
                        <span className="text-red-600 font-bold block text-center">R: {rgb.r}</span>
                        <input
                          type="range"
                          min="0"
                          max="255"
                          value={rgb.r}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setSelectedColor(rgbToHex(val, rgb.g, rgb.b));
                          }}
                          className="w-full h-1 bg-slate-200 rounded accent-red-600 cursor-pointer"
                        />
                      </div>
                      {/* Green */}
                      <div className="space-y-1">
                        <span className="text-emerald-500 font-bold block text-center">G: {rgb.g}</span>
                        <input
                          type="range"
                          min="0"
                          max="255"
                          value={rgb.g}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setSelectedColor(rgbToHex(rgb.r, val, rgb.b));
                          }}
                          className="w-full h-1 bg-slate-200 rounded accent-emerald-600 cursor-pointer"
                        />
                      </div>
                      {/* Blue */}
                      <div className="space-y-1">
                        <span className="text-blue-600 font-bold block text-center">B: {rgb.b}</span>
                        <input
                          type="range"
                          min="0"
                          max="255"
                          value={rgb.b}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setSelectedColor(rgbToHex(rgb.r, rgb.g, val));
                          }}
                          className="w-full h-1 bg-slate-200 rounded accent-blue-600 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="w-full md:w-auto self-end">
                    <button
                      type="submit"
                      id="add-custom-group-btn"
                      className="w-full md:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-500 hover:text-white active:bg-blue-700 text-white font-semibold text-xs rounded-lg inline-flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      Sanal Grup Sütununu Ekle
                    </button>
                  </div>
                </div>
              );
            })()}

            {errorMsg && (
              <p className="text-xs text-rose-600 font-sans bg-rose-50 border border-rose-100 p-2.5 rounded-lg flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                {errorMsg}
              </p>
            )}

          </form>
        </div>

        {/* RIGHT COLUMN: Active Custom Groups List (5 cols) */}
        <div className="md:col-span-5 bg-stone-50/50 border border-stone-200/60 rounded-xl p-4 flex flex-col">
          <h4 className="text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-3 block">
            Aktif Sanal Gruplar ({customGroups.length})
          </h4>
          
          {customGroups.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-stone-400">
              <Layers className="w-8 h-8 mb-2 opacity-40" />
              <p className="text-[11px] font-sans font-medium">Henüz sanal ve birleşik sütun grubu oluşturmadınız.</p>
              <p className="text-[10px] mt-1 text-stone-500 leading-normal max-w-xs">Soldaki menüyü kullanarak eklediğiniz birden çok sütun verisi toplu analiz sütunu olarak raporlar.</p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {customGroups.map((g) => (
                <div 
                  key={g.id} 
                  id={`custom-group-card-${g.id}`} 
                  className="bg-white border border-stone-200 rounded-xl p-3 shadow-xs space-y-2 relative"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: g.color }}></div>
                      <span className="text-xs font-bold font-mono text-stone-900 leading-none truncate pr-4 max-w-[140px]">
                        {g.name}
                      </span>
                    </div>
                    <button
                      id={`delete-group-${g.id}`}
                      onClick={() => handleDeleteGroup(g.id)}
                      className="text-stone-400 hover:text-rose-600 p-1 rounded-sm hover:bg-rose-50 transition-colors"
                      title="Sanal Grubu Kaldır"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="text-[10px] text-stone-500 font-sans leading-relaxed">
                    İçerdiği Sütunlar ({g.selectedColumns.length}):
                  </p>
                  
                  <div className="flex flex-wrap gap-1">
                    {g.selectedColumns.map((col, cIdx) => (
                      <span 
                        key={`${col}-${cIdx}`} 
                        className="text-[9px] font-medium bg-stone-100 text-stone-700 px-1.5 py-0.5 rounded border border-stone-200/50 truncate max-w-[130px]" 
                        title={col}
                      >
                        {col}
                      </span>
                    ))}
                  </div>

                  <div className="text-[9px] text-right font-mono text-emerald-600 font-semibold pt-1 border-t border-stone-100">
                    Sanal Toplama Dahil
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
