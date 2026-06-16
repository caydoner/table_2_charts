/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import GoogleConnector from './components/GoogleConnector';
import CustomGroupConfig from './components/CustomGroupConfig';
import CustomRowGroupConfig from './components/CustomRowGroupConfig';
import VisualCharter from './components/VisualCharter';
import ReportTable from './components/ReportTable';
import { DEFAULT_CUSTOM_GROUPS, DEMO_SPREADSHEET } from './demoData';
import { type CustomGroup, type CustomRowGroup } from './types';
import { 
  FileSpreadsheet, 
  TreePine, 
  Layers, 
  Settings2, 
  HelpCircle, 
  Info,
  Sparkles,
  RefreshCw,
  TrendingUp,
  MapPin,
  CheckCircle,
  FolderLock
} from 'lucide-react';


export default function App() {
  // Loaded raw dataset
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string | number>[]>([]);
  const [sourceName, setSourceName] = useState<string>("");
  const [sheetName, setSheetName] = useState<string>("");
  const [sheetsList, setSheetsList] = useState<string[]>([]);
  const [spreadsheetId, setSpreadsheetId] = useState<string>("");

  // Column Mapping State
  const [regionColumn, setRegionColumn] = useState<string>("");
  const [selectedAreaColumns, setSelectedAreaColumns] = useState<string[]>([]);

  // Custom Sütun Grupları (Custom Groups)
  const [customGroups, setCustomGroups] = useState<CustomGroup[]>([]);

  // Custom Satır Grupları (Custom Row Groups)
  const [customRowGroups, setCustomRowGroups] = useState<CustomRowGroup[]>([]);
  const [mergeRowGroups, setMergeRowGroups] = useState<boolean>(true);

  // Data character state (Alan m2 vs. Adet sayı)
  const [dataType, setDataType] = useState<'area' | 'count'>('area');

  // Active/selected rows & columns for synchronization
  const [activeColumns, setActiveColumns] = useState<string[]>([]);
  const [activeGroups, setActiveGroups] = useState<string[]>([]);
  const [activeRegions, setActiveRegions] = useState<string[]>([]);

  // Label dictionary alias state
  const [labelAliases, setLabelAliases] = useState<Record<string, string>>({});

  // 1. Process dataset rows taking Custom Row (Region) Groups into account
  const processedRows = useMemo(() => {
    if (!regionColumn || customRowGroups.length === 0) {
      return rows;
    }

    const groupedRegionNames = new Set<string>();
    customRowGroups.forEach((group) => {
      group.selectedRegions.forEach((r) => {
        groupedRegionNames.add(r);
      });
    });

    const groupRows = customRowGroups.map((group) => {
      const groupRecord: Record<string, string | number | boolean> = {
        [regionColumn]: group.name,
        __isGroupRow__: true,
      };

      headers.forEach((col) => {
        if (col === regionColumn) return;
        
        let sum = 0;
        let isAnyNumeric = false;
        
        rows.forEach((row) => {
          const rowRegion = String(row[regionColumn] || "");
          if (group.selectedRegions.includes(rowRegion)) {
            const val = row[col];
            if (val !== undefined && val !== null && val !== "" && !isNaN(Number(val))) {
              sum += Number(val);
              isAnyNumeric = true;
            }
          }
        });
        
        if (isAnyNumeric) {
          groupRecord[col] = sum;
        } else {
          groupRecord[col] = "";
        }
      });

      return groupRecord;
    });

    if (mergeRowGroups) {
      const nonGroupedRows = rows.filter((row) => {
        const rowRegion = String(row[regionColumn] || "");
        return !groupedRegionNames.has(rowRegion);
      });
      return [...groupRows, ...nonGroupedRows];
    } else {
      return [...groupRows, ...rows];
    }
  }, [rows, customRowGroups, regionColumn, headers, mergeRowGroups]);

  // Synchronize active elements in App when source datasets change
  const uniqueRegions = useMemo(() => {
    return Array.from(new Set(processedRows.map((row) => String(row[regionColumn] || "Bilinmeyen Bölge"))));
  }, [processedRows, regionColumn]);

  const rawUniqueRegions = useMemo(() => {
    return Array.from(new Set(rows.map((row) => String(row[regionColumn] || "Bilinmeyen Bölge"))));
  }, [rows, regionColumn]);

  useEffect(() => {
    setActiveRegions(uniqueRegions);
  }, [uniqueRegions]);

  useEffect(() => {
    setActiveColumns(selectedAreaColumns);
  }, [selectedAreaColumns]);

  useEffect(() => {
    setActiveGroups(customGroups.map(g => g.name));
  }, [customGroups]);

  // UI state toggles
  const [showConfig, setShowConfig] = useState(false);
  const [loadingSheetToggle, setLoadingSheetToggle] = useState(false);

  // Auto-Detect Headers & Regions on new data load
  const autoDetectColumns = (
    loadedHeaders: string[], 
    loadedRows: Record<string, string | number>[],
    loadedSourceName: string
  ) => {
    if (loadedHeaders.length === 0 || loadedRows.length === 0) return;

    // 1. Detect "Karar Bölgesi" column
    // Searches Turkish and English common geographical registry keys
    const regionKeywords = ["KARAR", "BÖLGE", "ILCE", "İLÇE", "İL", "ZONE", "REGION", "GEOGRAPHY", "PLACE", "AD", "BÖLGESI", "BÖLGESİ"];
    let detectedRegion = "";
    
    // Check key strings pattern
    for (const h of loadedHeaders) {
      const upperH = h.toUpperCase().replace(/İ/g, "I");
      if (regionKeywords.some(keyword => upperH.includes(keyword))) {
        detectedRegion = h;
        break;
      }
    }
    // Fallback if not matching: take the first column
    if (!detectedRegion) {
      detectedRegion = loadedHeaders[0];
    }

    // 2. Detect area columns representing measurements
    // Checks if the column values are predominantly numerical, and not indeed the region column itself
    const detectedAreas: string[] = [];
    loadedHeaders.forEach((h) => {
      if (h === detectedRegion) return;
      
      // Look key name keywords or check type of row values
      const valSample = loadedRows[0]?.[h];
      const isNumeric = typeof valSample === 'number' && !isNaN(valSample);
      
      const areaKeywords = ["M²", "M2", "ALAN", "ARAZİ", "ARAZİSİ", "ARAZI", "METREKARE", "MİKTAR", "VOLUME", "SIZE", "SUM"];
      const matchesKeyword = areaKeywords.some(kw => h.toUpperCase().includes(kw));

      if (isNumeric || matchesKeyword) {
        detectedAreas.push(h);
      }
    });

    setRegionColumn(detectedRegion);
    setSelectedAreaColumns(detectedAreas);

    // Apply default Turkish agriculture grouping if demo dataset or first time loaded is detected
    if (loadedSourceName.includes("Türkiye Tarım") || loadedHeaders.includes("KURU MARJİNAL TARIM ARAZİSİ")) {
      setCustomGroups(DEFAULT_CUSTOM_GROUPS);
    } else {
      // Clear or leave empty for external sheets so users can make bespoke ones
      setCustomGroups([]);
    }
    setCustomRowGroups([]);
  };

  // Callback mapping for child loaders
  const handleDataLoaded = (
    loadedHeaders: string[], 
    loadedRows: Record<string, string | number>[], 
    loadedSourceName: string, 
    loadedSheetName: string,
    loadedSheetsList?: string[],
    loadedSpreadsheetId?: string,
    initialDataType?: 'area' | 'count'
  ) => {
    setHeaders(loadedHeaders);
    setRows(loadedRows);
    setSourceName(loadedSourceName);
    setSheetName(loadedSheetName);
    
    // Set data type based on the loaded dataset character
    if (initialDataType) {
      setDataType(initialDataType);
    } else {
      setDataType('area');
    }
    
    if (loadedSheetsList) {
      setSheetsList(loadedSheetsList);
    } else {
      setSheetsList([]);
    }

    if (loadedSpreadsheetId) {
      setSpreadsheetId(loadedSpreadsheetId);
    } else {
      setSpreadsheetId("");
    }

    autoDetectColumns(loadedHeaders, loadedRows, loadedSourceName);
  };

  // Handle switching internal files offline for the demo dataset
  const handleSwitchInternalSheet = (newSheetName: string) => {
    if (spreadsheetId === DEMO_SPREADSHEET.id && DEMO_SPREADSHEET.sheets[newSheetName]) {
      const sheetData = DEMO_SPREADSHEET.sheets[newSheetName];
      setSheetName(newSheetName);
      setHeaders(sheetData.headers);
      setRows(sheetData.rows);
      autoDetectColumns(sheetData.headers, sheetData.rows, sourceName);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans antialiased text-slate-800 bg-[#f8fafc]">
      
      {/* GLOBAL TOP APP BAR (Professional Slate and Royal Blue accents) */}
      <header className="bg-slate-900 border-b border-slate-800 text-white shadow-sm shrink-0">
        <div className="max-w-7xl mx-auto px-5 py-4.5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg border border-blue-500 shadow-inner">
              <FileSpreadsheet className="w-5.5 h-5.5 text-white" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-white m-0">
                TABLOSAL VERİ GÖRSELLEŞTİRME VE RAPORLAMA PANELİ
              </h1>
            </div>
          </div>
          
          {/* Quick Stats Summary top badges */}
          {rows.length > 0 && (
            <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold max-w-sm truncate text-slate-300">
              <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
              <span className="truncate">
                Aktif Sayfa: <strong className="text-white font-bold">{sheetName}</strong>
              </span>
            </div>
          )}
        </div>
      </header>

      {/* CORE FRAMEWORK CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-6 py-6 space-y-6">
        
        {/* 1. DATA SELECTOR & CONNECTORS ROW */}
        <div className="transition-all duration-300">
          <GoogleConnector 
            onDataLoaded={handleDataLoaded} 
            activeSpreadsheetId={spreadsheetId} 
            activeSheetName={sheetName} 
          />
        </div>



        {rows.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-xs text-center text-slate-800">
            <p className="text-xs text-stone-550 font-sans tracking-wide">
              Lütfen yukarıdaki kutuya e-tablo verilerinizi kopyalayıp "Yapıştırılan Verileri Çözümle" butonuna dokunarak yeni bir rapor başlatın.
            </p>
          </div>
        ) : (
          /* ACTIVE DATABASE CONTENT FLOW */
          <div className="space-y-6 animate-fade-in">
            
            {/* 3. OPTIONAL COLUMN CONFIGURATOR */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm text-slate-800 animate-fade-in">
              <button
                id="accordion-config-trigger"
                onClick={() => setShowConfig(!showConfig)}
                className="w-full text-left p-5 flex items-center justify-between hover:bg-slate-50/50 transition-colors focus:outline-none cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-slate-100 rounded-lg text-slate-700">
                    <Settings2 className="w-4 h-4 text-slate-800" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 tracking-tight text-sm uppercase">
                      Grafik Eksenlerinin Düzenlenmesi
                    </h3>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-[11px] bg-slate-100 border border-slate-200 text-slate-600 px-2.5 py-1 rounded-full font-sans font-semibold">
                    {showConfig ? "Ayarları Gizle" : "Ayarları Düzenle"}
                  </span>
                </div>
              </button>

              {/* Collapsed content container */}
              {showConfig && (
                <div id="accordion-config-content" className="p-5 border-t border-slate-150 bg-slate-50/30 grid grid-cols-1 md:grid-cols-3 gap-6 animate-slide-down">
                  
                  {/* Select Region Column */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                      YATAY EKSEN
                    </label>
                    <select
                      id="conf-region-select"
                      value={regionColumn}
                      onChange={(e) => setRegionColumn(e.target.value)}
                      className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 font-sans cursor-pointer"
                    >
                      {headers.map((h, hIdx) => (
                        <option key={`${h}-${hIdx}`} value={h}>{h}</option>
                      ))}
                    </select>
                    <p className="text-[10px] text-slate-500 leading-normal font-sans">
                      Grafiklerde yatay eksende gösterilecek ve alansal verilerin gruplanacağı coğrafi bölge veya karar adı kolonu.
                    </p>
                  </div>

                  {/* Select Area Columns */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-705 uppercase tracking-wider block">
                      ÖLÇÜM KOLONLARI
                    </label>
                    <div className="max-h-40 overflow-y-auto p-2 border border-slate-200 rounded-lg bg-white space-y-1">
                      {headers.map((h, hIdx) => {
                        if (h === regionColumn) return null;
                        const isChecked = selectedAreaColumns.includes(h);
                        return (
                          <label key={`${h}-${hIdx}`} className="flex items-center gap-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 p-1.5 rounded cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              id={`config-check-${h.replace(/\s+/g, '-')}`}
                              onChange={() => {
                                // Prevent unselecting everything
                                if (isChecked) {
                                  setSelectedAreaColumns(selectedAreaColumns.filter(c => c !== h));
                                } else {
                                  setSelectedAreaColumns([...selectedAreaColumns, h]);
                                }
                              }}
                              className="rounded text-blue-650 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                            />
                            <span className="truncate">{h}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Override Data Measurement Character */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                      ÖLÇÜM BİRİMİ
                    </label>
                    <div className="space-y-1 p-1 bg-white border border-slate-200 rounded-xl">
                      <button
                        type="button"
                        id="override-type-area"
                        onClick={() => setDataType('area')}
                        className={`w-full text-left text-xs p-2 rounded-lg flex items-center justify-between font-bold transition-all cursor-pointer ${
                          dataType === 'area'
                            ? 'bg-blue-50 text-blue-800'
                            : 'bg-white hover:bg-slate-50 text-slate-650'
                        }`}
                      >
                        <span className="font-sans">Alan Ölçümü (m²)</span>
                        {dataType === 'area' && <span className="text-[10px] uppercase font-bold text-blue-600 bg-blue-100/50 px-1.5 py-0.5 rounded">Aktif</span>}
                      </button>
                      <button
                        type="button"
                        id="override-type-count"
                        onClick={() => setDataType('count')}
                        className={`w-full text-left text-xs p-2 rounded-lg flex items-center justify-between font-bold transition-all cursor-pointer ${
                          dataType === 'count'
                            ? 'bg-blue-50 text-blue-800'
                            : 'bg-white hover:bg-slate-50 text-slate-650'
                        }`}
                      >
                        <span className="font-sans">Miktar / Adet / Sayı</span>
                        {dataType === 'count' && <span className="text-[10px] uppercase font-bold text-blue-600 bg-blue-100/50 px-1.5 py-0.5 rounded">Aktif</span>}
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-normal font-sans">
                      Dilediğiniz an veri setinin çalışma birim biçimini değiştirebilirsiniz. "Miktar / Adet" modunda veriler doğrudan sayım adeti olarak grafiğe yansıtılır.
                    </p>
                  </div>

                </div>
              )}
            </div>

            {/* 4. CUSTOM GROUP BUILDER PANEL (COLUMN GRPS) */}
            <CustomGroupConfig 
              availableColumns={selectedAreaColumns} 
              customGroups={customGroups} 
              onGroupsChange={(newGroups) => setCustomGroups(newGroups)} 
            />

            {/* CUSTOM ROW GROUP BUILDER PANEL (ROW GRPS) */}
            <CustomRowGroupConfig
              regionColumn={regionColumn}
              availableRegions={rawUniqueRegions}
              customRowGroups={customRowGroups}
              onRowGroupsChange={(newGroups) => setCustomRowGroups(newGroups)}
              mergeRowGroups={mergeRowGroups}
              onMergeRowGroupsChange={(val) => setMergeRowGroups(val)}
            />

            {/* 5. VISUAL CHARTER PANEL (BARS, PIE) */}
            <VisualCharter 
              sheetName={sheetName} 
              sourceName={sourceName} 
              headers={headers} 
              rows={processedRows} 
              regionColumn={regionColumn} 
              selectedAreaColumns={selectedAreaColumns} 
              customGroups={customGroups} 
              dataType={dataType}
              activeColumns={activeColumns}
              setActiveColumns={setActiveColumns}
              activeGroups={activeGroups}
              setActiveGroups={setActiveGroups}
              activeRegions={activeRegions}
              setActiveRegions={setActiveRegions}
              labelAliases={labelAliases}
              setLabelAliases={setLabelAliases}
            />

            {/* 6. TABULAR SUMMARY REPORTS GRID */}
            <ReportTable 
              rows={processedRows} 
              regionColumn={regionColumn} 
              selectedAreaColumns={selectedAreaColumns} 
              customGroups={customGroups} 
              dataType={dataType}
              activeColumns={activeColumns}
              activeGroups={activeGroups}
              activeRegions={activeRegions}
              labelAliases={labelAliases}
              mergeRowGroups={mergeRowGroups}
            />

          </div>
        )}

      </main>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-8 mt-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-5 flex flex-col md:flex-row items-center justify-end gap-4">
          <div className="flex items-center gap-4 text-[11px] font-semibold font-sans">
            <span className="text-slate-400">Bu uygulama Cihangir AYDÖNER tarafından geliştirilmiştir.</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
