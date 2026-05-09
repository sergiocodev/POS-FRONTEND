import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-logo',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './logo.component.html',
  styleUrl: './logo.component.scss'
})
export class LogoComponent {
  @Input() collapsed = false;
  @Input() showText = true;
  @Input() height = '40px';

  private themeService = inject(ThemeService);

  get isDarkMode() {
    return this.themeService.isDarkMode();
  }

}

