import { Component, OnInit, inject, signal, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RoleService } from '../../../../core/services/role.service';
import { RoleResponse } from '../../../../core/models/maintenance.model';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { InputIconModule } from 'primeng/inputicon';
import { IconFieldModule } from 'primeng/iconfield';

@Component({
    selector: 'app-roles-list',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        FormsModule,
        TableModule,
        ButtonModule,
        InputTextModule,
        SelectModule,
        TagModule,
        TooltipModule,
        InputIconModule,
        IconFieldModule
    ],
    templateUrl: './roles-list.component.html',
    styleUrl: './roles-list.component.scss'
})
export class RolesListComponent implements OnInit {
    private roleService = inject(RoleService);
    private router = inject(Router);

    @Output() create = new EventEmitter<void>();
    @Output() edit = new EventEmitter<number>();

    roles = signal<RoleResponse[]>([]);
    filteredRoles = signal<RoleResponse[]>([]);
    isLoading = signal(false);


    searchTerm = signal('');
    selectedStatusFilter = signal<boolean | null>(null);

    statusOptions = [
        { label: 'Todos los estados', value: null },
        { label: 'Activos', value: true },
        { label: 'Inactivos', value: false }
    ];

    ngOnInit() {
        this.loadData();
    }

    loadData() {
        this.isLoading.set(true);
        this.roleService.getAll().subscribe({
            next: (roles) => {
                this.roles.set(roles);
                this.filteredRoles.set(roles);
                this.isLoading.set(false);
            },
            error: (error) => {
                console.error('Error loading roles:', error);
                this.isLoading.set(false);
            }
        });
    }

    applyFilters() {
        let filtered = this.roles();


        const search = this.searchTerm().toLowerCase();
        if (search) {
            filtered = filtered.filter(role =>
                role.name.toLowerCase().includes(search) ||
                role.description?.toLowerCase().includes(search)
            );
        }


        if (this.selectedStatusFilter() !== null) {
            filtered = filtered.filter(role => role.active === this.selectedStatusFilter());
        }

        this.filteredRoles.set(filtered);
    }

    onSearchChange(value: string) {
        this.searchTerm.set(value);
        this.applyFilters();
    }

    onStatusFilterChange(event: any) {
        this.selectedStatusFilter.set(event.value);
        this.applyFilters();
    }

    createRole() {
        this.create.emit();
    }

    editRole(id: number) {
        this.edit.emit(id);
    }

    managePermissions(id: number) {
        this.router.navigate(['/settings/roles', id, 'permissions']);
    }

    deleteRole(role: RoleResponse) {
        if (confirm(`¿Está seguro de eliminar el rol "${role.name}"? Esta acción no se puede deshacer.`)) {
            this.roleService.delete(role.id).subscribe({
                next: () => {
                    this.loadData();
                },
                error: (error) => {
                    console.error('Error deleting role:', error);
                    alert('Error al eliminar el rol');
                }
            });
        }
    }

    toggleActive(role: RoleResponse) {
        this.roleService.toggleActive(role.id).subscribe({
            next: () => {
                this.loadData();
            },
            error: (error) => {
                console.error('Error toggling role status:', error);
                alert('Error al cambiar el estado del rol');
            }
        });
    }

    getPermissionCount(role: RoleResponse): number {
        return role.permissionCount || 0;
    }
}
