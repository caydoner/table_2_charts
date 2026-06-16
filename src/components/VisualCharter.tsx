/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Chart as ChartJS, registerables } from 'chart.js';
import { type CustomGroup } from '../types';
import { 
  BarChart3, 
  PieChart as PieIcon, 
  TrendingUp, 
  Maximize2, 
  Layers, 
  MapPin, 
  Calculator,
  Grid,
  Download
} from 'lucide-react';

// Register Chart.js modules
ChartJS.register(...registerables);

interface VisualCharterProps {
  sheetName: string;
  sourceName: string;
  headers: string[];
  rows: Record<string, string | number>[];
  regionColumn: string;
  selectedAreaColumns: string[];
  customGroups: CustomGroup[];
  dataType?: 'area' | 'count';
  activeColumns: string[];
  setActiveColumns: React.Dispatch<React.SetStateAction<string[]>>;
  activeGroups: string[];
  setActiveGroups: React.Dispatch<React.SetStateAction<string[]>>;
  activeRegions: string[];
  setActiveRegions: React.Dispatch<React.SetStateAction<string[]>>;
  labelAliases: Record<string, string>;
  setLabelAliases: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

const PIE_COLORS = [
  "#3b82f6", // Blue-500
  "#22c55e", // Green-500
  "#f59e0b", // Amber-500
  "#ec4899", // Pink-500
  "#8b5cf6", // Purple-500
  "#06b6d4", // Cyan-500
  "#f97316", // Orange-500
  "#64748b"  // Slate-500
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

export default function VisualCharter({
  sheetName,
  sourceName,
  rows,
  regionColumn,
  selectedAreaColumns,
  customGroups,
  dataType = 'area',
  activeColumns,
  setActiveColumns,
  activeGroups,
  setActiveGroups,
  activeRegions,
  setActiveRegions,
  labelAliases,
  setLabelAliases
}: VisualCharterProps) {
  const [chartType, setChartType] = useState<'grouped-bar' | 'stacked-bar' | 'line' | 'overall-pie'>('grouped-bar');
  const [unit, setUnit] = useState<'m2' | 'hectare'>('m2');
  
  // Dynamic dimensions sliders (X & Y axis dimensions)
  const [chartWidth, setChartWidth] = useState<number>(850);
  const [chartHeight, setChartHeight] = useState<number>(400);

  // Custom colors override with RGB support
  const [colorOverrides, setColorOverrides] = useState<Record<string, string>>({});
  const [showColorEditor, setShowColorEditor] = useState<boolean>(false);

  const getItemColor = (name: string, defaultColor: string) => {
    return colorOverrides[name] || defaultColor;
  };

  // Custom label font sizes
  const [axisFontSize, setAxisFontSize] = useState<number>(10);
  const [legendFontSize, setLegendFontSize] = useState<number>(10);
  
  // Show / hide label naming configurator panel
  const [showLabelEditor, setShowLabelEditor] = useState<boolean>(false);

  // Custom Axis Titles
  const [xAxisTitle, setXAxisTitle] = useState<string>("Bölgeler");
  const [yAxisTitle, setYAxisTitle] = useState<string>("Alan (m²)");
  const [axisTitleFontSize, setAxisTitleFontSize] = useState<number>(12);

  // Dynamically update Y-axis title default on dataType or unit changes
  useEffect(() => {
    setYAxisTitle(
      dataType === 'count' 
        ? "Miktar (Adet)" 
        : `Alan (${unit === 'hectare' ? 'Hektar - ha' : 'Metrekare - m²'})`
    );
  }, [dataType, unit]);

  // Custom alias translation helper
  const getLabel = (key: string) => labelAliases[key] || key;

  // 0. Extract unique regions for horizontal axis filtering
  const uniqueRegions = useMemo(() => {
    return Array.from(new Set(rows.map((row) => String(row[regionColumn] || "Bilinmeyen Bölge"))));
  }, [rows, regionColumn]);

  // Filter input rows according to active selected regions
  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const regionName = String(row[regionColumn] || "Bilinmeyen Bölge");
      return activeRegions.includes(regionName);
    });
  }, [rows, regionColumn, activeRegions]);

  // Formatter for values on tooltips and axes
  const formatValue = (val: number) => {
    if (dataType === 'count') {
      return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(val) + " adet";
    }
    if (unit === 'hectare') {
      const ha = val / 10000;
      return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 1 }).format(ha) + " ha";
    }
    return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(val) + " m²";
  };

  const formatSimpleValue = (val: number) => {
    if (dataType === 'count') {
      if (val >= 1000000) return (val / 1000000).toFixed(1) + "M adet";
      if (val >= 1000) return (val / 1000).toFixed(0) + "K adet";
      return val + " adet";
    }
    if (unit === 'hectare') {
      const ha = val / 10000;
      if (ha >= 1000000) return (ha / 1000000).toFixed(1) + "M ha";
      if (ha >= 1000) return (ha / 1000).toFixed(0) + "K ha";
      return ha.toFixed(0) + " ha";
    }
    if (val >= 1000000) return (val / 1000000).toFixed(1) + "M m²";
    if (val >= 1000) return (val / 1000).toFixed(0) + "K m²";
    return val + " m²";
  };

  // Plain formatting for Y axis ticks (without units suffix)
  const formatYAxisTickValue = (val: number) => {
    if (dataType === 'count') {
      if (val >= 1000000) return (val / 1000000).toFixed(1) + "M";
      if (val >= 1000) return (val / 1000).toFixed(0) + "K";
      return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(val);
    }
    if (unit === 'hectare') {
      const ha = val / 10000;
      if (ha >= 1000000) return (ha / 1000000).toFixed(1) + "M";
      if (ha >= 1000) return (ha / 1000).toFixed(0) + "K";
      return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(ha);
    }
    if (val >= 1000000) return (val / 1000000).toFixed(1) + "M";
    if (val >= 1000) return (val / 1000).toFixed(0) + "K";
    return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(val);
  };

  // 1. Process dataset for regional comparisons with filteredRows
  // Calculates real-time sums for virtual column groups
  const chartData = useMemo(() => {
    return filteredRows.map((row) => {
      const regionName = String(row[regionColumn] || "Bilinmeyen Bölge");
      const dataPoint: Record<string, string | number> = {
        region: regionName
      };

      // Set individual numerical columns
      selectedAreaColumns.forEach((col) => {
        const val = Number(row[col]) || 0;
        dataPoint[col] = val;
      });

      // Set custom virtual groups (Sums matching elements dynamically)
      customGroups.forEach((group) => {
        let groupSum = 0;
        group.selectedColumns.forEach((col) => {
          groupSum += Number(row[col]) || 0;
        });
        dataPoint[group.name] = groupSum;
      });

      return dataPoint;
    });
  }, [filteredRows, regionColumn, selectedAreaColumns, customGroups]);

  // 2. Process dataset for pie breakdown (cumulative sum of land types across all active regions)
  const pieData = useMemo(() => {
    // Only collect individual columns that are active (selected as visible layer)
    const columnsWithSums = selectedAreaColumns
      .filter((col) => activeColumns.includes(col))
      .map((col) => {
        const sum = filteredRows.reduce((acc, row) => acc + (Number(row[col]) || 0), 0);
        return { name: col, value: sum, isGroup: false };
      });

    // Only collect virtual groups that are active (selected as visible layer)
    const activeCustomGroups = customGroups.filter((group) => activeGroups.includes(group.name));
    const groupsWithSums = activeCustomGroups.map((group) => {
      const sum = filteredRows.reduce((acc, row) => {
        let insideSum = 0;
        group.selectedColumns.forEach((col) => {
          insideSum += Number(row[col]) || 0;
        });
        return acc + insideSum;
      }, 0);
      return { name: group.name, value: sum, isGroup: true };
    });

    // If active virtual grouping exists, subtract its sub-columns to prevent double counting
    if (activeCustomGroups.length > 0) {
      // Find columns that are in any ACTIVE custom group
      const columnsInAnyActiveGroup = new Set<string>();
      activeCustomGroups.forEach(g => g.selectedColumns.forEach(c => columnsInAnyActiveGroup.add(c)));

      const independentColumns = columnsWithSums.filter(c => !columnsInAnyActiveGroup.has(c.name));
      return [...groupsWithSums, ...independentColumns].filter(item => item.value > 0);
    }

    return columnsWithSums.filter(item => item.value > 0);
  }, [filteredRows, selectedAreaColumns, customGroups, activeColumns, activeGroups]);

  // Toggle helpers
  const toggleColumnSeries = (col: string) => {
    if (activeColumns.includes(col)) {
      setActiveColumns(activeColumns.filter(c => c !== col));
    } else {
      setActiveColumns([...activeColumns, col]);
    }
  };

  const toggleGroupSeries = (grp: string) => {
    if (activeGroups.includes(grp)) {
      setActiveGroups(activeGroups.filter(g => g !== grp));
    } else {
      setActiveGroups([...activeGroups, grp]);
    }
  };

  // Canvas ref and ChartJS instance ref to safely initialize/destroy
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<ChartJS | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Destroy existing instance to prevent visual glitch/memory leaks
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
      chartInstanceRef.current = null;
    }

    if (filteredRows.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let config: any = {};

    if (chartType === 'overall-pie') {
      if (pieData.length === 0) return;

      const labels = pieData.map(item => getLabel(item.name));
      const dataValues = pieData.map(item => {
        if (dataType === 'count') return item.value;
        return unit === 'hectare' ? item.value / 10000 : item.value;
      });

      const backgroundColors = pieData.map((entry, index) => {
        const groupObj = customGroups.find(g => g.name === entry.name);
        const defaultColor = groupObj ? groupObj.color : PIE_COLORS[index % PIE_COLORS.length];
        return getItemColor(entry.name, defaultColor);
      });

      config = {
        type: 'pie',
        data: {
          labels: labels,
          datasets: [{
            data: dataValues,
            backgroundColor: backgroundColors,
            borderColor: '#ffffff',
            borderWidth: 2,
            hoverOffset: 12
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                color: '#374151',
                padding: 12,
                font: {
                  size: legendFontSize,
                  family: 'system-ui, -apple-system, sans-serif',
                  weight: 'bold'
                }
              }
            },
            tooltip: {
              padding: 10,
              bodyFont: {
                size: 12,
                family: 'system-ui, -apple-system, sans-serif'
              },
              callbacks: {
                label: function(context: any) {
                  const label = context.label || '';
                  const val = context.raw || 0;
                  const originalVal = dataType === 'count' ? val : (unit === 'hectare' ? val * 10000 : val);
                  const formatted = formatValue(originalVal);
                  return ` ${label}: ${formatted}`;
                }
              }
            }
          }
        }
      };
    } else {
      // Bar or Line config
      const labels = filteredRows.map(row => getLabel(String(row[regionColumn] || "Bilinmeyen Bölge")));
      const datasets: any[] = [];

      // Add active virtual groups
      customGroups.forEach((g) => {
        if (!activeGroups.includes(g.name)) return;

        const dataValues = filteredRows.map((row) => {
          let sum = 0;
          g.selectedColumns.forEach((col) => {
            sum += Number(row[col]) || 0;
          });
          if (dataType === 'count') return sum;
          return unit === 'hectare' ? sum / 10000 : sum;
        });

        const effectiveColor = getItemColor(g.name, g.color);

        datasets.push({
          type: chartType === 'line' ? 'line' : 'bar',
          label: getLabel(g.name),
          data: dataValues,
          backgroundColor: effectiveColor,
          borderColor: effectiveColor,
          borderWidth: chartType === 'line' ? 3 : 1,
          fill: false,
          tension: chartType === 'line' ? 0.25 : 0,
          borderRadius: chartType === 'line' ? 0 : (chartType === 'stacked-bar' ? 0 : 6),
          pointBackgroundColor: effectiveColor,
          pointBorderColor: '#ffffff',
          pointBorderWidth: 1.5,
          pointRadius: chartType === 'line' ? 4.5 : 0,
          pointHoverRadius: chartType === 'line' ? 7 : 0,
        });
      });

      // Add active columns
      selectedAreaColumns.forEach((col, idx) => {
        if (!activeColumns.includes(col)) return;

        const defaultColor = PIE_COLORS[idx % PIE_COLORS.length];
        const effectiveColor = getItemColor(col, defaultColor);
        const dataValues = filteredRows.map((row) => {
          const val = Number(row[col]) || 0;
          if (dataType === 'count') return val;
          return unit === 'hectare' ? val / 10000 : val;
        });

        datasets.push({
          type: chartType === 'line' ? 'line' : 'bar',
          label: getLabel(col),
          data: dataValues,
          backgroundColor: effectiveColor,
          borderColor: effectiveColor,
          borderWidth: chartType === 'line' ? 3 : 1,
          fill: false,
          tension: chartType === 'line' ? 0.25 : 0,
          borderRadius: chartType === 'line' ? 0 : (chartType === 'stacked-bar' ? 0 : 6),
          pointBackgroundColor: effectiveColor,
          pointBorderColor: '#ffffff',
          pointBorderWidth: 1.5,
          pointRadius: chartType === 'line' ? 4.5 : 0,
          pointHoverRadius: chartType === 'line' ? 7 : 0,
        });
      });

      config = {
        type: chartType === 'line' ? 'line' : 'bar',
        data: {
          labels: labels,
          datasets: datasets
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              stacked: chartType === 'stacked-bar',
              grid: {
                display: false
              },
              title: {
                display: !!xAxisTitle.trim(),
                text: xAxisTitle,
                color: '#4b5563',
                font: {
                  size: axisTitleFontSize,
                  family: 'system-ui, -apple-system, sans-serif',
                  weight: 'bold'
                },
                padding: { top: 6, bottom: 0 }
              },
              ticks: {
                color: '#4b5563',
                font: {
                  size: axisFontSize,
                  family: 'system-ui, -apple-system, sans-serif'
                },
                maxRotation: 35,
                minRotation: 0
              }
            },
            y: {
              stacked: chartType === 'stacked-bar',
              grid: {
                color: '#f3f4f6'
              },
              title: {
                display: !!yAxisTitle.trim(),
                text: yAxisTitle,
                color: '#4b5563',
                font: {
                  size: axisTitleFontSize,
                  family: 'system-ui, -apple-system, sans-serif',
                  weight: 'bold'
                },
                padding: { top: 0, bottom: 6 }
              },
              ticks: {
                color: '#4b5563',
                font: {
                  size: axisFontSize,
                  family: 'monospace'
                },
                callback: function(value: number) {
                  const originalVal = dataType === 'count' ? value : (unit === 'hectare' ? value * 10000 : value);
                  return formatYAxisTickValue(originalVal);
                }
              }
            }
          },
          plugins: {
            legend: {
              position: 'top',
              labels: {
                color: '#374151',
                boxWidth: 10,
                padding: 14,
                font: {
                  size: legendFontSize,
                  family: 'system-ui, -apple-system, sans-serif',
                  weight: 'bold'
                }
              }
            },
            tooltip: {
              padding: 10,
              bodyFont: {
                size: 12,
                family: 'system-ui, -apple-system, sans-serif'
              },
              callbacks: {
                label: function(context: any) {
                  const label = context.dataset.label || '';
                  const val = context.raw || 0;
                  const originalVal = dataType === 'count' ? val : (unit === 'hectare' ? val * 10000 : val);
                  const formatted = formatValue(originalVal);
                  return ` ${label}: ${formatted}`;
                }
              }
            }
          }
        }
      };
    }

    const newChart = new ChartJS(ctx, config);
    chartInstanceRef.current = newChart;

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [chartType, filteredRows, regionColumn, activeColumns, activeGroups, unit, customGroups, selectedAreaColumns, pieData, axisFontSize, legendFontSize, dataType, labelAliases, xAxisTitle, yAxisTitle, axisTitleFontSize, colorOverrides]);

  // High-resolution Canvas saving to JPG/PNG
  const exportChart = (format: 'png' | 'jpeg') => {
    if (!chartInstanceRef.current || !canvasRef.current) {
      alert("Grafik görseli bulunamadı veya henüz yüklenmedi!");
      return;
    }

    try {
      const canvas = canvasRef.current;
      
      // Paint solid white backdrop on a secondary canvas to avoid transparent background issues for jpeg
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext('2d');
      
      if (tempCtx) {
        tempCtx.fillStyle = '#ffffff';
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        tempCtx.drawImage(canvas, 0, 0);

        const fileExtension = format === 'jpeg' ? 'jpg' : 'png';
        const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
        const dataURL = tempCanvas.toDataURL(mimeType, 0.95);

        const link = document.createElement('a');
        link.download = `${sheetName}-analiz-grafigi.${fileExtension}`;
        link.href = dataURL;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (e) {
      console.error(e);
      alert("Grafik dışa aktarma işlemi sırasında teknik bir hata oluştu.");
    }
  };

  // Grand summary values for metrics bar
  const metrics = useMemo(() => {
    let totalArea = 0;
    selectedAreaColumns.forEach((col) => {
      totalArea += filteredRows.reduce((acc, r) => acc + (Number(r[col]) || 0), 0);
    });

    const regionsCount = filteredRows.length;
    
    // Average area size per region
    const average = regionsCount > 0 ? totalArea / regionsCount : 0;

    return { totalArea, regionsCount, average };
  }, [filteredRows, selectedAreaColumns]);

  return (
    <div id="visual-charter" className="space-y-6">
      
      {/* 1. KEYMETRICS SUB-BOARD */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Metric 1 */}
        <div className="bg-white border border-stone-200/80 rounded-2xl p-5 shadow-xs relative overflow-hidden">
          <div className="absolute right-3 top-3 opacity-15 text-emerald-900 pointer-events-none">
            <Maximize2 className="w-12 h-12" />
          </div>
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block font-sans">
            {dataType === 'count' ? "Toplam Sayım Adedi" : "Toplam Alansal Alan"}
          </span>
          <span className="text-xl md:text-2xl font-extrabold text-stone-900 font-mono tracking-tight mt-1.5 block">
            {formatValue(metrics.totalArea).replace(" m²", "").replace(" ha", "").replace(" adet", "")}
          </span>
          <span className="text-xs text-stone-500 font-semibold flex items-center gap-1.5 mt-1 font-sans">
            <span className="inline-block w-2 h-2 rounded-full bg-blue-600"></span>
            {dataType === 'count' 
              ? "Çözümlenen toplam miktar adedi" 
              : (unit === 'm2' ? "Metrekare (m²) toplam alan" : "Hektar (ha) toplam alan")}
          </span>
        </div>

        {/* Metric 2 */}
        <div className="bg-white border border-stone-200/80 rounded-2xl p-5 shadow-xs relative overflow-hidden">
          <div className="absolute right-3 top-3 opacity-15 text-stone-950 pointer-events-none">
            <MapPin className="w-12 h-12" />
          </div>
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block font-sans">Karar Bölgeleri</span>
          <span className="text-xl md:text-2xl font-extrabold text-[#7c3aed] font-mono tracking-tight mt-1.5 block">
            {metrics.regionsCount} Bölge
          </span>
          <span className="text-xs text-stone-500 font-semibold flex items-center gap-1.5 mt-1 font-sans">
            <span className="inline-block w-2 h-2 rounded-full bg-[#7c3aed]"></span>
            Raporlanan bağımsız karar bölgesi
          </span>
        </div>

        {/* Metric 3 */}
        <div className="bg-white border border-stone-200/80 rounded-2xl p-5 shadow-xs relative overflow-hidden">
          <div className="absolute right-3 top-3 opacity-15 text-blue-900 pointer-events-none">
            <Calculator className="w-12 h-12" />
          </div>
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block font-sans">
            {dataType === 'count' ? "Bölge Başına Ortalama Sayım" : "Bölge Başına Ortalama Alan"}
          </span>
          <span className="text-xl md:text-2xl font-extrabold text-blue-600 font-mono tracking-tight mt-1.5 block">
            {formatValue(metrics.average).replace(" m²", "").replace(" ha", "").replace(" adet", "")}
          </span>
          <span className="text-xs text-stone-500 font-semibold flex items-center gap-1.5 mt-1 font-sans">
            <span className="inline-block w-2 h-2 rounded-full bg-blue-500"></span>
            Coğrafi bölge başına düşen ortalama
          </span>
        </div>

      </div>

      {/* 2. MAIN CHARTS RENDERING COMPONENT */}
      <div id="chart-display-card" className="bg-white border border-stone-200/80 rounded-2xl shadow-sm text-stone-800">
        
        {/* Tab Selection Header */}
        <div className="border-b border-stone-150 p-5 flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-stone-50/50">
          <div>
            <h4 className="font-bold text-stone-900 tracking-tight text-md">
              İnteraktif Veri Görselleştirme Araçları
            </h4>
            <p className="text-xs text-stone-500 font-sans mt-0.5">
              {sourceName} - {sheetName} sayfa verileri
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Unit unit selector */}
            {dataType === 'area' ? (
              <div className="inline-flex rounded-lg border border-stone-300 p-0.5 bg-white text-xs font-semibold">
                <button
                  id="unit-toggle-m2"
                  onClick={() => setUnit('m2')}
                  className={`px-3 py-1.5 rounded-md transition-colors ${
                    unit === 'm2' ? 'bg-stone-800 text-white' : 'text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  M² Birimi
                </button>
                <button
                  id="unit-toggle-ha"
                  onClick={() => setUnit('hectare')}
                  className={`px-3 py-1.5 rounded-md transition-colors ${
                    unit === 'hectare' ? 'bg-stone-800 text-white' : 'text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  Hektar (ha)
                </button>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-stone-300 text-stone-700 rounded-lg text-xs font-bold leading-none">
                <Calculator className="w-3.5 h-3.5 text-stone-500" />
                Adet / Sayım Ölçümü
              </div>
            )}

            {/* Type selector */}
            <div className="inline-flex rounded-lg border border-stone-300 p-0.5 bg-white text-xs font-semibold">
              <button
                id="chart-tab-grouped"
                onClick={() => setChartType('grouped-bar')}
                className={`px-3 py-1.5 inline-flex items-center gap-1.5 rounded-md transition-colors ${
                  chartType === 'grouped-bar' ? 'bg-blue-600 text-white' : 'text-stone-700 hover:bg-stone-100'
                }`}
                title="Grup Sütun Grafiği"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                Grup Sütun
              </button>
              <button
                id="chart-tab-stacked"
                onClick={() => setChartType('stacked-bar')}
                className={`px-3 py-1.5 inline-flex items-center gap-1.5 rounded-md transition-colors ${
                  chartType === 'stacked-bar' ? 'bg-blue-600 text-white' : 'text-stone-700 hover:bg-stone-100'
                }`}
                title="Yığılmış Sütun Grafiği"
              >
                <Layers className="w-3.5 h-3.5" />
                Yığın Sütun
              </button>
              <button
                id="chart-tab-line"
                onClick={() => setChartType('line')}
                className={`px-3 py-1.5 inline-flex items-center gap-1.5 rounded-md transition-colors ${
                  chartType === 'line' ? 'bg-blue-600 text-white' : 'text-stone-700 hover:bg-stone-100'
                }`}
                title="Çizgi Trend Grafiği"
              >
                <TrendingUp className="w-3.5 h-3.5" />
                Çizgi Analizi
              </button>
              <button
                id="chart-tab-pie"
                onClick={() => setChartType('overall-pie')}
                className={`px-3 py-1.5 inline-flex items-center gap-1.5 rounded-md transition-colors ${
                  chartType === 'overall-pie' ? 'bg-blue-600 text-white' : 'text-stone-700 hover:bg-stone-100'
                }`}
                title="Daire/Pasta Paylaşım Grafiği"
              >
                <PieIcon className="w-3.5 h-3.5" />
                Daire Payı
              </button>
            </div>

            {/* Export options */}
            <div className="inline-flex rounded-lg border border-stone-300 p-0.5 bg-white text-xs font-semibold font-sans">
              <button
                id="export-png-btn"
                onClick={() => exportChart('png')}
                className="px-3 py-1.5 inline-flex items-center gap-1.5 text-stone-700 hover:bg-stone-100 rounded-md transition-colors"
                title="Grafiği PNG olarak kaydet"
              >
                <Download className="w-3.5 h-3.5 text-blue-600" />
                PNG Aktar
              </button>
              <button
                id="export-jpeg-btn"
                onClick={() => exportChart('jpeg')}
                className="px-2.5 py-1.5 text-stone-700 hover:bg-stone-100 rounded-md transition-colors"
                title="Grafiği JPG olarak kaydet"
              >
                JPG Aktar
              </button>
            </div>

          </div>
        </div>

        {/* Chart Layout: left filter controls and right dynamic chart area */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-px bg-stone-150">
          
          {/* Legend series toggles column (3 cols) */}
          <div className="xl:col-span-3 bg-white p-5 space-y-4">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-widest block font-sans">
              Görüntülenecek Katmanlar
            </span>
            
            {/* Custom Groups series togglers */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wide block font-sans">
                  Sanal Gruplar (Toplam)
                </span>
                {customGroups.length > 0 && (
                  <div className="flex gap-1.5 text-[9px] font-bold font-sans">
                    <button 
                      type="button"
                      onClick={() => setActiveGroups(customGroups.map(g => g.name))}
                      className="text-blue-600 hover:underline cursor-pointer"
                    >
                      Tümünü Seç
                    </button>
                    <span className="text-stone-300">|</span>
                    <button 
                      type="button"
                      onClick={() => setActiveGroups([])}
                      className="text-stone-500 hover:underline cursor-pointer"
                    >
                      Temizle
                    </button>
                  </div>
                )}
              </div>
              {customGroups.length === 0 ? (
                <p className="text-[10px] font-sans text-stone-500 italic bg-stone-50 p-2 border border-stone-100 rounded-lg select-none">
                  Tanımlı sanal sütun grubu yok. Özel alanlar oluşturarak toplu grafik verisi üretebilirsiniz.
                </p>
              ) : (
                <div className="space-y-1">
                  {customGroups.map((g) => {
                    const isChecked = activeGroups.includes(g.name);
                    return (
                      <button
                        key={g.id}
                        id={`chart-toggle-group-${g.name.replace(/\s+/g, '-')}`}
                        onClick={() => toggleGroupSeries(g.name)}
                        className={`w-full text-left font-sans text-xs p-2 rounded-lg border flex items-center justify-between transition-all ${
                          isChecked 
                            ? 'bg-stone-50 border-stone-300 font-semibold' 
                            : 'bg-white border-stone-200 hover:bg-stone-50/50 opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate pr-2">
                          <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: colorOverrides[g.name] || g.color }}></span>
                          <span className="truncate">{g.name}</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // toggled by button click
                          className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                        />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Individual Columns series togglers */}
            <div className="space-y-2 border-t border-stone-100 pt-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wide block font-sans">
                  Tekil Kategoriler
                </span>
                {selectedAreaColumns.length > 0 && (
                  <div className="flex gap-1.5 text-[9px] font-bold font-sans">
                    <button 
                      type="button"
                      onClick={() => setActiveColumns(selectedAreaColumns)}
                      className="text-blue-600 hover:underline cursor-pointer"
                    >
                      Tümünü Seç
                    </button>
                    <span className="text-stone-300">|</span>
                    <button 
                      type="button"
                      onClick={() => setActiveColumns([])}
                      className="text-stone-500 hover:underline cursor-pointer"
                    >
                      Temizle
                    </button>
                  </div>
                )}
              </div>
              <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                {selectedAreaColumns.map((col, idx) => {
                  const isChecked = activeColumns.includes(col);
                  const baseColor = PIE_COLORS[idx % PIE_COLORS.length];
                  const color = colorOverrides[col] || baseColor;
                  return (
                    <button
                      key={`${col}-${idx}`}
                      id={`chart-toggle-col-${col.replace(/\s+/g, '-')}`}
                      onClick={() => toggleColumnSeries(col)}
                      className={`w-full text-left font-sans text-xs p-2 rounded-lg border flex items-center justify-between transition-all ${
                        isChecked 
                          ? 'bg-stone-50 border-stone-300 font-semibold' 
                          : 'bg-white border-stone-200 hover:bg-stone-50/50 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate pr-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }}></span>
                        <span className="truncate">{col}</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}} // toggled by button click
                        className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Yatay Eksen Süzgeci */}
            <div className="space-y-2 border-t border-stone-100 pt-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wide block font-sans">
                  Yatay Eksen (Bölgeler)
                </span>
                <div className="flex gap-1.5 text-[9px] font-bold font-sans">
                  <button 
                    onClick={() => setActiveRegions(uniqueRegions)}
                    className="text-blue-600 hover:underline hover:text-blue-700"
                  >
                    Tümünü Seç
                  </button>
                  <span className="text-stone-300">|</span>
                  <button 
                    onClick={() => setActiveRegions([])}
                    className="text-stone-500 hover:underline hover:text-stone-700"
                  >
                    Temizle
                  </button>
                </div>
              </div>
              
              <div className="space-y-1 max-h-44 overflow-y-auto pr-1 font-sans">
                {uniqueRegions.length === 0 ? (
                  <p className="text-[10px] text-stone-400 italic select-none">
                    Gösterilecek coğrafi bölge detayı bulunamadı.
                  </p>
                ) : (
                  uniqueRegions.map((region, rIdx) => {
                    const isChecked = activeRegions.includes(region);
                    return (
                      <button
                        key={`${region}-${rIdx}`}
                        id={`axis-filter-toggle-${region.replace(/\s+/g, '-')}`}
                        onClick={() => {
                          if (isChecked) {
                            setActiveRegions(activeRegions.filter(r => r !== region));
                          } else {
                            setActiveRegions([...activeRegions, region]);
                          }
                        }}
                        className={`w-full text-left text-xs p-1.5 rounded-lg border flex items-center justify-between transition-all ${
                          isChecked 
                            ? 'bg-stone-50 border-stone-300 font-semibold' 
                            : 'bg-white border-stone-200 hover:bg-stone-50/50 opacity-60'
                        }`}
                      >
                        <span className="truncate pr-2 font-sans">{region}</span>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // toggled by button click
                          className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                        />
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Grafik Yazı Boyutları */}
            <div className="space-y-3.5 border-t border-stone-100 pt-3.5">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wide block font-sans">
                Grafik Yazı Boyutları
              </span>
              <div className="space-y-3 font-sans">
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[11px] text-stone-600">
                    <span>Eksen Etiket Boyutu:</span>
                    <span className="font-mono font-bold text-blue-600">{axisFontSize}px</span>
                  </div>
                  <input
                    type="range"
                    id="slider-axis-font-size"
                    min="8"
                    max="22"
                    step="1"
                    value={axisFontSize}
                    onChange={(e) => setAxisFontSize(Number(e.target.value))}
                    className="w-full h-1.5 bg-stone-100 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                  />
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[11px] text-stone-600">
                    <span>Lejant (Gösterge) Görümü:</span>
                    <span className="font-mono font-bold text-blue-600">{legendFontSize}px</span>
                  </div>
                  <input
                    type="range"
                    id="slider-legend-font-size"
                    min="8"
                    max="22"
                    step="1"
                    value={legendFontSize}
                    onChange={(e) => setLegendFontSize(Number(e.target.value))}
                    className="w-full h-1.5 bg-stone-100 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                  />
                </div>
              </div>
            </div>

            {/* Eksen Başlığı Ayarları */}
            <div className="space-y-3.5 border-t border-stone-100 pt-3.5">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wide block font-sans">
                Eksen Başlığı Ayarları
              </span>
              <div className="space-y-3 font-sans text-xs">
                <div className="space-y-1">
                  <label htmlFor="xAxisTitleInput" className="text-[11px] text-stone-600 font-semibold block">Yatay Eksen Başlığı:</label>
                  <input
                    type="text"
                    id="xAxisTitleInput"
                    value={xAxisTitle}
                    onChange={(e) => setXAxisTitle(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg bg-stone-50 border border-stone-200 focus:outline-none focus:border-blue-500 focus:bg-white text-stone-800"
                    placeholder="Bölgeler"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="yAxisTitleInput" className="text-[11px] text-stone-600 font-semibold block">Dikey Eksen Başlığı:</label>
                  <input
                    type="text"
                    id="yAxisTitleInput"
                    value={yAxisTitle}
                    onChange={(e) => setYAxisTitle(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg bg-stone-50 border border-stone-200 focus:outline-none focus:border-blue-500 focus:bg-white text-stone-800"
                    placeholder="Alan (m²)"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[11px] text-stone-600">
                    <span>Eksen Başlık Yazı Boyutu:</span>
                    <span className="font-mono font-bold text-blue-600">{axisTitleFontSize}px</span>
                  </div>
                  <input
                    type="range"
                    id="slider-axis-title-font-size"
                    min="8"
                    max="22"
                    step="1"
                    value={axisTitleFontSize}
                    onChange={(e) => setAxisTitleFontSize(Number(e.target.value))}
                    className="w-full h-1.5 bg-stone-100 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                  />
                </div>
              </div>
            </div>

            {/* Grafik Boyut Ayarları */}
            <div className="space-y-3.5 border-t border-stone-100 pt-3.5">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wide block font-sans">
                Grafik Boyut Ayarları
              </span>
              <div className="space-y-3 font-sans">
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[11px] text-stone-600">
                    <span>Yatay Genişlik (X Ekseni):</span>
                    <span className="font-mono font-bold text-blue-600">{chartWidth}px</span>
                  </div>
                  <input
                    type="range"
                    id="slider-chart-width"
                    min="350"
                    max="1800"
                    step="10"
                    value={chartWidth}
                    onChange={(e) => setChartWidth(Number(e.target.value))}
                    className="w-full h-1.5 bg-stone-100 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                  />
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[11px] text-stone-600">
                    <span>Dikey Yükseklik (Y Ekseni):</span>
                    <span className="font-mono font-bold text-blue-600">{chartHeight}px</span>
                  </div>
                  <input
                    type="range"
                    id="slider-chart-height"
                    min="200"
                    max="1000"
                    step="10"
                    value={chartHeight}
                    onChange={(e) => setChartHeight(Number(e.target.value))}
                    className="w-full h-1.5 bg-stone-100 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                  />
                </div>
              </div>
            </div>

            {/* RGB Renk Seçimi */}
            <div className="space-y-3.5 border-t border-stone-100 pt-3.5">
              <button
                type="button"
                id="toggle-color-picker-button"
                onClick={() => setShowColorEditor(prev => !prev)}
                className="w-full flex items-center justify-between text-[10px] font-bold text-stone-400 uppercase tracking-wide font-sans hover:text-blue-600 transition-colors cursor-pointer"
              >
                <span>Katman RGB Renkleri</span>
                <span className="text-[12px] font-bold font-mono">{showColorEditor ? '▲' : '▼'}</span>
              </button>

              {showColorEditor && (
                <div className="space-y-4 text-xs text-stone-600 font-sans max-h-[350px] overflow-y-auto pr-1 select-none">
                  <p className="text-[10.5px] text-stone-500 leading-normal">
                    Her katmanın rengini RGB (Kırmızı, Yeşil, Mavi) sürgüsü veya sayısal değerleri ile hassas şekilde ayarlayın.
                  </p>

                  {/* Virtual Groups Renkleri */}
                  {(() => {
                    const activeCustomGroups = customGroups.filter((g) => activeGroups.includes(g.name));
                    if (activeCustomGroups.length === 0) return null;

                    return (
                      <div className="space-y-3 pb-2">
                        <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider block">Sanal Gruplar</span>
                        {activeCustomGroups.map((g) => {
                          const baseColor = g.color;
                          const currentColor = colorOverrides[g.name] || baseColor;
                          const rgb = hexToRgb(currentColor);

                          return (
                            <div key={g.id} className="p-2 border border-stone-150 rounded-lg bg-stone-50/50 space-y-2">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-bold text-stone-800 truncate block max-w-[150px]" title={g.name}>{getLabel(g.name)}</span>
                                <input 
                                  type="color"
                                  value={currentColor}
                                  onChange={(e) => setColorOverrides(prev => ({ ...prev, [g.name]: e.target.value }))}
                                  className="w-6 h-6 rounded border border-stone-200 cursor-pointer p-0 shrink-0 border-none"
                                />
                              </div>
                              
                              <div className="grid grid-cols-3 gap-1.5 text-[9px] font-mono">
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
                                      const newHex = rgbToHex(val, rgb.g, rgb.b);
                                      setColorOverrides(prev => ({ ...prev, [g.name]: newHex }));
                                    }}
                                    className="w-full h-1 bg-stone-100 rounded accent-red-600 cursor-pointer"
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
                                      const newHex = rgbToHex(rgb.r, val, rgb.b);
                                      setColorOverrides(prev => ({ ...prev, [g.name]: newHex }));
                                    }}
                                    className="w-full h-1 bg-stone-100 rounded accent-emerald-600 cursor-pointer"
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
                                      const newHex = rgbToHex(rgb.r, rgb.g, val);
                                      setColorOverrides(prev => ({ ...prev, [g.name]: newHex }));
                                    }}
                                    className="w-full h-1 bg-stone-100 rounded accent-blue-600 cursor-pointer"
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}

                  {/* Tekil Kategoriler Renkleri */}
                  {(() => {
                    const activeAreaColumns = selectedAreaColumns.filter((col) => activeColumns.includes(col));
                    if (activeAreaColumns.length === 0) return null;

                    return (
                      <div className="space-y-3 border-t border-stone-100 pt-3">
                        <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider block">Tekil Kategoriler</span>
                        {activeAreaColumns.map((col) => {
                          const originalIdx = selectedAreaColumns.indexOf(col);
                          const baseColor = PIE_COLORS[originalIdx % PIE_COLORS.length];
                          const currentColor = colorOverrides[col] || baseColor;
                          const rgb = hexToRgb(currentColor);

                          return (
                            <div key={col} className="p-2 border border-stone-150 rounded-lg bg-stone-50/50 space-y-2">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-bold text-stone-800 truncate block max-w-[150px]" title={col}>{getLabel(col)}</span>
                                <input 
                                  type="color"
                                  value={currentColor}
                                  onChange={(e) => setColorOverrides(prev => ({ ...prev, [col]: e.target.value }))}
                                  className="w-6 h-6 rounded border border-stone-200 cursor-pointer p-0 shrink-0 border-none"
                                />
                              </div>
                              
                              <div className="grid grid-cols-3 gap-1.5 text-[9px] font-mono">
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
                                      const newHex = rgbToHex(val, rgb.g, rgb.b);
                                      setColorOverrides(prev => ({ ...prev, [col]: newHex }));
                                    }}
                                    className="w-full h-1 bg-stone-100 rounded accent-red-600 cursor-pointer"
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
                                      const newHex = rgbToHex(rgb.r, val, rgb.b);
                                      setColorOverrides(prev => ({ ...prev, [col]: newHex }));
                                    }}
                                    className="w-full h-1 bg-stone-100 rounded accent-emerald-600 cursor-pointer"
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
                                      const newHex = rgbToHex(rgb.r, rgb.g, val);
                                      setColorOverrides(prev => ({ ...prev, [col]: newHex }));
                                    }}
                                    className="w-full h-1 bg-stone-100 rounded accent-blue-600 cursor-pointer"
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Grafik Eksenleri ve Lejand Etiket Düzenleyicisi */}
            <div className="space-y-3.5 border-t border-stone-100 pt-3.5">
              <button
                type="button"
                id="toggle-label-editor-button"
                onClick={() => setShowLabelEditor(prev => !prev)}
                className="w-full flex items-center justify-between text-[10px] font-bold text-stone-400 uppercase tracking-wide font-sans hover:text-blue-600 transition-colors cursor-pointer"
              >
                <span>Etiketleri Özelleştir</span>
                <span className="text-[12px] font-bold font-mono">{showLabelEditor ? '▲' : '▼'}</span>
              </button>
              
              {showLabelEditor && (
                <div className="space-y-3.5 text-xs text-stone-600 font-sans max-h-[250px] overflow-y-auto pr-1">
                  <p className="text-[10.5px] text-stone-500 leading-normal">
                    Grafik eksenlerinde, göstergelerde (lejantta) ve alttaki özet tabloda görünen isimleri değiştirebilirsiniz. Boş bırakırsanız orijinal isim kullanılır.
                  </p>
                  
                  {/* Regions */}
                  <div className="space-y-2">
                    <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider block">Yatay Eksen (Bölgeler)</span>
                    {uniqueRegions.map((region) => (
                      <div key={region} className="space-y-1">
                        <label className="text-[10px] text-stone-500 block truncate" title={region}>{region}:</label>
                        <input
                          type="text"
                          id={`alias-input-${region.replace(/\s+/g, '-')}`}
                          value={labelAliases[region] || ""}
                          placeholder={region}
                          onChange={(e) => {
                            const val = e.target.value;
                            setLabelAliases(prev => ({ ...prev, [region]: val }));
                          }}
                          className="w-full text-xs px-2 py-1 rounded bg-stone-50 border border-stone-200 focus:outline-none focus:border-blue-500 focus:bg-white text-stone-800"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Columns */}
                  <div className="space-y-2 pt-1 border-t border-stone-100/50">
                    <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider block">Kategoriler</span>
                    {selectedAreaColumns.map((col) => (
                      <div key={col} className="space-y-1">
                        <label className="text-[10px] text-stone-500 block truncate" title={col}>{col}:</label>
                        <input
                          type="text"
                          id={`alias-input-${col.replace(/\s+/g, '-')}`}
                          value={labelAliases[col] || ""}
                          placeholder={col}
                          onChange={(e) => {
                            const val = e.target.value;
                            setLabelAliases(prev => ({ ...prev, [col]: val }));
                          }}
                          className="w-full text-xs px-2 py-1 rounded bg-stone-50 border border-stone-200 focus:outline-none focus:border-blue-500 focus:bg-white text-stone-800"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Virtual Groups */}
                  {customGroups.length > 0 && (
                    <div className="space-y-2 pt-1 border-t border-stone-100/50">
                      <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider block">Sanal Gruplar</span>
                      {customGroups.map((g) => (
                        <div key={g.id} className="space-y-1">
                          <label className="text-[10px] text-stone-500 block truncate" title={g.name}>{g.name}:</label>
                          <input
                            type="text"
                            id={`alias-input-${g.name.replace(/\s+/g, '-')}`}
                            value={labelAliases[g.name] || ""}
                            placeholder={g.name}
                            onChange={(e) => {
                              const val = e.target.value;
                              setLabelAliases(prev => ({ ...prev, [g.name]: val }));
                            }}
                            className="w-full text-xs px-2 py-1 rounded bg-stone-50 border border-stone-200 focus:outline-none focus:border-blue-500 focus:bg-white text-stone-800"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>

          {/* Actual graphic component rendering (9 cols) */}
          <div id="chart-rendering-area" className="xl:col-span-9 bg-white p-6 relative flex flex-col justify-center min-h-[400px]">
            {filteredRows.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center p-12 text-stone-400 select-none">
                <Grid className="w-10 h-10 mb-2 animate-pulse text-stone-300" />
                <p className="text-xs font-semibold">Görüntülenecek veri bulunamadı.</p>
                <p className="text-[10px] mt-1 text-stone-500 leading-normal">
                  Süzgeç filtrelerine uygun grafik verisi bulunamadı. Lütfen soldan en az bir coğrafi bölge veya kategori seçin.
                </p>
              </div>
            ) : chartType === 'overall-pie' && pieData.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center p-12 text-stone-400 select-none">
                <Grid className="w-10 h-10 mb-2 text-stone-300" />
                <p className="text-xs font-semibold">Daire grafiği oluşturmak için lütfen en az bir kategori seçin.</p>
              </div>
            ) : (
              <div className="w-full overflow-x-auto border border-stone-100 rounded-xl bg-stone-50/20 p-2 md:p-4 flex justify-center">
                <div 
                  className="relative transition-all duration-150 shrink-0" 
                  style={{ 
                    width: `${chartWidth}px`, 
                    height: `${chartHeight}px`,
                    maxWidth: '100%',
                    minWidth: '280px'
                  }}
                >
                  <canvas ref={canvasRef} className="w-full h-full" />
                </div>
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
