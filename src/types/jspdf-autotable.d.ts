declare module 'jspdf-autotable' {
  import type { jsPDF } from 'jspdf';
  interface AutoTableOptions {
    head?: string[][];
    body?: string[][];
    startY?: number;
    theme?: string;
    headStyles?: Record<string, unknown>;
    bodyStyles?: Record<string, unknown>;
    alternateRowStyles?: Record<string, unknown>;
    styles?: Record<string, unknown>;
    columnStyles?: Record<number, Record<string, unknown>>;
    margin?: { top?: number; right?: number; bottom?: number; left?: number };
    didDrawPage?: (data: { cursor: { y: number } }) => void;
  }
  function autoTable(doc: jsPDF, options: AutoTableOptions): void;
  export default autoTable;
}
