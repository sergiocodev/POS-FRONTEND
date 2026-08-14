import { Component, OnInit, inject, signal, effect, untracked } from '@angular/core';
import { of } from 'rxjs';
import { catchError, tap, take } from 'rxjs/operators';
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
        untracked(() => this.loadSummary());
      }
    }, { allowSignalWrites: true });
  }

  ngOnInit(): void {
    this.loadSummary().subscribe();
  }

  loadSummary() {
    const estId = this.selectedEstablishmentId() ? Number(this.selectedEstablishmentId()) : undefined;
    return this.cashService.getSummary(estId).pipe(
      take(1),
      tap((res) => {
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
      }),
      catchError((err) => {
        console.error('Error loading summary', err);
        return of(null);
      })
    );
  }
}
