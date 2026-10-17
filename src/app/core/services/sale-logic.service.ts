import { Injectable } from '@angular/core';
import { ProductForSaleResponse, ProductUnitOption } from '../models/sale.model';

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
    const unitsMap = new Map<string, string[]>();
    const unitOptionsMap = new Map<string, ProductUnitOption[]>();

    for (const p of all) {
      const key = `${p.productId}_${p.lotId}`;
      const existing = seen.get(key);
      
      if (!unitsMap.has(key)) {
        unitsMap.set(key, []);
        unitOptionsMap.set(key, []);
      }
      if (!unitsMap.get(key)!.includes(p.unitName)) {
        unitsMap.get(key)!.push(p.unitName);
        unitOptionsMap.get(key)!.push({
          productUnitId: p.productUnitId,
          unitName: p.unitName,
          factor: p.factor,
          salesPrice: p.salesPrice
        });
      }

      if (!existing || p.factor < existing.factor) {
        seen.set(key, p);
      }
    }

    // Sort options by factor ascending (e.g. UNIDAD factor 1, BLISTER factor 4, CAJA factor 50)
    for (const options of unitOptionsMap.values()) {
      options.sort((a, b) => a.factor - b.factor);
    }

    return Array.from(seen.values()).map(p => {
      const key = `${p.productId}_${p.lotId}`;
      const options = unitOptionsMap.get(key) || [];
      return {
        ...p,
        availableUnits: options.map(o => o.unitName),
        unitOptions: options
      };
    });
  }

}