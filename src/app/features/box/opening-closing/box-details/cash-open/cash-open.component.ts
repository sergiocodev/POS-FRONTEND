import { Component, OnInit, inject, signal, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CashSessionService } from '../../../../../core/services/cash-session.service';
import { CashRegisterResponse } from '../../../../../core/models/cash.model';

@Component({
  selector: 'app-cash-open',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './cash-open.component.html',
  styleUrl: './cash-open.component.scss',
})
export class CashOpenComponent implements OnInit {
  @Output() cancel = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private cashService = inject(CashSessionService);

  sessionForm: FormGroup = this.fb.group({
    cashRegisterId: [null, [Validators.required]],
    openingBalance: [0, [Validators.required, Validators.min(0)]],
    notes: ['']
  });

  isLoading = signal<boolean>(false);
  registers = signal<CashRegisterResponse[]>([]);
  errorMessage = signal<string>('');

  ngOnInit(): void {
    this.loadRegisters();
  }

  loadRegisters(): void {
    this.cashService.getRegisters().subscribe({
      next: (response) => {
        this.registers.set(response.data);
      }
    });
  }

  onCancel(): void {
    this.cancel.emit();
  }

  onSubmit(): void {
    if (this.sessionForm.invalid) {
      this.sessionForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    const formValue = this.sessionForm.value;

    this.cashService.openSession({
      cashRegisterId: formValue.cashRegisterId,
      openingBalance: formValue.openingBalance,
      notes: formValue.notes
    }).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.saved.emit();
      },
      error: (err) => {
        this.errorMessage.set('Error al abrir la caja. Es posible que ya tenga una caja abierta.');
        this.isLoading.set(false);
      }
    });
  }
}
