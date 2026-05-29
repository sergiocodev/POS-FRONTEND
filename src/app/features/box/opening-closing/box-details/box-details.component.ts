import { Component, input, computed, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SessionStatusResponse, CashSessionResponse } from '../../../../core/models/cash.model';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-box-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './box-details.component.html',
  styleUrl: './box-details.component.scss',
})
export class BoxDetailsComponent {
  statusData = input<SessionStatusResponse | null>(null);
  activeSession = input<CashSessionResponse | null>(null);

  onViewMovements = output<void>();
  onCloseBox = output<void>();
  registerInflow = output<void>();
  registerOutflow = output<void>();

  authService = inject(AuthService);

  responsable = computed(() => {
    const user = this.authService.currentUser();
    return this.activeSession()?.username || (user ? user.fullName : 'No asignado');
  });

  ingresos = computed(() => {
    const data = this.statusData();
    if (!data) return 0;
    return (data.totalCashSales || 0) + (data.totalArCashPayments || 0) + (data.totalCashInflows || 0);
  });

  egresos = computed(() => {
    const data = this.statusData();
    if (!data) return 0;
    return (data.totalApCashPayments || 0) + (data.totalCashOutflows || 0);
  });

  ventas = computed(() => {
    const data = this.statusData();
    if (!data) return 0;
    return (data.totalCashSales || 0) + (data.totalDigital || 0);
  });

  totalEnCaja = computed(() => {
    return this.statusData()?.calculatedBalance || 0;
  });
}
