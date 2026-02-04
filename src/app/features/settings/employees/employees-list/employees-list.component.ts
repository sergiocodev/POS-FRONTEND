import { Component, OnInit, inject, signal, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { EmployeeService } from '../../../../core/services/employee.service';
import { EmployeeResponse } from '../../../../core/models/employee.model';
import { ModuleHeaderComponent } from '../../../../shared/components/module-header/module-header.component';

@Component({
    selector: 'app-employees-list',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        FormsModule,
        ModuleHeaderComponent
    ],
    templateUrl: './employees-list.component.html',
    styleUrl: './employees-list.component.scss'
})
export class EmployeesListComponent implements OnInit {
    private employeeService = inject(EmployeeService);

    @Output() create = new EventEmitter<void>();
    @Output() edit = new EventEmitter<number>();

    // Data Signals
    employees = signal<EmployeeResponse[]>([]);
    filteredEmployees = signal<EmployeeResponse[]>([]);
    isLoading = signal(false);

    // Filters & Pagination
    searchTerm = signal('');
    selectedStatusFilter = signal<boolean | null>(null);
    currentPage = 1;
    pageSize = 10;
    sortColumn: keyof EmployeeResponse | '' = '';
    sortDirection: 'asc' | 'desc' = 'asc';

    // Modal & Alerts State
    showModal = false;
    modalMessage = '';
    modalType: 'delete' | 'status' = 'status';
    pendingAction: (() => void) | null = null;

    alertMessage = '';
    alertTitle = '';
    alertType = 'success';

    ngOnInit() {
        this.loadData();
    }

    loadData() {
        this.isLoading.set(true);
        this.employeeService.getAll().subscribe({
            next: (employees) => {
                this.employees.set(employees);
                this.applyFilters(); // Apply initial filter logic
                this.isLoading.set(false);
            },
            error: (error) => {
                console.error('Error loading employees:', error);
                this.showAlert('Error', 'No se pudieron cargar los datos', 'danger');
                this.isLoading.set(false);
            }
        });
    }

    // --- Logic for Pagination & Sorting ---

    get paginatedEmployees(): EmployeeResponse[] {
        const startIndex = (this.currentPage - 1) * this.pageSize;
        return this.filteredEmployees().slice(startIndex, startIndex + this.pageSize);
    }

    changePage(newPage: number) {
        if (newPage >= 1 && newPage <= Math.ceil(this.filteredEmployees().length / this.pageSize)) {
            this.currentPage = newPage;
        }
    }

    min(a: number, b: number): number {
        return Math.min(a, b);
    }

    sortData(column: keyof EmployeeResponse) {
        if (this.sortColumn === column) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortColumn = column;
            this.sortDirection = 'asc';
        }

        const sorted = [...this.filteredEmployees()].sort((a, b) => {
            const res = a[column]! > b[column]! ? 1 : a[column]! < b[column]! ? -1 : 0;
            return this.sortDirection === 'asc' ? res : -res;
        });

        this.filteredEmployees.set(sorted);
    }

    getSortIcon(column: string): string {
        if (this.sortColumn !== column) return 'bi-arrow-down-up text-muted opacity-25';
        return this.sortDirection === 'asc' ? 'bi-arrow-up text-primary' : 'bi-arrow-down text-primary';
    }

    // --- Logic for Filtering ---

    applyFilters() {
        let filtered = this.employees();
        const search = this.searchTerm().toLowerCase();

        if (search) {
            filtered = filtered.filter(emp =>
                emp.firstName.toLowerCase().includes(search) ||
                (emp.lastName && emp.lastName.toLowerCase().includes(search)) ||
                (emp.documentNumber && emp.documentNumber.includes(search))
            );
        }

        if (this.selectedStatusFilter() !== null) {
            filtered = filtered.filter(emp => emp.active === this.selectedStatusFilter());
        }

        this.filteredEmployees.set(filtered);
        this.currentPage = 1; // Reset to page 1 on filter change
    }

    onSearchChange(value: string) {
        this.searchTerm.set(value);
        this.applyFilters();
    }

    clearFilters() {
        this.searchTerm.set('');
        this.selectedStatusFilter.set(null);
        this.applyFilters();
    }

    // --- Actions ---

    createEmployee() {
        this.create.emit();
    }

    editEmployee(id: number) {
        this.edit.emit(id);
    }

    getFullName(employee: EmployeeResponse): string {
        return `${employee.firstName} ${employee.lastName || ''}`.trim();
    }

    // --- Modal Logic (Replacing PrimeNG Dialog) ---

    openModal(message: string, type: 'delete' | 'status', action: () => void) {
        this.modalMessage = message;
        this.modalType = type;
        this.pendingAction = action;
        this.showModal = true;
    }

    closeModal() {
        this.showModal = false;
        this.pendingAction = null;
    }

    confirmAction() {
        if (this.pendingAction) {
            this.pendingAction();
        }
        this.closeModal();
    }

    // --- Specific Business Actions ---

    toggleEmployeeStatus(employee: EmployeeResponse) {
        const actionStr = employee.active ? 'desactivar' : 'activar';
        this.openModal(
            `¿Está seguro de <b>${actionStr}</b> al empleado ${this.getFullName(employee)}?`,
            'status',
            () => {
                const request = { ...employee, active: !employee.active };
                // Nota: Ajusta el objeto request según lo que tu API espere realmente (partial update)
                this.employeeService.update(employee.id, request).subscribe({
                    next: () => {
                        this.showAlert('Éxito', `Empleado ${actionStr} correctamente`, 'success');
                        this.loadData();
                    },
                    error: () => this.showAlert('Error', 'No se pudo cambiar el estado', 'danger')
                });
            }
        );
    }

    confirmDelete(employee: EmployeeResponse) {
        this.openModal(
            `¿Está seguro de eliminar a <b>${this.getFullName(employee)}</b>? Esta acción no se puede deshacer.`,
            'delete',
            () => {
                this.employeeService.delete(employee.id).subscribe({
                    next: () => {
                        this.showAlert('Eliminado', 'Empleado eliminado correctamente', 'success');
                        this.loadData();
                    },
                    error: () => this.showAlert('Error', 'No se pudo eliminar el empleado', 'danger')
                });
            }
        );
    }

    // --- Alerts Logic (Replacing PrimeNG Toast) ---

    showAlert(title: string, message: string, type: string) {
        this.alertTitle = title;
        this.alertMessage = message;
        this.alertType = type;
        // Auto hide after 3 seconds
        setTimeout(() => this.closeAlert(), 3000);
    }

    closeAlert() {
        this.alertMessage = '';
    }

    trackByEmployeeId(index: number, employee: EmployeeResponse): number {
        return employee.id;
    }
}