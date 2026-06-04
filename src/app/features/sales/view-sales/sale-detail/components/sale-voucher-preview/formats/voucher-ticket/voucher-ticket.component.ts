import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SaleResponse } from '../../../../../../../../core/models/sale.model';

@Component({
  selector: 'app-voucher-ticket',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './voucher-ticket.component.html',
  styleUrl: './voucher-ticket.component.scss'
})
export class VoucherTicketComponent {
  @Input() sale!: SaleResponse;
}
