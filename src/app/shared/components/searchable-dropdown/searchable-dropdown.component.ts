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

  // Output
  selectionChange = output<SelectOption>();

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
    const term = this.searchTerm().toLowerCase();
    return this.options().filter(opt => opt.label.toLowerCase().includes(term));
  });

  // Computado para el texto del botón principal
  displayText = computed(() => {
    const selected = this.selectedOption();
    return selected ? selected.label : this.placeholder();
  });

  toggleDropdown(): void {
    if (this.disabled()) return;
    this.isOpen.update(v => !v);
    if (!this.isOpen()) {
      this.searchTerm.set(''); // Resetea la búsqueda al cerrar
    }
  }

  selectOption(option: SelectOption): void {
    this.selectedOption.set(option);
    this.selectionChange.emit(option);
    this.isOpen.set(false);
    this.searchTerm.set('');
  }
}
