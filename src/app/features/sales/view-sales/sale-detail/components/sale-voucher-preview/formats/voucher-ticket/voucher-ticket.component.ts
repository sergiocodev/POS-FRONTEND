import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SaleResponse } from '../../../../../../../../core/models/sale.model';
import { UnitAbbreviationPipe } from '../../../../../../../../shared/pipes/unit-abbreviation.pipe';

@Component({
  selector: 'app-voucher-ticket',
  standalone: true,
  imports: [CommonModule, UnitAbbreviationPipe],
  templateUrl: './voucher-ticket.component.html',
  styleUrl: './voucher-ticket.component.scss'
})
export class VoucherTicketComponent {
  @Input() sale!: SaleResponse;
}
