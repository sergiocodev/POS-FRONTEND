import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DateRangeSearchComponent } from '../../../../../shared/components/date-range-search/date-range-search.component';
import { SearchableDropdownComponent, SelectOption } from '../../../../../shared/components/searchable-dropdown/searchable-dropdown.component';

@Component({
  selector: 'app-purchase-report-filters',
  standalone: true,
  imports: [CommonModule, FormsModule, DateRangeSearchComponent, SearchableDropdownComponent],
  templateUrl: './purchase-report-filters.component.html',
  styleUrl: './purchase-report-filters.component.scss'
})
export class PurchaseReportFiltersComponent {
  @Input() activeTab: string = '';
  @Input() startDate: string = '';
  @Input() endDate: string = '';
  
  @Output() dateRangeChange = new EventEmitter<{ startDate: string, endDate: string }>();
  @Output() search = new EventEmitter<void>();

  // Global filters
  @Input() establishments: any[] = [];
  @Input() selectedEstablishmentId: string | null = null;
  @Output() establishmentChange = new EventEmitter<string>();

  @Input() suppliers: any[] = [];
  @Input() selectedSupplierId: string | null = null;
  @Output() supplierChange = new EventEmitter<string>();

  @Input() buyers: any[] = [];
  @Input() selectedBuyerId: string | null = null;
  @Output() buyerChange = new EventEmitter<string>();

  // Dropdown options
  get establishmentOptions(): SelectOption[] {
    return this.establishments.map(est => ({ id: est.id.toString(), label: est.name }));
  }

  get supplierOptions(): SelectOption[] {
    return this.suppliers.map(sup => ({ id: sup.id.toString(), label: sup.name }));
  }

  get buyerOptions(): SelectOption[] {
    return this.buyers.map(b => ({ id: b.id.toString(), label: b.firstName + ' ' + (b.lastName || '') }));
  }

  onDateRangeChange(range: { startDate: string, endDate: string }) {
    this.dateRangeChange.emit(range);
  }

  applyFilters() {
    this.search.emit();
  }
}
