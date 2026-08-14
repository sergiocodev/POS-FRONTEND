import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PurchaseResponse } from '../../../../../../core/models/purchase.model';

@Component({
  selector: 'app-purchase-sidebar',
  imports: [CommonModule],
  templateUrl: './purchase-sidebar.component.html',
  styleUrl: './purchase-sidebar.component.scss',
  standalone: true
})
export class PurchaseSidebarComponent {
  @Input() selectedTab: string = 'document';
  @Input() purchase?: PurchaseResponse;
  
  @Output() tabChange = new EventEmitter<string>();
  @Output() receive = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
}
