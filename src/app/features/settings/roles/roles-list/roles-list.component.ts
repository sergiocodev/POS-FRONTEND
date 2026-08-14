import { Component, OnInit, inject, signal, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RoleResponse } from '../../../../core/models/maintenance.model';
import { CustomTableComponent, TableColumn } from '../../../../shared/components/custom-table/custom-table.component';

@Component({
    selector: 'app-roles-list',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        CustomTableComponent,
    ],
    providers: [DatePipe],
    templateUrl: './roles-list.component.html',
    styleUrl: './roles-list.component.scss'
})
export class RolesListComponent implements OnInit {
    private datePipe = inject(DatePipe);

    @Input() roles: RoleResponse[] = [];
    @Input() isLoading = false;
    @Input() totalItems = 0;
    @Input() currentPage = 1;
    @Input() pageSize = 10;

    @Output() pageChange = new EventEmitter<number>();
    @Output() searchChange = new EventEmitter<string>();

    @Output() create = new EventEmitter<void>();
    @Output() edit = new EventEmitter<number>();
    @Output() delete = new EventEmitter<RoleResponse>();
    @Output() permissions = new EventEmitter<RoleResponse>();

    // Configuración de la tabla
    cols: TableColumn[] = [
        { key: 'index', label: 'N°', type: 'index', width: '50px', align: 'center' },
        { key: 'name', label: 'Rol', type: 'text', filterable: true },
        { key: 'description', label: 'Descripción', type: 'text', format: (v: string) => v || 'Sin descripción' },
        { key: 'permissionCount', label: 'Permisos', type: 'text', format: (v: number) => `${v || 0} permisos` },

        { key: 'createdAt', label: 'Fecha Creación', type: 'text', format: (v: any) => v ? this.datePipe.transform(v, 'short') || 'N/A' : 'N/A' },
        { key: 'actions', label: 'Acciones', type: 'action' }
    ];

    // Local signals removed since server pagination is used

    constructor() { }

    ngOnInit() { }

    onPageChange(page: number) {
        this.pageChange.emit(page);
    }

    onFilterChange(filters: { [key: string]: string }) {
        const term = filters['name'] || '';
        this.searchChange.emit(term);
    }

    // --- Actions ---

    handleTableAction(e: { action: string, row: RoleResponse }) {
        if (e.action === 'edit') {
            this.edit.emit(e.row.id);
        } else if (e.action === 'delete') {
            this.delete.emit(e.row);
        } else if (e.action === 'permissions') {
            this.permissions.emit(e.row);
        }
    }



    createRole() {
        this.create.emit();
    }

    trackByRoleId(index: number, role: RoleResponse): number {
        return role.id;
    }
}
