import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CashSessionService } from '../../../core/services/cash-session.service';
import { EstablishmentService } from '../../../core/services/establishment.service';
import { EstablishmentResponse } from '../../../core/models/maintenance.model';
import { CashRegisterRequest } from '../../../core/models/cash.model';

@Component({
    selector: 'app-register-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule],
    templateUrl: './register-form.component.html',
    styleUrl: './register-form.component.scss'
})
export class RegisterFormComponent implements OnInit {
    private fb = inject(FormBuilder);
    private cashService = inject(CashSessionService);
    private establishmentService = inject(EstablishmentService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);

    registerForm: FormGroup;
    establishments = signal<EstablishmentResponse[]>([]);
    isLoading = signal<boolean>(false);
    isSaving = signal<boolean>(false);
    isEdit = signal<boolean>(false);
    registerId = signal<number | null>(null);

    constructor() {
        this.registerForm = this.fb.group({
            name: ['', [Validators.required, Validators.maxLength(100)]],
            establishmentId: [null, Validators.required],
            active: [true]
        });
    }

    ngOnInit(): void {
        this.loadEstablishments();

        const id = this.route.snapshot.params['id'];
        if (id) {
            this.isEdit.set(true);
            this.registerId.set(+id);
            this.loadRegister(+id);
        }
    }

    loadEstablishments(): void {
        this.establishmentService.getAll().subscribe({
            next: (response) => this.establishments.set(response.data)
        });
    }

    loadRegister(id: number): void {
        this.isLoading.set(true);
        this.cashService.getRegisterById(id).subscribe({
            next: (response) => {
                this.registerForm.patchValue(response.data);
                this.isLoading.set(false);
            },
            error: () => this.isLoading.set(false)
        });
    }

    onSubmit(): void {
        if (this.registerForm.invalid) {
            this.registerForm.markAllAsTouched();
            return;
        }

        this.isSaving.set(true);
        const request: CashRegisterRequest = this.registerForm.value;

        const request$ = this.isEdit()
            ? this.cashService.updateRegister(this.registerId()!, request)
            : this.cashService.createRegister(request);

        request$.subscribe({
            next: () => {
                this.isSaving.set(false);
                this.router.navigate(['/cash/registers']);
            },
            error: (err) => {
                console.error('Error saving register:', err);
                this.isSaving.set(false);
            }
        });
    }
}
