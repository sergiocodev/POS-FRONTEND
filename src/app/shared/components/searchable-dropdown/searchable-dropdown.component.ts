import { Component, input, output, computed, signal, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';

export interface SelectOption {
  id: string | number;
  label: string;
}

@Component({
  selector: 'app-searchable-dropdown',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './searchable-dropdown.component.html',
  styleUrl: './searchable-dropdown.component.scss',
})
export class SearchableDropdownComponent {
  // Inputs (Signal Inputs)
  options = input<SelectOption[]>([]);
  placeholder = input<string>('Seleccione un concepto');
  searchPlaceholder = input<string>('Buscar...');
  emptyMessage = input<string>('No se encontraron resultados.');
  selectedId = input<string | number | null>(null);
  searchable = input<boolean>(true);
  size = input<'sm' | 'md' | 'lg'>('md');
  disabled = input<boolean>(false);
  dropDirection = input<'down' | 'up'>('down');
  
  // Nuevo input para delegar la búsqueda al backend
  serverSideSearch = input<boolean>(false);

  // Output
  selectionChange = output<SelectOption>();
  // Nuevo output para notificar el término de búsqueda
  searchChange = output<string>();

  // Estado del componente
  isOpen = signal(false);
  searchTerm = signal('');
  selectedOption = signal<SelectOption | null>(null);

  constructor() {
    effect(() => {
      const id = this.selectedId();
      const opts = this.options();
      if (id !== undefined) {
        const found = opts.find(o => o.id === id);
        this.selectedOption.set(found || null);
      }
    }, { allowSignalWrites: true });
  }

  // Computado para filtrar las opciones en tiempo real
  filteredOptions = computed(() => {
    // Si la búsqueda es del lado del servidor, devolvemos todas las opciones
    if (this.serverSideSearch()) {
      return this.options();
    }
    const term = this.searchTerm().toLowerCase();
    return this.options().filter(opt => opt.label.toLowerCase().includes(term));
  });

  // Computado para el texto del botón principal
  displayText = computed(() => {
    const selected = this.selectedOption();
    return selected ? selected.label : this.placeholder();
  });

  onSearchTermChange(term: string) {
    this.searchTerm.set(term);
    if (this.serverSideSearch()) {
      this.searchChange.emit(term);
    }
  }

  toggleDropdown(): void {
    if (this.disabled()) return;
    this.isOpen.update(v => !v);
    if (!this.isOpen()) {
      this.searchTerm.set(''); // Resetea la búsqueda al cerrar
      if (this.serverSideSearch()) {
        this.searchChange.emit('');
      }
    }
  }

  selectOption(option: SelectOption): void {
    this.selectedOption.set(option);
    this.selectionChange.emit(option);
    this.isOpen.set(false);
    this.searchTerm.set('');
    if (this.serverSideSearch()) {
        this.searchChange.emit('');
    }
  }
}
