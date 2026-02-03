import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { EmployeeService } from '../../../core/services/employee.service';
import { EmployeeResponse } from '../../../core/models/employee.model';

@Component({
    selector: 'app-employees-list',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule],
    templateUrl: './employees-list.component.html',
    styleUrl: './employees-list.component.scss'
})
export class EmployeesListComponent implements OnInit {
    private employeeService = inject(EmployeeService);
    private router = inject(Router);

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
        this.router.navigate(['/employees/new']);
    }

    editEmployee(id: number) {
        this.router.navigate(['/employees', id, 'edit']);
    }

    toggleEmployeeStatus(employee: EmployeeResponse) {
        if (confirm(`¿Está seguro de ${employee.active ? 'desactivar' : 'activar'} al empleado ${employee.firstName} ${employee.lastName || ''}?`)) {
            const request = {
                firstName: employee.firstName,
                lastName: employee.lastName,
                documentNumber: employee.documentNumber,
                active: !employee.active
            };

            this.employeeService.update(employee.id, request).subscribe({
                next: () => {
                    this.loadData();
                },
                error: (error) => {
                    console.error('Error toggling employee status:', error);
                    alert('Error al cambiar el estado del empleado');
                }
            });
        }
    }

    deleteEmployee(employee: EmployeeResponse) {
        if (confirm(`¿Está seguro de eliminar al empleado ${employee.firstName} ${employee.lastName || ''}? Esta acción no se puede deshacer.`)) {
            this.employeeService.delete(employee.id).subscribe({
                next: () => {
                    this.loadData();
                },
                error: (error) => {
                    console.error('Error deleting employee:', error);
                    alert('Error al eliminar el empleado');
                }
            });
        }
    }

    getFullName(employee: EmployeeResponse): string {
        return `${employee.firstName} ${employee.lastName || ''}`.trim();
    }

    trackByEmployeeId(index: number, employee: EmployeeResponse): number {
        return employee.id;
    }
}
