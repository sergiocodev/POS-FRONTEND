import { Component, OnInit, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportService } from '../../../core/services/report.service';
import { CashSessionService } from '../../../core/services/cash-session.service';
import { EstablishmentStateService } from '../../../core/services/establishment-state.service';
import { EstablishmentService } from '../../../core/services/establishment.service';
import { ResponseApi } from '../../../core/models/response-api.model';
import { EstablishmentResponse } from '../../../core/models/maintenance.model';

import { ModuleHeaderComponent } from '../../../shared/components/module-header/module-header.component';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';
import { CardReportComponent, CardReportOption } from '../../../shared/components/card-report/card-report.component';
import { BoxReportFiltersComponent } from './components/box-report-filters/box-report-filters.component';
import { CustomTabsComponent, CustomTab } from '../../../shared/components/custom-tabs/custom-tabs.component';

export type BoxReportTab = 'sesiones' | 'movimientos' | 'arqueo';

@Component({
    selector: 'app-box-view-reports',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ModuleHeaderComponent,
        SpinnerComponent,
        CardReportComponent,
        BoxReportFiltersComponent,
        CustomTabsComponent
    ],
    templateUrl: './view-reports.component.html',
    styleUrl: './view-reports.component.scss'
})
export class ViewReportsComponent implements OnInit {
    // Services
    private reportService = inject(ReportService);
    private cashSessionService = inject(CashSessionService);
    private establishmentStateService = inject(EstablishmentStateService);
    private establishmentService = inject(EstablishmentService);

    // Tab state
    activeTab = signal<BoxReportTab>('sesiones');

    // Filter state
    startDate = signal('');
    endDate = signal('');
    establishments = signal<any[]>([]);
    selectedEstablishmentId = this.establishmentStateService.selectedEstablishmentId;
    cashRegisters = signal<any[]>([]);
    selectedCashRegisterId = signal<string | null>(null);

    // Session dropdown for Arqueo tab
    recentSessions = signal<CardReportOption[]>([]);
    selectedSessionId = signal<number | null>(null);

    // Loading
    isLoading = signal(false);

    // Tab definitions
    tabs: CustomTab[] = [
        { key: 'sesiones', label: 'Sesiones', icon: 'bi-clock-history' },
        { key: 'movimientos', label: 'Movimientos', icon: 'bi-arrow-left-right' },
        { key: 'arqueo', label: 'Arqueo', icon: 'bi-calculator' }
    ];

    constructor() {
        let isFirstRun = true;
        effect(() => {
            const estId = this.selectedEstablishmentId();
            if (isFirstRun) {
                isFirstRun = false;
                if (estId) this.loadRecentSessions();
                return;
            }
            if (estId) {
                this.loadRecentSessions();
            }
        }, { allowSignalWrites: true });
    }

    ngOnInit(): void {
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1, 0, 0, 0);
        const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

        const toLocalISO = (date: Date) => {
            const pad = (n: number) => n.toString().padStart(2, '0');
            return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
        };

        this.startDate.set(toLocalISO(firstDay));
        this.endDate.set(toLocalISO(todayEnd));

        this.loadFiltersData();
    }

    private loadFiltersData(): void {
        // Load Establishments
        this.establishmentService.getAll().subscribe({
            next: (res: ResponseApi<EstablishmentResponse[]>) => this.establishments.set(res.data || []),
            error: () => {}
        });

        // Load Cash Registers
        const estId = this.selectedEstablishmentId();
        this.cashSessionService.getRegisters(estId).subscribe({
            next: (res) => this.cashRegisters.set(res.data || []),
            error: () => {}
        });

        // Load Recent Sessions for Arqueo tab
        this.loadRecentSessions();
    }

    private loadRecentSessions(): void {
        const estId = this.selectedEstablishmentId();
        this.cashSessionService.getAllPaged(estId ?? undefined, 0, 30).subscribe({
            next: (res) => {
                const content = res?.data?.content || res?.data || [];
                this.recentSessions.set(
                    content.map((s: any) => ({
                        id: s.id.toString(),
                        label: `#${s.id} — ${s.cashRegisterName || 'Caja'} (${s.status === 'OPEN' ? 'Abierta' : 'Cerrada'})`
                    }))
                );
            },
            error: () => {}
        });
    }

    setActiveTab(tab: string): void {
        this.activeTab.set(tab as BoxReportTab);
    }

    onDateRangeChange(range: { startDate: string; endDate: string }): void {
        this.startDate.set(range.startDate);
        this.endDate.set(range.endDate);
    }

    onEstablishmentChange(id: string): void {
        this.establishmentStateService.selectEstablishment(+id);
        this.loadRecentSessions();
    }

    onCashRegisterChange(id: string): void {
        this.selectedCashRegisterId.set(id);
    }

    onSessionChange(options: any): void {
        if (!options) {
            this.selectedSessionId.set(null);
            return;
        }
        const selectedOption = Array.isArray(options) ? options[0] : options;
        this.selectedSessionId.set(selectedOption ? +selectedOption.id : null);
    }

    // ── PDF Actions ──

    onViewSessionsPdf(): void {
        const estId = this.selectedEstablishmentId();
        if (!estId) { alert('Seleccione un establecimiento'); return; }
        this.isLoading.set(true);
        this.reportService.getCashSessionsPdf(this.startDate(), this.endDate(), estId).subscribe({
            next: (blob) => this.openPdf(blob, `Reporte_Sesiones_Caja_${this.getPdfTimestamp()}.pdf`),
            error: () => { this.isLoading.set(false); alert('Error al generar el reporte'); }
        });
    }

    onViewMovementsPdf(): void {
        const estId = this.selectedEstablishmentId();
        if (!estId) { alert('Seleccione un establecimiento'); return; }
        this.isLoading.set(true);
        this.reportService.getCashMovementsPdf(this.startDate(), this.endDate(), estId).subscribe({
            next: (blob) => this.openPdf(blob, `Reporte_Movimientos_Caja_${this.getPdfTimestamp()}.pdf`),
            error: () => { this.isLoading.set(false); alert('Error al generar el reporte'); }
        });
    }

    onViewArqueoPdf(): void {
        const sessionId = this.selectedSessionId();
        if (!sessionId) { alert('Seleccione una sesión para el arqueo'); return; }
        this.isLoading.set(true);
        this.reportService.getCashArqueoPdf(sessionId).subscribe({
            next: (blob) => this.openPdf(blob, `Arqueo_Caja_${sessionId}_${this.getPdfTimestamp()}.pdf`),
            error: () => { this.isLoading.set(false); alert('Error al generar el arqueo'); }
        });
    }

    private getPdfTimestamp(): string {
        const now = new Date();
        const pad = (n: number) => n.toString().padStart(2, '0');
        return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    }

    private openPdf(blob: Blob, filename: string): void {
        this.isLoading.set(false);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}
