import { Component, OnInit, inject, signal, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { UserService } from '../../../../core/services/user.service';
import { RoleService } from '../../../../core/services/role.service';
import { UploadService } from '../../../../core/services/upload.service';
import { AuthService } from '../../../../core/services/auth.service';
import { UserRequest } from '../../../../core/models/user.model';
import { RoleResponse } from '../../../../core/models/maintenance.model';

@Component({
    selector: 'app-user-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        FormsModule,
        RouterModule
    ],
    templateUrl: './user-form.component.html',
    styleUrl: './user-form.component.scss'
})
export class UserFormComponent implements OnInit {
    private fb = inject(FormBuilder);
    private userService = inject(UserService);
    private roleService = inject(RoleService);
    private uploadService = inject(UploadService);
    private authService = inject(AuthService);
    private router = inject(Router);

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
    imageError = signal(false);
    showPassword = signal(false);

    // Alert State
    alertMessage = '';
    alertTitle = '';
    alertType = 'success';

    roles = signal<RoleResponse[]>([]);
    selectedRoles = signal<number[]>([]);

    ngOnInit() {
        this.initForm();
        this.loadLookupData();
    }

    initForm() {
        this.userForm = this.fb.group({
            username: ['', [Validators.required, Validators.minLength(3)]],
            email: ['', [Validators.required, Validators.email]],
            fullName: ['', [Validators.required]],
            document: [''],
            password: ['', [Validators.minLength(8)]],
            active: [true],
            roleIds: [[], [Validators.required, Validators.minLength(1)]],
            profilePicture: ['']
        });

        this.userForm.get('profilePicture')?.valueChanges.subscribe(() => {
            this.imageError.set(false);
        });
    }

    loadLookupData() {
        this.roleService.getAll().subscribe({
            next: (roles) => {
                this.roles.set(roles.filter(r => r.active));
            },
            error: (error) => console.error('Error loading roles:', error)
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

    loadUser(id: number) {
        this.isLoading.set(true);
        this.userService.getById(id).subscribe({
            next: (user) => {
                this.userForm.patchValue({
                    username: user.username,
                    email: user.email,
                    fullName: user.fullName,
                    active: user.active,
                    roleIds: user.roles?.map(r => r.id) || [],
                    profilePicture: user.profilePicture || ''
                });
                this.selectedRoles.set(user.roles?.map(r => r.id) || []);
                this.isLoading.set(false);
            },
            error: (error) => {
                console.error('Error loading user:', error);
                this.showAlert('Error', 'Error al cargar el usuario', 'danger');
                this.cancel();
            }
        });
    }

    toggleRole(roleId: number) {
        // Solo permitir un rol a la vez
        const updated = [roleId];

        this.selectedRoles.set(updated);
        this.userForm.get('roleIds')?.setValue(updated);
        this.userForm.get('roleIds')?.markAsTouched();
    }

    isRoleSelected(roleId: number): boolean {
        return this.selectedRoles().includes(roleId);
    }

    togglePassword() {
        this.showPassword.update(v => !v);
    }

    searchDocument() {
        const document = this.userForm.get('document')?.value;
        if (!document) {
            this.showAlert('Atención', 'Ingrese un número de documento', 'warning');
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
                this.showAlert('Éxito', 'Datos encontrados', 'success');
            },
            error: (error) => {
                this.isSearching.set(false);
                this.showAlert('Error', 'No se encontraron datos', 'danger');
            }
        });
    }

    onFileSelected(event: any) {
        const file: File = event.target.files[0];
        if (file) {
            this.isSaving.set(true);
            this.uploadService.upload(file, 'usuarios').subscribe({
                next: (res) => {
                    this.userForm.patchValue({ profilePicture: res.url });
                    this.imageError.set(false);
                    this.isSaving.set(false);
                },
                error: (err) => {
                    this.showAlert('Error', 'No se pudo subir la imagen', 'danger');
                    this.isSaving.set(false);
                }
            });
        }
    }

    onSubmit() {
        if (this.userForm.invalid) {
            this.userForm.markAllAsTouched();
            if (this.userForm.get('roleIds')?.invalid) {
                this.showAlert('Atención', 'Debe seleccionar al menos un rol', 'warning');
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
            active: formValue.active,
            profilePicture: formValue.profilePicture
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
                // Update session logic if needed...
                const currentUser = this.authService.currentUser();
                if (currentUser && currentUser.id === this.userId) {
                    this.authService.updateCurrentUser({ ...currentUser, ...request, id: currentUser.id });
                }
                this.showAlert('Éxito', `Usuario ${this.isEditMode() ? 'actualizado' : 'creado'} correctamente`, 'success');
                setTimeout(() => this.saved.emit(), 1000); // Pequeño delay para ver la alerta
            },
            error: (error) => {
                console.error('Error saving user:', error);
                this.isSaving.set(false);
                this.showAlert('Error', 'Error al guardar el usuario', 'danger');
            }
        });
    }

    cancel() {
        this.cancelled.emit();
    }

    get f() {
        return this.userForm.controls;
    }

    // Alert Helpers
    showAlert(title: string, message: string, type: string) {
        this.alertTitle = title;
        this.alertMessage = message;
        this.alertType = type;
        setTimeout(() => this.closeAlert(), 4000);
    }

    closeAlert() {
        this.alertMessage = '';
    }
}