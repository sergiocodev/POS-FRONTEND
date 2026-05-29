import { Component, OnInit, inject, signal, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { CashSessionService } from '../../../core/services/cash-session.service';
import { AuthService } from '../../../core/services/auth.service';
import { EstablishmentStateService } from '../../../core/services/establishment-state.service';
import { CashSessionResponse, SessionStatus, SessionStatusResponse } from '../../../core/models/cash.model';
import { ModuleHeaderComponent } from '../../../shared/components/module-header/module-header.component';
import { SessionListComponent } from './session-list/session-list.component';
import { BoxDetailsComponent } from './box-details/box-details.component';
import { SummaryBoxComponent } from './summary-box/summary-box.component';

@Component({
    selector: 'app-opening-closing',
    standalone: true,
    imports: [CommonModule, RouterModule, ModuleHeaderComponent, SessionListComponent, BoxDetailsComponent, SummaryBoxComponent],
    templateUrl: './opening-closing.component.html',
    styleUrl: './opening-closing.component.scss'
})
export class OpeningClosingComponent implements OnInit {
    private cashService = inject(CashSessionService);
    private authService = inject(AuthService);
    private establishmentStateService = inject(EstablishmentStateService);
    private router = inject(Router);

    sessions = signal<CashSessionResponse[]>([]);
    activeSession = signal<CashSessionResponse | null>(null);
    statusData = signal<SessionStatusResponse | null>(null);
    isLoading = signal<boolean>(false);
    selectedEstablishmentId = this.establishmentStateService.selectedEstablishmentId;

    // Pagination state
    currentPage = signal<number>(0);
    pageSize = signal<number>(8);
    totalItems = signal<number>(0);
    totalPages = signal<number>(0);

    constructor() {
        effect(() => {
            if (this.selectedEstablishmentId()) {
                this.currentPage.set(0);
                this.loadData();
            }
        }, { allowSignalWrites: true });
    }

    ngOnInit(): void {
        this.loadData();
    }

    loadData(): void {
        const userId = this.authService.currentUser()?.id;
        if (!userId) return;

        this.isLoading.set(true);
        const estId = this.selectedEstablishmentId() ? Number(this.selectedEstablishmentId()) : undefined;

        this.cashService.getAllPaged(estId, this.currentPage(), this.pageSize()).subscribe({
            next: (response) => {
                const pageData = response.data;
                this.sessions.set(pageData.content);
                this.totalItems.set(pageData.totalElements);
                this.totalPages.set(pageData.totalPages);
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
                this.cashService.getCurrentSessionStatus(userId).subscribe({
                    next: (statusRes) => {
                        this.statusData.set(statusRes.data);
                    },
                    error: () => this.statusData.set(null)
                });
            },
            error: () => {
                this.activeSession.set(null);
                this.statusData.set(null);
            }
        });
    }

    onPageChange(page: number): void {
        this.currentPage.set(page);
        this.loadData();
    }

    onPageSizeChange(size: number): void {
        this.pageSize.set(size);
        this.currentPage.set(0);
        this.loadData();
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
}
