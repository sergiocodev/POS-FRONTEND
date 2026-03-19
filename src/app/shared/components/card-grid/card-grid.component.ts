import { CommonModule, NgIf, NgFor, DecimalPipe } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';

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
}

@Component({
  selector: 'app-card-grid',
  standalone: true,
  imports: [CommonModule, NgIf, NgFor, DecimalPipe],
  templateUrl: './card-grid.component.html',
  styleUrl: './card-grid.component.scss',
})
export class CardGridComponent {
  // Entradas desde el componente padre
  @Input() products: Product[] = [];
  @Input() isLoading: boolean = false;

  // Salida hacia el componente padre
  @Output() productClick = new EventEmitter<Product>();

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
