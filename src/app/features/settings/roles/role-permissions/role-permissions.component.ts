import { Component, OnInit, inject, signal, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RoleService } from '../../../../core/services/role.service';
import { PermissionService } from '../../../../core/services/permission.service';
import { RoleDetailResponse, PermissionResponse } from '../../../../core/models/maintenance.model';
import { ModalService } from '../../../../shared/components/confirm-modal/service/modal.service';

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
    private modalService = inject(ModalService);

    // Inputs/Outputs for Modal Mode
    @Input() roleId: number | null = null;
    @Input() roleName: string = '';
    @Output() saved = new EventEmitter<void>();
    @Output() cancelled = new EventEmitter<void>();

    role = signal<RoleDetailResponse | null>(null);
    groupedPermissions = signal<{ [module: string]: PermissionResponse[] }>({});
    modules = signal<string[]>([]);
    selectedPermissions = signal<number[]>([]);

    isLoading = signal(false);
    isSaving = signal(false);

    searchTerm = signal('');
    selectedModule = signal<string>('');

    ngOnInit() {
        // Prioritize Input roleId (Modal mode), otherwise check route (Page mode)
        const id = this.roleId || Number(this.route.snapshot.paramMap.get('id'));
        if (id) {
            this.loadData(id);
        }
    }

    loadData(roleId: number) {
        this.isLoading.set(true);

        // Cargar Rol
        this.roleService.getById(roleId).subscribe({
            next: (response) => {
                const role = response.data;
                this.role.set(role);
                this.selectedPermissions.set(role.permissions?.map(p => p.id) || []);
            },
            error: (error) => {
                console.error('Error loading role:', error);
                this.modalService.alert({ title: 'Error', message: 'No se pudo cargar el rol', type: 'error' });
                if (!this.roleId) { // Only navigate if not in modal mode
                    setTimeout(() => this.router.navigate(['/settings/roles']), 2000);
                }
            }
        });

        // Cargar Permisos
        this.permissionService.getGrouped().subscribe({
            next: (response) => {
                const grouped = response.data;
                this.groupedPermissions.set(grouped);
                this.modules.set(Object.keys(grouped));
                this.isLoading.set(false);
            },
            error: (error) => {
                console.error('Error loading permissions:', error);
                this.modalService.alert({ title: 'Error', message: 'No se pudieron cargar los permisos', type: 'error' });
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
                this.modalService.alert({ title: 'Éxito', message: 'Permisos actualizados correctamente', type: 'success' });

                if (this.roleId) {
                    // Modal Mode
                    setTimeout(() => this.saved.emit(), 1500);
                } else {
                    // Page Mode
                    setTimeout(() => this.router.navigate(['/settings/roles']), 1500);
                }
            },
            error: (error) => {
                console.error('Error updating permissions:', error);
                this.isSaving.set(false);
                this.modalService.alert({ title: 'Error', message: 'Ocurrió un error al guardar', type: 'error' });
            }
        });
    }

    cancel() {
        if (this.roleId) {
            this.cancelled.emit();
        } else {
            this.router.navigate(['/settings/roles']);
        }
    }
}