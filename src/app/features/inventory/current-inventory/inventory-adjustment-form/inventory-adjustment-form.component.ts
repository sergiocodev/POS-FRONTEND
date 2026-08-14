import { Component, OnInit, inject, signal, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { InventoryService } from '../../../../core/services/inventory.service';
import { InventoryResponse, InventoryRequest } from '../../../../core/models/inventory.model';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
    selector: 'app-inventory-adjustment-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './inventory-adjustment-form.component.html',
    styleUrl: './inventory-adjustment-form.component.scss'
})
export class InventoryAdjustmentFormComponent implements OnInit, OnChanges {
    private fb = inject(FormBuilder);
    private inventoryService = inject(InventoryService);
    public authService = inject(AuthService);

    @Input() inventoryItem: InventoryResponse | null = null;
    @Output() saved = new EventEmitter<void>();
    @Output() cancelled = new EventEmitter<void>();

    adjustmentForm: FormGroup;
    isSaving = signal(false);

    movementTypes = [
        { value: 'ADJUSTMENT', label: 'Ajuste General' },
        { value: 'LOSS', label: 'Pérdida' },
        { value: 'THEFT', label: 'Robo' },
        { value: 'RETURN', label: 'Devolución' },
        { value: 'IN', label: 'Ingreso Manual' },
        { value: 'OUT', label: 'Salida Manual' }
    ];

    constructor() {
        this.adjustmentForm = this.fb.group({
            quantity: [0, [Validators.required, Validators.min(0)]],
            movementType: ['ADJUSTMENT', Validators.required],
            notes: ['', [Validators.maxLength(255)]],
            costPrice: [0],
            salesPrice: [0],
            locationShelf: ['', [Validators.maxLength(255)]]
        });
    }

    ngOnInit() {
        this.initForm();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['inventoryItem'] && !changes['inventoryItem'].firstChange) {
            this.initForm();
        }
    }

    initForm() {
        if (this.inventoryItem) {
            this.adjustmentForm.patchValue({
                quantity: this.inventoryItem.quantity,
                costPrice: this.inventoryItem.costPrice,
                salesPrice: this.inventoryItem.salesPrice,
                locationShelf: this.inventoryItem.locationShelf || '',
                movementType: 'ADJUSTMENT',
                notes: ''
            });

            if (!this.authService.isAdmin()) {
                this.adjustmentForm.get('quantity')?.disable();
                this.adjustmentForm.get('costPrice')?.disable();
                this.adjustmentForm.get('salesPrice')?.disable();
            } else {
                this.adjustmentForm.get('quantity')?.enable();
                this.adjustmentForm.get('costPrice')?.enable();
                this.adjustmentForm.get('salesPrice')?.enable();
            }
        }
    }

    onSubmit() {
        if (this.adjustmentForm.invalid || !this.inventoryItem) return;

        this.isSaving.set(true);
        const item = this.inventoryItem;
        const formValue = this.adjustmentForm.getRawValue();

        const request: InventoryRequest = {
            establishmentId: item.establishmentId,
            lotId: item.lotId,
            quantity: formValue.quantity ?? item.quantity,
            costPrice: formValue.costPrice ?? item.costPrice,
            salesPrice: formValue.salesPrice ?? item.salesPrice,
            locationShelf: formValue.locationShelf,
            movementType: formValue.movementType,
            notes: formValue.notes
        };

        this.inventoryService.adjustStock(request).subscribe({
            next: () => {
                this.isSaving.set(false);
                this.saved.emit();
            },
            error: (err) => {
                console.error('Error adjusting stock:', err);
                this.isSaving.set(false);
            }
        });
    }

    onCancel() {
        this.cancelled.emit();
    }
}
