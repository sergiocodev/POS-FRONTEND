import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SaleResponse } from '../../../../../../../../core/models/sale.model';

@Component({
  selector: 'app-voucher-80mm',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './voucher-80mm.component.html',
  styleUrl: './voucher-80mm.component.scss'
})
export class Voucher80mmComponent {
  @Input() sale!: SaleResponse;
}
