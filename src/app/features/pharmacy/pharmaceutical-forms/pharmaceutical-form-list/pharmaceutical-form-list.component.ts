import { Component, OnInit, signal, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PharmaceuticalFormResponse } from '../../../../core/models/pharmaceutical-form.model';
import { CustomTableComponent, TableColumn } from '../../../../shared/components/custom-table/custom-table.component';

@Component({
    selector: 'app-pharmaceutical-form-list',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        CustomTableComponent
    ],
    templateUrl: './pharmaceutical-form-list.component.html',
    styleUrl: './pharmaceutical-form-list.component.scss'
})
export class PharmaceuticalFormListComponent implements OnInit, OnChanges {
    @Input() pharmaceuticalForms: PharmaceuticalFormResponse[] = [];
    @Input() isLoading = false;

    @Output() create = new EventEmitter<void>();
    @Output() edit = new EventEmitter<number>();
    @Output() delete = new EventEmitter<PharmaceuticalFormResponse>();
    @Output() toggleStatus = new EventEmitter<PharmaceuticalFormResponse>();

    // Configuración de la tabla
    cols: TableColumn[] = [
        { key: 'id', label: 'ID', type: 'text' },
        { key: 'name', label: 'Forma Farmacéutica', type: 'text' },
        { key: 'active', label: 'Estado', type: 'toggle' },
        { key: 'actions', label: 'Acciones', type: 'action' }
    ];

    localForms = signal<PharmaceuticalFormResponse[]>([]);
    filteredForms = signal<PharmaceuticalFormResponse[]>([]);

    searchTerm = signal('');
    selectedStatusFilter = signal<boolean | null>(null);

    // Pagination
    pageSize = 10;
    currentPage = 1;

    ngOnInit() {
        this.updateLocalData();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['pharmaceuticalForms']) {
            this.updateLocalData();
        }
    }

    updateLocalData() {
        this.localForms.set(this.pharmaceuticalForms);
        this.applyFilters();
    }

    applyFilters() {
        let filtered = this.localForms();

        const search = this.searchTerm().toLowerCase();
        if (search) {
            filtered = filtered.filter(f =>
                f.name.toLowerCase().includes(search)
            );
        }

        if (this.selectedStatusFilter() !== null) {
            filtered = filtered.filter(f => f.active === this.selectedStatusFilter());
        }

        this.filteredForms.set(filtered);
        this.currentPage = 1;
    }

    onSearchChange(value: string) {
        this.searchTerm.set(value);
        this.applyFilters();
    }

    onStatusFilterChange(event: any) {
        const value = event === 'true' ? true : event === 'false' ? false : null;
        this.selectedStatusFilter.set(value);
        this.applyFilters();
    }

    // --- Actions ---

    handleTableAction(e: { action: string, row: PharmaceuticalFormResponse }) {
        if (e.action === 'edit') {
            this.edit.emit(e.row.id);
        } else if (e.action === 'delete') {
            this.delete.emit(e.row);
        }
    }

    handleStatusToggle(e: { row: PharmaceuticalFormResponse, key: string, checked: boolean }) {
        this.toggleStatus.emit(e.row);
        e.row.active = !e.checked; // Optimistic toggle reversion
    }

    createPharmaceuticalForm() {
        this.create.emit();
    }

    trackByFormId(index: number, f: PharmaceuticalFormResponse): number {
        return f.id;
    }
}
