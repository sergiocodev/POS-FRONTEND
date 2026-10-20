import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SaleResponse } from '../../../../../../../../core/models/sale.model';
import { UnitAbbreviationPipe } from '../../../../../../../../shared/pipes/unit-abbreviation.pipe';

@Component({
  selector: 'app-voucher-a4',
  standalone: true,
  imports: [CommonModule, UnitAbbreviationPipe],
  templateUrl: './voucher-a4.component.html',
  styleUrl: './voucher-a4.component.scss'
})
export class VoucherA4Component {
  @Input() sale!: SaleResponse;
}
