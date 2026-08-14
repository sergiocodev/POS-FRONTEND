import { Component, OnInit, inject, signal, effect, untracked, computed, ViewChild } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { catchError, switchMap, take } from 'rxjs/operators';
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
import { MovementFormComponent } from '../cash-flows/movement-form/movement-form.component';
import { ModalGenericComponent } from '../../../shared/components/modal-generic/modal-generic.component';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { ModalAlertComponent } from '../../../shared/components/modal-alert/modal-alert.component';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';
import { ModalService } from '../../../shared/components/confirm-modal/service/modal.service';
import { CashOpenComponent } from './box-details/cash-open/cash-open.component';

@Component({
    selector: 'app-opening-closing',
    standalone: true,
    imports: [CommonModule, RouterModule, ModuleHeaderComponent, SessionListComponent, BoxDetailsComponent, SummaryBoxComponent, MovementFormComponent, ModalGenericComponent, CashOpenComponent, ConfirmModalComponent, ModalAlertComponent, SpinnerComponent],
    templateUrl: './opening-closing.component.html',

    styleUrl: './opening-closing.component.scss'
})
export class OpeningClosingComponent implements OnInit {
    private cashService = inject(CashSessionService);
    private authService = inject(AuthService);
    private establishmentStateService = inject(EstablishmentStateService);
    private router = inject(Router);

    @ViewChild(SummaryBoxComponent) summaryBox!: SummaryBoxComponent;

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
                untracked(() => {
                    this.currentPage.set(0);
                    this.loadData();
                });
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

        const summary$ = this.summaryBox ? this.summaryBox.loadSummary() : of(null);

        const paged$ = this.cashService.getAllPaged(estId, this.currentPage(), this.pageSize()).pipe(
            take(1),
            catchError(err => {
                console.error('Error loading sessions:', err);
                return of(null);
            })
        );

        const session$ = this.cashService.getActiveSession(estId).pipe(
            take(1),
            switchMap(res => {
                this.activeSession.set(res.data);
                return this.cashService.getCurrentSessionStatus(userId, estId).pipe(
                    take(1),
                    catchError(err => {
                        this.statusData.set(null);
                        return of(null);
                    })
                );
            }),
            catchError(err => {
                this.activeSession.set(null);
                this.statusData.set(null);
                return of(null);
            })
        );

        forkJoin({ paged: paged$, session: session$, summary: summary$ }).subscribe({
            next: (res) => {
                if (res.paged) {
                    const pageData = res.paged.data;
                    this.sessions.set(pageData.content);
                    this.totalItems.set(pageData.totalElements);
                    this.totalPages.set(pageData.totalPages);
                }
                if (res.session) {
                    this.statusData.set(res.session.data);
                }
                this.isLoading.set(false);
            },
            error: () => {
                this.isLoading.set(false);
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
        this.showOpenModal.set(true);
    }

    closeOpenModal(): void {
        this.showOpenModal.set(false);
    }

    onOpenSaved(): void {
        this.showOpenModal.set(false);
        this.loadData();
    }

    onCloseActiveSession(): void {
        if (this.activeSession()) {
            this.router.navigate(['/cash/close', this.activeSession()?.id]);
        }
    }

    showOpenModal = signal<boolean>(false);
    showMovementModal = signal<boolean>(false);
    movementType = signal<'inflow' | 'outflow'>('inflow');

    onViewMovements(): void {
        this.router.navigate(['/cash/movements']);
    }

    onRegisterInflow(): void {
        this.movementType.set('inflow');
        this.showMovementModal.set(true);
    }

    onRegisterOutflow(): void {
        this.movementType.set('outflow');
        this.showMovementModal.set(true);
    }

    closeMovementModal(): void {
        this.showMovementModal.set(false);
    }

    onMovementSaved(): void {
        this.showMovementModal.set(false);
        this.loadData();
    }
}
