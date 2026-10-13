import { Component, inject, signal, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductResponse, ProductUnitResponse } from '../../../../core/models/product.model';
import { CardGridComponent, Product } from '../../../../shared/components/card-grid/card-grid.component';
import { ProductUnitService } from '../../../../core/services/product-unit.service';
import { PurchaseCartItem } from '../purchase-cart.model';

@Component({
    selector: 'app-purchase-product-catalog-panel',
    standalone: true,
    imports: [
        CommonModule, FormsModule,
        CardGridComponent
    ],
    templateUrl: './purchase-product-catalog-panel.component.html',
    styleUrl: './purchase-product-catalog-panel.component.scss'
})
export class PurchaseProductCatalogPanelComponent implements OnChanges {
    private productUnitService = inject(ProductUnitService);

    @Input() products: ProductResponse[] = [];
    @Input() displayProducts: ProductResponse[] = [];
    @Input() filteredProducts: ProductResponse[] = [];
    @Input() cart: PurchaseCartItem[] = [];
    @Input() isLoading = false;

    @Output() productSearch = new EventEmitter<string>();
    @Output() updateCart = new EventEmitter<PurchaseCartItem[]>();
    @Output() imagesLoadingStatus = new EventEmitter<boolean>();

    productSearchTerm = '';
    
    // Map to CardGrid format
    mappedProducts: Product[] = [];

    // Unit Selector Modal Local State
    showUnitModal = signal<boolean>(false);
    unitModalProduct = signal<ProductResponse | null>(null);
    availableUnits = signal<ProductUnitResponse[]>([]);
    isUnitsLoading = signal<boolean>(false);

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['filteredProducts'] || changes['displayProducts']) {
            const listToMap = this.filteredProducts || this.displayProducts || [];
            this.mappedProducts = listToMap.map(p => ({
                id: p.id,
                productId: p.id,
                imageUrl: p.imageUrl,
                tradeName: p.tradeName,
                genericName: p.genericName,
                category: p.categoryName || '',
                salesPrice: p.units && p.units.length > 0 
                    ? (p.units.find(u => u.isBaseUnit)?.price || p.units[0].price) 
                    : 0,
                stock: 0, // In purchases we add stock, we don't strictly care about current stock to allow purchase
                description: p.description,
                presentation: p.presentationDescription,
                laboratory: p.laboratoryName,
                sanitaryRegistration: p.sanitaryRegistration,
                pharmaceuticalFormName: p.pharmaceuticalFormName,
                concentration: p.ingredients && p.ingredients.length > 0 
                    ? p.ingredients.map(i => i.concentration).filter(c => !!c).join(' + ') 
                    : undefined,
                availableUnits: p.units ? p.units.map(u => u.unitName) : []
            }));
        }
    }

    onProductSearch(): void {
        const term = this.productSearchTerm.trim();
        this.productSearch.emit(term);
    }

    openUnitSelector(productMapped: Product): void {
        const product = (this.filteredProducts || this.displayProducts).find(p => p.id === productMapped.id);
        if (!product) return;

        this.unitModalProduct.set(product);
        this.showUnitModal.set(true);
        this.isUnitsLoading.set(true);
        
        this.productUnitService.getByProductId(product.id).subscribe({
            next: (units) => {
                // sort units by factor asc
                units.sort((a, b) => a.factor - b.factor);
                this.availableUnits.set(units);
                this.isUnitsLoading.set(false);
                
                // If only 1 unit, auto-select it
                if (units.length === 1) {
                    this.selectUnit(units[0]);
                }
            },
            error: (err) => {
                console.error('Error fetching units for product', err);
                this.isUnitsLoading.set(false);
                this.availableUnits.set([]);
            }
        });
    }

    closeUnitModal(): void {
        this.showUnitModal.set(false);
    }

    selectUnit(unit: ProductUnitResponse): void {
        const product = this.unitModalProduct();
        if (!product) return;
        
        const existingIndex = this.cart.findIndex(
            i => i.product.id === product.id && i.unit.id === unit.id
        );

        let newCart = [...this.cart];
        if (existingIndex >= 0) {
            newCart[existingIndex] = {
                ...newCart[existingIndex],
                quantity: newCart[existingIndex].quantity + 1,
                totalCost: (newCart[existingIndex].quantity + 1) * newCart[existingIndex].unitCost
            };
        } else {
            // New item
            newCart.push({
                product,
                unit,
                quantity: 1,
                unitCost: unit.price, // Start with the reference price or 0
                totalCost: unit.price,
                lotCode: '',
                expiryDate: ''
            });
        }
        this.updateCart.emit(newCart);
        this.closeUnitModal();
        
        // Optionally clear search
        this.productSearchTerm = '';
        this.productSearch.emit('');
    }
}
