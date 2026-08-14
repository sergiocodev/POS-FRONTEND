import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PurchaseResponse } from '../../../../../../../../core/models/purchase.model';

@Component({
  selector: 'app-purchase-ticket',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './purchase-ticket.component.html',
  styleUrl: './purchase-ticket.component.scss'
})
export class PurchaseTicketComponent {
  @Input() purchase!: PurchaseResponse;
}
