import { Component, signal, ViewChild, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
// Eliminado: import { DialogModule } from 'primeng/dialog';
import { RolesListComponent } from './roles-list/roles-list.component';
import { RoleFormComponent } from './role-form/role-form.component';
import { RolePermissionsComponent } from './role-permissions/role-permissions.component';
import { ModuleHeaderComponent } from '../../../shared/components/module-header/module-header.component';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { ModalAlertComponent } from '../../../shared/components/modal-alert/modal-alert.component';
import { RoleService } from '../../../core/services/role.service';
import { ModalService } from '../../../shared/components/confirm-modal/service/modal.service';
import { RoleResponse } from '../../../core/models/maintenance.model';
import { ModalGenericComponent } from '../../../shared/components/modal-generic/modal-generic.component';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';

@Component({
    selector: 'app-roles',
    standalone: true,
    imports: [
        CommonModule,
        RolesListComponent,
        RoleFormComponent,
        RolePermissionsComponent,
        ModuleHeaderComponent,
        ConfirmModalComponent,
        ModalAlertComponent,
        ModalGenericComponent,
        SpinnerComponent
    ],
    templateUrl: './roles.component.html',
    styleUrl: './roles.component.scss'
})
export class RolesComponent implements OnInit {
    private roleService = inject(RoleService);
    private modalService = inject(ModalService);

    // State
    roles = signal<RoleResponse[]>([]);
    isLoading = signal(false);

    // Pagination
    currentPage = signal(1);
    pageSize = signal(10);
    totalItems = signal(0);
    searchTerm = signal('');

    // Modal Forms State
    showRoleForm = signal(false);
    selectedRoleId = signal<number | null>(null);

    // Modal Permissions State
    showPermissionsModal = signal(false);
    selectedRoleForPermissions = signal<RoleResponse | null>(null);

    ngOnInit() {
        this.loadData();
    }

    loadData() {
        this.isLoading.set(true);
        this.roleService.getAllPaged(this.currentPage() - 1, this.pageSize(), this.searchTerm()).subscribe({
            next: (response) => {
                if (response.data && response.data.content) {
                    this.roles.set(response.data.content);
                    this.totalItems.set(response.data.totalElements);
                } else {
                    this.roles.set([]);
                    this.totalItems.set(0);
                }
                this.isLoading.set(false);
            },
            error: (error) => {
                console.error('Error loading roles:', error);
                this.modalService.alert({
                    title: 'Error',
                    message: 'No se pudieron cargar los roles',
                    type: 'error'
                });
                this.isLoading.set(false);
            }
        });
    }

    onPageChange(page: number) {
        this.currentPage.set(page);
        this.loadData();
    }

    onSearch(term: string) {
        this.searchTerm.set(term);
        this.currentPage.set(1);
        this.loadData();
    }

    // --- Actions from List ---

    onOpenForm(roleId: number | null = null) {
        this.selectedRoleId.set(roleId);
        this.showRoleForm.set(true);
    }

    onFormSaved() {
        this.showRoleForm.set(false);
        this.selectedRoleId.set(null);
        this.loadData();
    }

    onFormCancelled() {
        this.showRoleForm.set(false);
        this.selectedRoleId.set(null);
    }

    onOpenPermissions(role: RoleResponse) {
        this.selectedRoleForPermissions.set(role);
        this.showPermissionsModal.set(true);
    }

    onPermissionsSaved() {
        this.showPermissionsModal.set(false);
        this.selectedRoleForPermissions.set(null);
        // No need to reload roles typically, unless permissions affect the list view
    }

    onPermissionsCancelled() {
        this.showPermissionsModal.set(false);
        this.selectedRoleForPermissions.set(null);
    }

    // --- Async Actions (Delete, Toggle) ---

    onDeleteRole(role: RoleResponse) {
        this.modalService.confirm({
            title: 'Confirmar Eliminación',
            message: `¿Está seguro de eliminar el rol "<b>${role.name}</b>"? Esta acción no se puede deshacer.`,
            confirmText: 'Eliminar',
            btnColor: 'danger'
        }).then(confirmed => {
            if (confirmed) {
                this.roleService.delete(role.id).subscribe({
                    next: () => {
                        this.loadData();
                        this.modalService.alert({
                            title: 'Eliminado',
                            message: 'Rol eliminado correctamente',
                            type: 'success'
                        });
                    },
                    error: (error) => {
                        console.error('Error deleting role:', error);
                        this.modalService.alert({
                            title: 'Error',
                            message: 'No se pudo eliminar el rol',
                            type: 'error'
                        });
                    }
                });
            }
        });
    }

}