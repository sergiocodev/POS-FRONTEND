import { Component, OnInit, inject, signal, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RoleService } from '../../../../core/services/role.service';
import { RoleResponse } from '../../../../core/models/maintenance.model';

@Component({
    selector: 'app-roles-list',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        FormsModule
    ],
    templateUrl: './roles-list.component.html',
    styleUrl: './roles-list.component.scss'
})
export class RolesListComponent implements OnInit {
    private roleService = inject(RoleService);
    private router = inject(Router);

    @Output() create = new EventEmitter<void>();
    @Output() edit = new EventEmitter<number>();

    // Data Signals
    roles = signal<RoleResponse[]>([]);
    filteredRoles = signal<RoleResponse[]>([]);
    isLoading = signal(false);

    // Filters
    searchTerm = signal('');
    selectedStatusFilter = signal<boolean | null>(null);

    // Pagination & Sorting
    currentPage = 1;
    pageSize = 10;
    sortColumn: keyof RoleResponse | '' = '';
    sortDirection: 'asc' | 'desc' = 'asc';

    // Modal & Alerts
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
            next: (roles) => {
                this.roles.set(roles);
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
        this.currentPage = 1;
        this.sortData(this.sortColumn as any, false);
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

    // --- Pagination & Sorting ---

    get paginatedRoles(): RoleResponse[] {
        const startIndex = (this.currentPage - 1) * this.pageSize;
        return this.filteredRoles().slice(startIndex, startIndex + this.pageSize);
    }

    changePage(newPage: number) {
        if (newPage >= 1 && newPage <= Math.ceil(this.filteredRoles().length / this.pageSize)) {
            this.currentPage = newPage;
        }
    }

    min(a: number, b: number): number {
        return Math.min(a, b);
    }

    sortData(column: keyof RoleResponse, toggle = true) {
        if (!column) return;

        if (toggle) {
            if (this.sortColumn === column) {
                this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                this.sortColumn = column;
                this.sortDirection = 'asc';
            }
        }

        const sorted = [...this.filteredRoles()].sort((a, b) => {
            const valA = a[column];
            const valB = b[column];
            if (valA == null) return 1;
            if (valB == null) return -1;

            const comparison = valA.toString().localeCompare(valB.toString());
            return this.sortDirection === 'asc' ? comparison : -comparison;
        });

        this.filteredRoles.set(sorted);
    }

    getSortIcon(column: string): string {
        if (this.sortColumn !== column) return 'bi-arrow-down-up opacity-25';
        return this.sortDirection === 'asc' ? 'bi-arrow-up text-primary' : 'bi-arrow-down text-primary';
    }

    // --- Actions ---

    createRole() {
        this.create.emit();
    }

    editRole(id: number) {
        this.edit.emit(id);
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