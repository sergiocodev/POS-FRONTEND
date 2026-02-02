import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { RoleService } from '../../../../core/services/role.service';
import { RoleResponse, PermissionResponse } from '../../../../core/models/maintenance.model';

@Component({
    selector: 'app-role-permissions',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './role-permissions.component.html',
    styleUrl: './role-permissions.component.scss'
})
export class RolePermissionsComponent implements OnInit {
    private roleService = inject(RoleService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);

    role = signal<RoleResponse | null>(null);
    allPermissions = signal<PermissionResponse[]>([]);
    selectedPermissions = signal<number[]>([]);
    isLoading = signal(false);
    isSaving = signal(false);

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

        // Load all permissions
        this.roleService.getPermissions().subscribe({
            next: (permissions) => {
                this.allPermissions.set(permissions);
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
        this.selectedPermissions.set(this.allPermissions().map(p => p.id));
    }

    deselectAll() {
        this.selectedPermissions.set([]);
    }

    onSave() {
        const roleId = this.role()?.id;
        if (!roleId) return;

        this.isSaving.set(true);

        this.roleService.assignPermissions(roleId, this.selectedPermissions()).subscribe({
            next: () => {
                this.isSaving.set(false);
                alert('Permisos asignados exitosamente');
                this.router.navigate(['/settings/roles']);
            },
            error: (error) => {
                console.error('Error assigning permissions:', error);
                this.isSaving.set(false);
                alert('Error al asignar permisos');
            }
        });
    }

    cancel() {
        this.router.navigate(['/settings/roles']);
    }
}
