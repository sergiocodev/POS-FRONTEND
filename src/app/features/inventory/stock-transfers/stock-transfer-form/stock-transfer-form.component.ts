import { Component, OnInit, inject, signal, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { StockTransferRequest, StockTransferItemRequest } from '../../../../core/models/stock-transfer.model';
import { EstablishmentResponse } from '../../../../core/models/maintenance.model';
import { InventoryResponse } from '../../../../core/models/inventory.model';
import { ProductUnitResponse } from '../../../../core/models/product.model';
import { EstablishmentStateService } from '../../../../core/services/establishment-state.service';
import { ProductUnitService } from '../../../../core/services/product-unit.service';

interface TransferItem extends InventoryResponse {
  transferQuantity: number;
  selectedUnitId?: number;
  units?: ProductUnitResponse[];
  loadingUnits?: boolean;
}

@Component({
  selector: 'app-stock-transfer-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './stock-transfer-form.component.html',
  styleUrl: './stock-transfer-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StockTransferFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private establishmentState = inject(EstablishmentStateService);
  private productUnitService = inject(ProductUnitService);

  // Inputs
  establishments = input<EstablishmentResponse[]>([]);
  inventoryItems = input<InventoryResponse[]>([]);
  lotsMap = input<Map<number, number>>(new Map());
  isSaving = input(false);
  isLoadingData = input(false);

  // Outputs
  saved = output<StockTransferRequest>();
  cancelled = output<void>();

  form!: FormGroup;
  selectedItems = signal<TransferItem[]>([]);
  searchTerm = signal('');

  ngOnInit() {
    this.initForm();
  }

  initForm() {
    this.form = this.fb.group({
      targetEstablishmentId: ['', Validators.required],
      notes: ['']
    });
  }

  get filteredInventory() {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return [];
    
    const selectedIds = this.selectedItems().map(i => i.id);
    return this.inventoryItems()
      .filter(i => !selectedIds.includes(i.id))
      .filter(i => 
        i.productName.toLowerCase().includes(term) || 
        (i.lotCode && i.lotCode.toLowerCase().includes(term))
      )
      .slice(0, 10);
  }

  addItem(item: InventoryResponse) {
    const newItem: TransferItem = { ...item, transferQuantity: 1, loadingUnits: true };
    this.selectedItems.update(items => [...items, newItem]);
    this.searchTerm.set('');

    const productId = this.lotsMap().get(item.lotId);
    if (!productId) return;

    this.productUnitService.getByProductId(productId).subscribe({
      next: (units) => {
        this.selectedItems.update(items => {
          const index = items.findIndex(i => i.id === item.id);
          if (index !== -1) {
            const newItems = [...items];
            newItems[index] = { 
              ...newItems[index], 
              units: units, 
              loadingUnits: false,
              selectedUnitId: units.length > 0 ? units[0].id : undefined
            };
            return newItems;
          }
          return items;
        });
      },
      error: () => {
        this.selectedItems.update(items => {
          const index = items.findIndex(i => i.id === item.id);
          if (index !== -1) {
            const newItems = [...items];
            newItems[index].loadingUnits = false;
            return newItems;
          }
          return items;
        });
      }
    });
  }

  removeItem(index: number) {
    this.selectedItems.update(items => {
      const newItems = [...items];
      newItems.splice(index, 1);
      return newItems;
    });
  }

  updateUnit(index: number, unitId: number) {
    this.selectedItems.update(items => {
      const newItems = [...items];
      newItems[index].selectedUnitId = Number(unitId);
      
      const item = newItems[index];
      const selectedUnit = item.units?.find(u => u.id === item.selectedUnitId);
      const factor = selectedUnit ? selectedUnit.factor : 1;
      const maxQty = Math.floor(item.quantity / factor);
      
      if (item.transferQuantity > maxQty) {
          item.transferQuantity = maxQty > 0 ? maxQty : 1;
      }
      
      return newItems;
    });
  }

  updateQuantity(index: number, quantity: number) {
    this.selectedItems.update(items => {
      const newItems = [...items];
      const item = newItems[index];
      
      const selectedUnit = item.units?.find(u => u.id === item.selectedUnitId);
      const factor = selectedUnit ? selectedUnit.factor : 1;
      const maxQty = Math.floor(item.quantity / factor);

      let parsedQty = Number(quantity);
      if (parsedQty > maxQty) {
        parsedQty = maxQty; 
      }
      if (parsedQty < 1) {
        parsedQty = 1;
      }
      newItems[index].transferQuantity = parsedQty;
      return newItems;
    });
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.selectedItems().length === 0) {
      return;
    }

    const currentEstId = this.establishmentState.selectedEstablishmentId();
    if (!currentEstId) return;

    try {
      const items: StockTransferItemRequest[] = this.selectedItems().map(i => {
        const productId = this.lotsMap().get(i.lotId);
        if (!productId) {
          throw new Error(`Product not found for lot ${i.lotId}`);
        }
        if (!i.selectedUnitId) {
          throw new Error(`Unit not selected for product ${i.productName}`);
        }
        return {
          productId: productId,
          lotId: i.lotId,
          unitId: i.selectedUnitId,
          quantity: i.transferQuantity
        };
      });

      const req: StockTransferRequest = {
        sourceEstablishmentId: currentEstId,
        targetEstablishmentId: Number(this.form.value['targetEstablishmentId']),
        notes: this.form.value['notes'],
        items: items
      };

      this.saved.emit(req);
    } catch (error) {
      console.error(error);
    }
  }

  cancel() {
    this.cancelled.emit();
  }
}

