import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CashSessionService } from '../../../core/services/cash-session.service';
import { CashRegisterResponse } from '../../../core/models/cash.model';

@Component({
    selector: 'app-session-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule],
    templateUrl: './session-form.component.html',
    styleUrl: './session-form.component.scss'
})
export class SessionFormComponent implements OnInit {
    private fb = inject(FormBuilder);
    private cashService = inject(CashSessionService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);

    sessionForm: FormGroup;
    isLoading = signal<boolean>(false);
    mode = signal<'OPEN' | 'CLOSE'>('OPEN');
    registers = signal<CashRegisterResponse[]>([]);
    errorMessage = signal<string>('');

    constructor() {
        this.sessionForm = this.fb.group({
            cashRegisterId: [null],
            openingBalance: [0, [Validators.required, Validators.min(0)]],
            closingBalance: [0, [Validators.min(0)]],
            notes: ['']
        });
    }

    ngOnInit(): void {
        const segments = this.route.snapshot.url.map(s => s.path);
        if (segments.includes('close')) {
            this.mode.set('CLOSE');
            const id = this.route.snapshot.params['id'];
            this.sessionForm.get('closingBalance')?.setValidators([Validators.required, Validators.min(0)]);
        } else {
            this.mode.set('OPEN');
            this.sessionForm.get('cashRegisterId')?.setValidators([Validators.required]);
            this.loadRegisters();
        }
    }

    loadRegisters(): void {
        this.cashService.getRegisters().subscribe({
            next: (data) => {
                this.registers.set(data.filter(r => r.active));
            }
        });
    }

    onSubmit(): void {
        if (this.sessionForm.invalid) {
            this.sessionForm.markAllAsTouched();
            return;
        }

        this.isLoading.set(true);
        const formValue = this.sessionForm.value;

        if (this.mode() === 'OPEN') {
            this.cashService.openSession({
                cashRegisterId: formValue.cashRegisterId,
                openingBalance: formValue.openingBalance,
                notes: formValue.notes
            }).subscribe({
                next: () => this.router.navigate(['/cash']),
                error: (err) => {
                    this.errorMessage.set('Error al abrir la caja. Es posible que ya tenga una caja abierta.');
                    this.isLoading.set(false);
                }
            });
        } else {
            const id = this.route.snapshot.params['id'];
            this.cashService.closeSession(id, formValue.closingBalance).subscribe({
                next: () => this.router.navigate(['/cash']),
                error: (err) => {
                    this.errorMessage.set('Error al cerrar la caja.');
                    this.isLoading.set(false);
                }
            });
        }
    }
}
