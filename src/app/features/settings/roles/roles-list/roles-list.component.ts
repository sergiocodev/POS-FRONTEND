import { Component, OnInit, inject, signal, Input, Output, EventEmitter, effect } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RoleResponse } from '../../../../core/models/maintenance.model';
import { CustomTableComponent, TableColumn } from '../../../../shared/components/custom-table/custom-table.component';
import { TableFilterComponent } from '../../../../shared/components/table-filter/table-filter.component';

@Component({
    selector: 'app-roles-list',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        CustomTableComponent,
        TableFilterComponent
    ],
    providers: [DatePipe],
    templateUrl: './roles-list.component.html',
    styleUrl: './roles-list.component.scss'
})
export class RolesListComponent implements OnInit {
    private datePipe = inject(DatePipe);

    @Input() roles: RoleResponse[] = [];
    @Input() isLoading = false;

    @Output() create = new EventEmitter<void>();
    @Output() edit = new EventEmitter<number>();
    @Output() delete = new EventEmitter<RoleResponse>();
    @Output() permissions = new EventEmitter<RoleResponse>();

    // Configuración de la tabla
    cols: TableColumn[] = [
        { key: 'name', label: 'Rol', type: 'text' },
        { key: 'description', label: 'Descripción', type: 'text', format: (v: string) => v || 'Sin descripción' },
        { key: 'permissionCount', label: 'Permisos', type: 'text', format: (v: number) => `${v || 0} permisos` },

        { key: 'createdAt', label: 'Fecha Creación', type: 'text', format: (v: any) => v ? this.datePipe.transform(v, 'short') || 'N/A' : 'N/A' },
        { key: 'actions', label: 'Acciones', type: 'action' }
    ];

    // Datos Locales y Filtrados
    // rolesSignal es una señal computada basada en el input, o simplemente usamos filteredRoles
    // Para simplificar el filtrado local con app-table-filter que usa signals, convertiremos el input a signal localmente
    localRoles = signal<RoleResponse[]>([]);
    filteredRoles = signal<RoleResponse[]>([]);

    // Filters
    searchTerm = signal('');

    // Pagination & Sorting (Table defaults)
    currentPage = 1;
    pageSize = 10;
    sortColumn: keyof RoleResponse | '' = '';
    sortDirection: 'asc' | 'desc' = 'asc';

    constructor() { }

    ngOnInit() {
        // Inicializar
        this.updateLocalRoles();
    }

    ngOnChanges() {
        this.updateLocalRoles();
    }

    updateLocalRoles() {
        this.localRoles.set(this.roles);
        this.applyFilters();
    }

    // No loadData() anymore

    // --- Filter Logic ---

    applyFilters() {
        let filtered = this.localRoles();
        const search = this.searchTerm().toLowerCase();

        if (search) {
            filtered = filtered.filter(role =>
                role.name.toLowerCase().includes(search) ||
                (role.description && role.description.toLowerCase().includes(search))
            );
        }



        this.filteredRoles.set(filtered);
        this.currentPage = 1;
    }

    onSearchChange(value: string) {
        this.searchTerm.set(value);
        this.applyFilters();
    }



    resetFilters() {
        this.searchTerm.set('');
        this.applyFilters();
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
