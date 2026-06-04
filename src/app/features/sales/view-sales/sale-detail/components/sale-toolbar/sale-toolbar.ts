import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-sale-toolbar',
  standalone: true,
  templateUrl: './sale-toolbar.html',
  styleUrl: './sale-toolbar.scss',
})
export class SaleToolbar {
  @Input() selectedFormat: string = 'TICKET';
  
  @Output() formatChange = new EventEmitter<any>();
  @Output() print = new EventEmitter<void>();
  @Output() download = new EventEmitter<void>();
  @Output() share = new EventEmitter<void>();
}
