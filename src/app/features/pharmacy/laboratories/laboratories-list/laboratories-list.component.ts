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

    // Configuración de la tabla
    cols: TableColumn[] = [
        { key: 'id', label: 'ID', type: 'text' },
        { key: 'name', label: 'Laboratorio', type: 'text' },
        { key: 'actions', label: 'Acciones', type: 'action' }
    ];

    localLaboratories = signal<LaboratoryResponse[]>([]);
    filteredLaboratories = signal<LaboratoryResponse[]>([]);

    searchTerm = signal('');

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



        this.filteredLaboratories.set(filtered);
        this.currentPage = 1;
    }

    onSearchChange(value: string) {
        this.searchTerm.set(value);
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



    createLaboratory() {
        this.create.emit();
    }

    trackByLaboratoryId(index: number, laboratory: LaboratoryResponse): number {
        return laboratory.id;
    }
}
