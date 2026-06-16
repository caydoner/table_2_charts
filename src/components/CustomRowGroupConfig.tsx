/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { type CustomRowGroup } from '../types';
import { 
  FolderPlus, 
  HelpCircle, 
  Trash2, 
  Layers, 
  Check, 
  Plus,
  Compass,
  AlertTriangle,
  FolderSync,
  ChevronDown,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';

interface CustomRowGroupConfigProps {
  regionColumn: string;
  availableRegions: string[];
  customRowGroups: CustomRowGroup[];
  onRowGroupsChange: (newGroups: CustomRowGroup[]) => void;
  mergeRowGroups: boolean;
  onMergeRowGroupsChange: (val: boolean) => void;
}

const COLOR_PALETTE = [
  "#4f46e5", // Indigo-600
  "#0891b2", // Cyan-600
  "#db2777", // Pink-600
  "#ea580c", // Orange-600
  "#16a34a", // Green-600
  "#ca8a04", // Yellow-600
  "#7c3aed", // Purple-600
  "#4b5563"  // Gray-600
];

export default function CustomRowGroupConfig({ 
  regionColumn,
  availableRegions, 
  customRowGroups, 
  onRowGroupsChange,
  mergeRowGroups,
  onMergeRowGroupsChange
}: CustomRowGroupConfigProps) {
  const [newGroupName, setNewGroupName] = useState("");
  const [selectedRegs, setSelectedRegs] = useState<string[]>([]);
  const [selectedColor, setSelectedColor] = useState(COLOR_PALETTE[0]);
  const [errorMsg, setErrorMsg] = useState("");

  const handleToggleRegion = (regionName: string) => {
    if (selectedRegs.includes(regionName)) {
      setSelectedRegs(selectedRegs.filter(r => r !== regionName));
    } else {
      setSelectedRegs([...selectedRegs, regionName]);
    }
  };

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const trimmedName = newGroupName.trim();
    if (!trimmedName) {
      setErrorMsg("Lütfen yatay eksen (satır) grup adı girin.");
      return;
    }

    if (customRowGroups.some(g => g.name.toUpperCase() === trimmedName.toUpperCase())) {
      setErrorMsg(`"${trimmedName}" adında bir satır grubu zaten mevcut. Başka bir isim seçiniz.`);
      return;
    }

    if (selectedRegs.length === 0) {
      setErrorMsg("Lütfen bu gruba dahil edilecek en az bir satır (bölge) seçin.");
      return;
    }

    const newGroup: CustomRowGroup = {
      id: `row-group-${Date.now()}`,
      name: trimmedName.toUpperCase(),
      selectedRegions: [...selectedRegs],
      color: selectedColor
    };

    onRowGroupsChange([...customRowGroups, newGroup]);
    
    setNewGroupName("");
    setSelectedRegs([]);
    
    const nextColorIdx = (customRowGroups.length + 1) % COLOR_PALETTE.length;
    setSelectedColor(COLOR_PALETTE[nextColorIdx]);
  };

  const handleDeleteGroup = (groupId: string) => {
    const updated = customRowGroups.filter(g => g.id !== groupId);
    onRowGroupsChange(updated);
  };

  return (
    <div id="custom-row-group-config-card" className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm text-slate-800">
      
      {/* Title block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 mb-5 gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-indigo-50 rounded-lg text-indigo-700">
            <FolderSync className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 leading-tight">
              Özel Satır (Bölge/Karar) Gruplandırma - Yatay Eksen Sentezi
            </h3>
            <p className="text-xs text-slate-500 font-sans mt-1">
              Yatay eksendeki farklı satır verilerini {regionColumn ? `(${regionColumn})` : ""} tek bir grup altında birleştirip sanal toplamını analiz edin
            </p>
          </div>
        </div>

        {/* Fusion Toggle Switch */}
        <div className="flex items-center gap-2.5 bg-slate-50 hover:bg-slate-100/70 border border-slate-200 px-3 py-1.5 rounded-xl transition-all self-start sm:self-auto cursor-pointer"
             onClick={() => onMergeRowGroupsChange(!mergeRowGroups)}>
          <span className="text-[11px] font-bold text-slate-700 font-sans">
            Gruplanan Satırları Tek Satır Yap:
          </span>
          <button 
            type="button"
            className="text-indigo-600 focus:outline-none flex items-center justify-center"
            title={mergeRowGroups ? "Gruplanan satırlar birleştirilir" : "Gruplanan satırlar tek tek gösterilmeye devam eder"}
          >
            {mergeRowGroups ? (
              <ToggleRight className="w-8 h-8 text-indigo-600" />
            ) : (
              <ToggleLeft className="w-8 h-8 text-slate-400" />
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Create Row Group From (7 cols) */}
        <div className="md:col-span-7 space-y-4">
          <form onSubmit={handleCreateGroup} className="space-y-4">
            
            {/* Group Name input */}
            <div className="space-y-1.5">
              <label htmlFor="row-group-name-input" className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                1. Satır Grup Adı:
              </label>
              <input
                id="row-group-name-input"
                type="text"
                placeholder="Örn: BATI BÖLGELERİ, SEÇİLİ YERLEŞKELER vb."
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600 transition-all font-sans uppercase font-medium"
              />
            </div>

            {/* Region select checklists */}
            <div className="space-y-1.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  2. Gruba Dahil Edilecek Satırları (Bölgeleri) Seçin:
                </label>
                <div className="flex items-center gap-2 text-[10px] font-bold font-sans">
                  <button 
                    type="button"
                    onClick={() => setSelectedRegs(availableRegions)}
                    className="text-indigo-605 hover:underline cursor-pointer"
                  >
                    Tümünü Seç
                  </button>
                  <span className="text-slate-300">|</span>
                  <button 
                    type="button"
                    onClick={() => setSelectedRegs([])}
                    className="text-stone-500 hover:underline cursor-pointer"
                  >
                    Temizle
                  </button>
                  <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full font-mono text-slate-505 font-medium ml-1 shrink-0">
                    {selectedRegs.length} seçildi
                  </span>
                </div>
              </div>

              {availableRegions.length === 0 ? (
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-center text-xs text-slate-500">
                  Gruplanacak yatay eksen verisi bulunamadı. Lütfen önce veri seti yükleyin.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-48 overflow-y-auto p-2 border border-slate-200 rounded-xl bg-slate-50/20">
                  {availableRegions.map((regionName, rIdx) => {
                    const isChecked = selectedRegs.includes(regionName);
                    return (
                      <button
                        key={`${regionName}-${rIdx}`}
                        id={`toggle-row-region-${regionName.replace(/\s+/g, '-')}`}
                        type="button"
                        onClick={() => handleToggleRegion(regionName)}
                        className={`text-left text-xs font-medium px-3 py-2 rounded-lg border flex items-center justify-between transition-all group ${
                          isChecked 
                            ? 'bg-indigo-50/80 border-indigo-500/80 text-indigo-900 font-semibold' 
                            : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                        }`}
                      >
                        <span className="truncate pr-2">{regionName}</span>
                        <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                          isChecked ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 group-hover:border-slate-400 bg-white'
                        }`}>
                          {isChecked && <Check className="w-3 h-3" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Colors and Submit */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                  Satır Grubu Rengi:
                </span>
                <div className="flex gap-1.5">
                  {COLOR_PALETTE.map((color) => (
                    <button
                      key={color}
                      type="button"
                      id={`row-color-circle-${color.replace('#', '')}`}
                      onClick={() => setSelectedColor(color)}
                      className={`w-6 h-6 rounded-full border transition-all ${
                        selectedColor === color 
                          ? 'scale-110 border-slate-905 ring-2 ring-indigo-900/10' 
                          : 'border-white hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                id="add-custom-row-group-btn"
                className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 hover:text-white active:bg-indigo-700 text-white font-semibold text-xs rounded-lg inline-flex items-center justify-center gap-1.5 transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Sanal Grup Satırını Ekle
              </button>
            </div>

            {errorMsg && (
              <p className="text-xs text-rose-600 font-sans bg-rose-50 border border-rose-100 p-2.5 rounded-lg flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                {errorMsg}
              </p>
            )}

          </form>
        </div>

        {/* RIGHT COLUMN: Active Custom Row Groups (5 cols) */}
        <div className="md:col-span-5 bg-stone-50/55 border border-stone-200/60 rounded-xl p-4 flex flex-col">
          <h4 className="text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-3 block font-sans">
            Aktif Sanal Satır Grupları ({customRowGroups.length})
          </h4>
          
          {customRowGroups.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-stone-400">
              <FolderSync className="w-8 h-8 mb-2 opacity-40 text-stone-500" />
              <p className="text-[11px] font-sans font-medium">Henüz sanal ve birleşik satır grubu oluşturmadınız.</p>
              <p className="text-[10px] mt-1 text-stone-500 leading-normal max-w-xs">Soldaki panelden birden fazla satırı (bölgeyi) seçip tek bir sanal satır olarak toplayarak özetleyebilirsiniz.</p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {customRowGroups.map((g) => (
                <div 
                  key={g.id} 
                  id={`custom-row-group-card-${g.id}`} 
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
                      id={`delete-row-group-${g.id}`}
                      onClick={() => handleDeleteGroup(g.id)}
                      className="text-stone-404 hover:text-rose-600 p-1 rounded-sm hover:bg-rose-50 transition-colors"
                      title="Sanal Satır Grubunu Kaldır"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="text-[10px] text-stone-500 font-sans leading-relaxed">
                    İçerdiği Orijinal Satırlar ({g.selectedRegions.length}):
                  </p>
                  
                  <div className="flex flex-wrap gap-1">
                    {g.selectedRegions.map((reg, rIdx) => (
                      <span 
                        key={`${reg}-${rIdx}`} 
                        className="text-[9px] font-medium bg-indigo-50/50 text-indigo-950 px-1.5 py-0.5 rounded border border-indigo-100/50 truncate max-w-[130px]" 
                        title={reg}
                      >
                        {reg}
                      </span>
                    ))}
                  </div>

                  <div className="text-[9px] text-right font-mono text-indigo-600 font-semibold pt-1 border-t border-stone-100">
                    Sanal Satır Toplamı Aktif
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
