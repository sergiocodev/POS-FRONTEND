import { Component, OnInit, inject, signal, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { EmployeeService } from '../../../../core/services/employee.service';
import { EmployeeRequest } from '../../../../core/models/employee.model';
import { UserService } from '../../../../core/services/user.service';
import { UserResponse } from '../../../../core/models/user.model';
import { ModalService } from '../../../../shared/components/confirm-modal/service/modal.service';
import { ModalAlertComponent } from '../../../../shared/components/modal-alert/modal-alert.component';
import { ConfirmModalComponent } from '../../../../shared/components/confirm-modal/confirm-modal.component';
import { SpinnerComponent } from '../../../../shared/components/spinner/spinner.component';

@Component({
    selector: 'app-employee-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        RouterModule,
        ModalAlertComponent,
        ConfirmModalComponent,
        SpinnerComponent
    ],
    templateUrl: './employee-form.component.html',
    styleUrl: './employee-form.component.scss'
})
export class EmployeeFormComponent implements OnInit {
    private fb = inject(FormBuilder);
    private employeeService = inject(EmployeeService);
    private userService = inject(UserService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private modalService = inject(ModalService);

    @Input() isModal: boolean = false;
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
    isSearching = signal(false);
    users = signal<UserResponse[]>([]);

    ngOnInit() {
        this.initForm();
        this.loadUsers();
        
        // Check Input first, then Route
        const routeId = this.route.snapshot.paramMap.get('id');
        const idToLoad = this.employeeId || (routeId ? +routeId : null);

        if (idToLoad) {
            this.isEditMode.set(true);
            this._employeeId.set(idToLoad);
            this.loadEmployee(idToLoad);
        }
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
            next: (response) => {
                this.users.set(response.data);
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
                this.employeeForm.controls['userId']?.setValue(null);
            }
        }
    }

    loadEmployee(id: number) {
        this.isLoading.set(true);
        this.employeeService.getById(id).subscribe({
            next: (response) => {
                const employee = response.data;
                this.employeeForm.patchValue({
                    firstName: employee.firstName,
                    lastName: employee.lastName,
                    documentNumber: employee.documentNumber,
                    userId: (employee as any).userId || null
                });
                this.isLoading.set(false);
            },
            error: (error) => {
                console.error('Error loading employee:', error);
                this.modalService.alert({
                    title: 'Error',
                    message: 'No se pudo cargar la información del empleado',
                    type: 'error'
                });
                this.isLoading.set(false);
                if (this.isModal) {
                    this.cancelled.emit();
                } else {
                    this.router.navigate(['/employees']);
                }
            }
        });
    }

    searchDocument() {
        const document = this.employeeForm.get('documentNumber')?.value;
        if (!document) {
            this.modalService.alert({ title: 'Atención', message: 'Ingrese un número de documento para buscar.', type: 'warning' });
            return;
        }

        this.isSearching.set(true);

        this.userService.searchByDocument(document).subscribe({
            next: (response) => {
                this.isSearching.set(false);
                const data = response.data;

                if (data.razonSocial) {
                    this.employeeForm.patchValue({
                        firstName: data.razonSocial,
                        lastName: ''
                    });
                } else if (data.nombres) {
                    this.employeeForm.patchValue({
                        firstName: data.nombres,
                        lastName: `${data.apellidoPaterno || ''} ${data.apellidoMaterno || ''}`.trim()
                    });
                } else {
                    this.modalService.alert({ title: 'Sin resultados', message: 'No se encontraron datos para este documento.', type: 'warning' });
                }
            },
            error: (error) => {
                this.isSearching.set(false);
                this.modalService.alert({ title: 'Error', message: 'No se encontraron datos para este documento o ocurrió un error.', type: 'error' });
                console.error('Search error:', error);
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
            userId: formValue.userId ? Number(formValue.userId) : undefined
        };

        const operation = this.isEditMode()
            ? this.employeeService.update(this.employeeId!, request)
            : this.employeeService.create(request);

        operation.subscribe({
            next: () => {
                this.isSaving.set(false);
                if (this.isModal) {
                    this.saved.emit();
                } else {
                    this.modalService.alert({ title: 'Éxito', message: 'Personal guardado correctamente', type: 'success' })
                        .then(() => this.router.navigate(['/employees']));
                }
            },
            error: (error) => {
                console.error('Error saving employee:', error);
                this.isSaving.set(false);
                let msg = 'No se pudo guardar la información del empleado';
                if (error.status === 409) {
                    msg = 'Ya existe un empleado con este número de documento.';
                }
                this.modalService.alert({
                    title: 'Error',
                    message: msg,
                    type: 'error'
                });
            }
        });
    }


    get f() {
        return this.employeeForm.controls;
    }
}