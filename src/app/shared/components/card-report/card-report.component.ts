import { Component, Input, Output, EventEmitter, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface CardReportOption {
  id: string | number;
  label: string;
}

export interface CardReportDropdownConfig {
  key: string;
  options: CardReportOption[];
  placeholder: string;
  multiple?: boolean;
  selectedId?: string | number | null;
  selectedIds?: (string | number)[];
}

@Component({
  selector: 'app-card-report',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './card-report.component.html',
  styleUrl: './card-report.component.scss',
})
export class CardReportComponent {
  @Input() title: string = '';
  @Input() description: string = '';
  @Input() buttonText: string = 'VER REPORTE';
  @Input() disabled: boolean = false;
  
  // Single Dropdown Inputs (Backward Compatibility)
  @Input() options: CardReportOption[] = [];
  @Input() placeholder: string = 'Seleccione una opción';
  @Input() hasDropdown: boolean = false;
  @Input() multiple: boolean = false;

  // Multiple Dropdowns Input
  @Input() dropdownConfigs: CardReportDropdownConfig[] = [];

  @Output() actionClick = new EventEmitter<void>();
  @Output() selectionChange = new EventEmitter<CardReportOption | CardReportOption[] | null>();
  @Output() dropdownChange = new EventEmitter<{key: string, value: CardReportOption | CardReportOption[] | null}>();

  // Dropdown States
  // We use a map to handle multiple dropdowns
  openDropdownKey = signal<string | null>(null);
  searchTerms = signal<Record<string, string>>({});
  
  // Internal state for single dropdown
  selectedOptions = signal<CardReportOption[]>([]);
  
  // Internal state for multiple dropdowns
  multiSelectedOptions = signal<Record<string, CardReportOption[]>>({});

  getFilteredOptions(config: CardReportDropdownConfig | null = null) {
    const opts = config ? config.options : this.options;
    const key = config ? config.key : 'single';
    const term = (this.searchTerms()[key] || '').toLowerCase();
    return opts.filter(opt => opt.label.toLowerCase().includes(term));
  }

  toggleDropdown(key: string) {
    if (this.openDropdownKey() === key) {
      this.openDropdownKey.set(null);
    } else {
      this.openDropdownKey.set(key);
      // Reset search for this key
      this.searchTerms.update(prev => ({ ...prev, [key]: '' }));
    }
  }

  selectOption(option: CardReportOption | null, config: CardReportDropdownConfig | null = null) {
    const key = config ? config.key : 'single';
    const isMultiple = config ? config.multiple : this.multiple;

    if (!option) {
      if (config) {
        this.multiSelectedOptions.update(prev => ({ ...prev, [key]: [] }));
        this.dropdownChange.emit({ key, value: isMultiple ? [] : null });
      } else {
        this.selectedOptions.set([]);
        this.selectionChange.emit(isMultiple ? [] : null);
      }
      return;
    }

    if (isMultiple) {
      const current = config ? (this.multiSelectedOptions()[key] || []) : this.selectedOptions();
      const index = current.findIndex(o => o.id === option.id);
      
      let next: CardReportOption[];
      if (index > -1) {
        next = current.filter(o => o.id !== option.id);
      } else {
        next = [...current, option];
      }
      
      if (config) {
        this.multiSelectedOptions.update(prev => ({ ...prev, [key]: next }));
        this.dropdownChange.emit({ key, value: next });
      } else {
        this.selectedOptions.set(next);
        this.selectionChange.emit(next);
      }
    } else {
      if (config) {
        this.multiSelectedOptions.update(prev => ({ ...prev, [key]: [option] }));
        this.dropdownChange.emit({ key, value: option });
      } else {
        this.selectedOptions.set([option]);
        this.selectionChange.emit(option);
      }
      this.openDropdownKey.set(null);
    }
  }

  isSelected(option: CardReportOption, config: CardReportDropdownConfig | null = null): boolean {
    const current = config ? (this.multiSelectedOptions()[config.key] || []) : this.selectedOptions();
    return current.some(o => o.id === option.id);
  }

  getSelectedOptions(config: CardReportDropdownConfig | null = null): CardReportOption[] {
    return config ? (this.multiSelectedOptions()[config.key] || []) : this.selectedOptions();
  }

  onSearchChange(key: string, term: string) {
    this.searchTerms.update(prev => ({ ...prev, [key]: term }));
  }

  trackById(index: number, item: CardReportOption) {
    return item.id;
  }

  onClick() {
    this.actionClick.emit();
  }
}


