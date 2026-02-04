import { Component, OnInit, inject, signal, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { EmployeeService } from '../../../../core/services/employee.service';
import { EmployeeRequest } from '../../../../core/models/employee.model';
import { UserService } from '../../../../core/services/user.service';
import { UserResponse } from '../../../../core/models/user.model';

import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { InputMaskModule } from 'primeng/inputmask';
import { MessageModule } from 'primeng/message';

@Component({
    selector: 'app-employee-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        RouterModule,
        InputTextModule,
        SelectModule,
        ButtonModule,
        InputMaskModule,
        MessageModule
    ],
    templateUrl: './employee-form.component.html',
    styleUrl: './employee-form.component.scss'
})
export class EmployeeFormComponent implements OnInit {
    private fb = inject(FormBuilder);
    private employeeService = inject(EmployeeService);
    private userService = inject(UserService);

    @Input() set employeeId(value: number | null) {
        this._employeeId.set(value);
        this.checkEditModeFromInput();
    }
    get employeeId(): number | null {
        return this._employeeId();
    }
    private _employeeId = signal<number | null>(null);

    @Output() saved = new EventEmitter<void>();
    @Output() cancelled = new EventEmitter<void>();

    employeeForm!: FormGroup;
    isEditMode = signal(false);
    isLoading = signal(false);
    isSaving = signal(false);
    users = signal<UserResponse[]>([]);

    ngOnInit() {
        this.initForm();
        this.loadUsers();
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

    checkEditModeFromInput() {
        const id = this.employeeId;
        if (id) {
            this.isEditMode.set(true);
            this.loadEmployee(id);
        } else {
            this.isEditMode.set(false);
            if (this.employeeForm) {
                this.employeeForm.reset();
            }
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
                    userId: null // We don't have the userId in the response currently, but keep placeholder
                });
                this.isLoading.set(false);
            },
            error: (error) => {
                console.error('Error loading employee:', error);
                alert('Error al cargar el empleado');
                this.cancelled.emit();
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
            ? this.employeeService.update(this.employeeId!, request)
            : this.employeeService.create(request);

        operation.subscribe({
            next: () => {
                this.isSaving.set(false);
                this.saved.emit();
            },
            error: (error) => {
                console.error('Error saving employee:', error);
                this.isSaving.set(false);
                alert('Error al guardar el empleado');
            }
        });
    }

    cancel() {
        this.cancelled.emit();
    }

    get f() {
        return this.employeeForm.controls;
    }
}
