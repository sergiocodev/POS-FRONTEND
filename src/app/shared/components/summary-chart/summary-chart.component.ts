import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-summary-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './summary-chart.component.html',
  styleUrl: './summary-chart.component.scss',
})
export class SummaryChart {
  // Generador de ID único por instancia para evitar colisiones en los gradientes SVG
  protected componentId = Math.random().toString(36).substring(2, 9);
  protected Math = Math;

  // --- Propiedades Configurables (Inputs) ---
  @Input() title: string = 'Nominal Balance';
  @Input() amount: number = 7500.00;
  @Input() currency: string = 'USD';
  @Input() percentage: number = 1.19;

  // Customización de colores del ícono superior izquierdo
  @Input() iconColor: string = '#d946ef';    // Rosa original
  @Input() iconBgColor: string = '#fdf2f8';  // Fondo rosa original

  /**
   * Ruta SVG (Path) que dibuja las curvas del gráfico. 
   * Puedes pasarle coordenadas diferentes desde fuera para pintar gráficos distintos.
   */
  @Input() chartPath: string = 'M 0 25 Q 8 38, 14 24 T 26 18 T 35 28 T 46 6 T 55 24 T 64 6 T 74 30 T 84 18 T 93 30 T 100 6';

  // --- Eventos de Salida (Outputs) ---
  @Output() cardClick = new EventEmitter<void>();
  @Output() expandClick = new EventEmitter<MouseEvent>();

  // Devuelve el color del gráfico dependiendo de si la tendencia sube o baja
  get trendColor(): string {
    return this.percentage >= 0 ? '#10b981' : '#ef4444';
  }

  // --- Métodos de Interacción ---
  onCardClick(): void {
    this.cardClick.emit();
  }

  onExpand(event: MouseEvent): void {
    event.stopPropagation(); // Evita que se dispare el click de la tarjeta contenedora
    this.expandClick.emit(event);
  }
}
