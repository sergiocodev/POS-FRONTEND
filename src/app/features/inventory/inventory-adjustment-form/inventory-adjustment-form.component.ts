import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { InventoryService } from '../../../core/services/inventory.service';
import { InventoryResponse, InventoryRequest } from '../../../core/models/inventory.model';

@Component({
    selector: 'app-inventory-adjustment-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule],
    templateUrl: './inventory-adjustment-form.component.html',
    styleUrl: './inventory-adjustment-form.component.scss'
})
export class InventoryAdjustmentFormComponent implements OnInit {
    private fb = inject(FormBuilder);
    private inventoryService = inject(InventoryService);
    private route = inject(ActivatedRoute);
    private router = inject(Router);

    adjustmentForm: FormGroup;
    inventoryItem = signal<InventoryResponse | null>(null);
    isLoading = signal(false);
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
            salesPrice: [0]
        });
    }

    ngOnInit() {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.loadInventoryItem(+id);
        }
    }

    loadInventoryItem(id: number) {
        this.isLoading.set(true);
        this.inventoryService.getById(id).subscribe({
            next: (item) => {
                this.inventoryItem.set(item);
                this.adjustmentForm.patchValue({
                    quantity: item.quantity,
                    costPrice: item.costPrice,
                    salesPrice: item.salesPrice
                });
                this.isLoading.set(false);
            },
            error: (err) => {
                console.error('Error loading inventory item:', err);
                this.isLoading.set(false);
                this.router.navigate(['/inventory']);
            }
        });
    }

    onSubmit() {
        if (this.adjustmentForm.invalid || !this.inventoryItem()) return;

        this.isSaving.set(true);
        const item = this.inventoryItem()!;
        const formValue = this.adjustmentForm.value;

        const request: InventoryRequest = {
            establishmentId: item.establishmentId,
            lotId: item.lotId,
            quantity: formValue.quantity,
            costPrice: formValue.costPrice,
            salesPrice: formValue.salesPrice,
            movementType: formValue.movementType,
            notes: formValue.notes
        };

        this.inventoryService.adjustStock(request).subscribe({
            next: () => {
                this.isSaving.set(false);
                this.router.navigate(['/inventory']);
            },
            error: (err) => {
                console.error('Error adjusting stock:', err);
                this.isSaving.set(false);
            }
        });
    }
}
