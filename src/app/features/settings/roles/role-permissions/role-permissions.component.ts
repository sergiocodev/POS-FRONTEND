import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RoleService } from '../../../../core/services/role.service';
import { PermissionService } from '../../../../core/services/permission.service';
import { RoleDetailResponse, PermissionResponse } from '../../../../core/models/maintenance.model';

@Component({
    selector: 'app-role-permissions',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule],
    templateUrl: './role-permissions.component.html',
    styleUrl: './role-permissions.component.scss'
})
export class RolePermissionsComponent implements OnInit {
    private roleService = inject(RoleService);
    private permissionService = inject(PermissionService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);

    role = signal<RoleDetailResponse | null>(null);
    groupedPermissions = signal<{ [module: string]: PermissionResponse[] }>({});
    modules = signal<string[]>([]);
    selectedPermissions = signal<number[]>([]);
    isLoading = signal(false);
    isSaving = signal(false);

    // Filters
    searchTerm = signal('');
    selectedModule = signal<string>('');

    ngOnInit() {
        const roleId = this.route.snapshot.paramMap.get('id');
        if (roleId) {
            this.loadData(+roleId);
        }
    }

    loadData(roleId: number) {
        this.isLoading.set(true);

        // Load role
        this.roleService.getById(roleId).subscribe({
            next: (role) => {
                this.role.set(role);
                this.selectedPermissions.set(role.permissions?.map(p => p.id) || []);
            },
            error: (error) => {
                console.error('Error loading role:', error);
                alert('Error al cargar el rol');
                this.router.navigate(['/settings/roles']);
            }
        });

        // Load grouped permissions
        this.permissionService.getGrouped().subscribe({
            next: (grouped) => {
                this.groupedPermissions.set(grouped);
                this.modules.set(Object.keys(grouped));
                this.isLoading.set(false);
            },
            error: (error) => {
                console.error('Error loading permissions:', error);
                this.isLoading.set(false);
            }
        });
    }

    togglePermission(permissionId: number) {
        const current = this.selectedPermissions();
        if (current.includes(permissionId)) {
            this.selectedPermissions.set(current.filter(id => id !== permissionId));
        } else {
            this.selectedPermissions.set([...current, permissionId]);
        }
    }

    isPermissionSelected(permissionId: number): boolean {
        return this.selectedPermissions().includes(permissionId);
    }

    selectAll() {
        const allPermissions = Object.values(this.groupedPermissions()).flat();
        this.selectedPermissions.set(allPermissions.map(p => p.id));
    }

    selectAllInModule(module: string) {
        const modulePermissions = this.groupedPermissions()[module] || [];
        const current = this.selectedPermissions();
        const moduleIds = modulePermissions.map(p => p.id);
        const combined = [...new Set([...current, ...moduleIds])];
        this.selectedPermissions.set(combined);
    }

    deselectAllInModule(module: string) {
        const modulePermissions = this.groupedPermissions()[module] || [];
        const moduleIds = modulePermissions.map(p => p.id);
        this.selectedPermissions.set(
            this.selectedPermissions().filter(id => !moduleIds.includes(id))
        );
    }

    getFilteredModules(): string[] {
        if (!this.selectedModule()) {
            return this.modules();
        }
        return this.modules().filter(m => m === this.selectedModule());
    }

    getFilteredPermissions(module: string): PermissionResponse[] {
        const permissions = this.groupedPermissions()[module] || [];
        const search = this.searchTerm().toLowerCase();

        if (!search) {
            return permissions;
        }

        return permissions.filter(p =>
            p.name.toLowerCase().includes(search) ||
            p.description?.toLowerCase().includes(search)
        );
    }

    deselectAll() {
        this.selectedPermissions.set([]);
    }

    onSave() {
        const roleId = this.role()?.id;
        if (!roleId) return;

        this.isSaving.set(true);

        const request = { permissionIds: this.selectedPermissions() };

        this.roleService.replacePermissions(roleId, request).subscribe({
            next: () => {
                this.isSaving.set(false);
                alert('Permisos actualizados exitosamente');
                this.router.navigate(['/settings/roles']);
            },
            error: (error) => {
                console.error('Error updating permissions:', error);
                this.isSaving.set(false);
                alert('Error al actualizar permisos');
            }
        });
    }

    cancel() {
        this.router.navigate(['/settings/roles']);
    }
}
