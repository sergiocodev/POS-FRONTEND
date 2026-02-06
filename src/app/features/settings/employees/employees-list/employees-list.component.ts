import { Component, OnInit, inject, signal, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { EmployeeService } from '../../../../core/services/employee.service';
import { EmployeeResponse } from '../../../../core/models/employee.model';
import { ModuleHeaderComponent } from '../../../../shared/components/module-header/module-header.component';
import { CustomTableComponent, TableColumn } from '../../../../shared/components/custom-table/custom-table.component';
import { ModalGenericComponent } from '../../../../shared/components/modal-generic/modal-generic.component';
import { EmployeeFormComponent } from '../employee-form/employee-form.component';

@Component({
    selector: 'app-employees-list',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        FormsModule,
        ModuleHeaderComponent,
        CustomTableComponent,
        ModalGenericComponent,
        EmployeeFormComponent
    ],
    templateUrl: './employees-list.component.html',
    styleUrl: './employees-list.component.scss'
})
export class EmployeesListComponent implements OnInit {
    private employeeService = inject(EmployeeService);

    @Output() create = new EventEmitter<void>();
    @Output() edit = new EventEmitter<number>();

    // Configuración de la tabla
    cols: TableColumn[] = [
        { key: 'fullName', label: 'Nombre', type: 'text' },
        { key: 'documentNumber', label: 'Documento', type: 'text' },
        {
            key: 'username',
            label: 'Usuario',
            type: 'text',
            format: (v: any) => v || 'Sin cuenta'
        },
        { key: 'active', label: 'Estado', type: 'toggle' },
        { key: 'actions', label: 'Acciones', type: 'action' }
    ];

    // Data Signals
    employees = signal<EmployeeResponse[]>([]);
    filteredEmployees = signal<EmployeeResponse[]>([]);
    isLoading = signal(false);

    // Filtros
    searchTerm = signal('');
    selectedStatusFilter = signal<boolean | null>(null);

    // Modal de Formulario de Empleado
    showEmployeeModal = signal(false);
    selectedEmployeeId = signal<number | null>(null);

    // Pagination (Handled by CustomTable)
    pageSize = 10;

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
            next: (response) => {
                const employees = response.data;
                // Mapear para tener fullName disponible para la tabla
                const mapped = employees.map(emp => ({
                    ...emp,
                    fullName: `${emp.firstName} ${emp.lastName || ''}`.trim()
                }));
                this.employees.set(mapped);
                this.applyFilters();
                this.isLoading.set(false);
            },
            error: (error) => {
                console.error('Error loading employees:', error);
                this.showAlert('Error', 'No se pudieron cargar los datos', 'danger');
                this.isLoading.set(false);
            }
        });
    }

    // --- Filter Logic ---

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
    }

    onSearchChange(value: string) {
        this.searchTerm.set(value);
        this.applyFilters();
    }

    onStatusFilterChange(event: any) {
        const value = event === 'true' ? true : event === 'false' ? false : null;
        this.selectedStatusFilter.set(value);
        this.applyFilters();
    }

    // --- Actions ---

    handleTableAction(e: { action: string, row: EmployeeResponse }) {
        if (e.action === 'edit') {
            this.editEmployee(e.row.id);
        } else if (e.action === 'delete') {
            this.confirmDelete(e.row);
        }
    }

    handleStatusToggle(e: { row: EmployeeResponse, key: string, checked: boolean }) {
        this.toggleEmployeeStatus(e.row);
    }

    createEmployee() {
        this.selectedEmployeeId.set(null);
        this.showEmployeeModal.set(true);
    }

    editEmployee(id: number) {
        this.selectedEmployeeId.set(id);
        this.showEmployeeModal.set(true);
    }

    onEmployeeSaved() {
        this.showEmployeeModal.set(false);
        this.loadData();
    }

    onEmployeeCancelled() {
        this.showEmployeeModal.set(false);
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