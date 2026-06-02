import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-spinner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './spinner.component.html',
  styleUrl: './spinner.component.scss',
})
export class SpinnerComponent {
  /** Controla la visibilidad del spinner */
  @Input() show: boolean = false;

  /** Si es true, el spinner cubrirá toda la pantalla con un fondo borroso */
  @Input() fullScreen: boolean = false;

  /** Mensaje opcional a mostrar debajo del spinner */
  @Input() message: string = 'Procesando';

  /** Tamaño del spinner en píxeles */
  @Input() size: number = 48;

  /** Color principal del spinner (Por defecto: primary de Bootstrap 5) */
  @Input() color: string = '#0d6efd';

}
