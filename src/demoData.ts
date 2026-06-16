/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { type ParsedSheetData, type CustomGroup } from './types';

export interface DemoSpreadsheet {
  id: string;
  name: string;
  sheets: Record<string, {
    headers: string[];
    rows: Record<string, string | number>[];
    regionColumn: string;
    areaColumns: string[];
  }>;
}

export const DEMO_SPREADSHEET: DemoSpreadsheet = {
  id: "demo-tarim-alansal",
  name: "Türkiye Tarım ve Orman Alansal Veri Raporu (DEMO)",
  sheets: {
    "Tarım Arazileri Dağılımı": {
      headers: [
        "Karar Bölgesi",
        "KURU MARJİNAL TARIM ARAZİSİ",
        "KURU ÖZEL ÜRÜN ARAZİSİ",
        "DİKİLİ TARIM ARAZİSİ",
        "SULU MUTLAK TARIM ARAZİSİ",
        "SULU ÖZEL ÜRÜN ARAZİSİ",
        "ÖRTÜ ALTI TARIM ARAZİSİ"
      ],
      regionColumn: "Karar Bölgesi",
      areaColumns: [
        "KURU MARJİNAL TARIM ARAZİSİ",
        "KURU ÖZEL ÜRÜN ARAZİSİ",
        "DİKİLİ TARIM ARAZİSİ",
        "SULU MUTLAK TARIM ARAZİSİ",
        "SULU ÖZEL ÜRÜN ARAZİSİ",
        "ÖRTÜ ALTI TARIM ARAZİSİ"
      ],
      rows: [
        {
          "Karar Bölgesi": "Güneydoğu Anadolu Bölgesi",
          "KURU MARJİNAL TARIM ARAZİSİ": 45200000,
          "KURU ÖZEL ÜRÜN ARAZİSİ": 28400000,
          "DİKİLİ TARIM ARAZİSİ": 12500000,
          "SULU MUTLAK TARIM ARAZİSİ": 31100000,
          "SULU ÖZEL ÜRÜN ARAZİSİ": 16900000,
          "ÖRTÜ ALTI TARIM ARAZİSİ": 1500000
        },
        {
          "Karar Bölgesi": "Ege Bölgesi",
          "KURU MARJİNAL TARIM ARAZİSİ": 18500000,
          "KURU ÖZEL ÜRÜN ARAZİSİ": 35200000,
          "DİKİLİ TARIM ARAZİSİ": 41200000,
          "SULU MUTLAK TARIM ARAZİSİ": 19400000,
          "SULU ÖZEL ÜRÜN ARAZİSİ": 22300000,
          "ÖRTÜ ALTI TARIM ARAZİSİ": 9800000
        },
        {
          "Karar Bölgesi": "Akdeniz Bölgesi",
          "KURU MARJİNAL TARIM ARAZİSİ": 15600000,
          "KURU ÖZEL ÜRÜN ARAZİSİ": 22400000,
          "DİKİLİ TARIM ARAZİSİ": 34800000,
          "SULU MUTLAK TARIM ARAZİSİ": 24700000,
          "SULU ÖZEL ÜRÜN ARAZİSİ": 29600000,
          "ÖRTÜ ALTI TARIM ARAZİSİ": 24200000
        },
        {
          "Karar Bölgesi": "İç Anadolu Bölgesi",
          "KURU MARJİNAL TARIM ARAZİSİ": 92400000,
          "KURU ÖZEL ÜRÜN ARAZİSİ": 45100000,
          "DİKİLİ TARIM ARAZİSİ": 6200000,
          "SULU MUTLAK TARIM ARAZİSİ": 48200000,
          "SULU ÖZEL ÜRÜN ARAZİSİ": 11500000,
          "ÖRTÜ ALTI TARIM ARAZİSİ": 800000
        },
        {
          "Karar Bölgesi": "Marmara Bölgesi",
          "KURU MARJİNAL TARIM ARAZİSİ": 22100000,
          "KURU ÖZEL ÜRÜN ARAZİSİ": 31200000,
          "DİKİLİ TARIM ARAZİSİ": 14500000,
          "SULU MUTLAK TARIM ARAZİSİ": 15800000,
          "SULU ÖZEL ÜRÜN ARAZİSİ": 14900000,
          "ÖRTÜ ALTI TARIM ARAZİSİ": 4200000
        },
        {
          "Karar Bölgesi": "Karadeniz Bölgesi",
          "KURU MARJİNAL TARIM ARAZİSİ": 26400000,
          "KURU ÖZEL ÜRÜN ARAZİSİ": 48900000,
          "DİKİLİ TARIM ARAZİSİ": 28100000,
          "SULU MUTLAK TARIM ARAZİSİ": 8200000,
          "SULU ÖZEL ÜRÜN ARAZİSİ": 9400000,
          "ÖRTÜ ALTI TARIM ARAZİSİ": 1900000
        },
        {
          "Karar Bölgesi": "Doğu Anadolu Bölgesi",
          "KURU MARJİNAL TARIM ARAZİSİ": 65800000,
          "KURU ÖZEL ÜRÜN ARAZİSİ": 12400000,
          "DİKİLİ TARIM ARAZİSİ": 3100000,
          "SULU MUTLAK TARIM ARAZİSİ": 14200000,
          "SULU ÖZEL ÜRÜN ARAZİSİ": 4100000,
          "ÖRTÜ ALTI TARIM ARAZİSİ": 300000
        }
      ]
    },
    "Doğal Alanlar & Mera Envanteri": {
      headers: [
        "Karar Bölgesi",
        "ORMAN LANSMAN ALANI",
        "KORUNAN DOĞAL ALAN",
        "MERA ARAZİSİ",
        "SULAK ALANLAR",
        "DİĞER ORMAN ALANI"
      ],
      regionColumn: "Karar Bölgesi",
      areaColumns: [
        "ORMAN LANSMAN ALANI",
        "KORUNAN DOĞAL ALAN",
        "MERA ARAZİSİ",
        "SULAK ALANLAR",
        "DİĞER ORMAN ALANI"
      ],
      rows: [
        {
          "Karar Bölgesi": "Karadeniz Bölgesi",
          "ORMAN LANSMAN ALANI": 58200000,
          "KORUNAN DOĞAL ALAN": 15400000,
          "MERA ARAZİSİ": 25100000,
          "SULAK ALANLAR": 4200000,
          "DİĞER ORMAN ALANI": 18200000
        },
        {
          "Karar Bölgesi": "Akdeniz Bölgesi",
          "ORMAN LANSMAN ALANI": 49100000,
          "KORUNAN DOĞAL ALAN": 19800000,
          "MERA ARAZİSİ": 14200000,
          "SULAK ALANLAR": 3100000,
          "DİĞER ORMAN ALANI": 16900000
        },
        {
          "Karar Bölgesi": "Ege Bölgesi",
          "ORMAN LANSMAN ALANI": 34500000,
          "KORUNAN DOĞAL ALAN": 11200000,
          "MERA ARAZİSİ": 12800000,
          "SULAK ALANLAR": 2900000,
          "DİĞER ORMAN ALANI": 11500000
        },
        {
          "Karar Bölgesi": "Marmara Bölgesi",
          "ORMAN LANSMAN ALANI": 28400000,
          "KORUNAN DOĞAL ALAN": 8100000,
          "MERA ARAZİSİ": 6400000,
          "SULAK ALANLAR": 5800000,
          "DİĞER ORMAN ALANI": 9400000
        },
        {
          "Karar Bölgesi": "İç Anadolu Bölgesi",
          "ORMAN LANSMAN ALANI": 11200000,
          "KORUNAN DOĞAL ALAN": 14500000,
          "MERA ARAZİSİ": 88100000,
          "SULAK ALANLAR": 9100000,
          "DİĞER ORMAN ALANI": 4600000
        },
        {
          "Karar Bölgesi": "Doğu Anadolu Bölgesi",
          "ORMAN LANSMAN ALANI": 19500000,
          "KORUNAN DOĞAL ALAN": 22400000,
          "MERA ARAZİSİ": 105600000,
          "SULAK ALANLAR": 8400000,
          "DİĞER ORMAN ALANI": 8200000
        },
        {
          "Karar Bölgesi": "Güneydoğu Anadolu Bölgesi",
          "ORMAN LANSMAN ALANI": 8100000,
          "KORUNAN DOĞAL ALAN": 5400000,
          "MERA ARAZİSİ": 28400000,
          "SULAK ALANLAR": 6100000,
          "DİĞER ORMAN ALANI": 3100000
        }
      ]
    }
  }
};

export const DEFAULT_CUSTOM_GROUPS: CustomGroup[] = [
  {
    id: "group-tarim-alani",
    name: "TARIM ALANI",
    selectedColumns: ["KURU MARJİNAL TARIM ARAZİSİ", "KURU ÖZEL ÜRÜN ARAZİSİ", "DİKİLİ TARIM ARAZİSİ"],
    color: "#16a34a"  // Green-600
  },
  {
    id: "group-sulu-tarim",
    name: "SULU TARIM ALANI",
    selectedColumns: ["SULU MUTLAK TARIM ARAZİSİ", "SULU ÖZEL ÜRÜN ARAZİSİ", "ÖRTÜ ALTI TARIM ARAZİSİ"],
    color: "#2563eb"  // Blue-600
  }
];

export function parsePastedData(text: string): { headers: string[]; rows: Record<string, string | number>[] } | null {
  if (!text || !text.trim()) return null;
  const lines = text.trim().split("\n");
  if (lines.length < 2) return null;

  // Process tab or comma or semicolon separated spreadsheet paste
  const delimiter = lines[0].includes("\t") ? "\t" : lines[0].includes(";") ? ";" : ",";
  const headers = lines[0].split(delimiter).map(h => h.trim().replace(/^"|"$/g, ''));
  
  const rows: Record<string, string | number>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(delimiter);
    if (cells.length < headers.length) continue;
    
    const row: Record<string, string | number> = {};
    let hasData = false;
    
    headers.forEach((h, colIdx) => {
      let val = cells[colIdx]?.trim().replace(/^"|"$/g, '') || "";
      if (val !== "") {
        hasData = true;
      }
      
      // Attempt to clean and format numbers (e.g. stripping dots / commas for square meter parsing)
      // Turkish spreadsheet numbers can be formatted as 15.600.000 or 15600050 or 15,60 (decimal)
      const cleanNum = val.replace(/\./g, "").replace(/,/g, ".");
      const numericVal = Number(cleanNum);
      
      if (val.trim() !== "" && !isNaN(numericVal)) {
        row[h] = numericVal;
      } else {
        row[h] = val;
      }
    });

    if (hasData) {
      rows.push(row);
    }
  }

  if (rows.length === 0) return null;
  return { headers, rows };
}
