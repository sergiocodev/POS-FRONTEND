import { Component, OnInit, inject, signal, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../../core/services/user.service';
import { RoleService } from '../../../../core/services/role.service';
import { UserResponse } from '../../../../core/models/user.model';
import { RoleResponse } from '../../../../core/models/maintenance.model';
import { ModuleHeaderComponent } from '../../../../shared/components/module-header/module-header.component';

import { CustomTableComponent, TableColumn } from '../../../../shared/components/custom-table/custom-table.component';
import { DatePipe } from '@angular/common';
import { ModalGenericComponent } from '../../../../shared/components/modal-generic/modal-generic.component';
import { UserFormComponent } from '../user-form/user-form.component';

@Component({
    selector: 'app-users-list',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        FormsModule,
        ModuleHeaderComponent,
        CustomTableComponent,
        ModalGenericComponent,
        UserFormComponent
    ],
    providers: [DatePipe],
    templateUrl: './users-list.component.html',
    styleUrl: './users-list.component.scss'
})
export class UsersListComponent implements OnInit {
    private userService = inject(UserService);
    private roleService = inject(RoleService);
    private datePipe = inject(DatePipe);

    @Output() create = new EventEmitter<void>();
    @Output() edit = new EventEmitter<number>();

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

    // Datos
    users = signal<UserResponse[]>([]);
    filteredUsers = signal<UserResponse[]>([]);
    roles = signal<RoleResponse[]>([]);
    isLoading = signal(false);

    // Filtros
    searchTerm = signal('');
    selectedRoleFilter = signal<number | null>(null);
    selectedStatusFilter = signal<boolean | null>(null);

    currentPage = 1;
    pageSize = 10;

    // Modal y Alertas (Reemplazo de PrimeNG)
    showConfirmModal = false;
    modalMessage = '';
    modalActionType: 'delete' | 'status' = 'status';
    pendingAction: (() => void) | null = null;

    alertMessage = '';
    alertTitle = '';
    alertType = 'success';

    // Modal de Formulario de Usuario
    showUserModal = signal(false);
    selectedUserId = signal<number | null>(null);

    ngOnInit() {
        this.loadData();
    }

    loadData() {
        this.isLoading.set(true);
        // Cargar Roles
        this.roleService.getAll().subscribe({
            next: (response) => this.roles.set(response.data),
            error: (err) => console.error(err)
        });

        // Cargar Usuarios
        this.userService.getAll().subscribe({
            next: (response) => {
                this.users.set(response.data);
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

    // --- Acciones de la Tabla ---

    handleTableAction(e: { action: string, row: UserResponse }) {
        if (e.action === 'edit') {
            this.editUser(e.row.id);
        } else if (e.action === 'delete') {
            this.confirmDelete(e.row);
        }
    }

    handleStatusToggle(e: { row: UserResponse, key: string, checked: boolean }) {
        this.confirmToggleStatus(e.row);
    }

    // --- Acciones ---

    createUser() {
        this.selectedUserId.set(null);
        this.showUserModal.set(true);
    }

    editUser(id: number) {
        this.selectedUserId.set(id);
        this.showUserModal.set(true);
    }

    onUserSaved() {
        this.showUserModal.set(false);
        this.loadData();
    }

    onUserCancelled() {
        this.showUserModal.set(false);
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