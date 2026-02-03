import { Component, OnInit, inject, signal, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../../core/services/user.service';
import { RoleService } from '../../../../core/services/role.service';
import { EstablishmentService } from '../../../../core/services/establishment.service';
import { UserResponse } from '../../../../core/models/user.model';
import { RoleResponse } from '../../../../core/models/maintenance.model';

@Component({
    selector: 'app-users-list',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule],
    templateUrl: './users-list.component.html',
    styleUrl: './users-list.component.scss'
})
export class UsersListComponent implements OnInit {
    private userService = inject(UserService);
    private roleService = inject(RoleService);
    private router = inject(Router);

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

    onRoleFilterChange(roleId: string) {
        this.selectedRoleFilter.set(roleId ? +roleId : null);
        this.applyFilters();
    }

    onStatusFilterChange(status: string) {
        if (status === '') {
            this.selectedStatusFilter.set(null);
        } else {
            this.selectedStatusFilter.set(status === 'true');
        }
        this.applyFilters();
    }

    createUser() {
        this.create.emit();
    }

    editUser(id: number) {
        this.edit.emit(id);
    }

    toggleUserStatus(user: UserResponse) {
        if (confirm(`¿Está seguro de ${user.active ? 'desactivar' : 'activar'} al usuario ${user.username}?`)) {
            this.userService.toggleActive(user.id).subscribe({
                next: () => {
                    this.loadData();
                },
                error: (error) => {
                    console.error('Error toggling user status:', error);
                    alert('Error al cambiar el estado del usuario');
                }
            });
        }
    }

    deleteUser(user: UserResponse) {
        if (confirm(`¿Está seguro de eliminar al usuario ${user.username}? Esta acción no se puede deshacer.`)) {
            this.userService.delete(user.id).subscribe({
                next: () => {
                    this.loadData();
                },
                error: (error) => {
                    console.error('Error deleting user:', error);
                    alert('Error al eliminar el usuario');
                }
            });
        }
    }

    getRoleNames(user: UserResponse): string {
        return user.roles?.map(role => role.name).join(', ') || 'Sin roles';
    }

    getEstablishmentNames(user: UserResponse): string {
        return user.establishments?.map(est => est.name).join(', ') || 'Sin establecimientos';
    }
}
