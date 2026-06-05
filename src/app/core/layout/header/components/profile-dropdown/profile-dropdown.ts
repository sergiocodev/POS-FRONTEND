import { Component, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../services/auth.service';
import { EstablishmentResponse } from '../../../../models/maintenance.model';

@Component({
  selector: 'app-profile-dropdown',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile-dropdown.html',
  styleUrl: './profile-dropdown.scss',
})
export class ProfileDropdown {
  authService = inject(AuthService);
  imageError = signal(false);
  
  availableServiceCenters = input<EstablishmentResponse[]>([]);
  selectedServiceCenterId = input<number | null>(null);
  
  selectCareCenter = output<number>();
  myAccount = output<void>();
  logout = output<void>();
}
