export type ColumnType = 'text' | 'image' | 'toggle' | 'icon' | 'action';

export interface TableColumn {
  key: string;       // Nombre de la propiedad en el objeto JSON
  label: string;     // Título de la columna
  type?: ColumnType; // Defecto: 'text'
  filterable?: boolean; // Si true, muestra input de búsqueda
  format?: (value: any) => string; // Transformación de texto (ej. moneda, fechas)
}

import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-custom-table',
  imports: [CommonModule, FormsModule],
  templateUrl: './custom-table.component.html',
  styleUrl: './custom-table.component.scss',
})
export class CustomTableComponent implements OnChanges {
  // --- ENTRADAS ---
  @Input() columns: TableColumn[] = [];
  @Input() data: any[] = [];
  @Input() pageSize: number = 10;
  @Input() tableClass: string = 'table-striped table-hover';

  // --- SALIDAS ---
  @Output() onAction = new EventEmitter<{ action: string, row: any }>();
  @Output() onToggle = new EventEmitter<{ row: any, key: string, checked: boolean }>();
  @Output() onFileSelected = new EventEmitter<{ row: any, file: File }>();

  // --- ESTADO INTERNO ---
  filteredData: any[] = [];   // Datos después de aplicar filtros
  paginatedData: any[] = [];  // Datos de la página actual
  filterValues: { [key: string]: string } = {}; // Valores de los inputs de búsqueda

  // Paginación
  currentPage: number = 1;
  totalPages: number = 1;
  visiblePages: (number | string)[] = []; // Array para dibujar los botones (ej: [1, '...', 4, 5, 6])

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
        const value = String(row[col.key] || '').toLowerCase();
        return value.includes(search);
      });
    });

    // Recalcular total de páginas
    this.totalPages = Math.ceil(this.filteredData.length / this.pageSize) || 1;

    // Si la página actual queda fuera de rango, volver a la 1
    if (this.currentPage > this.totalPages) this.currentPage = 1;

    this.updatePaginatedData();
  }

  // 2. Cortar datos para la página actual
  updatePaginatedData() {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedData = this.filteredData.slice(start, end);

    this.updateVisiblePages();
  }

  // 3. Generar botones de paginación (Lógica Smart)
  updateVisiblePages() {
    const total = this.totalPages;
    const current = this.currentPage;
    const delta = 1; // Cuántas páginas mostrar a los lados de la actual
    const range: number[] = [];
    const rangeWithDots: (number | string)[] = [];

    // Algoritmo simple para mostrar rangos: 1 ... 4 5 6 ... 10
    for (let i = 1; i <= total; i++) {
      if (i === 1 || i === total || (i >= current - delta && i <= current + delta)) {
        range.push(i);
      }
    }

    let l: number | null = null;
    for (let i of range) {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push('...');
        }
      }
      rangeWithDots.push(i);
      l = i;
    }
    this.visiblePages = rangeWithDots;
  }

  // --- ACCIONES ---

  changePage(page: number | string) {
    if (page === '...') return;
    const pageNum = Number(page);
    if (pageNum >= 1 && pageNum <= this.totalPages && pageNum !== this.currentPage) {
      this.currentPage = pageNum;
      this.updatePaginatedData();
    }
  }

  getValue(row: any, col: TableColumn): any {
    const val = row[col.key];
    return col.format ? col.format(val) : val;
  }
}
