import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActiveIngredientResponse } from '../../../../core/models/active-ingredient.model';
import { CustomTableComponent, TableColumn } from '../../../../shared/components/custom-table/custom-table.component';

@Component({
    selector: 'app-active-ingredients-list',
    standalone: true,
    imports: [
        CommonModule,
        CustomTableComponent
    ],
    templateUrl: './active-ingredients-list.component.html',
    styleUrl: './active-ingredients-list.component.scss'
})
export class ActiveIngredientsListComponent {
    @Input() activeIngredients: ActiveIngredientResponse[] = [];
    @Input() isLoading = false;
    @Input() totalItems = 0;
    @Input() currentPage = 1;
    @Input() pageSize = 10;

    @Output() create = new EventEmitter<void>();
    @Output() edit = new EventEmitter<number>();
    @Output() delete = new EventEmitter<ActiveIngredientResponse>();
    @Output() pageChange = new EventEmitter<number>();
    @Output() pageSizeChange = new EventEmitter<number>();
    @Output() tableFilterChange = new EventEmitter<any>();

    // Configuración de la tabla
    cols: TableColumn[] = [
        { key: 'index', label: 'N°', type: 'index', width: '50px', align: 'center' },
        { key: 'name', label: 'Nombre', type: 'text', filterable: true },
        { key: 'description', label: 'Descripción', type: 'text', filterable: false },
        { key: 'actions', label: 'Acciones', type: 'action', width: '100px', align: 'center' }
    ];

    // --- Actions ---

    handleTableAction(e: { action: string, row: ActiveIngredientResponse }) {
        if (e.action === 'edit') {
            this.edit.emit(e.row.id);
        } else if (e.action === 'delete') {
            this.delete.emit(e.row);
        }
    }

    createActiveIngredient() {
        this.create.emit();
    }

    trackByIngredientId(index: number, ingredient: ActiveIngredientResponse): number {
        return ingredient.id;
    }
}
