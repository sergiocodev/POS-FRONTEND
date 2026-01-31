import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { CashSessionService } from '../../../core/services/cash-session.service';
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
    private router = inject(Router);

    sessions = signal<CashSessionResponse[]>([]);
    activeSession = signal<CashSessionResponse | null>(null);
    isLoading = signal<boolean>(false);

    ngOnInit(): void {
        this.loadData();
    }

    loadData(): void {
        this.isLoading.set(true);
        // Get all sessions
        this.cashService.getAllSessions().subscribe({
            next: (data) => {
                this.sessions.set(data);
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
