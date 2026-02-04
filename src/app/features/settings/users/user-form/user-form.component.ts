import { Component, OnInit, inject, signal, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { UserService } from '../../../../core/services/user.service';
import { RoleService } from '../../../../core/services/role.service';
import { UserRequest, UserResponse } from '../../../../core/models/user.model';
import { RoleResponse } from '../../../../core/models/maintenance.model';

// PrimeNG Imports
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { CheckboxModule } from 'primeng/checkbox';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ChipModule } from 'primeng/chip';

@Component({
    selector: 'app-user-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        FormsModule,
        RouterModule,
        InputTextModule,
        PasswordModule,
        CheckboxModule,
        ToggleSwitchModule,
        ButtonModule,
        InputNumberModule,
        CardModule,
        ProgressSpinnerModule,
        MessageModule,
        ToastModule,
        ChipModule
    ],
    providers: [MessageService],
    templateUrl: './user-form.component.html',
    styleUrl: './user-form.component.scss'
})
export class UserFormComponent implements OnInit {
    private fb = inject(FormBuilder);
    private userService = inject(UserService);
    private roleService = inject(RoleService);

    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private messageService = inject(MessageService);

    @Input() set userId(value: number | null) {
        this._userId.set(value);
        this.checkEditModeFromInput();
    }
    get userId(): number | null {
        return this._userId();
    }
    private _userId = signal<number | null>(null);

    @Output() saved = new EventEmitter<void>();
    @Output() cancelled = new EventEmitter<void>();

    userForm!: FormGroup;
    isEditMode = signal(false);
    isLoading = signal(false);
    isSaving = signal(false);
    isSearching = signal(false);

    roles = signal<RoleResponse[]>([]);
    selectedRoles = signal<number[]>([]);

    ngOnInit() {
        this.initForm();
        this.loadLookupData();
        this.checkEditMode();
    }

    initForm() {
        this.userForm = this.fb.group({
            username: ['', [Validators.required, Validators.minLength(3)]],
            email: ['', [Validators.required, Validators.email]],
            fullName: ['', [Validators.required]],
            document: [null],
            password: ['', [Validators.minLength(8)]],
            active: [true],
            roleIds: [[], [Validators.required, Validators.minLength(1)]]
        });
    }

    loadLookupData() {
        this.roleService.getAll().subscribe({
            next: (roles) => {
                this.roles.set(roles.filter(r => r.active));
            },
            error: (error) => {
                console.error('Error loading roles:', error);
            }
        });


    }

    checkEditModeFromInput() {
        const id = this.userId;
        if (id) {
            this.isEditMode.set(true);
            this.loadUser(id);

            if (this.userForm) {
                this.userForm.get('password')?.clearValidators();
                this.userForm.get('password')?.updateValueAndValidity();
            }
        } else {
            this.isEditMode.set(false);
            if (this.userForm) {
                this.userForm.reset({ active: true });
                this.selectedRoles.set([]);
                this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(8)]);
                this.userForm.get('password')?.updateValueAndValidity();
            }
        }
    }

    checkEditMode() {

    }

    loadUser(id: number) {
        this.isLoading.set(true);
        this.userService.getById(id).subscribe({
            next: (user) => {
                this.userForm.patchValue({
                    username: user.username,
                    email: user.email,
                    fullName: user.fullName,
                    active: user.active,
                    roleIds: user.roles?.map(r => r.id) || []
                });
                this.selectedRoles.set(user.roles?.map(r => r.id) || []);

                this.isLoading.set(false);
            },
            error: (error) => {
                console.error('Error loading user:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Error al cargar el usuario'
                });
                this.router.navigate(['/settings/users']);
            }
        });
    }

    toggleRole(roleId: number) {
        const current = this.selectedRoles();
        let updated: number[];
        if (current.includes(roleId)) {
            updated = current.filter(id => id !== roleId);
        } else {
            updated = [...current, roleId];
        }

        this.selectedRoles.set(updated);
        this.userForm.get('roleIds')?.setValue(updated);
        this.userForm.get('roleIds')?.markAsTouched();
    }

    isRoleSelected(roleId: number): boolean {
        return this.selectedRoles().includes(roleId);
    }

    searchDocument() {
        const document = this.userForm.get('document')?.value;
        if (!document) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Atención',
                detail: 'Ingrese un número de documento'
            });
            return;
        }

        this.isSearching.set(true);
        this.userService.searchByDocument(document.toString()).subscribe({
            next: (data) => {
                this.isSearching.set(false);
                if (data.razonSocial) {
                    this.userForm.patchValue({ fullName: data.razonSocial });
                } else if (data.nombres) {
                    const fullName = `${data.nombres} ${data.apellidoPaterno || ''} ${data.apellidoMaterno || ''}`.trim();
                    this.userForm.patchValue({ fullName: fullName });
                }

                this.messageService.add({
                    severity: 'success',
                    summary: 'Éxito',
                    detail: 'Datos encontrados'
                });
            },
            error: (error) => {
                this.isSearching.set(false);
                console.error('Error searching document:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se encontraron datos para el documento ingresado'
                });
            }
        });
    }

    onSubmit() {
        if (this.userForm.invalid) {
            this.userForm.markAllAsTouched();

            if (this.userForm.get('roleIds')?.invalid) {
                this.messageService.add({
                    severity: 'warn',
                    summary: 'Atención',
                    detail: 'Debe seleccionar al menos un rol'
                });
            }
            return;
        }

        this.isSaving.set(true);

        const formValue = this.userForm.value;
        const request: UserRequest = {
            username: formValue.username,
            email: formValue.email,
            fullName: formValue.fullName,
            roleIds: this.selectedRoles(),
            active: formValue.active
        };


        if (formValue.password) {
            request.password = formValue.password;
        }

        const operation = this.isEditMode()
            ? this.userService.update(this.userId!, request)
            : this.userService.create(request);

        operation.subscribe({
            next: () => {
                this.isSaving.set(false);
                this.messageService.add({
                    severity: 'success',
                    summary: 'Éxito',
                    detail: `Usuario ${this.isEditMode() ? 'actualizado' : 'creado'} correctamente`
                });
                this.saved.emit();
            },
            error: (error) => {
                console.error('Error saving user:', error);
                this.isSaving.set(false);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Error al guardar el usuario'
                });
            }
        });
    }

    cancel() {
        this.cancelled.emit();
    }

    get f() {
        return this.userForm.controls;
    }
}
