import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// --- INTERFACES ---

export type ColumnType = 'text' | 'image' | 'toggle' | 'icon' | 'action' | 'badge' | 'tags' | 'template' | 'index';

export interface BadgeItem {
  label: string;
  class: string; // Ej: 'bg-primary text-white'
}

export interface TableColumn {
  key: string;           // Nombre de la propiedad en el JSON
  label: string;         // Título de la columna
  type?: ColumnType;     // Tipo de celda (defecto: text)
  width?: string;        // Ancho opcional (ej: '150px')
  filterable?: boolean;  // Mostrar input de filtro

  // Transformadores
  format?: (value: any) => string;                   // Para formatear texto (ej: monedas)
  classCallback?: (value: any, row?: any) => string; // Para clases dinámicas (tipo 'badge' o 'icon')
  tagsCallback?: (row: any) => BadgeItem[];          // Para generar múltiples etiquetas (tipo 'tags')

  // Para celdas personalizadas complejas (Tu caso de Producto)
  templateRef?: TemplateRef<any>;
}


@Component({
  selector: 'app-custom-table',
  imports: [CommonModule, FormsModule],
  templateUrl: './custom-table.component.html',
  styleUrl: './custom-table.component.scss',
})
export class CustomTableComponent implements OnChanges {
  // --- INPUTS ---
  @Input() columns: TableColumn[] = [];
  @Input() data: any[] = [];
  @Input() pageSize: number = 10;

  // Defecto: Solo hover, fondo blanco (sin striped)
  @Input() tableClass: string = 'table-hover';

  // --- OUTPUTS ---
  @Output() onAction = new EventEmitter<{ action: string, row: any }>();
  @Output() onToggle = new EventEmitter<{ row: any, key: string, checked: boolean }>();
  @Output() onFileSelected = new EventEmitter<{ row: any, file: File }>();

  // --- LÓGICA INTERNA ---
  filteredData: any[] = [];
  paginatedData: any[] = [];
  filterValues: { [key: string]: string } = {};

  currentPage: number = 1;
  totalPages: number = 1;
  visiblePages: (number | string)[] = [];

  get hasFilterableColumns(): boolean {
    return this.columns.some(c => c.filterable);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] || changes['columns']) {
      this.applyFilters();
    }
  }

  // 1. Filtrado
  applyFilters() {
    this.filteredData = this.data.filter(row => {
      return this.columns.every(col => {
        if (!col.filterable) return true;
        const search = (this.filterValues[col.key] || '').toLowerCase();
        // Buscamos en el valor directo o en propiedades anidadas si fuera necesario
        const value = String(row[col.key] || '').toLowerCase();
        return value.includes(search);
      });
    });

    this.totalPages = Math.ceil(this.filteredData.length / this.pageSize) || 1;
    if (this.currentPage > this.totalPages) this.currentPage = 1;
    this.updatePaginatedData();
  }

  // 2. Paginación de datos
  updatePaginatedData() {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedData = this.filteredData.slice(start, end);
    this.updateVisiblePages();
  }

  // 3. Calculadora de botones de paginación
  updateVisiblePages() {
    const total = this.totalPages;
    const current = this.currentPage;
    const delta = 1;
    const range: number[] = [];
    const rangeWithDots: (number | string)[] = [];

    for (let i = 1; i <= total; i++) {
      if (i === 1 || i === total || (i >= current - delta && i <= current + delta)) {
        range.push(i);
      }
    }

    let l: number | null = null;
    for (let i of range) {
      if (l) {
        if (i - l === 2) rangeWithDots.push(l + 1);
        else if (i - l !== 1) rangeWithDots.push('...');
      }
      rangeWithDots.push(i);
      l = i;
    }
    this.visiblePages = rangeWithDots;
  }

  // --- UI HELPERS ---
  changePage(page: number | string) {
    if (page === '...') return;
    const p = Number(page);
    if (p >= 1 && p <= this.totalPages) {
      this.currentPage = p;
      this.updatePaginatedData();
    }
  }

  getValue(row: any, col: TableColumn): any {
    const val = row[col.key];
    return col.format ? col.format(val) : val;
  }
}
