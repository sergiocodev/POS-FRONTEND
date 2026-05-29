import { Component, Input, Output, EventEmitter, OnInit, OnChanges, inject, signal, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CashSessionService } from '../../../../core/services/cash-session.service';
import { AuthService } from '../../../../core/services/auth.service';
import { CashConceptResponse } from '../../../../core/models/cash.model';

@Component({
    selector: 'app-movement-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, FormsModule],
    templateUrl: './movement-form.component.html',
    styleUrl: './movement-form.component.scss'
})
export class MovementFormComponent implements OnInit, OnChanges {
    @Input() movementType: 'inflow' | 'outflow' = 'inflow';
    @Output() onSave = new EventEmitter<void>();
    @Output() onCancel = new EventEmitter<void>();

    private fb = inject(FormBuilder);
    private cashService = inject(CashSessionService);
    private authService = inject(AuthService);

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
        this.type.set(this.movementType);
        this.loadConcepts();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['movementType']) {
            this.type.set(this.movementType);
            this.movementForm.reset({ amount: 0, description: '', conceptId: null, reference: '' });
            this.errorMessage.set('');
            this.loadConcepts();
        }
    }

    loadConcepts(): void {
        const type = this.type() === 'inflow' ? 'IN' : 'OUT';
        this.cashService.getConceptsByType(type, false).subscribe({
            next: (response: any) => {
                this.concepts.set(response.data);
            },
            error: (err: any) => {
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

        const userId = (this.authService as any).currentUser()?.id;
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
            ? (this.cashService as any).registerInflow(request)
            : (this.cashService as any).registerOutflow(request);

        action$.subscribe({
            next: () => {
                this.isLoading.set(false);
                this.onSave.emit();
            },
            error: (err: any) => {
                this.errorMessage.set('Error al registrar el movimiento. Verifique que tenga una caja abierta.');
                this.isLoading.set(false);
            }
        });
    }

    addConcept(): void {
        const typeStr = this.type() === 'inflow' ? 'IN' : 'OUT';
        const typeLabel = this.type() === 'inflow' ? 'ingreso' : 'egreso';
        const name = window.prompt(`Ingrese el nombre para el nuevo concepto de ${typeLabel}:`);

        if (name && name.trim()) {
            this.isLoading.set(true);
            (this.cashService as any).createConcept(name.trim(), typeStr).subscribe({
                next: (response: any) => {
                    this.isLoading.set(false);
                    if (response.data) {
                        this.concepts.update(c => [...c, response.data]);
                        this.movementForm.patchValue({ conceptId: response.data.id });
                    }
                },
                error: (err: any) => {
                    this.isLoading.set(false);
                    this.errorMessage.set('Error al crear el concepto.');
                }
            });
        }
    }
}
