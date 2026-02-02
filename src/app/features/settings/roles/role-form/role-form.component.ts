import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RoleService } from '../../../../core/services/role.service';
import { RoleRequest } from '../../../../core/models/maintenance.model';

@Component({
    selector: 'app-role-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule],
    templateUrl: './role-form.component.html',
    styleUrl: './role-form.component.scss'
})
export class RoleFormComponent implements OnInit {
    private fb = inject(FormBuilder);
    private roleService = inject(RoleService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);

    roleForm!: FormGroup;
    isEditMode = signal(false);
    roleId = signal<number | null>(null);
    isLoading = signal(false);
    isSaving = signal(false);

    ngOnInit() {
        this.initForm();
        this.checkEditMode();
    }

    initForm() {
        this.roleForm = this.fb.group({
            name: ['', [Validators.required, Validators.minLength(3)]],
            description: [''],
            active: [true]
        });
    }

    checkEditMode() {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.isEditMode.set(true);
            this.roleId.set(+id);
            this.loadRole(+id);
        }
    }

    loadRole(id: number) {
        this.isLoading.set(true);
        this.roleService.getById(id).subscribe({
            next: (role) => {
                this.roleForm.patchValue({
                    name: role.name,
                    description: role.description,
                    active: role.active
                });
                this.isLoading.set(false);
            },
            error: (error) => {
                console.error('Error loading role:', error);
                alert('Error al cargar el rol');
                this.router.navigate(['/settings/roles']);
            }
        });
    }

    onSubmit() {
        if (this.roleForm.invalid) {
            this.roleForm.markAllAsTouched();
            return;
        }

        this.isSaving.set(true);

        const formValue = this.roleForm.value;
        const request: RoleRequest = {
            name: formValue.name,
            description: formValue.description,
            active: formValue.active
        };

        const operation = this.isEditMode()
            ? this.roleService.update(this.roleId()!, request)
            : this.roleService.create(request);

        operation.subscribe({
            next: () => {
                this.isSaving.set(false);
                alert(`Rol ${this.isEditMode() ? 'actualizado' : 'creado'} exitosamente`);
                this.router.navigate(['/settings/roles']);
            },
            error: (error) => {
                console.error('Error saving role:', error);
                this.isSaving.set(false);
                alert('Error al guardar el rol');
            }
        });
    }

    cancel() {
        this.router.navigate(['/settings/roles']);
    }

    get f() {
        return this.roleForm.controls;
    }
}
