import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, switchMap, of } from 'rxjs';
import { PurchaseService } from '../../../core/services/purchase.service';
import { ProductService } from '../../../core/services/product.service';
import { SupplierService } from '../../../core/services/supplier.service';
import { SaleService } from '../../../core/services/sale.service';
import { AuthService } from '../../../core/services/auth.service';
import { ProductUnitService } from '../../../core/services/product-unit.service';
import { PurchaseRequest, PurchaseResponse } from '../../../core/models/purchase.model';
import { ProductResponse, ProductUnitResponse } from '../../../core/models/product.model';
import { SupplierResponse } from '../../../core/models/supplier.model';
import { EstablishmentResponse } from '../../../core/models/sale.model';
import { PurchaseFormComponent } from './purchase-form/purchase-form.component';

@Component({
  selector: 'app-new-purchase',
  standalone: true,
  imports: [CommonModule, PurchaseFormComponent],
  templateUrl: './new-purchase.component.html',
  styleUrls: ['./new-purchase.component.scss']
})
export class NewPurchaseComponent implements OnInit {
  private purchaseService = inject(PurchaseService);
  private productService = inject(ProductService);
  private supplierService = inject(SupplierService);
  private saleService = inject(SaleService);
  private authService = inject(AuthService);
  private productUnitService = inject(ProductUnitService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  isLoading = signal<boolean>(false);
  isEditMode = signal<boolean>(false);
  errorMessage = signal<string>('');
  
  products = signal<ProductResponse[]>([]);
  suppliers = signal<SupplierResponse[]>([]);
  establishments = signal<EstablishmentResponse[]>([]);
  productUnits = signal<{ [productId: number]: ProductUnitResponse[] }>({});
  
  purchase = signal<PurchaseResponse | undefined>(undefined);

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    this.loadInitialData(id ? +id : null);
  }

  loadInitialData(purchaseId: number | null = null): void {
    this.isLoading.set(true);
    forkJoin({
      products: this.productService.getAll(),
      suppliers: this.supplierService.getAll(),
      establishments: this.saleService.getEstablishments()
    }).pipe(
      switchMap(data => {
        this.products.set(data.products.data);
        this.suppliers.set(data.suppliers.data);
        this.establishments.set(data.establishments.data);

        if (purchaseId) {
          return this.purchaseService.getById(purchaseId);
        }
        return of(null);
      })
    ).subscribe({
      next: (purchaseResponse) => {
        if (purchaseResponse) {
          this.isEditMode.set(true);
          this.purchase.set(purchaseResponse.data);
          this.loadAllUnitsForPurchase(purchaseResponse.data);
        } else {
          this.isLoading.set(false);
        }
      },
      error: () => {
        this.errorMessage.set('Error al cargar datos. Intente nuevamente.');
        this.isLoading.set(false);
      }
    });
  }

  private loadAllUnitsForPurchase(purchase: PurchaseResponse): void {
    const uniqueProductIds = [...new Set(
      purchase.items
        .map(item => this.products().find(p => p.tradeName === item.productName)?.id)
        .filter((id): id is number => id !== undefined)
    )];

    if (uniqueProductIds.length === 0) {
      this.isLoading.set(false);
      return;
    }

    const unitLoaders = forkJoin(Object.fromEntries(
      uniqueProductIds.map(pid => [pid, this.productUnitService.getByProductId(pid)])
    ));

    unitLoaders.subscribe({
      next: (unitsMap) => {
        this.productUnits.update(curr => ({ ...curr, ...unitsMap }));
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Error al cargar unidades de productos.');
        this.isLoading.set(false);
      }
    });
  }

  onLoadProductUnits(productId: number): void {
    if (this.productUnits()[productId]) return;
    
    this.productUnitService.getByProductId(productId).subscribe({
      next: (units) => {
        this.productUnits.update(curr => ({...curr, [productId]: units}));
      }
    });
  }

  onSavePurchase(request: PurchaseRequest): void {
    this.errorMessage.set('');
    this.isLoading.set(true);

    const userId = this.authService.currentUser()?.id || 1;

    this.purchaseService.create(request, userId).subscribe({
      next: () => {
        this.router.navigate(['/purchases']);
      },
      error: () => {
        this.errorMessage.set('Error al registrar la compra. Verifique los datos.');
        this.isLoading.set(false);
      }
    });
  }
}
