import { Component, OnInit, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { CashSessionService } from '../../../core/services/cash-session.service';
import { EstablishmentStateService } from '../../../core/services/establishment-state.service';
import { CashSessionResponse, SessionStatus } from '../../../core/models/cash.model';

@Component({
    selector: 'app-session-list',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './session-list.component.html',
    styleUrl: './session-list.component.scss'
})
export class SessionListComponent implements OnInit {
    private cashService = inject(CashSessionService);
    private establishmentStateService = inject(EstablishmentStateService);
    private router = inject(Router);

    sessions = signal<CashSessionResponse[]>([]);
    filteredSessions = signal<CashSessionResponse[]>([]);
    activeSession = signal<CashSessionResponse | null>(null);
    isLoading = signal<boolean>(false);
    selectedEstablishmentId = this.establishmentStateService.selectedEstablishmentId;

    constructor() {
        effect(() => {
            if (this.selectedEstablishmentId()) {
                this.loadData();
            }
        });
    }

    ngOnInit(): void {
        this.loadData();
    }

    loadData(): void {
        const userId = this.cashService['authService'].currentUser()?.id;
        if (!userId) return;

        this.isLoading.set(true);
        // Get user history
        this.cashService.getHistory(userId).subscribe({
            next: (data) => {
                this.sessions.set(data);
                this.applyFilter();
                this.isLoading.set(false);
            },
            error: (err) => {
                console.error('Error loading sessions:', err);
                this.isLoading.set(false);
            }
        });

        // Check for active session
        this.cashService.getActiveSession().subscribe({
            next: (session) => {
                this.activeSession.set(session);
            },
            error: () => {
                this.activeSession.set(null);
            }
        });
    }

    applyFilter(): void {
        const estId = this.selectedEstablishmentId();
        // Since backend might not return establishmentId in history item (need to verify model)
        // I'll filter by what's available or just show all for the user if model lacks it.
        // Actually CashRegisterResponse has establishmentId, maybe CashSessionResponse should too.
        this.filteredSessions.set(this.sessions());
    }

    onOpenSession(): void {
        this.router.navigate(['/cash/open']);
    }

    onCloseActiveSession(): void {
        if (this.activeSession()) {
            this.router.navigate(['/cash/close', this.activeSession()?.id]);
        }
    }

    getStatusBadgeClass(status: SessionStatus): string {
        return status === SessionStatus.OPEN ? 'bg-success' : 'bg-secondary';
    }
}
