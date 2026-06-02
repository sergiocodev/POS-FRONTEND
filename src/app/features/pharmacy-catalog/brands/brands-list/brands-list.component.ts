import { Component, OnInit, signal, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BrandResponse } from '../../../../core/models/brand.model';
import { CustomTableComponent, TableColumn } from '../../../../shared/components/custom-table/custom-table.component';

@Component({
    selector: 'app-brands-list',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        CustomTableComponent
    ],
    templateUrl: './brands-list.component.html',
    styleUrl: './brands-list.component.scss'
})
export class BrandsListComponent implements OnInit, OnChanges {
    @Input() brands: BrandResponse[] = [];
    @Input() isLoading = false;
    @Input() totalItems = 0;
    @Input() currentPage = 1;
    @Input() pageSize = 10;

    @Output() create = new EventEmitter<void>();
    @Output() edit = new EventEmitter<number>();
    @Output() delete = new EventEmitter<BrandResponse>();
    @Output() pageChange = new EventEmitter<number>();
    @Output() pageSizeChange = new EventEmitter<number>();
    @Output() tableFilterChange = new EventEmitter<any>();

    // Configuración de la tabla
    cols: TableColumn[] = [
        { key: 'index', label: 'N°', type: 'index', width: '50px', align: 'center' },
        { key: 'name', label: 'Marca', type: 'text', filterable: true },
        { key: 'actions', label: 'Acciones', type: 'action', width: '100px', align: 'center' }
    ];

    ngOnInit() {}
    ngOnChanges(changes: SimpleChanges) {}

    // --- Actions ---

    handleTableAction(e: { action: string, row: BrandResponse }) {
        if (e.action === 'edit') {
            this.edit.emit(e.row.id);
        } else if (e.action === 'delete') {
            this.delete.emit(e.row);
        }
    }
}
