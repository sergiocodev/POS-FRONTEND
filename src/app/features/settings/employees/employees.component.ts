import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
// Eliminado: import { DialogModule } ...
import { EmployeesListComponent } from './employees-list/employees-list.component';
import { EmployeeFormComponent } from './employee-form/employee-form.component';
import { EmployeeService } from '../../../core/services/employee.service';
import { ModalService } from '../../../shared/components/confirm-modal/service/modal.service';
import { EmployeeResponse } from '../../../core/models/employee.model';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { ModalAlertComponent } from '../../../shared/components/modal-alert/modal-alert.component';
import { ModalGenericComponent } from '../../../shared/components/modal-generic/modal-generic.component';
import { ModuleHeaderComponent } from '../../../shared/components/module-header/module-header.component';

@Component({
    selector: 'app-employees',
    standalone: true,
    imports: [
        CommonModule,
        EmployeesListComponent,
        EmployeeFormComponent,
        ConfirmModalComponent,
        ModalAlertComponent,
        ModalGenericComponent,
        ModuleHeaderComponent
    ],
    templateUrl: './employees.component.html',
    styleUrl: './employees.component.scss'
})
export class EmployeesComponent implements OnInit {
    private employeeService = inject(EmployeeService);
    private modalService = inject(ModalService);

    // State
    employees = signal<EmployeeResponse[]>([]);
    isLoading = signal(false);

    // Modal State
    displayForm = signal(false);
    selectedEmployeeId = signal<number | null>(null);

    ngOnInit() {
        this.loadData();
    }

    loadData() {
        this.isLoading.set(true);
        this.employeeService.getAll().subscribe({
            next: (response) => {
                const data = response.data;
                // Mapear para tener fullName disponible para la tabla
                const mapped = data.map(emp => ({
                    ...emp,
                    fullName: `${emp.firstName} ${emp.lastName || ''}`.trim()
                }));
                this.employees.set(mapped);
                this.isLoading.set(false);
            },
            error: (error) => {
                console.error('Error loading employees:', error);
                this.modalService.alert({
                    title: 'Error',
                    message: 'No se pudieron cargar los empleados',
                    type: 'error'
                });
                this.isLoading.set(false);
            }
        });
    }

    onOpenForm(employeeId: number | null = null) {
        this.selectedEmployeeId.set(employeeId);
        this.displayForm.set(true);
    }

    onFormSaved() {
        this.displayForm.set(false);
        this.selectedEmployeeId.set(null);
        this.loadData();
    }

    onFormCancelled() {
        this.displayForm.set(false);
        this.selectedEmployeeId.set(null);
    }

    async onDeleteEmployee(emp: EmployeeResponse) {
        const confirmed = await this.modalService.confirm({
            title: 'Eliminar Personal',
            message: `¿Está seguro de eliminar a <b>${emp.firstName} ${emp.lastName || ''}</b>? Esta acción no se puede deshacer.`,
            btnColor: 'danger',
            confirmText: 'Eliminar'
        });

        if (confirmed) {
            this.employeeService.delete(emp.id).subscribe({
                next: () => {
                    this.loadData();
                    this.modalService.alert({ title: 'Eliminado', message: 'Personal eliminado correctamente', type: 'success' });
                },
                error: (error) => {
                    console.error('Error deleting employee:', error);
                    this.modalService.alert({ title: 'Error', message: 'No se pudo eliminar el personal', type: 'error' });
                }
            });
        }
    }

    async onToggleStatus(emp: EmployeeResponse) {
        const actionStr = emp.active ? 'desactivar' : 'activar';
        const confirmed = await this.modalService.confirm({
            title: 'Confirmación',
            message: `¿Está seguro de <b>${actionStr}</b> al empleado <b>${emp.firstName} ${emp.lastName || ''}</b>?`,
            btnColor: 'warning',
            confirmText: emp.active ? 'Desactivar' : 'Activar'
        });

        if (confirmed) {
            const request = { ...emp, active: !emp.active };
            this.employeeService.update(emp.id, request).subscribe({
                next: () => {
                    this.loadData();
                    this.modalService.alert({ title: 'Éxito', message: `Personal ${actionStr} correctamente`, type: 'success' });
                },
                error: (error) => {
                    console.error('Error toggling status:', error);
                    this.modalService.alert({ title: 'Error', message: 'No se pudo cambiar el estado', type: 'error' });
                }
            });
        }
    }
}