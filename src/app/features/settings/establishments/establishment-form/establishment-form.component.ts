import { Component, OnInit, inject, signal, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { EstablishmentService } from '../../../../core/services/establishment.service';
import { EstablishmentRequest } from '../../../../core/models/maintenance.model';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';

@Component({
    selector: 'app-establishment-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        RouterModule,
        InputTextModule,
        ButtonModule,
        MessageModule
    ],
    templateUrl: './establishment-form.component.html',
    styleUrl: './establishment-form.component.scss'
})
export class EstablishmentFormComponent implements OnInit {
    private fb = inject(FormBuilder);
    private establishmentService = inject(EstablishmentService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);

    @Input() set establishmentId(value: number | null) {
        this._establishmentId.set(value);
        this.checkEditModeFromInput();
    }
    get establishmentId(): number | null {
        return this._establishmentId();
    }
    private _establishmentId = signal<number | null>(null);

    @Output() saved = new EventEmitter<void>();
    @Output() cancelled = new EventEmitter<void>();

    establishmentForm!: FormGroup;
    isEditMode = signal(false);
    isLoading = signal(false);
    isSaving = signal(false);

    ngOnInit() {
        this.initForm();
    }

    initForm() {
        this.establishmentForm = this.fb.group({
            name: ['', [Validators.required, Validators.minLength(3)]],
            address: [''],
            codeSunat: ['0000', [Validators.maxLength(10)]]
        });
    }

    checkEditModeFromInput() {
        const id = this.establishmentId;
        if (id) {
            this.isEditMode.set(true);
            this.loadEstablishment(id);
        } else {
            this.isEditMode.set(false);
            if (this.establishmentForm) {
                this.establishmentForm.reset({ codeSunat: '0000' });
            }
        }
    }

    loadEstablishment(id: number) {
        this.isLoading.set(true);
        this.establishmentService.getById(id).subscribe({
            next: (establishment) => {
                this.establishmentForm.patchValue({
                    name: establishment.name,
                    address: establishment.address,
                    codeSunat: establishment.codeSunat
                });
                this.isLoading.set(false);
            },
            error: (error) => {
                console.error('Error loading establishment:', error);
                this.isLoading.set(false);
            }
        });
    }

    onSubmit() {
        if (this.establishmentForm.invalid) {
            this.establishmentForm.markAllAsTouched();
            return;
        }

        this.isSaving.set(true);

        const formValue = this.establishmentForm.value;
        const request: EstablishmentRequest = {
            name: formValue.name,
            address: formValue.address || undefined,
            codeSunat: formValue.codeSunat || '0000',
            active: true
        };

        const operation = this.isEditMode()
            ? this.establishmentService.update(this.establishmentId!, request)
            : this.establishmentService.create(request);

        operation.subscribe({
            next: () => {
                this.isSaving.set(false);
                this.saved.emit();
            },
            error: (error) => {
                console.error('Error saving establishment:', error);
                this.isSaving.set(false);
            }
        });
    }

    cancel() {
        this.cancelled.emit();
    }

    get f() {
        return this.establishmentForm.controls;
    }
}
