import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PurchaseResponse } from '../../../../../../../../core/models/purchase.model';

@Component({
  selector: 'app-purchase-a4',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './purchase-a4.component.html',
  styleUrl: './purchase-a4.component.scss'
})
export class PurchaseA4Component {
  @Input() purchase!: PurchaseResponse;
}
