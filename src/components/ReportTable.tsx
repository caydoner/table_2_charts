/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useCallback } from 'react';
import { type CustomGroup } from '../types';
import { 
  Download, 
  Copy, 
  Search, 
  ArrowUpDown, 
  Check, 
  FileSpreadsheet,
  Layers,
  Calculator
} from 'lucide-react';

interface ReportTableProps {
  rows: Record<string, string | number>[];
  regionColumn: string;
  selectedAreaColumns: string[];
  customGroups: CustomGroup[];
  dataType?: 'area' | 'count';
  activeColumns?: string[];
  activeGroups?: string[];
  activeRegions?: string[];
  labelAliases?: Record<string, string>;
  mergeRowGroups?: boolean;
}

export default function ReportTable({
  rows,
  regionColumn,
  selectedAreaColumns,
  customGroups,
  dataType = 'area',
  activeColumns,
  activeGroups,
  activeRegions,
  labelAliases = {},
  mergeRowGroups = true
}: ReportTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [unit, setUnit] = useState<'m2' | 'hectare'>('m2');
  const [copied, setCopied] = useState(false);
  const [showPercentages, setShowPercentages] = useState(true);
  
  // Custom Display label translation function
  const getLabel = (key: string) => labelAliases[key] || key;

  // Filter custom groups and selected columns based on active selection from chart filter lists
  const displayedGroups = useMemo(() => {
    return customGroups.filter((g) => activeGroups ? activeGroups.includes(g.name) : true);
  }, [customGroups, activeGroups]);

  const displayedAreaColumns = useMemo(() => {
    return selectedAreaColumns.filter((col) => activeColumns ? activeColumns.includes(col) : true);
  }, [selectedAreaColumns, activeColumns]);
  
  // Sorting state
  const [sortField, setSortField] = useState<string>(regionColumn);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Value formatting helper (plain numbers without suffix tags in cells)
  const formatCell = (val: number | string) => {
    if (typeof val === 'string') return val;
    if (dataType === 'count') {
      return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(val);
    }
    if (unit === 'hectare') {
      const ha = val / 10000;
      return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 1 }).format(ha);
    }
    return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(val);
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc'); // Numerical values sorting defaults to descending first
    }
  };

  // 1. Compile row data carrying virtual groups computed sums
  const computedTableRows = useMemo(() => {
    return rows.map((row) => {
      const compiledRecord: Record<string, string | number> = { ...row };

      // Add pre-computed virtual groups
      customGroups.forEach((group) => {
        let sum = 0;
        group.selectedColumns.forEach((col) => {
          sum += Number(row[col]) || 0;
        });
        compiledRecord[group.name] = sum;
      });

      return compiledRecord;
    });
  }, [rows, customGroups]);

  // 2. Filter rows (respect active selected regions / horizontal axis values, and table search query)
  const filteredRows = useMemo(() => {
    let result = computedTableRows;
    if (activeRegions) {
      result = result.filter((row) => {
        const rName = String(row[regionColumn] || "Bilinmeyen Bölge");
        return activeRegions.includes(rName);
      });
    }
    
    if (!searchTerm.trim()) return result;
    const term = searchTerm.toLowerCase();
    return result.filter((r) => 
      String(r[regionColumn] || "").toLowerCase().includes(term)
    );
  }, [computedTableRows, searchTerm, regionColumn, activeRegions]);

  // Helper to compute a single row's aggregated sum based on displayed/active columns or groups
  const getRowSumHelper = useCallback((r: Record<string, string | number>) => {
    if (displayedAreaColumns.length > 0) {
      return displayedAreaColumns.reduce((acc, col) => acc + (Number(r[col]) || 0), 0);
    }
    return displayedGroups.reduce((acc, g) => acc + (Number(r[g.name]) || 0), 0);
  }, [displayedAreaColumns, displayedGroups]);

  // 3. Sort rows
  const sortedRows = useMemo(() => {
    const sorted = [...filteredRows];
    sorted.sort((a, b) => {
      let valA: string | number;
      let valB: string | number;

      if (sortField === '__row_total__') {
        valA = getRowSumHelper(a);
        valB = getRowSumHelper(b);
      } else {
        valA = a[sortField];
        valB = b[sortField];
      }

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      }
      
      const strA = String(valA || "").toLocaleLowerCase('tr');
      const strB = String(valB || "").toLocaleLowerCase('tr');
      return sortDirection === 'asc' 
        ? strA.localeCompare(strB) 
        : strB.localeCompare(strA);
    });
    return sorted;
  }, [filteredRows, sortField, sortDirection, getRowSumHelper]);

  // 4. Calculate Column Totals (on filtered rows and displayed columns)
  const totals = useMemo(() => {
    const totalRecord: Record<string, number> = {};

    // If mergeRowGroups is false, we should exclude the virtual group rows from the totals calculation
    // to avoid double-counting the sub-regions and rendering incorrect column percentages (K ratios).
    const rowsForTotals = filteredRows.filter((r) => {
      if (!mergeRowGroups && r.__isGroupRow__ === true) {
        return false;
      }
      return true;
    });

    displayedAreaColumns.forEach((col) => {
      totalRecord[col] = rowsForTotals.reduce((acc, r) => acc + (Number(r[col]) || 0), 0);
    });

    displayedGroups.forEach((g) => {
      totalRecord[g.name] = rowsForTotals.reduce((acc, row) => {
        let s = 0;
        g.selectedColumns.forEach((col) => {
          s += Number(row[col]) || 0;
        });
        return acc + s;
      }, 0);
    });

    return totalRecord;
  }, [filteredRows, displayedAreaColumns, displayedGroups, mergeRowGroups]);

  // Grand Total of either active individual columns or custom virtual groups if no individual ones are active
  const grandTotal = useMemo(() => {
    if (displayedAreaColumns.length > 0) {
      return displayedAreaColumns.reduce((acc, col) => acc + (totals[col] || 0), 0);
    }
    return displayedGroups.reduce((acc, g) => acc + (totals[g.name] || 0), 0);
  }, [totals, displayedAreaColumns, displayedGroups]);

  // CSV Exporter
  const handleDownloadCSV = () => {
    const headersList = [regionColumn, ...displayedGroups.map(g => g.name), ...displayedAreaColumns];
    const headersListWithTotal = [...headersList, "TOPLAM"];
    let csvContent = "\uFEFF"; // UTF-8 BOM for Microsoft Excel Turkish character compatibility

    // Heading row
    csvContent += headersListWithTotal.map(h => `"${getLabel(h)}"`).join(";") + "\n";

    // Row contents - using sortedRows so sorted order matches visual table
    sortedRows.forEach((row) => {
      const rowSumVal = getRowSumHelper(row);

      const line = headersListWithTotal.map(h => {
        if (h === regionColumn) {
          const val = row[h];
          return `"${getLabel(String(val || ''))}"`;
        }

        if (h === "TOPLAM") {
          const formattedVal = formatCell(rowSumVal);
          if (showPercentages) {
            const grandPct = grandTotal > 0 ? (rowSumVal / grandTotal) * 100 : 0;
            return `"${formattedVal} (G: %${grandPct.toFixed(1)})"`;
          }
          return `"${formattedVal}"`;
        }

        const cellValue = Number(row[h]) || 0;
        const formattedVal = formatCell(cellValue);

        if (showPercentages) {
          const rowPct = rowSumVal > 0 ? (cellValue / rowSumVal) * 100 : 0;
          const colTotal = totals[h] || 0;
          const colPct = colTotal > 0 ? (cellValue / colTotal) * 100 : 0;
          return `"${formattedVal} (S: %${rowPct.toFixed(1)}, K: %${colPct.toFixed(1)})"`;
        }
        return `"${formattedVal}"`;
      });
      csvContent += line.join(";") + "\n";
    });

    // Totals bottom line
    const totalsLine = headersListWithTotal.map(h => {
      if (h === regionColumn) return `"TOPLAM"`;

      if (h === "TOPLAM") {
        const formattedVal = formatCell(grandTotal);
        if (showPercentages) {
          return `"${formattedVal} (%100.0)"`;
        }
        return `"${formattedVal}"`;
      }

      const colVal = totals[h] || 0;
      const formattedVal = formatCell(colVal);

      if (showPercentages) {
        const grandPct = grandTotal > 0 ? (colVal / grandTotal) * 100 : 0;
        return `"${formattedVal} (%${grandPct.toFixed(1)})"`;
      }
      return `"${formattedVal}"`;
    });
    csvContent += totalsLine.join(";") + "\n";

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.id = "csv-downloader-link";
    link.setAttribute("href", url);

    const filePrefix = dataType === 'count' ? 'Sayim_Miktar_Raporu' : 'Alansal_Veri_Raporu';
    link.setAttribute("download", `${filePrefix}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Copy to spreadsheet layout direct (TSV style cells)
  const handleCopyToClipboard = () => {
    const headersList = [regionColumn, ...displayedGroups.map(g => g.name), ...displayedAreaColumns];
    const headersListWithTotal = [...headersList, "TOPLAM"];
    let clipboardText = headersListWithTotal.map(h => getLabel(h)).join("\t") + "\n";

    sortedRows.forEach((row) => {
      const rowSumVal = getRowSumHelper(row);

      clipboardText += headersListWithTotal.map(h => {
        if (h === regionColumn) {
          const val = row[h];
          return getLabel(String(val || ""));
        }

        if (h === "TOPLAM") {
          const formattedVal = formatCell(rowSumVal);
          if (showPercentages) {
            const grandPct = grandTotal > 0 ? (rowSumVal / grandTotal) * 100 : 0;
            return `${formattedVal} (G: %${grandPct.toFixed(1)})`;
          }
          return formattedVal;
        }

        const cellValue = Number(row[h]) || 0;
        const formattedVal = formatCell(cellValue);

        if (showPercentages) {
          const rowPct = rowSumVal > 0 ? (cellValue / rowSumVal) * 100 : 0;
          const colTotal = totals[h] || 0;
          const colPct = colTotal > 0 ? (cellValue / colTotal) * 100 : 0;
          return `${formattedVal} (S: %${rowPct.toFixed(1)}, K: %${colPct.toFixed(1)})`;
        }
        return formattedVal;
      }).join("\t") + "\n";
    });

    // Totals line
    clipboardText += headersListWithTotal.map(h => {
      if (h === regionColumn) return "TOPLAM";

      if (h === "TOPLAM") {
        const formattedVal = formatCell(grandTotal);
        if (showPercentages) {
          return `${formattedVal} (%100.0)`;
        }
        return formattedVal;
      }

      const colVal = totals[h] || 0;
      const formattedVal = formatCell(colVal);

      if (showPercentages) {
        const grandPct = grandTotal > 0 ? (colVal / grandTotal) * 100 : 0;
        return `${formattedVal} (%${grandPct.toFixed(1)})`;
      }
      return formattedVal;
    }).join("\t") + "\n";

    navigator.clipboard.writeText(clipboardText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div id="report-table-card" className="bg-white border border-slate-205 rounded-2xl shadow-sm text-slate-800 p-6 space-y-4">
      
      {/* Grid Toolbar: Search, Unit Toggler, Copy & Export buttons */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        
        {/* Search regions */}
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-stone-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            id="region-search-input"
            type="text"
            placeholder="Karar bölgesi ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-9 pr-4 py-2 border border-slate-300 rounded-lg bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition-all font-sans"
          />
        </div>

        {/* Buttons and unit options */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Unit selector buttons */}
          {dataType === 'area' && (
            <div className="inline-flex rounded-lg border border-stone-300 p-0.5 bg-white text-[11px] font-bold">
              <button
                id="tbl-unit-toggle-m2"
                onClick={() => setUnit('m2')}
                className={`px-2.5 py-1.5 rounded-md transition-colors ${
                  unit === 'm2' ? 'bg-stone-800 text-white' : 'text-stone-700 hover:bg-stone-100'
                }`}
              >
                M² Göster
              </button>
              <button
                id="tbl-unit-toggle-ha"
                onClick={() => setUnit('hectare')}
                className={`px-2.5 py-1.5 rounded-md transition-colors ${
                  unit === 'hectare' ? 'bg-stone-800 text-white' : 'text-stone-700 hover:bg-stone-100'
                }`}
              >
                Hektar (ha)
              </button>
            </div>
          )}

          {dataType === 'count' && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 text-stone-700 border border-stone-200 rounded-lg text-xs font-bold leading-none">
              <Calculator className="w-3.5 h-3.5 text-stone-500" />
              Adet / Sayım Gösterimi
            </div>
          )}

          {/* Percentage overlay toggle switch */}
          <div 
            className="inline-flex items-center gap-1.5 bg-indigo-50/50 border border-indigo-200 px-2.5 py-1.5 rounded-lg text-xs cursor-pointer select-none hover:bg-indigo-100/50 transition-all font-semibold"
            onClick={() => setShowPercentages(!showPercentages)}
          >
            <input 
              type="checkbox" 
              checked={showPercentages} 
              onChange={() => {}} 
              className="rounded text-indigo-600 focus:ring-indigo-500 accent-indigo-600 mr-0.5 cursor-pointer w-3.5 h-3.5"
            />
            <span className="text-indigo-950 font-sans text-[11px]">
              % Oranları Göster
            </span>
          </div>

          {/* Copy cells button */}
          <button
            id="copy-to-clipboard-btn"
            onClick={handleCopyToClipboard}
            className="px-3 py-2 border border-slate-355 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 rounded-lg inline-flex items-center gap-1.5 transition-all active:scale-[0.98]"
            title="E-tabloya yapıştırmak üzere kopyala"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-blue-600 animate-scale-up" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Kopyalandı!" : "Tabloyu Kopyala"}
          </button>

          {/* Export CSV button */}
          <button
            id="download-csv-btn"
            onClick={handleDownloadCSV}
            className="px-3 py-2 bg-stone-800 hover:bg-stone-900 active:bg-stone-950 text-white text-xs font-bold rounded-lg inline-flex items-center gap-1.5 transition-all shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            Excel/CSV İndir
          </button>

        </div>
      </div>

      {/* Main Responsive Grid Tabular Area */}
      {sortedRows.length === 0 ? (
        <div className="p-8 bg-stone-50 border border-stone-100 rounded-xl text-center text-xs text-stone-500">
          Arama kriterine uyan karar bölgesi bulunamadı.
        </div>
      ) : (
        <div className="overflow-x-auto border border-slate-205 rounded-xl bg-white shadow-xs">
          <table className="w-full text-left border-collapse" id="data-report-grid">
            {/* Table headers */}
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200">
                {/* Region Header column */}
                <th 
                  id={`grid-header-${regionColumn.replace(/\s+/g, '-')}`}
                  onClick={() => handleSort(regionColumn)}
                  className="px-4 py-3 text-xs font-bold text-stone-700 cursor-pointer select-none hover:bg-stone-105/80 transition-colors"
                >
                  <div className="flex items-center gap-1 leading-none uppercase tracking-wider">
                    {getLabel(regionColumn)}
                    <ArrowUpDown className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                  </div>
                </th>

                {/* Custom virtual groups calculated columns */}
                {displayedGroups.map((g) => {
                  const headerUnit = unit === 'hectare' ? 'ha' : dataType === 'count' ? 'adet' : 'm²';
                  return (
                    <th
                      key={g.id}
                      id={`grid-header-${g.name.replace(/\s+/g, '-')}`}
                      onClick={() => handleSort(g.name)}
                      className="px-4 py-3 text-xs font-bold text-slate-900 cursor-pointer select-none hover:bg-slate-105/80 transition-colors border-l border-slate-200/50 bg-blue-50/20"
                    >
                      <div className="flex items-center justify-between gap-1 leading-none uppercase tracking-wider">
                        <div className="flex items-center gap-1.5">
                          <Layers className="w-3 h-3 text-blue-600" />
                          <span className="text-blue-950">{getLabel(g.name)} ({headerUnit}) (Sanal)</span>
                        </div>
                        <ArrowUpDown className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      </div>
                    </th>
                  );
                })}

                {/* Normal individual columns */}
                {displayedAreaColumns.map((col, cIdx) => {
                  const headerUnit = unit === 'hectare' ? 'ha' : dataType === 'count' ? 'adet' : 'm²';
                  return (
                    <th
                      key={`${col}-${cIdx}`}
                      id={`grid-header-${col.replace(/\s+/g, '-')}`}
                      onClick={() => handleSort(col)}
                      className="px-4 py-3 text-xs font-bold text-stone-600 cursor-pointer select-none hover:bg-stone-100/80 transition-colors border-l border-stone-200/50"
                    >
                      <div className="flex items-center justify-between gap-1 leading-none uppercase tracking-wider">
                        <span className="truncate max-w-[155px]" title={getLabel(col)}>{getLabel(col)} ({headerUnit})</span>
                        <ArrowUpDown className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      </div>
                    </th>
                  );
                })}

                {/* Row Total header */}
                <th
                  id="grid-header-row-total"
                  onClick={() => handleSort('__row_total__')}
                  className="px-4 py-3 text-xs font-bold text-indigo-900 cursor-pointer select-none hover:bg-indigo-100/80 transition-colors border-l-2 border-slate-300 bg-slate-100/50"
                >
                  <div className="flex items-center justify-between gap-1 leading-none uppercase tracking-wider">
                    <span className="font-extrabold text-slate-900">TOPLAM</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  </div>
                </th>
              </tr>
            </thead>

            {/* Table rows */}
            <tbody className="divide-y divide-stone-150">
              {sortedRows.map((row, idx) => {
                const rowSumVal = getRowSumHelper(row);

                return (
                  <tr 
                    key={idx} 
                    id={`grid-row-${idx}`}
                    className="hover:bg-slate-50/80 text-[11px] leading-normal font-sans font-medium transition-colors"
                  >
                    {/* Region field */}
                    <td className="px-4 py-2.5 font-semibold text-stone-900 truncate max-w-[170px]" id={`grid-cell-region-${idx}`}>
                      {getLabel(String(row[regionColumn] || ""))}
                    </td>

                    {/* Custom calculated groups values */}
                    {displayedGroups.map((g) => {
                      const cellValue = Number(row[g.name]) || 0;
                      const rowPct = rowSumVal > 0 ? (cellValue / rowSumVal) * 100 : 0;
                      const colPct = (totals[g.name] || 0) > 0 ? (cellValue / (totals[g.name] || 0)) * 100 : 0;

                      return (
                        <td 
                          key={g.id} 
                          className="px-4 py-2.5 border-l border-slate-200/50 bg-blue-50/5"
                          id={`grid-cell-${g.name.replace(/\s+/g, '-')}-${idx}`}
                        >
                          <div className="flex flex-col items-end">
                            <span className="font-mono font-bold text-blue-800">{formatCell(cellValue)}</span>
                            {showPercentages && (
                              <div className="text-[9px] text-slate-400 font-sans mt-0.5 whitespace-nowrap leading-none flex items-center gap-1.5 pt-0.5 border-t border-slate-100/40">
                                <span title="Satır içi oran (Bu bölgedeki payı)">
                                  S: <span className="text-blue-700/80 font-semibold">%{(rowPct).toFixed(1)}</span>
                                </span>
                                <span className="text-slate-300">|</span>
                                <span title="Kolon içi oran (Tüm bölgeler arasındaki payı)">
                                  K: <span className="text-blue-700/80 font-semibold">%{(colPct).toFixed(1)}</span>
                                </span>
                              </div>
                            )}
                          </div>
                        </td>
                      );
                    })}

                    {/* Standard columns values */}
                    {displayedAreaColumns.map((col, cIdx) => {
                      const cellValue = Number(row[col]) || 0;
                      const rowPct = rowSumVal > 0 ? (cellValue / rowSumVal) * 100 : 0;
                      const colPct = (totals[col] || 0) > 0 ? (cellValue / (totals[col] || 0)) * 100 : 0;

                      return (
                        <td 
                          key={`${col}-${cIdx}`} 
                          className="px-4 py-2.5 border-l border-stone-200/50"
                          id={`grid-cell-${col.replace(/\s+/g, '-')}-${idx}`}
                        >
                          <div className="flex flex-col items-end">
                            <span className="font-mono text-stone-700">{formatCell(cellValue)}</span>
                            {showPercentages && (
                              <div className="text-[9px] text-slate-400 font-sans mt-0.5 whitespace-nowrap leading-none flex items-center gap-1.5 pt-0.5 border-t border-slate-100/40">
                                <span title="Satır içi oran (Bu bölgedeki payı)">
                                  S: <span className="text-stone-600 font-bold">%{(rowPct).toFixed(1)}</span>
                                </span>
                                <span className="text-stone-200">|</span>
                                <span title="Kolon içi oran (Tüm bölgeler arasındaki payı)">
                                  K: <span className="text-stone-600 font-bold">%{(colPct).toFixed(1)}</span>
                                </span>
                              </div>
                            )}
                          </div>
                        </td>
                      );
                    })}

                    {/* Row Total cell (last column) */}
                    <td 
                      className="px-4 py-2.5 border-l-2 border-slate-300 bg-slate-55/60"
                      id={`grid-cell-row-total-${idx}`}
                    >
                      <div className="flex flex-col items-end">
                        <span className="font-mono font-extrabold text-slate-900">{formatCell(rowSumVal)}</span>
                        {showPercentages && (
                          <div className="text-[9px] text-indigo-700 font-sans mt-0.5 whitespace-nowrap leading-none pt-0.5 border-t border-indigo-150/50">
                            <span title="Bölge payı (Tüm bölgelerin toplamı içindeki ağırlığı)">
                              G: <span className="font-bold">%{(grandTotal > 0 ? (rowSumVal / grandTotal) * 100 : 0).toFixed(1)}</span>
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {/* Bottom totals aggregate row */}
              <tr id="grid-aggregate-totals-row" className="bg-stone-100/85 hover:bg-stone-100 font-bold border-t-2 border-stone-300 text-[11px] leading-normal font-sans">
                <td className="px-4 py-3 text-stone-900 uppercase">
                  TOPLAM (Seçili)
                </td>

                {/* Group metrics aggregates */}
                {displayedGroups.map((g) => {
                  const colVal = totals[g.name] || 0;
                  const grandPct = grandTotal > 0 ? (colVal / grandTotal) * 100 : 0;

                  return (
                    <td 
                      key={g.id} 
                      className="px-4 py-3 border-l border-slate-250 bg-blue-50/20"
                    >
                      <div className="flex flex-col items-end">
                        <span className="font-mono text-blue-900 font-extrabold">{formatCell(colVal)}</span>
                        {showPercentages && (
                          <div className="text-[9px] text-blue-700 font-sans mt-0.5 leading-none pt-0.5 border-t border-blue-200/40 font-bold">
                            <span title="Kolon payı (Genel toplam içindeki ağırlığı)">
                              %{(grandPct).toFixed(1)}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                  );
                })}

                {/* Specific field aggregates */}
                {displayedAreaColumns.map((col, cIdx) => {
                  const colVal = totals[col] || 0;
                  const grandPct = grandTotal > 0 ? (colVal / grandTotal) * 100 : 0;

                  return (
                    <td 
                      key={`${col}-${cIdx}`} 
                      className="px-4 py-3 border-l border-stone-250"
                    >
                      <div className="flex flex-col items-end">
                        <span className="font-mono text-stone-800 font-bold">{formatCell(colVal)}</span>
                        {showPercentages && (
                          <div className="text-[9px] text-stone-500 font-sans mt-0.5 leading-none pt-0.5 border-t border-stone-200">
                            <span title="Kolon payı (Genel toplam içindeki ağırlığı)">
                              %{(grandPct).toFixed(1)}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                  );
                })}

                {/* Grand Total column aggregate cell */}
                <td className="px-4 py-3 border-l-2 border-slate-300 bg-indigo-50 font-extrabold text-right">
                  <div className="flex flex-col items-end">
                    <span className="font-mono text-indigo-950 font-extrabold">{formatCell(grandTotal)}</span>
                    {showPercentages && (
                      <div className="text-[9px] text-indigo-700 font-sans mt-0.5 leading-none pt-0.5 border-t border-indigo-200">
                        <span>%100.0</span>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            </tbody>

          </table>
        </div>
      )}

      {/* Grid instructions footer */}
      <div className="flex items-center gap-2 text-[10px] text-stone-400 font-sans mt-2">
        <Calculator className="w-3.5 h-3.5" />
        <span>
          Sanal grup toplamları her karar bölgesi bazında otomatik olarak hesaplanır. Tablo başlıklarına tıklayarak kolonları artan/azalan şeklinde sıralayabilirsiniz.
        </span>
      </div>

    </div>
  );
}
