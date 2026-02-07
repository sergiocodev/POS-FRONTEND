import { Component, OnInit, inject, signal, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EstablishmentResponse } from '../../../../core/models/maintenance.model';
import { CustomTableComponent, TableColumn } from '../../../../shared/components/custom-table/custom-table.component';

@Component({
    selector: 'app-establishments-list',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        CustomTableComponent
    ],
    templateUrl: './establishments-list.component.html',
    styleUrl: './establishments-list.component.scss'
})
export class EstablishmentsListComponent implements OnInit, OnChanges {
    @Input() establishments: EstablishmentResponse[] = [];
    @Input() isLoading = false;

    @Output() create = new EventEmitter<void>();
    @Output() edit = new EventEmitter<number>();
    @Output() delete = new EventEmitter<EstablishmentResponse>();
    @Output() toggleStatus = new EventEmitter<EstablishmentResponse>();

    // Configuración de la tabla
    cols: TableColumn[] = [
        { key: 'name', label: 'Establecimiento', type: 'text' },
        { key: 'address', label: 'Dirección', type: 'text', format: (v: string) => v || 'Sin dirección' },
        { key: 'codeSunat', label: 'Cód. SUNAT', type: 'text' },
        { key: 'active', label: 'Estado', type: 'toggle' },
        { key: 'actions', label: 'Acciones', type: 'action' }
    ];

    // Data Signals
    localEstablishments = signal<EstablishmentResponse[]>([]);
    filteredEstablishments = signal<EstablishmentResponse[]>([]);

    // Filtros
    searchTerm = signal('');
    selectedStatusFilter = signal<boolean | null>(null);

    pageSize = 10;

    constructor() { }

    ngOnInit() {
        this.updateLocalData();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['establishments']) {
            this.updateLocalData();
        }
    }

    updateLocalData() {
        this.localEstablishments.set(this.establishments);
        this.applyFilters();
    }

    // --- Filter Logic ---

    applyFilters() {
        let filtered = this.localEstablishments();
        const search = this.searchTerm().toLowerCase();

        if (search) {
            filtered = filtered.filter(est =>
                est.name.toLowerCase().includes(search) ||
                (est.address && est.address.toLowerCase().includes(search)) ||
                est.codeSunat.toLowerCase().includes(search)
            );
        }

        if (this.selectedStatusFilter() !== null) {
            filtered = filtered.filter(est => est.active === this.selectedStatusFilter());
        }

        this.filteredEstablishments.set(filtered);
    }

    onSearchChange(value: string) {
        this.searchTerm.set(value);
        this.applyFilters();
    }

    onStatusFilterChange(event: any) {
        let value: boolean | null = null;
        if (event === 'true' || event === true) value = true;
        else if (event === 'false' || event === false) value = false;

        this.selectedStatusFilter.set(value);
        this.applyFilters();
    }

    // --- Actions ---

    handleTableAction(e: { action: string, row: EstablishmentResponse }) {
        if (e.action === 'edit') {
            this.edit.emit(e.row.id);
        } else if (e.action === 'delete') {
            this.delete.emit(e.row);
        }
    }

    handleStatusToggle(e: { row: EstablishmentResponse, key: string, checked: boolean }) {
        this.toggleStatus.emit(e.row);
    }

    createEstablishment() {
        this.create.emit();
    }



    trackById(index: number, est: EstablishmentResponse): number {
        return est.id;
    }
}