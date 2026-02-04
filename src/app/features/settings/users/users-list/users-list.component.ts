import { Component, OnInit, inject, signal, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../../core/services/user.service';
import { RoleService } from '../../../../core/services/role.service';
import { EstablishmentService } from '../../../../core/services/establishment.service';
import { UserResponse } from '../../../../core/models/user.model';
import { RoleResponse } from '../../../../core/models/maintenance.model';
import { ModuleHeaderComponent } from '../../../../shared/components/module-header/module-header.component';

// PrimeNG Imports
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';

@Component({
    selector: 'app-users-list',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        FormsModule,
        TableModule,
        ButtonModule,
        InputTextModule,
        SelectModule,
        IconFieldModule,
        InputIconModule,
        TagModule,
        ProgressSpinnerModule,
        ConfirmDialogModule,
        ToastModule,
        TooltipModule,
        ModuleHeaderComponent
    ],
    providers: [ConfirmationService, MessageService],
    templateUrl: './users-list.component.html',
    styleUrl: './users-list.component.scss'
})
export class UsersListComponent implements OnInit {
    private userService = inject(UserService);
    private roleService = inject(RoleService);
    private router = inject(Router);
    private confirmationService = inject(ConfirmationService);
    private messageService = inject(MessageService);

    @Output() create = new EventEmitter<void>();
    @Output() edit = new EventEmitter<number>();

    users = signal<UserResponse[]>([]);
    filteredUsers = signal<UserResponse[]>([]);
    roles = signal<RoleResponse[]>([]);
    isLoading = signal(false);


    searchTerm = signal('');
    selectedRoleFilter = signal<number | null>(null);
    selectedStatusFilter = signal<boolean | null>(null);

    ngOnInit() {
        this.loadData();
    }

    loadData() {
        this.isLoading.set(true);
        this.userService.getAll().subscribe({
            next: (users) => {
                this.users.set(users);
                this.filteredUsers.set(users);
                this.isLoading.set(false);
            },
            error: (error) => {
                console.error('Error loading users:', error);
                this.isLoading.set(false);
            }
        });

        this.roleService.getAll().subscribe({
            next: (roles) => {
                this.roles.set(roles);
            },
            error: (error) => {
                console.error('Error loading roles:', error);
            }
        });
    }

    applyFilters() {
        let filtered = this.users();


        const search = this.searchTerm().toLowerCase();
        if (search) {
            filtered = filtered.filter(user =>
                user.username.toLowerCase().includes(search) ||
                user.fullName.toLowerCase().includes(search) ||
                user.email.toLowerCase().includes(search)
            );
        }


        if (this.selectedRoleFilter() !== null) {
            filtered = filtered.filter(user =>
                user.roles.some(role => role.id === this.selectedRoleFilter())
            );
        }


        if (this.selectedStatusFilter() !== null) {
            filtered = filtered.filter(user => user.active === this.selectedStatusFilter());
        }

        this.filteredUsers.set(filtered);
    }

    onSearchChange(value: string) {
        this.searchTerm.set(value);
        this.applyFilters();
    }

    onRoleFilterChange(roleId: number | null) {
        this.selectedRoleFilter.set(roleId);
        this.applyFilters();
    }

    onStatusFilterChange(status: boolean | null) {
        this.selectedStatusFilter.set(status);
        this.applyFilters();
    }

    createUser() {
        this.create.emit();
    }

    editUser(id: number) {
        this.edit.emit(id);
    }

    toggleUserStatus(user: UserResponse) {
        this.confirmationService.confirm({
            message: `¿Está seguro de ${user.active ? 'desactivar' : 'activar'} al usuario ${user.username}?`,
            header: 'Confirmación de Estado',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí',
            rejectLabel: 'No',
            accept: () => {
                this.userService.toggleActive(user.id).subscribe({
                    next: () => {
                        this.loadData();
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Éxito',
                            detail: `Usuario ${user.active ? 'desactivado' : 'activado'} correctamente`
                        });
                    },
                    error: (error) => {
                        console.error('Error toggling user status:', error);
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Error al cambiar el estado del usuario'
                        });
                    }
                });
            }
        });
    }

    deleteUser(user: UserResponse) {
        this.confirmationService.confirm({
            message: `¿Está seguro de eliminar al usuario ${user.username}? Esta acción no se puede deshacer.`,
            header: 'Confirmar Eliminación',
            icon: 'pi pi-trash',
            acceptLabel: 'Eliminar',
            rejectLabel: 'Cancelar',
            rejectButtonStyleClass: 'p-button-text',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.userService.delete(user.id).subscribe({
                    next: () => {
                        this.loadData();
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Éxito',
                            detail: 'Usuario eliminado correctamente'
                        });
                    },
                    error: (error) => {
                        console.error('Error deleting user:', error);
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Error al eliminar el usuario'
                        });
                    }
                });
            }
        });
    }

    getRoleNames(user: UserResponse): string {
        return user.roles?.map(role => role.name).join(', ') || 'Sin roles';
    }

    getEstablishmentNames(user: UserResponse): string {
        return user.establishments?.map(est => est.name).join(', ') || 'Sin establecimientos';
    }
}
