import { Component, OnInit, inject, signal, Output, EventEmitter } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RoleService } from '../../../../core/services/role.service';
import { RoleResponse } from '../../../../core/models/maintenance.model';
import { CustomTableComponent, TableColumn } from '../../../../shared/components/custom-table/custom-table.component';
import { ModalGenericComponent } from '../../../../shared/components/modal-generic/modal-generic.component';
import { RoleFormComponent } from '../role-form/role-form.component';

@Component({
    selector: 'app-roles-list',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        FormsModule,
        CustomTableComponent,
        ModalGenericComponent,
        RoleFormComponent
    ],
    providers: [DatePipe],
    templateUrl: './roles-list.component.html',
    styleUrl: './roles-list.component.scss'
})
export class RolesListComponent implements OnInit {
    private roleService = inject(RoleService);
    private router = inject(Router);
    private datePipe = inject(DatePipe);

    @Output() create = new EventEmitter<void>();
    @Output() edit = new EventEmitter<number>();

    // Configuración de la tabla
    cols: TableColumn[] = [
        { key: 'name', label: 'Rol', type: 'text' },
        { key: 'description', label: 'Descripción', type: 'text', format: (v: string) => v || 'Sin descripción' },
        { key: 'permissionCount', label: 'Permisos', type: 'text', format: (v: number) => `${v || 0} permisos` },
        { key: 'active', label: 'Estado', type: 'toggle' },
        { key: 'createdAt', label: 'Fecha Creación', type: 'text', format: (v: any) => this.datePipe.transform(v, 'dd/MM/yyyy') || '' },
        { key: 'actions', label: 'Acciones', type: 'action' }
    ];

    // Data Signals
    roles = signal<RoleResponse[]>([]);
    filteredRoles = signal<RoleResponse[]>([]);
    isLoading = signal(false);

    // Filters
    searchTerm = signal('');
    selectedStatusFilter = signal<boolean | null>(null);

    // Pagination & Sorting (Table defaults)
    currentPage = 1;
    pageSize = 10;
    sortColumn: keyof RoleResponse | '' = '';
    sortDirection: 'asc' | 'desc' = 'asc';

    // Modal de Formulario de Rol
    showRoleModal = signal(false);
    selectedRoleId = signal<number | null>(null);

    // Modal & Alerts (Confirmaciones)
    showConfirmModal = false;
    modalMessage = '';
    modalActionType: 'delete' | 'status' = 'status';
    pendingAction: (() => void) | null = null;

    alertMessage = '';
    alertTitle = '';
    alertType = 'success';

    ngOnInit() {
        this.loadData();
    }

    loadData() {
        this.isLoading.set(true);
        this.roleService.getAll().subscribe({
            next: (response) => {
                this.roles.set(response.data);
                this.applyFilters();
                this.isLoading.set(false);
            },
            error: (error) => {
                console.error('Error loading roles:', error);
                this.showAlert('Error', 'No se pudieron cargar los roles', 'danger');
                this.isLoading.set(false);
            }
        });
    }

    // --- Filter Logic ---

    applyFilters() {
        let filtered = this.roles();
        const search = this.searchTerm().toLowerCase();

        if (search) {
            filtered = filtered.filter(role =>
                role.name.toLowerCase().includes(search) ||
                (role.description && role.description.toLowerCase().includes(search))
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
        // Manejar conversión de string a boolean/null desde select nativo
        const value = event === 'true' ? true : event === 'false' ? false : null;
        this.selectedStatusFilter.set(value);
        this.applyFilters();
    }

    // --- Actions ---

    handleTableAction(e: { action: string, row: RoleResponse }) {
        if (e.action === 'edit') {
            this.editRole(e.row.id);
        } else if (e.action === 'delete') {
            this.confirmDelete(e.row);
        } else if (e.action === 'permissions') {
            this.managePermissions(e.row.id);
        }
    }

    handleStatusToggle(e: { row: RoleResponse, key: string, checked: boolean }) {
        this.confirmToggleActive(e.row);
    }

    createRole() {
        this.selectedRoleId.set(null);
        this.showRoleModal.set(true);
    }

    editRole(id: number) {
        this.selectedRoleId.set(id);
        this.showRoleModal.set(true);
    }

    onRoleSaved() {
        this.showRoleModal.set(false);
        this.loadData();
    }

    onRoleCancelled() {
        this.showRoleModal.set(false);
    }

    managePermissions(id: number) {
        this.router.navigate(['/settings/roles', id, 'permissions']);
    }

    getPermissionCount(role: RoleResponse): number {
        return role.permissionCount || 0;
    }

    trackByRoleId(index: number, role: RoleResponse): number {
        return role.id;
    }

    // --- Modal Logic ---

    confirmDelete(role: RoleResponse) {
        this.modalActionType = 'delete';
        this.modalMessage = `¿Está seguro de eliminar el rol "<b>${role.name}</b>"? Esta acción no se puede deshacer.`;
        this.showConfirmModal = true;
        this.pendingAction = () => {
            this.roleService.delete(role.id).subscribe({
                next: () => {
                    this.loadData();
                    this.showAlert('Eliminado', 'Rol eliminado correctamente', 'success');
                },
                error: (error) => {
                    console.error('Error deleting role:', error);
                    this.showAlert('Error', 'No se pudo eliminar el rol', 'danger');
                }
            });
        };
    }

    confirmToggleActive(role: RoleResponse) {
        this.modalActionType = 'status';
        this.modalMessage = `¿Está seguro de ${role.active ? 'desactivar' : 'activar'} el rol "<b>${role.name}</b>"?`;
        this.showConfirmModal = true;
        this.pendingAction = () => {
            this.roleService.toggleActive(role.id).subscribe({
                next: () => {
                    this.loadData();
                    this.showAlert('Éxito', `Rol ${role.active ? 'desactivado' : 'activado'} correctamente`, 'success');
                },
                error: (error) => {
                    console.error('Error toggling role:', error);
                    this.showAlert('Error', 'No se pudo cambiar el estado', 'danger');
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

    // --- Alert Logic ---

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
