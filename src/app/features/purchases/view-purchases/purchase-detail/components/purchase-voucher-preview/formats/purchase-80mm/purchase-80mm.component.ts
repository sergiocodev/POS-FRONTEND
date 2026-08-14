import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PurchaseResponse } from '../../../../../../../../core/models/purchase.model';

@Component({
  selector: 'app-purchase-80mm',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './purchase-80mm.component.html',
  styleUrl: './purchase-80mm.component.scss'
})
export class Purchase80mmComponent {
  @Input() purchase!: PurchaseResponse;
}
