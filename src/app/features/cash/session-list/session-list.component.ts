import { Component, OnInit, inject, signal, effect, computed } from '@angular/core';
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

    // Client-side pagination
    currentPage = signal(0);
    pageSize = signal(20);

    pagedSessions = computed(() => {
        const start = this.currentPage() * this.pageSize();
        return this.filteredSessions().slice(start, start + this.pageSize());
    });

    totalItems = computed(() => this.filteredSessions().length);
    totalPages = computed(() => Math.ceil(this.totalItems() / this.pageSize()));

    get displayStart(): number {
        return this.totalItems() === 0 ? 0 : (this.currentPage() * this.pageSize()) + 1;
    }

    get displayEnd(): number {
        const end = (this.currentPage() + 1) * this.pageSize();
        return Math.min(end, this.totalItems());
    }

    get pageNumbers(): number[] {
        const total = this.totalPages();
        const current = this.currentPage();
        const pages: number[] = [];

        if (total <= 7) {
            for (let i = 0; i < total; i++) pages.push(i);
        } else {
            pages.push(0, 1, 2);
            if (current > 4) pages.push(-1);
            const start = Math.max(3, current - 1);
            const end = Math.min(total - 3, current + 1);
            for (let i = start; i <= end; i++) pages.push(i);
            if (current < total - 5) pages.push(-2);
            pages.push(total - 3, total - 2, total - 1);
        }

        return pages;
    }

    goToPage(page: number): void {
        if (page >= 0 && page < this.totalPages()) {
            this.currentPage.set(page);
        }
    }

    previousPage(): void {
        if (this.currentPage() > 0) {
            this.currentPage.set(this.currentPage() - 1);
        }
    }

    nextPage(): void {
        if (this.currentPage() < this.totalPages() - 1) {
            this.currentPage.set(this.currentPage() + 1);
        }
    }

    onPageClick(page: number): void {
        if (page < 0) return;
        this.goToPage(page);
    }

    isEllipsis(page: number): boolean {
        return page < 0;
    }

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

        this.cashService.getAllSessions().subscribe({
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
        this.currentPage.set(0);
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

    onRegisterInflow(): void {
        this.router.navigate(['/cash/movement/inflow']);
    }

    onRegisterOutflow(): void {
        this.router.navigate(['/cash/movement/outflow']);
    }

    getStatusBadgeClass(status: SessionStatus): string {
        return status === SessionStatus.OPEN ? 'bg-success' : 'bg-secondary';
    }
}
