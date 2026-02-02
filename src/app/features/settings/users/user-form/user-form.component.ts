import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { UserService } from '../../../../core/services/user.service';
import { RoleService } from '../../../../core/services/role.service';
import { UserRequest, UserResponse } from '../../../../core/models/user.model';
import { RoleResponse } from '../../../../core/models/maintenance.model';

@Component({
    selector: 'app-user-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule],
    templateUrl: './user-form.component.html',
    styleUrl: './user-form.component.scss'
})
export class UserFormComponent implements OnInit {
    private fb = inject(FormBuilder);
    private userService = inject(UserService);
    private roleService = inject(RoleService);

    private router = inject(Router);
    private route = inject(ActivatedRoute);

    userForm!: FormGroup;
    isEditMode = signal(false);
    userId = signal<number | null>(null);
    isLoading = signal(false);
    isSaving = signal(false);

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
            password: ['', [Validators.minLength(8)]],
            active: [true]
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

    checkEditMode() {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.isEditMode.set(true);
            this.userId.set(+id);
            this.loadUser(+id);
            // Password is optional in edit mode
            this.userForm.get('password')?.clearValidators();
            this.userForm.get('password')?.updateValueAndValidity();
        } else {
            // Password is required in create mode
            this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(8)]);
            this.userForm.get('password')?.updateValueAndValidity();
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
                    active: user.active
                });
                this.selectedRoles.set(user.roles?.map(r => r.id) || []);

                this.isLoading.set(false);
            },
            error: (error) => {
                console.error('Error loading user:', error);
                alert('Error al cargar el usuario');
                this.router.navigate(['/settings/users']);
            }
        });
    }

    toggleRole(roleId: number) {
        const current = this.selectedRoles();
        if (current.includes(roleId)) {
            this.selectedRoles.set(current.filter(id => id !== roleId));
        } else {
            this.selectedRoles.set([...current, roleId]);
        }
    }

    isRoleSelected(roleId: number): boolean {
        return this.selectedRoles().includes(roleId);
    }

    onSubmit() {
        if (this.userForm.invalid) {
            this.userForm.markAllAsTouched();
            return;
        }

        if (this.selectedRoles().length === 0) {
            alert('Debe seleccionar al menos un rol');
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

        // Only include password if provided
        if (formValue.password) {
            request.password = formValue.password;
        }

        const operation = this.isEditMode()
            ? this.userService.update(this.userId()!, request)
            : this.userService.create(request);

        operation.subscribe({
            next: () => {
                this.isSaving.set(false);
                alert(`Usuario ${this.isEditMode() ? 'actualizado' : 'creado'} exitosamente`);
                this.router.navigate(['/settings/users']);
            },
            error: (error) => {
                console.error('Error saving user:', error);
                this.isSaving.set(false);
                alert('Error al guardar el usuario');
            }
        });
    }

    cancel() {
        this.router.navigate(['/settings/users']);
    }

    get f() {
        return this.userForm.controls;
    }
}
