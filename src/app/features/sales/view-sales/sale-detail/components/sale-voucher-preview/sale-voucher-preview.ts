import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SaleResponse } from '../../../../../../core/models/sale.model';
import { VoucherA4Component } from './formats/voucher-a4/voucher-a4.component';
import { Voucher80mmComponent } from './formats/voucher-80mm/voucher-80mm.component';
import { VoucherTicketComponent } from './formats/voucher-ticket/voucher-ticket.component';

@Component({
  selector: 'app-sale-voucher-preview',
  standalone: true,
  imports: [CommonModule, VoucherA4Component, Voucher80mmComponent, VoucherTicketComponent],
  templateUrl: './sale-voucher-preview.html',
  styleUrl: './sale-voucher-preview.scss'
})
export class SaleVoucherPreview {
  @Input() sale?: SaleResponse;
  @Input() selectedFormat: string = '80MM';
}
