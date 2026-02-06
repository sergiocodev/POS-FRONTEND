import { Component, OnInit, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CashSessionService } from '../../../core/services/cash-session.service';
import { EstablishmentStateService } from '../../../core/services/establishment-state.service';
import { CashSessionResponse } from '../../../core/models/cash.model';

@Component({
    selector: 'app-cash-report',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './cash-report.component.html',
    styleUrl: './cash-report.component.scss'
})
export class CashReportComponent implements OnInit {
    private cashService = inject(CashSessionService);
    private establishmentStateService = inject(EstablishmentStateService);

    sessions = signal<CashSessionResponse[]>([]);
    isLoading = signal<boolean>(false);
    selectedEstablishmentId = this.establishmentStateService.selectedEstablishmentId;

    startDate = '';
    endDate = '';

    constructor() {
        effect(() => {
            if (this.selectedEstablishmentId()) {
                this.loadReport();
            }
        });
    }

    ngOnInit(): void {
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

        this.startDate = firstDay.toISOString().split('T')[0];
        this.endDate = today.toISOString().split('T')[0];

        this.loadReport();
    }

    loadReport(): void {
        this.isLoading.set(true);


        this.cashService.getAllSessions().subscribe({
            next: (response) => {
                const data = response.data;
                const estId = this.selectedEstablishmentId();
                const filtered = data.filter(s => {
                    const sessionDate = s.openedAt.split('T')[0];
                    const matchesDate = sessionDate >= this.startDate && sessionDate <= this.endDate;



                    return matchesDate;
                });
                this.sessions.set(filtered);
                this.isLoading.set(false);
            },
            error: (err) => {
                console.error('Error loading cash report', err);
                this.isLoading.set(false);
            }
        });
    }

    getTotalOpening(): number {
        return this.sessions().reduce((sum, s) => sum + (s.openingBalance || 0), 0);
    }

    getTotalCalculated(): number {
        return this.sessions().reduce((sum, s) => sum + (s.calculatedBalance || 0), 0);
    }

    getTotalClosing(): number {
        return this.sessions().reduce((sum, s) => sum + (s.closingBalance || 0), 0);
    }

    getTotalDiff(): number {
        return this.sessions().reduce((sum, s) => sum + (s.diffAmount || 0), 0);
    }
}
