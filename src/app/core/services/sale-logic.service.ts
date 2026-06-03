import { Injectable } from '@angular/core';
import { ProductForSaleResponse } from '../models/sale.model';

@Injectable({
  providedIn: 'root'
})
export class SaleLogicService {

  /**
   * Deduplicates products for the grid, showing only the unit with the lowest factor
   * when multiple units exist for the same productId and lotId.
   */
  deduplicateProductsForGrid(all: ProductForSaleResponse[]): ProductForSaleResponse[] {
    const seen = new Map<string, ProductForSaleResponse>();
    for (const p of all) {
      const key = `${p.productId}_${p.lotId}`;
      const existing = seen.get(key);
      if (!existing || p.factor < existing.factor) {
        seen.set(key, p);
      }
    }
    return Array.from(seen.values());
  }

}