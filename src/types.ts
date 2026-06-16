/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SpreadsheetInfo {
  id: string;
  name: string;
  updatedAt?: string;
}

export interface CustomGroup {
  id: string;
  name: string;
  selectedColumns: string[];
  color: string;
}

export interface CustomRowGroup {
  id: string;
  name: string;
  selectedRegions: string[];
  color: string;
}

export interface ParsedSheetData {
  sheetName: string;
  headers: string[];
  rows: Record<string, string | number>[];
  regionColumn: string;
  selectedAreaColumns: string[];
  customGroups: CustomGroup[];
  customRowGroups?: CustomRowGroup[]; // Optional backports
}

export interface ChartDataPoint {
  region: string;
  [key: string]: string | number;
}
