import { Component, OnInit, inject, signal, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { RoleService } from '../../../../core/services/role.service';
import { PermissionService } from '../../../../core/services/permission.service';
import { RoleDetailResponse, PermissionResponse } from '../../../../core/models/maintenance.model';
import { ModalService } from '../../../../shared/components/confirm-modal/service/modal.service';
import { RoleInfoCardComponent } from './components/role-info-card/role-info-card.component';
import { PermissionsListComponent } from './components/permissions-list/permissions-list.component';

@Component({
    selector: 'app-role-permissions',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        RoleInfoCardComponent,
        PermissionsListComponent,
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

    // Modal mode inputs/outputs
    @Input() roleId: number | null = null;
    @Input() roleName: string = '';
    @Output() saved = new EventEmitter<void>();
    @Output() cancelled = new EventEmitter<void>();

    // State
    role = signal<RoleDetailResponse | null>(null);
    groupedPermissions = signal<{ [module: string]: PermissionResponse[] }>({});
    modules = signal<string[]>([]);
    selectedPermissions = signal<number[]>([]);
    expandedModules = signal<string[]>([]);
    isLoading = signal(false);
    isSaving = signal(false);

    ngOnInit() {
        const id = this.roleId || Number(this.route.snapshot.paramMap.get('id'));
        if (id) this.loadData(id);
    }

    // ─── Data Loading ───────────────────────────────────────────────────────────

    loadData(roleId: number) {
        this.isLoading.set(true);

        this.roleService.getById(roleId).subscribe({
            next: (response) => {
                const role = response.data;
                this.role.set(role);
                this.selectedPermissions.set(role.permissions?.map(p => p.id) || []);
            },
            error: () => {
                this.modalService.alert({ title: 'Error', message: 'No se pudo cargar el rol', type: 'error' });
                if (!this.roleId) setTimeout(() => this.router.navigate(['/settings/roles']), 2000);
            }
        });

        this.permissionService.getGrouped().subscribe({
            next: (response) => {
                const grouped = response.data;
                this.groupedPermissions.set(grouped);
                this.modules.set(Object.keys(grouped));
                if (Object.keys(grouped).length > 0) {
                    this.expandedModules.set([Object.keys(grouped)[0]]);
                }
                this.isLoading.set(false);
            },
            error: () => {
                this.modalService.alert({ title: 'Error', message: 'No se pudieron cargar los permisos', type: 'error' });
                this.isLoading.set(false);
            }
        });
    }

    // ─── Permission Handlers (passed to PermissionsListComponent) ────────────────

    onToggleModuleExpand(module: string) {
        const current = this.expandedModules();
        this.expandedModules.set(
            current.includes(module)
                ? current.filter(m => m !== module)
                : [...current, module]
        );
    }

    onToggleModuleSelect(module: string) {
        const perms = this.groupedPermissions()[module] || [];
        const allSelected = perms.every(p => this.selectedPermissions().includes(p.id));
        if (allSelected) {
            const ids = perms.map(p => p.id);
            this.selectedPermissions.set(this.selectedPermissions().filter(id => !ids.includes(id)));
        } else {
            const ids = perms.map(p => p.id);
            this.selectedPermissions.set([...new Set([...this.selectedPermissions(), ...ids])]);
        }
    }

    onTogglePermission(permissionId: number) {
        const current = this.selectedPermissions();
        this.selectedPermissions.set(
            current.includes(permissionId)
                ? current.filter(id => id !== permissionId)
                : [...current, permissionId]
        );
    }

    // ─── Save / Cancel ───────────────────────────────────────────────────────────

    onSave() {
        const roleId = this.role()?.id;
        if (!roleId) return;

        this.isSaving.set(true);
        this.roleService.replacePermissions(roleId, { permissionIds: this.selectedPermissions() }).subscribe({
            next: () => {
                this.isSaving.set(false);
                this.modalService.alert({ title: 'Éxito', message: 'Permisos actualizados correctamente', type: 'success' });
                if (this.roleId) {
                    setTimeout(() => this.saved.emit(), 1500);
                } else {
                    setTimeout(() => this.router.navigate(['/settings/roles']), 1500);
                }
            },
            error: () => {
                this.isSaving.set(false);
                this.modalService.alert({ title: 'Error', message: 'Ocurrió un error al guardar', type: 'error' });
            }
        });
    }

    onCancel() {
        if (this.roleId) {
            this.cancelled.emit();
        } else {
            this.router.navigate(['/settings/roles']);
        }
    }
}