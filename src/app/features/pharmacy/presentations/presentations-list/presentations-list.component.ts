import { Component, OnInit, signal, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PresentationResponse } from '../../../../core/models/product.model';
import { CustomTableComponent, TableColumn } from '../../../../shared/components/custom-table/custom-table.component';

@Component({
    selector: 'app-presentations-list',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        CustomTableComponent
    ],
    templateUrl: './presentations-list.component.html',
    styleUrl: './presentations-list.component.scss'
})
export class PresentationsListComponent implements OnInit, OnChanges {
    @Input() presentations: PresentationResponse[] = [];
    @Input() isLoading = false;

    @Output() create = new EventEmitter<void>();
    @Output() edit = new EventEmitter<number>();
    @Output() delete = new EventEmitter<PresentationResponse>();

    // Configuración de la tabla
    cols: TableColumn[] = [
        { key: 'id', label: 'ID', type: 'text' },
        { key: 'description', label: 'Presentación', type: 'text' },
        { key: 'actions', label: 'Acciones', type: 'action' }
    ];

    localPresentations = signal<PresentationResponse[]>([]);
    filteredPresentations = signal<PresentationResponse[]>([]);

    searchTerm = signal('');

    // Pagination
    pageSize = 10;
    currentPage = 1;

    ngOnInit() {
        this.updateLocalData();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['presentations']) {
            this.updateLocalData();
        }
    }

    updateLocalData() {
        this.localPresentations.set(this.presentations);
        this.applyFilters();
    }

    applyFilters() {
        let filtered = this.localPresentations();

        const search = this.searchTerm().toLowerCase();
        if (search) {
            filtered = filtered.filter(p =>
                p.description.toLowerCase().includes(search)
            );
        }

        this.filteredPresentations.set(filtered);
        this.currentPage = 1;
    }

    onSearchChange(value: string) {
        this.searchTerm.set(value);
        this.applyFilters();
    }

    // --- Actions ---

    handleTableAction(e: { action: string, row: PresentationResponse }) {
        if (e.action === 'edit') {
            this.edit.emit(e.row.id);
        } else if (e.action === 'delete') {
            this.delete.emit(e.row);
        }
    }

    createPresentation() {
        this.create.emit();
    }

    trackByPresentationId(index: number, presentation: PresentationResponse): number {
        return presentation.id;
    }
}
