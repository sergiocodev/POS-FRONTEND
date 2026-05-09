import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CustomerResponse } from '../../../../core/models/customer.model';
import { CustomTableComponent, TableColumn } from '../../../../shared/components/custom-table/custom-table.component';

@Component({
    selector: 'app-customer-list',
    standalone: true,
    imports: [CommonModule, RouterModule, CustomTableComponent],
    templateUrl: './customer-list.component.html',
    styleUrl: './customer-list.component.scss'
})
export class CustomerListComponent implements OnInit {
    // Inputs from Container
    @Input() customers: CustomerResponse[] = [];
    @Input() isLoading = false;
    @Input() errorMessage = '';
    @Input() totalItems = 0;
    @Input() totalPages = 0;
    @Input() currentPage = 0;
    @Input() pageSize = 10;

    // Outputs to Container
    @Output() newCustomer = new EventEmitter<void>();
    @Output() editCustomer = new EventEmitter<number>();
    @Output() deleteCustomer = new EventEmitter<CustomerResponse>();
    @Output() clearError = new EventEmitter<void>();
    @Output() pageChange = new EventEmitter<number>();
    @Output() pageSizeChange = new EventEmitter<number>();
    @Output() tableFilterChange = new EventEmitter<any>();

    columns: TableColumn[] = [
        { key: 'index', label: 'N°', type: 'index', width: '50px', align: 'center' },
        {
            key: 'documentType',
            label: 'Tipo Doc.',
            type: 'badge',
            align: 'center',
            classCallback: () => 'bg-secondary'
        },
        { key: 'documentNumber', label: 'Nº Documento', filterable: true },
        { key: 'name', label: 'Nombre', filterable: true },
        { key: 'phone', label: 'Teléfono', filterable: true },
        { key: 'email', label: 'Email', filterable: true },
        {
            key: 'accumulatedPoints',
            label: 'Puntos',
            type: 'badge',
            align: 'center',
            classCallback: () => 'bg-primary bg-opacity-10 text-primary rounded-pill px-3'
        },
        { key: 'actions', label: 'Acciones', type: 'action', align: 'center' }
    ];

    ngOnInit(): void {
    }

    onTableAction(event: { action: string, row: any }): void {
        if (event.action === 'edit') {
            this.onEdit(event.row.id);
        } else if (event.action === 'delete') {
            this.onDelete(event.row);
        }
    }

    handlePageChange(page: number): void {
        this.pageChange.emit(page);
    }

    handlePageSizeChange(size: number): void {
        this.pageSizeChange.emit(size);
    }

    handleTableFilter(filters: any): void {
        this.tableFilterChange.emit(filters);
    }

    onEdit(id: number): void {
        this.editCustomer.emit(id);
    }

    onDelete(customer: CustomerResponse): void {
        this.deleteCustomer.emit(customer);
    }

    onClearError(): void {
        this.clearError.emit();
    }
}
