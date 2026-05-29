import { Component, OnInit, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CashSessionService } from '../../../../core/services/cash-session.service';
import { EstablishmentStateService } from '../../../../core/services/establishment-state.service';
import { SmartKpiCardsComponent, SmartKpiItem } from '../../../../shared/components/smart-kpi-cards/smart-kpi-cards.component';

@Component({
  selector: 'app-summary-box',
  standalone: true,
  imports: [CommonModule, SmartKpiCardsComponent],
  templateUrl: './summary-box.component.html',
  styleUrl: './summary-box.component.scss',
})
export class SummaryBoxComponent implements OnInit {
  private cashService = inject(CashSessionService);
  private establishmentStateService = inject(EstablishmentStateService);

  kpiItems = signal<SmartKpiItem[]>([]);
  selectedEstablishmentId = this.establishmentStateService.selectedEstablishmentId;

  constructor() {
    effect(() => {
      if (this.selectedEstablishmentId()) {
        this.loadSummary();
      }
    }, { allowSignalWrites: true });
  }

  ngOnInit(): void {
    this.loadSummary();
  }

  loadSummary() {
    const estId = this.selectedEstablishmentId() ? Number(this.selectedEstablishmentId()) : undefined;
    this.cashService.getSummary(estId).subscribe({
      next: (res) => {
        const data = res.data as any[];
        const styles: any = {
          'CAJAS ABIERTAS': { icon: 'bi-door-open', color: 'green' },
          'CAJAS CERRADAS': { icon: 'bi-door-closed', color: 'orange' },
          'INGRESO TOTAL': { icon: 'bi-arrow-up-right-circle', color: 'blue' },
          'EGRESO TOTAL': { icon: 'bi-arrow-down-right-circle', color: 'purple' }
        };

        const mappedData: SmartKpiItem[] = data.map((item: any) => ({
          ...item,
          ...(styles[item.label] || { icon: 'bi-info-circle', color: 'blue' })
        }));

        this.kpiItems.set(mappedData);
      },
      error: (err) => console.error('Error loading summary', err)
    });
  }
}
