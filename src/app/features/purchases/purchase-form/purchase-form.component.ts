import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { PurchaseService } from '../../../core/services/purchase.service';
import { ProductService } from '../../../core/services/product.service';
import { SupplierService } from '../../../core/services/supplier.service';
import { SaleService } from '../../../core/services/sale.service';
import { PurchaseRequest, PurchaseDocumentType, PurchaseStatus } from '../../../core/models/purchase.model';
import { ProductResponse } from '../../../core/models/product.model';
import { SupplierResponse } from '../../../core/models/supplier.model';
import { EstablishmentResponse } from '../../../core/models/sale.model';
import { AuthService } from '../../../core/services/auth.service';
import { forkJoin } from 'rxjs';

@Component({
    selector: 'app-purchase-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule],
    templateUrl: './purchase-form.component.html',
    styleUrl: './purchase-form.component.scss'
})
export class PurchaseFormComponent implements OnInit {
    private fb = inject(FormBuilder);
    private purchaseService = inject(PurchaseService);
    private productService = inject(ProductService);
    private supplierService = inject(SupplierService);
    private saleService = inject(SaleService);
    private authService = inject(AuthService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);

    purchaseForm: FormGroup;
    isLoading = signal<boolean>(false);
    isEditMode = signal<boolean>(false);
    errorMessage = signal<string>('');

    products = signal<ProductResponse[]>([]);
    suppliers = signal<SupplierResponse[]>([]);
    establishments = signal<EstablishmentResponse[]>([]);

    constructor() {
        this.purchaseForm = this.fb.group({
            supplierId: [null, Validators.required],
            establishmentId: [null, Validators.required],
            documentType: [PurchaseDocumentType.FACTURA, Validators.required],
            series: ['', [Validators.required, Validators.maxLength(20)]],
            number: ['', [Validators.required, Validators.maxLength(20)]],
            issueDate: [new Date().toISOString().split('T')[0], Validators.required],
            notes: [''],
            items: this.fb.array([])
        });
    }

    get items(): FormArray {
        return this.purchaseForm.get('items') as FormArray;
    }

    ngOnInit(): void {
        this.loadInitialData();
        const id = this.route.snapshot.params['id'];
        if (id) {
            this.isEditMode.set(true);
            this.loadPurchase(id);
        } else {
            this.addItem(); 
        }
    }

    loadInitialData(): void {
        this.isLoading.set(true);
        forkJoin({
            products: this.productService.getAll(),
            suppliers: this.supplierService.getAll(),
            establishments: this.saleService.getEstablishments()
        }).subscribe({
            next: (data) => {
                this.products.set(data.products.filter(p => p.active));
                this.suppliers.set(data.suppliers.filter(s => s.active));
                this.establishments.set(data.establishments.filter(e => e.active));
                this.isLoading.set(false);
            },
            error: (err) => {
                this.errorMessage.set('Error al cargar datos auxiliares.');
                this.isLoading.set(false);
            }
        });
    }

    loadPurchase(id: number): void {
        this.isLoading.set(true);
        this.purchaseService.getById(id).subscribe({
            next: (purchase) => {
                this.purchaseForm.patchValue({
                    supplierId: this.suppliers().find(s => s.name === purchase.supplierName)?.id,
                    establishmentId: this.establishments().find(e => e.name === purchase.establishmentName)?.id,
                    documentType: purchase.documentType,
                    series: purchase.series,
                    number: purchase.number,
                    issueDate: purchase.issueDate,
                    notes: purchase.notes
                });

                
                this.items.clear();
                purchase.items.forEach(item => {
                    const product = this.products().find(p => p.name === item.productName);
                    this.items.push(this.fb.group({
                        productId: [product?.id, Validators.required],
                        lotCode: [item.lotCode, Validators.required],
                        expiryDate: [item.expiryDate, Validators.required],
                        quantity: [item.quantity, [Validators.required, Validators.min(1)]],
                        bonusQuantity: [item.bonusQuantity],
                        unitCost: [item.unitCost, [Validators.required, Validators.min(0)]]
                    }));
                });

                this.purchaseForm.disable(); 
                this.isLoading.set(false);
            },
            error: (err) => {
                this.errorMessage.set('Error al cargar la compra.');
                this.isLoading.set(false);
            }
        });
    }

    addItem(): void {
        const itemForm = this.fb.group({
            productId: [null, Validators.required],
            lotCode: ['', [Validators.required, Validators.maxLength(100)]],
            expiryDate: ['', Validators.required],
            quantity: [null, [Validators.required, Validators.min(1)]],
            bonusQuantity: [0],
            unitCost: [null, [Validators.required, Validators.min(0)]]
        });
        this.items.push(itemForm);
    }

    removeItem(index: number): void {
        if (this.items.length > 1) {
            this.items.removeAt(index);
        }
    }

    calculateTotal(): number {
        return this.items.controls.reduce((sum, ctrl) => {
            const qty = ctrl.get('quantity')?.value || 0;
            const cost = ctrl.get('unitCost')?.value || 0;
            return sum + (qty * cost);
        }, 0);
    }

    onSubmit(): void {
        if (this.purchaseForm.invalid) {
            this.purchaseForm.markAllAsTouched();
            return;
        }

        this.isLoading.set(true);
        const request: PurchaseRequest = this.purchaseForm.value;
        const userId = this.authService.currentUser()?.id || 1;

        this.purchaseService.create(request, userId).subscribe({
            next: () => {
                this.router.navigate(['/purchases']);
            },
            error: (err) => {
                this.errorMessage.set('Error al registrar la compra. Verifique los datos.');
                this.isLoading.set(false);
            }
        });
    }
}
