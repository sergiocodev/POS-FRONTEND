import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { EmployeeService } from '../../../core/services/employee.service';
import { EmployeeResponse, EmployeeRequest } from '../../../core/models/employee.model';

@Component({
    selector: 'app-employee-list',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './employee-list.component.html',
    styleUrl: './employee-list.component.scss'
})
export class EmployeeListComponent implements OnInit {
    private employeeService = inject(EmployeeService);
    private router = inject(Router);

    employees = signal<EmployeeResponse[]>([]);
    filteredEmployees = signal<EmployeeResponse[]>([]);
    isLoading = signal<boolean>(false);
    errorMessage = signal<string>('');
    searchTerm = signal<string>('');

    ngOnInit(): void {
        this.loadEmployees();
    }

    loadEmployees(): void {
        this.isLoading.set(true);
        this.errorMessage.set('');

        this.employeeService.getAll().subscribe({
            next: (data) => {
                this.employees.set(data);
                this.filteredEmployees.set(data);
                this.isLoading.set(false);
            },
            error: (error) => {
                this.errorMessage.set('Error al cargar empleados. Intenta de nuevo.');
                this.isLoading.set(false);
                console.error('Error loading employees:', error);
            }
        });
    }

    onSearch(event: Event): void {
        const input = event.target as HTMLInputElement;
        const term = input.value.toLowerCase();
        this.searchTerm.set(term);

        if (!term) {
            this.filteredEmployees.set(this.employees());
            return;
        }

        const filtered = this.employees().filter(emp =>
            emp.firstName.toLowerCase().includes(term) ||
            (emp.lastName && emp.lastName.toLowerCase().includes(term)) ||
            (emp.documentNumber && emp.documentNumber.toLowerCase().includes(term)) ||
            (emp.username && emp.username.toLowerCase().includes(term))
        );
        this.filteredEmployees.set(filtered);
    }

    onNew(): void {
        this.router.navigate(['/employees/new']);
    }

    onEdit(id: number): void {
        this.router.navigate(['/employees/edit', id]);
    }

    onDelete(employee: EmployeeResponse): void {
        if (confirm(`¿Estás seguro de eliminar a ${employee.firstName} ${employee.lastName || ''}?`)) {
            this.employeeService.delete(employee.id).subscribe({
                next: () => {
                    this.loadEmployees();
                },
                error: (error) => {
                    this.errorMessage.set('Error al eliminar el empleado. Intenta de nuevo.');
                }
            });
        }
    }

    toggleStatus(employee: EmployeeResponse): void {
        const newStatus = !employee.active;
        const request: EmployeeRequest = {
            firstName: employee.firstName,
            lastName: employee.lastName,
            documentNumber: employee.documentNumber,
            active: newStatus
        };

        this.employeeService.update(employee.id, request).subscribe({
            next: () => {
                this.loadEmployees();
            },
            error: (error) => {
                this.errorMessage.set('Error al actualizar el estado del empleado.');
                console.error('Error toggling employee status:', error);
            }
        });
    }
}
