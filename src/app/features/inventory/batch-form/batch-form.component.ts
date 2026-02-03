import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { InventoryService } from '../../../core/services/inventory.service';
import { ProductService } from '../../../core/services/product.service';
import { ProductLotRequest } from '../../../core/models/inventory.model';
import { ProductResponse } from '../../../core/models/product.model';

@Component({
    selector: 'app-batch-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule],
    templateUrl: './batch-form.component.html',
    styleUrl: './batch-form.component.scss'
})
export class BatchFormComponent implements OnInit {
    private fb = inject(FormBuilder);
    private inventoryService = inject(InventoryService);
    private productService = inject(ProductService);
    private router = inject(Router);

    batchForm: FormGroup;
    products = signal<ProductResponse[]>([]);
    isLoadingProducts = signal(false);
    isSaving = signal(false);

    constructor() {
        this.batchForm = this.fb.group({
            productId: [null, Validators.required],
            lotCode: ['', [Validators.required, Validators.maxLength(50)]],
            expiryDate: ['', Validators.required]
        });
    }

    ngOnInit() {
        this.loadProducts();
    }

    loadProducts() {
        this.isLoadingProducts.set(true);
        this.productService.getAll().subscribe({
            next: (data) => {
                this.products.set(data);
                this.isLoadingProducts.set(false);
            },
            error: (err) => {
                console.error('Error loading products:', err);
                this.isLoadingProducts.set(false);
            }
        });
    }

    onSubmit() {
        if (this.batchForm.invalid) return;

        this.isSaving.set(true);
        const request: ProductLotRequest = this.batchForm.value;

        this.inventoryService.createLot(request).subscribe({
            next: () => {
                this.isSaving.set(false);
                this.router.navigate(['/inventory/batches']);
            },
            error: (err) => {
                console.error('Error creating lot:', err);
                this.isSaving.set(false);
            }
        });
    }
}
