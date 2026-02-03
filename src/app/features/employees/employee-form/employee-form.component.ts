import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { EmployeeService } from '../../../core/services/employee.service';
import { EmployeeRequest } from '../../../core/models/employee.model';
import { UserService } from '../../../core/services/user.service';
import { UserResponse } from '../../../core/models/user.model';

@Component({
    selector: 'app-employee-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule],
    templateUrl: './employee-form.component.html',
    styleUrl: './employee-form.component.scss'
})
export class EmployeeFormComponent implements OnInit {
    private fb = inject(FormBuilder);
    private employeeService = inject(EmployeeService);
    private userService = inject(UserService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);

    employeeForm!: FormGroup;
    isEditMode = signal(false);
    employeeId = signal<number | null>(null);
    isLoading = signal(false);
    isSaving = signal(false);
    users = signal<UserResponse[]>([]);

    ngOnInit() {
        this.initForm();
        this.loadUsers();
        this.checkEditMode();
    }

    initForm() {
        this.employeeForm = this.fb.group({
            firstName: ['', [Validators.required, Validators.minLength(2)]],
            lastName: [''],
            documentNumber: ['', [Validators.pattern(/^[0-9]{8,11}$/)]],
            userId: [null]
        });
    }

    loadUsers() {
        this.userService.getAll().subscribe({
            next: (users) => {
                this.users.set(users);
            },
            error: (error) => {
                console.error('Error loading users:', error);
            }
        });
    }

    checkEditMode() {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.isEditMode.set(true);
            this.employeeId.set(+id);
            this.loadEmployee(+id);
        }
    }

    loadEmployee(id: number) {
        this.isLoading.set(true);
        this.employeeService.getById(id).subscribe({
            next: (employee) => {
                this.employeeForm.patchValue({
                    firstName: employee.firstName,
                    lastName: employee.lastName,
                    documentNumber: employee.documentNumber,
                    userId: null 
                });
                this.isLoading.set(false);
            },
            error: (error) => {
                console.error('Error loading employee:', error);
                alert('Error al cargar el empleado');
                this.router.navigate(['/employees']);
            }
        });
    }

    onSubmit() {
        if (this.employeeForm.invalid) {
            this.employeeForm.markAllAsTouched();
            return;
        }

        this.isSaving.set(true);

        const formValue = this.employeeForm.value;
        const request: EmployeeRequest = {
            firstName: formValue.firstName,
            lastName: formValue.lastName || undefined,
            documentNumber: formValue.documentNumber || undefined,
            userId: formValue.userId || undefined,
            active: true 
        };

        const operation = this.isEditMode()
            ? this.employeeService.update(this.employeeId()!, request)
            : this.employeeService.create(request);

        operation.subscribe({
            next: () => {
                this.isSaving.set(false);
                alert(`Empleado ${this.isEditMode() ? 'actualizado' : 'creado'} exitosamente`);
                this.router.navigate(['/employees']);
            },
            error: (error) => {
                console.error('Error saving employee:', error);
                this.isSaving.set(false);
                alert('Error al guardar el empleado');
            }
        });
    }

    cancel() {
        this.router.navigate(['/employees']);
    }

    get f() {
        return this.employeeForm.controls;
    }
}
