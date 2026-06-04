import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sale-sidebar',
  imports: [CommonModule],
  templateUrl: './sale-sidebar.html',
  styleUrl: './sale-sidebar.scss',
  standalone: true
})
export class SaleSidebar {
  @Input() selectedTab: string = 'document';
  
  @Output() tabChange = new EventEmitter<string>();
  @Output() clone = new EventEmitter<void>();
  @Output() invalidate = new EventEmitter<void>();
}

