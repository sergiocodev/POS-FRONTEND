import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-custom-card',
  imports: [CommonModule],
  templateUrl: './custom-card.component.html',
  styleUrl: './custom-card.component.scss',
})
export class CustomCardComponent {
  // Inputs para configuración básica
  @Input() title: string = '';
  @Input() subtitle: string = '';
  @Input() imgUrl: string = '';
  @Input() imgAlt: string = 'Imagen de tarjeta';

  // Clases personalizadas para permitir variar el estilo (ej: 'bg-primary text-white')
  @Input() headerClass: string = '';
  @Input() bodyClass: string = '';
}
