import { CommonModule, NgIf, NgFor, DecimalPipe } from '@angular/common';
import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';

export interface Product {
  id: string | number;
  productId?: number;
  imageUrl?: string;
  tradeName: string;
  genericName?: string;
  category: string;
  salesPrice: number;
  stock: number;
  expirationDate?: string | Date;
  // Additional fields for compatibility with ProductForSaleResponse
  description?: string;
  presentation?: string;
  concentration?: string;
  laboratory?: string;
  lotCode?: string;
  lotId?: number;
  locationShelf?: string;
  availableUnits?: string[];
}

@Component({
  selector: 'app-card-grid',
  standalone: true,
  imports: [CommonModule, NgIf, NgFor, DecimalPipe],
  templateUrl: './card-grid.component.html',
  styleUrl: './card-grid.component.scss',
})
export class CardGridComponent implements OnChanges {
  // Entradas desde el componente padre
  @Input() products: Product[] = [];
  @Input() isLoading: boolean = false;

  // Salida hacia el componente padre
  @Output() productClick = new EventEmitter<Product>();
  @Output() imagesLoadingStatus = new EventEmitter<boolean>();

  private imagesToLoad = 0;
  private imagesLoadedCount = 0;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['products'] || changes['isLoading']) {
      // Si estamos en skeleton loading, no reportamos carga de imágenes aún
      if (this.isLoading) {
        this.imagesLoadingStatus.emit(false);
        return;
      }

      this.imagesToLoad = this.products.filter(p => p.imageUrl).length;
      this.imagesLoadedCount = 0;

      if (this.imagesToLoad > 0) {
        this.imagesLoadingStatus.emit(true);
        // Safety timeout: dismiss spinner after 5 seconds regardless of image status
        setTimeout(() => {
          if (this.imagesLoadedCount < this.imagesToLoad) {
            this.imagesLoadingStatus.emit(false);
          }
        }, 5000);
      } else {
        this.imagesLoadingStatus.emit(false);
      }
    }
  }

  onImageLoadOrError(event?: any): void {
    if (event && event.type === 'error') {
      event.target.style.display = 'none';
    }
    this.imagesLoadedCount++;
    if (this.imagesLoadedCount >= this.imagesToLoad) {
      this.imagesLoadingStatus.emit(false);
    }
  }

  // Emitimos el evento cuando el usuario hace clic en una tarjeta
  onProductClick(product: Product): void {
    this.productClick.emit(product);
  }

  // Lógica para calcular los días de vencimiento
  getDaysToExpire(expirationDate: string | Date): number {
    const today = new Date();
    const expDate = new Date(expirationDate);
    const diffTime = expDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Determina la clase CSS según los días restantes
  getExpirationClass(expirationDate: string | Date): string {
    const days = this.getDaysToExpire(expirationDate);
    if (days <= 30) return 'expiration-critical';
    if (days <= 90) return 'expiration-warning';
    return 'expiration-ok';
  }

  // Determina la clase CSS según el stock
  getStockClass(stock: number): string {
    if (stock <= 5) return 'stock-critical';
    if (stock <= 20) return 'stock-low';
    return 'stock-ok';
  }
}
