import { Component, OnInit, inject, signal, Input, Output, EventEmitter, effect, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserResponse } from '../../../../core/models/user.model';
import { RoleResponse } from '../../../../core/models/maintenance.model';

import { CustomTableComponent, TableColumn } from '../../../../shared/components/custom-table/custom-table.component';
import { DatePipe } from '@angular/common';

@Component({
    selector: 'app-users-list',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        CustomTableComponent
    ],
    providers: [DatePipe],
    templateUrl: './users-list.component.html',
    styleUrl: './users-list.component.scss'
})
export class UsersListComponent implements OnInit, OnChanges {
    private datePipe = inject(DatePipe);

    @Input() users: UserResponse[] = [];
    @Input() roles: RoleResponse[] = [];
    @Input() isLoading = false;

    // Pagination inputs
    @Input() totalItems = 0;
    @Input() totalPages = 0;
    @Input() currentPage = 0;
    @Input() pageSize = 10;

    @Output() edit = new EventEmitter<number>();
    @Output() delete = new EventEmitter<UserResponse>();

    // Pagination & Filter outputs
    @Output() pageChange = new EventEmitter<number>();
    @Output() pageSizeChange = new EventEmitter<number>();
    @Output() tableFilterChange = new EventEmitter<any>();

    // Configuración de la tabla
    cols: TableColumn[] = [
        { key: 'index', label: 'N°', type: 'index', width: '50px', align: 'center' },
        { key: 'profilePicture', label: 'Perfil', type: 'image' },
        { key: 'username', label: 'Usuario', type: 'text', filterable: true },
        { key: 'fullName', label: 'Nombre Completo', type: 'text', filterable: true },
        { key: 'email', label: 'Email', type: 'text', filterable: true },
        { key: 'roles', label: 'Roles', type: 'text', format: (roles: any[]) => roles.map(r => r.name).join(', ') },

        { key: 'lastLogin', label: 'Último Acceso', type: 'text', format: (v: any) => v ? this.datePipe.transform(v, 'dd/MM/yyyy HH:mm', 'UTC') || 'N/A' : 'Nunca' },
        { key: 'actions', label: 'Acciones', type: 'action' }
    ];

    constructor() { }

    ngOnInit() {
    }

    ngOnChanges(changes: SimpleChanges) {
    }

    // --- Acciones de la Tabla ---

    handleTableAction(e: { action: string, row: UserResponse }) {
        if (e.action === 'edit') {
            this.edit.emit(e.row.id);
        } else if (e.action === 'delete') {
            this.delete.emit(e.row);
        }
    }



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



    // --- Helpers de UI ---

    trackByUserId(index: number, user: UserResponse): number {
        return user.id;
    }
}