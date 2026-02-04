import { Component, OnInit, inject, signal, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RoleService } from '../../../../core/services/role.service';
import { RoleRequest } from '../../../../core/models/maintenance.model';

@Component({
    selector: 'app-role-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        RouterModule
        // Eliminados: InputTextModule, TextareaModule, etc.
    ],
    templateUrl: './role-form.component.html',
    styleUrl: './role-form.component.scss'
})
export class RoleFormComponent implements OnInit {
    private fb = inject(FormBuilder);
    private roleService = inject(RoleService);
    private router = inject(Router);

    @Input() set roleId(value: number | null) {
        this._roleId.set(value);
        this.checkEditModeFromInput();
    }
    get roleId(): number | null {
        return this._roleId();
    }
    private _roleId = signal<number | null>(null);

    @Output() saved = new EventEmitter<void>();
    @Output() cancelled = new EventEmitter<void>();

    roleForm!: FormGroup;
    isEditMode = signal(false);
    isLoading = signal(false);
    isSaving = signal(false);

    ngOnInit() {
        this.initForm();
    }

    initForm() {
        this.roleForm = this.fb.group({
            name: ['', [Validators.required, Validators.minLength(3)]],
            description: [''],
            active: [true]
        });
    }

    checkEditModeFromInput() {
        const id = this.roleId;
        if (id) {
            this.isEditMode.set(true);
            this.loadRole(id);
        } else {
            this.isEditMode.set(false);
            if (this.roleForm) {
                this.roleForm.reset({ active: true });
            }
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
                // Aquí podrías emitir un evento de error o usar un servicio de alertas nativo
                alert('Error al cargar el rol');
                this.cancelled.emit();
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
            ? this.roleService.update(this.roleId!, request)
            : this.roleService.create(request);

        operation.subscribe({
            next: () => {
                this.isSaving.set(false);
                this.saved.emit();
            },
            error: (error) => {
                console.error('Error saving role:', error);
                this.isSaving.set(false);
                alert('Error al guardar el rol');
            }
        });
    }

    cancel() {
        this.cancelled.emit();
    }

    get f() {
        return this.roleForm.controls;
    }
}