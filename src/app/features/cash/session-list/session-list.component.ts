import { Component, OnInit, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { CashSessionService } from '../../../core/services/cash-session.service';
import { AuthService } from '../../../core/services/auth.service';
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
    private authService = inject(AuthService);
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
        const userId = this.authService.currentUser()?.id;
        if (!userId) return;

        this.isLoading.set(true);

        this.cashService.getHistory(userId).subscribe({
            next: (response) => {
                this.sessions.set(response.data);
                this.applyFilter();
                this.isLoading.set(false);
            },
            error: (err) => {
                console.error('Error loading sessions:', err);
                this.isLoading.set(false);
            }
        });


        this.cashService.getActiveSession().subscribe({
            next: (response) => {
                this.activeSession.set(response.data);
            },
            error: () => {
                this.activeSession.set(null);
            }
        });
    }

    applyFilter(): void {
        const estId = this.selectedEstablishmentId();
        if (!estId) {
            this.filteredSessions.set(this.sessions());
            return;
        }

        this.filteredSessions.set(
            this.sessions().filter(s => s.establishmentId === Number(estId))
        );
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
