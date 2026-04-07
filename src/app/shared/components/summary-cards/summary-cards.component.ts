import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

// summary-item.model.ts
export interface SummaryItem {
  label: string;
  value: number;
  icon: string;      // Ejemplo: 'F', 'B', 'C'
  cssClass: string;  // Ejemplo: 'card-f', 'card-b'
}

@Component({
  selector: 'app-summary-cards',
  imports: [CommonModule],
  templateUrl: './summary-cards.component.html',
  styleUrl: './summary-cards.component.scss',
})
export class SummaryCardsComponent {
  @Input() title: string = 'Resumen';
  @Input() items: SummaryItem[] = [];
  @Input() currencyCode: string = 'PEN';
  @Input() currencySymbol: string = 'S/ ';
}
