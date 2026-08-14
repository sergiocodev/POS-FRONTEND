import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PurchaseResponse } from '../../../../../../core/models/purchase.model';
import { PurchaseA4Component } from './formats/purchase-a4/purchase-a4.component';
import { Purchase80mmComponent } from './formats/purchase-80mm/purchase-80mm.component';
import { PurchaseTicketComponent } from './formats/purchase-ticket/purchase-ticket.component';

@Component({
  selector: 'app-purchase-voucher-preview',
  standalone: true,
  imports: [CommonModule, PurchaseA4Component, Purchase80mmComponent, PurchaseTicketComponent],
  templateUrl: './purchase-voucher-preview.component.html',
  styleUrl: './purchase-voucher-preview.component.scss'
})
export class PurchaseVoucherPreviewComponent {
  @Input() purchase?: PurchaseResponse;
  @Input() selectedFormat: string = '80MM';
}
