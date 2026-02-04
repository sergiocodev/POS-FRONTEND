import { Component, OnInit, inject, signal, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../../core/services/user.service';
import { RoleService } from '../../../../core/services/role.service';
import { UserResponse } from '../../../../core/models/user.model';
import { RoleResponse } from '../../../../core/models/maintenance.model';
import { ModuleHeaderComponent } from '../../../../shared/components/module-header/module-header.component';

@Component({
    selector: 'app-users-list',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        FormsModule,
        ModuleHeaderComponent
    ],
    templateUrl: './users-list.component.html',
    styleUrl: './users-list.component.scss'
})
export class UsersListComponent implements OnInit {
    private userService = inject(UserService);
    private roleService = inject(RoleService);

    @Output() create = new EventEmitter<void>();
    @Output() edit = new EventEmitter<number>();

    // Datos
    users = signal<UserResponse[]>([]);
    filteredUsers = signal<UserResponse[]>([]);
    roles = signal<RoleResponse[]>([]);
    isLoading = signal(false);

    // Filtros
    searchTerm = signal('');
    selectedRoleFilter = signal<number | null>(null);
    selectedStatusFilter = signal<boolean | null>(null);

    // Paginación y Ordenamiento
    currentPage = 1;
    pageSize = 10;
    sortColumn: keyof UserResponse | '' = '';
    sortDirection: 'asc' | 'desc' = 'asc';

    // Modal y Alertas (Reemplazo de PrimeNG)
    showConfirmModal = false;
    modalMessage = '';
    modalActionType: 'delete' | 'status' = 'status';
    pendingAction: (() => void) | null = null;

    alertMessage = '';
    alertTitle = '';
    alertType = 'success';

    ngOnInit() {
        this.loadData();
    }

    loadData() {
        this.isLoading.set(true);
        // Cargar Roles
        this.roleService.getAll().subscribe({
            next: (roles) => this.roles.set(roles),
            error: (err) => console.error(err)
        });

        // Cargar Usuarios
        this.userService.getAll().subscribe({
            next: (users) => {
                this.users.set(users);
                this.applyFilters();
                this.isLoading.set(false);
            },
            error: (error) => {
                console.error('Error loading users:', error);
                this.showAlert('Error', 'No se pudieron cargar los usuarios', 'danger');
                this.isLoading.set(false);
            }
        });
    }

    // --- Lógica de Filtrado ---

    applyFilters() {
        let filtered = this.users();
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
            filtered = filtered.filter(user =>
                user.roles.some(role => role.id === this.selectedRoleFilter())
            );
        }

        // Filtro Estado
        if (this.selectedStatusFilter() !== null) {
            filtered = filtered.filter(user => user.active === this.selectedStatusFilter());
        }

        this.filteredUsers.set(filtered);
        this.currentPage = 1; // Resetear a página 1 al filtrar
        this.sortData(this.sortColumn as any, false); // Re-aplicar orden si existe
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

    clearFilters() {
        this.searchTerm.set('');
        this.selectedRoleFilter.set(null);
        this.selectedStatusFilter.set(null);
        this.applyFilters();
    }

    // --- Paginación y Ordenamiento Manual ---

    get paginatedUsers(): UserResponse[] {
        const startIndex = (this.currentPage - 1) * this.pageSize;
        return this.filteredUsers().slice(startIndex, startIndex + this.pageSize);
    }

    changePage(newPage: number) {
        if (newPage >= 1 && newPage <= Math.ceil(this.filteredUsers().length / this.pageSize)) {
            this.currentPage = newPage;
        }
    }

    min(a: number, b: number): number {
        return Math.min(a, b);
    }

    sortData(column: keyof UserResponse, toggleDirection = true) {
        if (!column) return;

        if (toggleDirection) {
            if (this.sortColumn === column) {
                this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                this.sortColumn = column;
                this.sortDirection = 'asc';
            }
        }

        const sorted = [...this.filteredUsers()].sort((a, b) => {
            const valA = a[column];
            const valB = b[column];

            // Manejo básico de strings y nulls
            if (valA == null) return 1;
            if (valB == null) return -1;

            const comparison = valA.toString().localeCompare(valB.toString());
            return this.sortDirection === 'asc' ? comparison : -comparison;
        });

        this.filteredUsers.set(sorted);
    }

    getSortIcon(column: string): string {
        if (this.sortColumn !== column) return 'bi-arrow-down-up text-muted opacity-25';
        return this.sortDirection === 'asc' ? 'bi-arrow-up text-primary' : 'bi-arrow-down text-primary';
    }

    // --- Acciones ---

    createUser() {
        this.create.emit();
    }

    editUser(id: number) {
        this.edit.emit(id);
    }

    // --- Modal y Alertas (Reemplazo de ConfirmationService) ---

    confirmToggleStatus(user: UserResponse) {
        this.modalActionType = 'status';
        this.modalMessage = `¿Está seguro de <b>${user.active ? 'desactivar' : 'activar'}</b> al usuario ${user.username}?`;
        this.showConfirmModal = true;

        this.pendingAction = () => {
            this.userService.toggleActive(user.id).subscribe({
                next: () => {
                    this.loadData();
                    this.showAlert('Éxito', `Usuario ${user.active ? 'desactivado' : 'activado'} correctamente`, 'success');
                },
                error: (error) => {
                    console.error(error);
                    this.showAlert('Error', 'No se pudo cambiar el estado', 'danger');
                }
            });
        };
    }

    confirmDelete(user: UserResponse) {
        this.modalActionType = 'delete';
        this.modalMessage = `¿Está seguro de eliminar al usuario <b>${user.username}</b>? Esta acción no se puede deshacer.`;
        this.showConfirmModal = true;

        this.pendingAction = () => {
            this.userService.delete(user.id).subscribe({
                next: () => {
                    this.loadData();
                    this.showAlert('Eliminado', 'Usuario eliminado correctamente', 'success');
                },
                error: (error) => {
                    console.error(error);
                    this.showAlert('Error', 'Error al eliminar el usuario', 'danger');
                }
            });
        };
    }

    closeModal() {
        this.showConfirmModal = false;
        this.pendingAction = null;
    }

    executePendingAction() {
        if (this.pendingAction) this.pendingAction();
        this.closeModal();
    }

    // --- Helpers de UI ---

    showAlert(title: string, message: string, type: string) {
        this.alertTitle = title;
        this.alertMessage = message;
        this.alertType = type;
        setTimeout(() => this.closeAlert(), 3000);
    }

    closeAlert() {
        this.alertMessage = '';
    }

    trackByUserId(index: number, user: UserResponse): number {
        return user.id;
    }
}