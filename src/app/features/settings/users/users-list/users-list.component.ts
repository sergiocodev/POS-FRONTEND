import { Component, OnInit, inject, signal, Input, Output, EventEmitter, effect, OnChanges, SimpleChanges } from '@angular/core';
import { TableFilterComponent } from '../../../../shared/components/table-filter/table-filter.component';
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
        CustomTableComponent,
        TableFilterComponent
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

    @Output() create = new EventEmitter<void>();
    @Output() edit = new EventEmitter<number>();
    @Output() delete = new EventEmitter<UserResponse>();
    @Output() toggleStatus = new EventEmitter<UserResponse>();

    // Configuración de la tabla
    cols: TableColumn[] = [
        { key: 'profilePicture', label: 'Perfil', type: 'image' },
        { key: 'username', label: 'Usuario', type: 'text', filterable: true },
        { key: 'fullName', label: 'Nombre Completo', type: 'text', filterable: true },
        { key: 'email', label: 'Email', type: 'text', filterable: true },
        { key: 'roles', label: 'Roles', type: 'text', format: (roles: any[]) => roles.map(r => r.name).join(', ') },
        { key: 'active', label: 'Estado', type: 'toggle' },
        { key: 'lastLogin', label: 'Último Acceso', type: 'text', format: (v: any) => v ? this.datePipe.transform(v, 'short') || 'N/A' : 'Nunca' },
        { key: 'actions', label: 'Acciones', type: 'action' }
    ];

    // Datos Locales y Filtrados
    localUsers = signal<UserResponse[]>([]);
    filteredUsers = signal<UserResponse[]>([]);

    // Filtros
    searchTerm = signal('');
    selectedRoleFilter = signal<number | null>(null);
    selectedStatusFilter = signal<boolean | null>(null);

    currentPage = 1;
    pageSize = 10;



    constructor() { }

    ngOnInit() {
        this.updateLocalData();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['users']) {
            this.updateLocalData();
        }
    }

    updateLocalData() {
        this.localUsers.set(this.users);
        this.applyFilters();
    }

    // No loadData() anymore

    // --- Lógica de Filtrado ---

    applyFilters() {
        let filtered = this.localUsers();
        const search = this.searchTerm().toLowerCase();

        // Filtro Texto
        if (search) {
            filtered = filtered.filter(user =>
                user.username.toLowerCase().includes(search) ||
                user.fullName.toLowerCase().includes(search) ||
                user.email.toLowerCase().includes(search)
            );
        }

        // Filtro Rol
        if (this.selectedRoleFilter() !== null) {
            const role = this.roles.find(r => r.id === this.selectedRoleFilter());
            if (role) {
                filtered = filtered.filter(user => user.roles.some(r => r.name === role.name));
            }
        }

        // Filtro Estado
        if (this.selectedStatusFilter() !== null) {
            filtered = filtered.filter(user => user.active === this.selectedStatusFilter());
        }

        this.filteredUsers.set(filtered);
        this.currentPage = 1; // Resetear a página 1 al filtrar
    }

    onSearchChange(value: string) {
        this.searchTerm.set(value);
        this.applyFilters();
    }

    onRoleFilterChange(roleId: number | null) {
        // Corrección para conversión de string a number si viene del select nativo
        const val = roleId ? Number(roleId) : null;
        this.selectedRoleFilter.set(val);
        this.applyFilters();
    }

    onStatusFilterChange(status: any) {
        // El select nativo puede devolver strings "true"/"false"
        let val: boolean | null = null;
        if (status === 'true' || status === true) val = true;
        if (status === 'false' || status === false) val = false;

        this.selectedStatusFilter.set(val);
        this.applyFilters();
    }

    resetFilters() {
        this.selectedRoleFilter.set(null);
        this.selectedStatusFilter.set(null);
        // searchTerm se limpia via model() en el TableFilterComponent
    }

    // --- Acciones de la Tabla ---

    handleTableAction(e: { action: string, row: UserResponse }) {
        if (e.action === 'edit') {
            this.edit.emit(e.row.id);
        } else if (e.action === 'delete') {
            this.delete.emit(e.row);
        }
    }

    handleStatusToggle(e: { row: UserResponse, key: string, checked: boolean }) {
        this.toggleStatus.emit(e.row);
        // Optimistic toggle reversion to wait for parent reload
        e.row.active = !e.checked;
    }

    // --- Acciones ---

    createUser() {
        this.create.emit();
    }



    // --- Helpers de UI ---

    trackByUserId(index: number, user: UserResponse): number {
        return user.id;
    }
}