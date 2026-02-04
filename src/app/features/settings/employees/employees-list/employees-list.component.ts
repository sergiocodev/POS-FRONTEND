import { Component, OnInit, inject, signal, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { EmployeeService } from '../../../../core/services/employee.service';
import { EmployeeResponse } from '../../../../core/models/employee.model';

import { ModuleHeaderComponent } from '../../../../shared/components/module-header/module-header.component';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ToolbarModule } from 'primeng/toolbar';
import { BadgeModule } from 'primeng/badge';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';
import { AvatarModule } from 'primeng/avatar';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

@Component({
    selector: 'app-employees-list',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        FormsModule,
        ModuleHeaderComponent,
        TableModule,
        ButtonModule,
        InputTextModule,
        IconFieldModule,
        InputIconModule,
        ToolbarModule,
        BadgeModule,
        TooltipModule,
        TagModule,
        AvatarModule,
        ConfirmDialogModule,
        ToastModule
    ],
    providers: [ConfirmationService, MessageService],
    templateUrl: './employees-list.component.html',
    styleUrl: './employees-list.component.scss'
})
export class EmployeesListComponent implements OnInit {
    private employeeService = inject(EmployeeService);
    private confirmationService = inject(ConfirmationService);
    private messageService = inject(MessageService);

    @Output() create = new EventEmitter<void>();
    @Output() edit = new EventEmitter<number>();

    employees = signal<EmployeeResponse[]>([]);
    filteredEmployees = signal<EmployeeResponse[]>([]);
    isLoading = signal(false);


    searchTerm = signal('');
    selectedStatusFilter = signal<boolean | null>(null);

    ngOnInit() {
        this.loadData();
    }

    loadData() {
        this.isLoading.set(true);
        this.employeeService.getAll().subscribe({
            next: (employees) => {
                this.employees.set(employees);
                this.filteredEmployees.set(employees);
                this.isLoading.set(false);
            },
            error: (error) => {
                console.error('Error loading employees:', error);
                this.isLoading.set(false);
            }
        });
    }

    applyFilters() {
        let filtered = this.employees();


        const search = this.searchTerm().toLowerCase();
        if (search) {
            filtered = filtered.filter(emp =>
                emp.firstName.toLowerCase().includes(search) ||
                (emp.lastName && emp.lastName.toLowerCase().includes(search)) ||
                (emp.documentNumber && emp.documentNumber.toLowerCase().includes(search)) ||
                (emp.username && emp.username.toLowerCase().includes(search))
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

    onStatusFilterChange(status: string) {
        if (status === '') {
            this.selectedStatusFilter.set(null);
        } else {
            this.selectedStatusFilter.set(status === 'true');
        }
        this.applyFilters();
    }

    createEmployee() {
        this.create.emit();
    }

    editEmployee(id: number) {
        this.edit.emit(id);
    }

    toggleEmployeeStatus(employee: EmployeeResponse) {
        this.confirmationService.confirm({
            message: `¿Está seguro de ${employee.active ? 'desactivar' : 'activar'} al empleado <b>${this.getFullName(employee)}</b>?`,
            header: 'Confirmar Acción',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí',
            rejectLabel: 'No',
            acceptButtonStyleClass: 'p-button-warning',
            rejectButtonStyleClass: 'p-button-text',
            accept: () => {
                const request = {
                    firstName: employee.firstName,
                    lastName: employee.lastName,
                    documentNumber: employee.documentNumber,
                    active: !employee.active
                };

                this.employeeService.update(employee.id, request).subscribe({
                    next: () => {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Éxito',
                            detail: `Empleado ${employee.active ? 'desactivado' : 'activado'} correctamente`
                        });
                        this.loadData();
                    },
                    error: (error) => {
                        console.error('Error toggling employee status:', error);
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'No se pudo cambiar el estado del empleado'
                        });
                    }
                });
            }
        });
    }

    deleteEmployee(employee: EmployeeResponse) {
        this.confirmationService.confirm({
            message: `¿Está seguro de eliminar al empleado <b>${this.getFullName(employee)}</b>? Esta acción no se puede deshacer.`,
            header: 'Eliminar Empleado',
            icon: 'pi pi-trash',
            acceptLabel: 'Eliminar',
            rejectLabel: 'Cancelar',
            acceptButtonStyleClass: 'p-button-danger',
            rejectButtonStyleClass: 'p-button-text',
            accept: () => {
                this.employeeService.delete(employee.id).subscribe({
                    next: () => {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Eliminado',
                            detail: 'Empleado eliminado correctamente'
                        });
                        this.loadData();
                    },
                    error: (error) => {
                        console.error('Error deleting employee:', error);
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'No se pudo eliminar el empleado'
                        });
                    }
                });
            }
        });
    }

    getFullName(employee: EmployeeResponse): string {
        return `${employee.firstName} ${employee.lastName || ''}`.trim();
    }

    trackByEmployeeId(index: number, employee: EmployeeResponse): number {
        return employee.id;
    }
}
