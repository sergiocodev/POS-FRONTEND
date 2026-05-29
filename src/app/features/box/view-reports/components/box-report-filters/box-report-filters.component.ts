import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DateRangeSearchComponent } from '../../../../../shared/components/date-range-search/date-range-search.component';
import { SearchableDropdownComponent, SelectOption } from '../../../../../shared/components/searchable-dropdown/searchable-dropdown.component';

@Component({
  selector: 'app-box-report-filters',
  standalone: true,
  imports: [CommonModule, FormsModule, DateRangeSearchComponent, SearchableDropdownComponent],
  templateUrl: './box-report-filters.component.html',
  styleUrl: './box-report-filters.component.scss'
})
export class BoxReportFiltersComponent {
  @Input() activeTab: string = '';
  @Input() startDate: string = '';
  @Input() endDate: string = '';

  @Output() dateRangeChange = new EventEmitter<{ startDate: string, endDate: string }>();
  @Output() search = new EventEmitter<void>();

  // Global filters
  @Input() establishments: any[] = [];
  @Input() selectedEstablishmentId: string | null = null;
  @Output() establishmentChange = new EventEmitter<string>();

  @Input() cashRegisters: any[] = [];
  @Input() selectedCashRegisterId: string | null = null;
  @Output() cashRegisterChange = new EventEmitter<string>();

  get establishmentOptions(): SelectOption[] {
    return this.establishments.map(est => ({ id: est.id.toString(), label: est.name }));
  }

  get cashRegisterOptions(): SelectOption[] {
    return this.cashRegisters.map(r => ({ id: r.id.toString(), label: r.name }));
  }

  onDateRangeChange(range: { startDate: string, endDate: string }) {
    this.dateRangeChange.emit(range);
  }

  applyFilters() {
    this.search.emit();
  }
}
