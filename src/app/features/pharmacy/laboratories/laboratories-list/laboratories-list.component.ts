import { Component, OnInit, signal, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LaboratoryResponse } from '../../../../core/models/laboratory.model';
import { CustomTableComponent, TableColumn } from '../../../../shared/components/custom-table/custom-table.component';

@Component({
    selector: 'app-laboratories-list',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        CustomTableComponent
    ],
    templateUrl: './laboratories-list.component.html',
    styleUrl: './laboratories-list.component.scss'
})
export class LaboratoriesListComponent implements OnInit, OnChanges {
    @Input() laboratories: LaboratoryResponse[] = [];
    @Input() isLoading = false;

    @Output() create = new EventEmitter<void>();
    @Output() edit = new EventEmitter<number>();
    @Output() delete = new EventEmitter<LaboratoryResponse>();
    @Output() toggleStatus = new EventEmitter<LaboratoryResponse>();

    // Configuración de la tabla
    cols: TableColumn[] = [
        { key: 'id', label: 'ID', type: 'text' },
        { key: 'name', label: 'Laboratorio', type: 'text' },
        { key: 'active', label: 'Estado', type: 'toggle' },
        { key: 'actions', label: 'Acciones', type: 'action' }
    ];

    localLaboratories = signal<LaboratoryResponse[]>([]);
    filteredLaboratories = signal<LaboratoryResponse[]>([]);

    searchTerm = signal('');
    selectedStatusFilter = signal<boolean | null>(null);

    // Pagination
    pageSize = 10;
    currentPage = 1;

    ngOnInit() {
        this.updateLocalData();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['laboratories']) {
            this.updateLocalData();
        }
    }

    updateLocalData() {
        this.localLaboratories.set(this.laboratories);
        this.applyFilters();
    }

    applyFilters() {
        let filtered = this.localLaboratories();

        const search = this.searchTerm().toLowerCase();
        if (search) {
            filtered = filtered.filter(lab =>
                lab.name.toLowerCase().includes(search)
            );
        }

        if (this.selectedStatusFilter() !== null) {
            filtered = filtered.filter(lab => lab.active === this.selectedStatusFilter());
        }

        this.filteredLaboratories.set(filtered);
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

    handleTableAction(e: { action: string, row: LaboratoryResponse }) {
        if (e.action === 'edit') {
            this.edit.emit(e.row.id);
        } else if (e.action === 'delete') {
            this.delete.emit(e.row);
        }
    }

    handleStatusToggle(e: { row: LaboratoryResponse, key: string, checked: boolean }) {
        this.toggleStatus.emit(e.row);
        e.row.active = !e.checked; // Optimistic toggle reversion
    }

    createLaboratory() {
        this.create.emit();
    }

    trackByLaboratoryId(index: number, laboratory: LaboratoryResponse): number {
        return laboratory.id;
    }
}
