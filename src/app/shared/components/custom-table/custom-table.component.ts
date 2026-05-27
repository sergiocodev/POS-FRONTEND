import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, TemplateRef, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { CustomSelectComponent } from '../custom-select.component/custom-select.component';

// --- INTERFACES ---

export type ColumnType = 'text' | 'image' | 'toggle' | 'icon' | 'action' | 'badge' | 'tags' | 'template' | 'index' | 'html';

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
  format?: (value: any, row?: any) => string;                   // Para formatear texto (ej: monedas)
  classCallback?: (value: any, row?: any) => string; // Para clases dinámicas (tipo 'badge' o 'icon')
  tagsCallback?: (row: any) => BadgeItem[];          // Para generar múltiples etiquetas (tipo 'tags')

  // Para celdas personalizadas complejas (Tu caso de Producto)
  templateRef?: TemplateRef<any>;
  align?: 'left' | 'center' | 'right';
}

@Component({
  selector: 'app-custom-table',
  standalone: true,
  imports: [CommonModule, FormsModule, CustomSelectComponent],
  templateUrl: './custom-table.component.html',
  styleUrl: './custom-table.component.scss',
})
export class CustomTableComponent implements OnInit, OnChanges, OnDestroy {
  // --- INPUTS ---
  @Input() columns: TableColumn[] = [];
  @Input() data: any[] = [];
  @Input() pageSize: number = 10;
  @Input() totalElements: number = 0;
  @Input() currentPage: number = 1;

  @Input() tableClass: string = 'table-hover';
  @Input() title: string = '';
  @Input() icon: string = '';
  @Input() showAddButton: boolean = false;
  @Input() addButtonLabel: string = 'Nuevo';

  // --- OUTPUTS ---
  @Output() onAction = new EventEmitter<{ action: string, row: any }>();
  @Output() onPageChange = new EventEmitter<number>();
  @Output() onPageSizeChange = new EventEmitter<number>();
  @Output() onToggle = new EventEmitter<{ row: any, key: string, checked: boolean }>();
  @Output() onFilterChange = new EventEmitter<{ [key: string]: string }>();
  @Output() onAdd = new EventEmitter<void>();

  isServerSide: boolean = false;

  // --- LÓGICA INTERNA ---
  filteredData: any[] = [];
  paginatedData: any[] = [];
  filterValues: { [key: string]: string } = {};

  totalPages: number = 1;
  visiblePages: (number | string)[] = [];
  pageSizeOptions: number[] = [10, 20, 50, 100];

  // Debounce logic
  private filterSubject = new Subject<{ [key: string]: string }>();
  private filterSubscription?: Subscription;

  get hasFilterableColumns(): boolean {
    return this.columns.some(c => c.filterable);
  }

  ngOnInit(): void {
    // Forzamos el modo server-side si totalElements fue proporcionado (incluso si es 0)
    if (this.totalElements !== undefined && this.totalElements !== null) {
      this.isServerSide = true;
    }

    // Configurar debounce para el filtrado
    this.filterSubscription = this.filterSubject.pipe(
      debounceTime(250) // Esperar 250ms después de que el usuario termine de escribir
    ).subscribe(filters => {
      this.onFilterChange.emit(filters);
      this.applyFilters();
    });
  }

  ngOnDestroy(): void {
    this.filterSubscription?.unsubscribe();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['totalElements']) {
      this.isServerSide = true;
    }
    if (changes['data'] || changes['columns']) {
      this.applyFilters();
    }
  }

  // 1. Filtrado
  applyFilters() {
    if (this.isServerSide) {
      this.filteredData = this.data;
      this.totalPages = Math.ceil(this.totalElements / this.pageSize) || 1;
    } else {
      this.filteredData = this.data.filter(row => {
        return this.columns.every(col => {
          if (!col.filterable) return true;
          const search = (this.filterValues[col.key] || '').toLowerCase();
          const value = String(row[col.key] || '').toLowerCase();
          return value.includes(search);
        });
      });
      this.totalPages = Math.ceil(this.filteredData.length / this.pageSize) || 1;
    }

    if (this.currentPage > this.totalPages) {
      if (this.totalElements === 0 || !this.isServerSide) this.currentPage = 1;
    }
    this.updatePaginatedData();
  }

  // 2. Paginación de datos
  updatePaginatedData() {
    if (this.isServerSide) {
      this.paginatedData = this.filteredData;
    } else {
      const start = (this.currentPage - 1) * this.pageSize;
      const end = start + this.pageSize;
      this.paginatedData = this.filteredData.slice(start, end);
    }
    this.updateVisiblePages();
  }

  onPageSizeUIChange(event: any) {
    const newSize = Number(event.target?.value ?? event);
    this.onPageSizeChange.emit(newSize);
  }

  onPageSizeSelectChange(value: any) {
    const newSize = Number(value);
    this.pageSize = newSize;
    this.onPageSizeChange.emit(newSize);
    this.applyFilters();
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

  changePage(page: number | string) {
    if (page === '...') return;
    const p = Number(page);
    if (p >= 1 && p <= this.totalPages) {
      if (this.isServerSide) {
        this.onPageChange.emit(p - 1);
      } else {
        this.currentPage = p;
        this.updatePaginatedData();
      }
    }
  }

  onFilterUIChange() {
    // Si es server-side, mandamos al subject para el debounce
    if (this.isServerSide) {
      this.filterSubject.next({ ...this.filterValues });
    } else {
      // Si no es server-side, aplicamos de inmediato para que se vea reactivo localmente
      this.applyFilters();
    }
  }

  getValue(row: any, col: TableColumn): any {
    const val = row[col.key];
    return col.format ? col.format(val, row) : val;
  }
}
