import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { EmployeeService } from '../../../core/services/employee.service';
import { UserService, User } from '../../../core/services/user.service';
import { forkJoin } from 'rxjs';

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

    employeeForm: FormGroup;
    isEditMode = signal<boolean>(false);
    employeeId = signal<number | null>(null);
    isLoading = signal<boolean>(false);
    errorMessage = signal<string>('');

    users = signal<User[]>([]);

    constructor() {
        this.employeeForm = this.fb.group({
            firstName: ['', [Validators.required, Validators.maxLength(100)]],
            lastName: ['', [Validators.maxLength(100)]],
            documentNumber: ['', [Validators.maxLength(20)]],
            userId: [null],
            active: [true]
        });
    }

    ngOnInit(): void {
        this.loadInitialData();
    }

    loadInitialData(): void {
        const id = this.route.snapshot.paramMap.get('id');
        this.isLoading.set(true);

        const requests: any = {
            users: this.userService.getAll()
        };

        if (id) {
            this.isEditMode.set(true);
            this.employeeId.set(+id);
            requests.employee = this.employeeService.getById(+id);
        }

        forkJoin(requests).subscribe({
            next: (data: any) => {
                this.users.set(data.users);
                if (data.employee) {
                    // Find the userId if username matches
                    const associatedUser = data.users.find((u: any) => u.username === data.employee.username);

                    this.employeeForm.patchValue({
                        firstName: data.employee.firstName,
                        lastName: data.employee.lastName,
                        documentNumber: data.employee.documentNumber,
                        userId: associatedUser ? associatedUser.id : null,
                        active: data.employee.active
                    });
                }
                this.isLoading.set(false);
            },
            error: (err) => {
                this.errorMessage.set('Error al cargar datos. Intenta de nuevo.');
                this.isLoading.set(false);
            }
        });
    }

    onSubmit(): void {
        if (this.employeeForm.invalid) {
            this.employeeForm.markAllAsTouched();
            return;
        }

        this.isLoading.set(true);
        const employeeData = this.employeeForm.value;

        const request$ = this.isEditMode()
            ? this.employeeService.update(this.employeeId()!, employeeData)
            : this.employeeService.create(employeeData);

        request$.subscribe({
            next: () => this.router.navigate(['/employees']),
            error: (err) => {
                this.errorMessage.set('Error al guardar el empleado. Verifica los datos.');
                this.isLoading.set(false);
            }
        });
    }

    onCancel(): void {
        this.router.navigate(['/employees']);
    }
}
