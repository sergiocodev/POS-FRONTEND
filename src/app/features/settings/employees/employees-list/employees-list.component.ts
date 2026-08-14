import { Component, OnInit, inject, signal, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmployeeResponse } from '../../../../core/models/employee.model';
import { CustomTableComponent, TableColumn } from '../../../../shared/components/custom-table/custom-table.component';

@Component({
    selector: 'app-employees-list',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        CustomTableComponent
    ],
    templateUrl: './employees-list.component.html',
    styleUrl: './employees-list.component.scss'
})
export class EmployeesListComponent {
    @Input() employees: EmployeeResponse[] = [];
    @Input() isLoading: boolean = false;

    // Pagination inputs
    @Input() totalItems = 0;
    @Input() totalPages = 0;
    @Input() currentPage = 0;
    @Input() pageSize = 10;

    @Output() create = new EventEmitter<void>();
    @Output() edit = new EventEmitter<number>();
    @Output() delete = new EventEmitter<EmployeeResponse>();

    // Pagination & Filter outputs
    @Output() pageChange = new EventEmitter<number>();
    @Output() pageSizeChange = new EventEmitter<number>();
    @Output() tableFilterChange = new EventEmitter<any>();

    // Configuración de la tabla
    cols: TableColumn[] = [
        { key: 'index', label: 'N°', type: 'index', width: '50px', align: 'center' },
        { key: 'fullName', label: 'Nombre', type: 'text', filterable: true },
        { key: 'documentNumber', label: 'Documento', type: 'text', filterable: true },
        {
            key: 'username',
            label: 'Usuario',
            type: 'text',
            filterable: true,
            format: (v: any) => v || 'Sin cuenta'
        },

        { key: 'actions', label: 'Acciones', type: 'action' }
    ];

    // Filter Logic is handled by Backend now

    // --- Table Custom Pagination & Filter Events ---

    handlePageChange(page: number) {
        // custom-table usually emits 1-based page, we emit 0-based to parent
        this.pageChange.emit(page - 1);
    }

    handlePageSizeChange(size: number) {
        this.pageSizeChange.emit(size);
    }

    handleTableFilter(filters: any) {
        this.tableFilterChange.emit(filters);
    }

    // --- Actions ---

    handleTableAction(e: { action: string, row: EmployeeResponse }) {
        if (e.action === 'edit') {
            this.edit.emit(e.row.id);
        } else if (e.action === 'delete') {
            this.delete.emit(e.row);
        }
    }



    createEmployee() {
        this.create.emit();
    }

    getFullName(employee: EmployeeResponse): string {
        return `${employee.firstName} ${employee.lastName || ''}`.trim();
    }



    trackByEmployeeId(index: number, employee: EmployeeResponse): number {
        return employee.id;
    }
}