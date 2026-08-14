import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SaleResponse } from '../../../../../../core/models/sale.model';
import { AuthService } from '../../../../../../core/services/auth.service';

@Component({
  selector: 'app-sale-sidebar',
  imports: [CommonModule],
  templateUrl: './sale-sidebar.html',
  styleUrl: './sale-sidebar.scss',
  standalone: true
})
export class SaleSidebar {
  public authService = inject(AuthService);

  @Input() selectedTab: string = 'document';
  @Input() sale?: SaleResponse;
  
  @Output() tabChange = new EventEmitter<string>();
  @Output() clone = new EventEmitter<void>();
  @Output() invalidate = new EventEmitter<void>();
}

