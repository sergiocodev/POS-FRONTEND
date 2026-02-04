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
    imports: [
        CommonModule,
        RouterModule,
        FormsModule
        // Eliminados módulos de PrimeNG
    ],
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

    searchTerm = signal('');
    selectedModule = signal<string>('');

    // Estado para Alertas
    alertMessage = '';
    alertTitle = '';
    alertType = 'success';

    ngOnInit() {
        const roleId = this.route.snapshot.paramMap.get('id');
        if (roleId) {
            this.loadData(+roleId);
        }
    }

    loadData(roleId: number) {
        this.isLoading.set(true);

        // Cargar Rol
        this.roleService.getById(roleId).subscribe({
            next: (role) => {
                this.role.set(role);
                this.selectedPermissions.set(role.permissions?.map(p => p.id) || []);
            },
            error: (error) => {
                console.error('Error loading role:', error);
                this.showAlert('Error', 'No se pudo cargar el rol', 'danger');
                setTimeout(() => this.router.navigate(['/settings/roles']), 2000);
            }
        });

        // Cargar Permisos
        this.permissionService.getGrouped().subscribe({
            next: (grouped) => {
                this.groupedPermissions.set(grouped);
                this.modules.set(Object.keys(grouped));
                this.isLoading.set(false);
            },
            error: (error) => {
                console.error('Error loading permissions:', error);
                this.showAlert('Error', 'No se pudieron cargar los permisos', 'danger');
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

    deselectAll() {
        this.selectedPermissions.set([]);
    }

    selectAllInModule(module: string) {
        const modulePermissions = this.groupedPermissions()[module] || [];
        const current = this.selectedPermissions();
        const moduleIds = modulePermissions.map(p => p.id);
        // Combinar y eliminar duplicados
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

    onSave() {
        const roleId = this.role()?.id;
        if (!roleId) return;

        this.isSaving.set(true);
        const request = { permissionIds: this.selectedPermissions() };

        this.roleService.replacePermissions(roleId, request).subscribe({
            next: () => {
                this.isSaving.set(false);
                this.showAlert('Éxito', 'Permisos actualizados correctamente', 'success');
                setTimeout(() => this.router.navigate(['/settings/roles']), 1500);
            },
            error: (error) => {
                console.error('Error updating permissions:', error);
                this.isSaving.set(false);
                this.showAlert('Error', 'Ocurrió un error al guardar', 'danger');
            }
        });
    }

    cancel() {
        this.router.navigate(['/settings/roles']);
    }

    // Helpers UI
    showAlert(title: string, message: string, type: string) {
        this.alertTitle = title;
        this.alertMessage = message;
        this.alertType = type;
        setTimeout(() => this.closeAlert(), 3000);
    }

    closeAlert() {
        this.alertMessage = '';
    }
}