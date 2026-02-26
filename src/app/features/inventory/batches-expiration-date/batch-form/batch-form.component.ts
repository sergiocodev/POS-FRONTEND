import { Component, OnInit, inject, signal, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { InventoryService } from '../../../../core/services/inventory.service';
import { ProductLotRequest } from '../../../../core/models/inventory.model';
import { ProductResponse } from '../../../../core/models/product.model';

@Component({
    selector: 'app-batch-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './batch-form.component.html',
    styleUrl: './batch-form.component.scss'
})
export class BatchFormComponent implements OnInit {
    private fb = inject(FormBuilder);
    private inventoryService = inject(InventoryService);

    @Input() products: ProductResponse[] = [];
    @Input() isLoadingProducts = false;

    @Output() saved = new EventEmitter<void>();
    @Output() cancelled = new EventEmitter<void>();

    batchForm: FormGroup;
    isSaving = signal(false);

    constructor() {
        this.batchForm = this.fb.group({
            productId: [null, Validators.required],
            lotCode: ['', [Validators.required, Validators.maxLength(50)]],
            expiryDate: ['', Validators.required]
        });
    }

    ngOnInit() { }

    onSubmit() {
        if (this.batchForm.invalid) return;

        this.isSaving.set(true);
        const request: ProductLotRequest = this.batchForm.value;

        this.inventoryService.createLot(request).subscribe({
            next: () => {
                this.isSaving.set(false);
                this.saved.emit();
            },
            error: (err) => {
                console.error('Error creating lot:', err);
                this.isSaving.set(false);
            }
        });
    }

    onCancel() {
        this.cancelled.emit();
    }
}
