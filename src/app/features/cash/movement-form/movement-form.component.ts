import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CashSessionService } from '../../../core/services/cash-session.service';
import { AuthService } from '../../../core/services/auth.service';
import { CashConceptResponse } from '../../../core/models/cash.model';

@Component({
    selector: 'app-movement-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule],
    templateUrl: './movement-form.component.html',
    styleUrl: './movement-form.component.scss'
})
export class MovementFormComponent implements OnInit {
    private fb = inject(FormBuilder);
    private cashService = inject(CashSessionService);
    private authService = inject(AuthService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);

    movementForm: FormGroup = this.fb.group({
        amount: [0, [Validators.required, Validators.min(0.01)]],
        description: ['', [Validators.required]],
        conceptId: [null, [Validators.required]],
        reference: ['']
    });

    isLoading = signal<boolean>(false);
    type = signal<'inflow' | 'outflow'>('inflow');
    concepts = signal<CashConceptResponse[]>([]);
    errorMessage = signal<string>('');

    ngOnInit(): void {
        const typeParam = this.route.snapshot.params['type'];
        this.type.set(typeParam === 'outflow' ? 'outflow' : 'inflow');
        this.loadConcepts();
    }

    loadConcepts(): void {
        const type = this.type() === 'inflow' ? 'IN' : 'OUT';
        this.cashService.getConceptsByType(type).subscribe({
            next: (response) => {
                this.concepts.set(response.data);
            },
            error: (err) => {
                console.error('Error loading concepts:', err);
                this.errorMessage.set('Error al cargar los conceptos de caja.');
            }
        });
    }

    onSubmit(): void {
        if (this.movementForm.invalid) {
            this.movementForm.markAllAsTouched();
            return;
        }

        const userId = this.authService.currentUser()?.id;
        if (!userId) {
            this.errorMessage.set('Usuario no identificado.');
            return;
        }

        this.isLoading.set(true);
        const formValue = this.movementForm.value;
        const request = {
            userId,
            amount: formValue.amount,
            description: formValue.description,
            conceptId: formValue.conceptId,
            reference: formValue.reference
        };

        const action$ = this.type() === 'inflow' 
            ? this.cashService.registerInflow(request)
            : this.cashService.registerOutflow(request);

        action$.subscribe({
            next: () => {
                this.router.navigate(['/cash']);
            },
            error: (err) => {
                this.errorMessage.set('Error al registrar el movimiento. Verifique que tenga una caja abierta.');
                this.isLoading.set(false);
            }
        });
    }
}
