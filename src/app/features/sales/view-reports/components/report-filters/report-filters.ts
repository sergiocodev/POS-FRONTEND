import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DateRangeSearchComponent } from '../../../../../shared/components/date-range-search/date-range-search.component';
import { SearchableDropdownComponent, SelectOption } from '../../../../../shared/components/searchable-dropdown/searchable-dropdown.component';

@Component({
  selector: 'app-report-filters',
  standalone: true,
  imports: [CommonModule, FormsModule, DateRangeSearchComponent, SearchableDropdownComponent],
  templateUrl: './report-filters.html',
  styleUrl: './report-filters.scss'
})
export class ReportFilters {
  @Input() activeTab: string = '';
  @Input() startDate: string = '';
  @Input() endDate: string = '';
  
  // Date signals will be updated via filterChange event from DateRangeSearchComponent
  // But we still need initial values or we just let DateRangeSearch handle its own state and emit.
  // Wait, DateRangeSearchComponent emits {startDate, endDate}.
  @Output() dateRangeChange = new EventEmitter<{ startDate: string, endDate: string }>();
  @Output() search = new EventEmitter<void>();

  @Input() establishments: any[] = [];
  @Input() selectedEstablishmentId: string | null = null;
  @Output() establishmentChange = new EventEmitter<string>();

  @Input() documentTypes: any[] = [];
  @Input() selectedDocumentType: string = '';
  @Output() documentTypeChange = new EventEmitter<string>();

  @Input() availableSeries: string[] = [];
  @Input() selectedSeries: string = '';
  @Output() seriesChange = new EventEmitter<string>();

  @Input() sellers: any[] = [];
  @Input() selectedSellerId: string | null = null;
  @Output() sellerChange = new EventEmitter<string>();

  @Input() customers: any[] = [];
  @Input() selectedCustomerId: string | null = null;
  @Output() customerChange = new EventEmitter<string>();

  get establishmentOptions(): SelectOption[] {
    return this.establishments.map(est => ({ id: est.id.toString(), label: est.name }));
  }

  get documentTypeOptions(): SelectOption[] {
    return this.documentTypes.map(type => ({ id: type.value, label: type.label }));
  }

  get seriesOptions(): SelectOption[] {
    return this.availableSeries.map(serie => ({ id: serie, label: serie }));
  }

  get sellerOptions(): SelectOption[] {
    return this.sellers.map(seller => ({ id: seller.id.toString(), label: seller.name }));
  }

  get customerOptions(): SelectOption[] {
    return this.customers.map(customer => ({ id: customer.id.toString(), label: customer.name }));
  }

  onDateRangeChange(range: { startDate: string, endDate: string }) {
    this.dateRangeChange.emit(range);
  }

  applyFilters() {
    this.search.emit();
  }
}
