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

    // Configuración de la tabla
    cols: TableColumn[] = [
        { key: 'profilePicture', label: 'Perfil', type: 'image' },
        { key: 'username', label: 'Usuario', type: 'text', filterable: true },
        { key: 'fullName', label: 'Nombre Completo', type: 'text', filterable: true },
        { key: 'email', label: 'Email', type: 'text', filterable: true },
        { key: 'roles', label: 'Roles', type: 'text', format: (roles: any[]) => roles.map(r => r.name).join(', ') },

        { key: 'lastLogin', label: 'Último Acceso', type: 'text', format: (v: any) => v ? this.datePipe.transform(v, 'dd/MM/yyyy HH:mm', 'UTC') || 'N/A' : 'Nunca' },
        { key: 'actions', label: 'Acciones', type: 'action' }
    ];

    // Datos Locales y Filtrados
    localUsers = signal<UserResponse[]>([]);
    filteredUsers = signal<UserResponse[]>([]);

    // Filtros
    searchTerm = signal('');
    selectedRoleFilter = signal<number | null>(null);

    currentPage = signal(1);
    pageSize = 10;
    totalUsers = signal(0);



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
        this.totalUsers.set(this.users.length);
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



        this.filteredUsers.set(filtered);
        this.currentPage.set(1); // Resetear a página 1 al filtrar
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



    resetFilters() {
        this.selectedRoleFilter.set(null);
    }

    // --- Acciones de la Tabla ---

    handleTableAction(e: { action: string, row: UserResponse }) {
        if (e.action === 'edit') {
            this.edit.emit(e.row.id);
        } else if (e.action === 'delete') {
            this.delete.emit(e.row);
        }
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