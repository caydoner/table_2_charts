/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  DEMO_SPREADSHEET, 
  parsePastedData 
} from '../demoData';
import { 
  Compass, 
  Database, 
  ClipboardList, 
  AlertCircle,
  Grid,
  Layers,
  HelpCircle,
  CheckCircle
} from 'lucide-react';

interface GoogleConnectorProps {
  onDataLoaded: (
    headers: string[], 
    rows: Record<string, string | number>[], 
    sourceName: string, 
    sheetName: string,
    sheetsList?: string[],
    spreadsheetId?: string,
    initialDataType?: 'area' | 'count'
  ) => void;
  activeSpreadsheetId?: string;
  activeSheetName?: string;
}

export default function GoogleConnector({ 
  onDataLoaded, 
  activeSpreadsheetId, 
  activeSheetName 
}: GoogleConnectorProps) {
  // Paste raw text state
  const [pastedText, setPastedText] = useState("");
  const [pasteError, setPasteError] = useState("");
  const [localDataType, setLocalDataType] = useState<'area' | 'count'>('area');
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' | null }>({ text: "", type: null });

  // Trigger loading raw pasted data
  const handlePasteSubmit = () => {
    setPasteError("");
    setStatusMessage({ text: "", type: null });

    if (!pastedText.trim()) {
      setPasteError("Lütfen hücre alanını doldurun.");
      return;
    }

    const result = parsePastedData(pastedText);
    if (result) {
      onDataLoaded(
        result.headers, 
        result.rows, 
        "Yapıştırılan Veri", 
        "Kopyalanan Hücreler",
        undefined,
        undefined,
        localDataType
      );
      setStatusMessage({ 
        text: `Kopyalanan e-tablo hücreleri başarıyla çözümlendi! (Veri Ölçüm Karakteri: ${localDataType === 'area' ? 'Alan m²' : 'Miktar/Adet'})`, 
        type: 'success' 
      });
    } else {
      setPasteError("Veri ayrıştırılamadı. Lütfen excel/e-tablonuzdan başlık satırı dahil en az 1 satır kopyaladığınızdan emin olun.");
    }
  };

  return (
    <div id="google-connector-card" className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden text-slate-800">
      
      {/* Right Column: Paste TSV Area */}
      <div className="bg-white p-6 flex flex-col">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1.5 h-5 bg-blue-600 rounded-full"></div>
          <h3 className="font-bold text-slate-900 flex items-center gap-1.5 text-sm uppercase tracking-wide">
            <ClipboardList className="w-4 h-4 text-blue-600" />
            E-Tablodan Hücreleri Yapıştırın
          </h3>
        </div>

        <div className="space-y-4">
          <textarea
            id="raw-paste-textarea"
            placeholder="E-tablonuzdaki satırları (başlık dahil) kopyalayıp buraya yapıştırın. Örn:&#10;Karar Bölgesi&#9;KURU ÖZEL ÜRÜN ARAZİSİ&#9;DİKİLİ TARIM ARAZİSİ&#10;Marmara&#9;450000&#9;120000&#10;Ege&#9;180000&#9;600000"
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            className="w-full min-h-[140px] text-[11.5px] p-3.5 bg-stone-50 border border-slate-200 rounded-xl font-mono focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-0 transition-all leading-normal text-stone-850"
          />

          {/* Veri Türü Seçimi */}
          <div className="bg-stone-50 border border-stone-150 p-3 rounded-xl space-y-1.5 text-left">
            <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wide block font-sans">
              Yapıştırılan Veri Türü / Ölçüm Karakteri:
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                id="data-type-select-area"
                onClick={() => setLocalDataType('area')}
                className={`flex-1 py-1.5 px-3 rounded-lg border text-xs font-bold font-sans transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  localDataType === 'area'
                    ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                    : 'bg-white border-stone-200 text-stone-650 hover:bg-stone-105'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span>
                Alan (m²)
              </button>
              <button
                type="button"
                id="data-type-select-count"
                onClick={() => setLocalDataType('count')}
                className={`flex-1 py-1.5 px-3 rounded-lg border text-xs font-bold font-sans transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  localDataType === 'count'
                    ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                    : 'bg-white border-stone-200 text-stone-650 hover:bg-stone-105'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                Miktar / Adet / Sayı
              </button>
            </div>
          </div>
          
          {pasteError && (
            <p className="text-xs text-rose-600 font-sans flex items-center gap-1.5 font-semibold">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {pasteError}
            </p>
          )}

          <button
            id="paste-import-btn"
            onClick={handlePasteSubmit}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm uppercase tracking-wider cursor-pointer"
          >
            Yapıştırılan Verileri Çözümle
            <Grid className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Feedbacks Panel */}
      {statusMessage.text && (
        <div className={`px-5 py-3 border-t text-xs font-sans tracking-wide flex items-center justify-between gap-2 ${
          statusMessage.type === 'success' ? 'bg-emerald-50 text-emerald-900 border-emerald-100' :
          statusMessage.type === 'error' ? 'bg-rose-50 text-rose-800 border-rose-100' :
          'bg-stone-50 text-stone-650 border-stone-100'
        }`}>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
            <span className="font-semibold">{statusMessage.text}</span>
          </div>
          <button 
            id="close-status-message-btn"
            onClick={() => setStatusMessage({ text: "", type: null })} 
            className="text-[10px] hover:underline text-stone-500 hover:text-stone-900 font-bold cursor-pointer"
          >
            Kapat
          </button>
        </div>
      )}
    </div>
  );
}
