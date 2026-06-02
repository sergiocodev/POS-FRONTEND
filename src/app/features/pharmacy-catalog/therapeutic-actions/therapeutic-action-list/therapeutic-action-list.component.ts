import { Component, OnInit, signal, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TherapeuticActionResponse } from '../../../../core/models/therapeutic-action.model';
import { CustomTableComponent, TableColumn } from '../../../../shared/components/custom-table/custom-table.component';

@Component({
    selector: 'app-therapeutic-action-list',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        CustomTableComponent
    ],
    templateUrl: './therapeutic-action-list.component.html',
    styleUrl: './therapeutic-action-list.component.scss'
})
export class TherapeuticActionListComponent implements OnInit, OnChanges {
    @Input() therapeuticActions: TherapeuticActionResponse[] = [];
    @Input() isLoading = false;

    @Output() create = new EventEmitter<void>();
    @Output() edit = new EventEmitter<number>();
    @Output() delete = new EventEmitter<TherapeuticActionResponse>();

    // Configuración de la tabla
    cols: TableColumn[] = [
        { key: 'id', label: 'ID', type: 'text' },
        { key: 'name', label: 'Acción Terapéutica', type: 'text' },
        { key: 'description', label: 'Descripción', type: 'text' },
        { key: 'actions', label: 'Acciones', type: 'action' }
    ];

    localActions = signal<TherapeuticActionResponse[]>([]);
    filteredActions = signal<TherapeuticActionResponse[]>([]);

    searchTerm = signal('');

    // Pagination
    pageSize = 10;
    currentPage = 1;

    ngOnInit() {
        this.updateLocalData();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['therapeuticActions']) {
            this.updateLocalData();
        }
    }

    updateLocalData() {
        this.localActions.set(this.therapeuticActions);
        this.applyFilters();
    }

    applyFilters() {
        let filtered = this.localActions();

        const search = this.searchTerm().toLowerCase();
        if (search) {
            filtered = filtered.filter(a =>
                a.name.toLowerCase().includes(search) ||
                (a.description && a.description.toLowerCase().includes(search))
            );
        }

        this.filteredActions.set(filtered);
        this.currentPage = 1;
    }

    onSearchChange(value: string) {
        this.searchTerm.set(value);
        this.applyFilters();
    }

    // --- Actions ---

    handleTableAction(e: { action: string, row: TherapeuticActionResponse }) {
        if (e.action === 'edit') {
            this.edit.emit(e.row.id);
        } else if (e.action === 'delete') {
            this.delete.emit(e.row);
        }
    }



    createTherapeuticAction() {
        this.create.emit();
    }

    trackByActionId(index: number, action: TherapeuticActionResponse): number {
        return action.id;
    }
}
