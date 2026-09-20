import { Component, OnInit, inject, signal, computed, effect, untracked } from '@angular/core';
import { forkJoin } from 'rxjs';
import { take, finalize } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SaleService } from '../../../core/services/sale.service';
import { EstablishmentStateService } from '../../../core/services/establishment-state.service';
import { SaleResponse, SaleSummaryResponse } from '../../../core/models/sale.model';
import { SaleListComponent } from './sale-list/sale-list.component';
import { ModalGenericComponent } from '../../../shared/components/modal-generic/modal-generic.component';
import { SaleDetailComponent } from './sale-detail/sale-detail.component';
import { SummaryCardsComponent, SummaryItem } from '../../../shared/components/summary-cards/summary-cards.component';
import { ModuleHeaderComponent } from '../../../shared/components/module-header/module-header.component';
import { DateRangeSearchComponent } from '../../../shared/components/date-range-search/date-range-search.component';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { ModalAlertComponent } from '../../../shared/components/modal-alert/modal-alert.component';
import { ModalService } from '../../../shared/components/confirm-modal/service/modal.service';
import { AuthService } from '../../../core/services/auth.service';
import { SunatService } from '../../../core/services/sunat.service';

@Component({
    selector: 'app-view-sales',
    standalone: true,
    imports: [
        CommonModule,
        SaleListComponent,
        ModalGenericComponent,
        SaleDetailComponent,
        ModuleHeaderComponent,
        SummaryCardsComponent,
        DateRangeSearchComponent,
        SpinnerComponent,
        ConfirmModalComponent,
        ModalAlertComponent
    ],
    templateUrl: './view-sales.component.html',
    styleUrl: './view-sales.component.scss'
})
export class ViewSalesComponent implements OnInit {
    private saleService = inject(SaleService);
    private authService = inject(AuthService);
    private router = inject(Router);
    private establishmentStateService = inject(EstablishmentStateService);
    private modalService = inject(ModalService);
    private sunatService = inject(SunatService);

    selectedEstablishmentId = this.establishmentStateService.selectedEstablishmentId;

    // State
    sales = signal<SaleResponse[]>([]);
    isLoading = signal<boolean>(false);

    // Pagination & Filters
    currentPage = signal(0);
    pageSize = signal(10);
    totalItems = signal(0);
    totalPages = signal(0);

    startDate = signal<string>(this.formatDate(new Date()) + 'T00:00:00');
    endDate = signal<string>(this.formatDate(new Date()) + 'T23:59:59');
    tableFilters = signal<any>({});
    serverSummary = signal<SaleSummaryResponse | null>(null);

    // Modal State
    isDetailVisible = signal<boolean>(false);
    selectedSale = signal<SaleResponse | undefined>(undefined);

    summaryItems = computed<SummaryItem[]>(() => {
        const s = this.serverSummary();
        if (!s) return [
            { label: 'Total Facturas', value: 0, icon: 'bi-file-earmark-text', cssClass: 'card-f', isCurrency: true },
            { label: 'Total Boletas', value: 0, icon: 'bi-receipt', cssClass: 'card-b', isCurrency: true },
            { label: 'Nota de Venta', value: 0, icon: 'bi-journal-text', cssClass: 'card-v', isCurrency: true },
            { label: 'Total Neto', value: 0, icon: 'bi-cash-coin', cssClass: 'card-n', isCurrency: true },
        ];

        return [
            { label: 'Total Facturas', value: s.totalFacturas, icon: 'bi-file-earmark-text', cssClass: 'card-f', isCurrency: true },
            { label: 'Total Boletas', value: s.totalBoletas, icon: 'bi-receipt', cssClass: 'card-b', isCurrency: true },
            { label: 'Nota de Venta', value: s.totalNotaVenta, icon: 'bi-journal-text', cssClass: 'card-v', isCurrency: true },
            { label: 'Total Neto', value: s.totalNeto, icon: 'bi-cash-coin', cssClass: 'card-n', isCurrency: true },
        ];
    });

    ngOnInit(): void {
        this.loadAllData();
    }

    constructor() {
        let isFirstRun = true;
        // React when establishment changes
        effect(() => {
            this.selectedEstablishmentId(); // track signal
            
            if (isFirstRun) {
                isFirstRun = false;
                return; // Let ngOnInit handle the initial data load
            }

            untracked(() => {
                this.currentPage.set(0);
                this.loadAllData();
            });
        }, { allowSignalWrites: true });
    }

    private formatDate(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    loadAllData(): void {
        this.isLoading.set(true);
        forkJoin({
            sales: this.saleService.getAllPaged(this.currentPage(), this.pageSize(), this.startDate(), this.endDate(), this.tableFilters(), this.selectedEstablishmentId()).pipe(take(1)),
            summary: this.saleService.getSummary(this.startDate(), this.endDate(), this.tableFilters(), this.selectedEstablishmentId()).pipe(take(1))
        }).subscribe({
            next: (response) => {
                const page = response.sales.data;
                this.sales.set(page.content || []);
                this.totalItems.set(page.totalElements || 0);
                this.totalPages.set(page.totalPages || 0);
                this.serverSummary.set(response.summary.data);
                this.isLoading.set(false);
            },
            error: (error) => {
                this.isLoading.set(false);
                this.modalService.alert({ title: 'Error', message: 'No se pudieron cargar los datos. Por favor, intente nuevamente.', type: 'error' });
                console.error('Error loading data:', error);
            }
        });
    }

    loadSales(): void {
        this.isLoading.set(true);
        this.saleService.getAllPaged(this.currentPage(), this.pageSize(), this.startDate(), this.endDate(), this.tableFilters(), this.selectedEstablishmentId())
        .pipe(take(1), finalize(() => this.isLoading.set(false)))
        .subscribe({
            next: (response) => {
                const page = response.data;
                this.sales.set(page.content || []);
                this.totalItems.set(page.totalElements || 0);
                this.totalPages.set(page.totalPages || 0);
            },
            error: (error) => {
                this.modalService.alert({ title: 'Error', message: 'No se pudieron cargar los datos. Por favor, intente nuevamente.', type: 'error' });
                console.error('Error loading sales:', error);
            }
        });
    }

    handlePageChange(page: number): void {
        this.currentPage.set(page);
        this.loadSales();
    }

    handlePageSizeChange(size: number): void {
        this.pageSize.set(size);
        this.currentPage.set(0);
        this.loadSales();
    }

    handleTableFilter(filters: any): void {
        this.tableFilters.set(filters);
        this.currentPage.set(0);
        this.loadAllData();
    }

    handleDateFilter(event: { startDate: string, endDate: string }) {
        this.startDate.set(event.startDate);
        this.endDate.set(event.endDate);
        this.currentPage.set(0);
        this.loadAllData();
    }

    onViewDetails(id: number): void {
        this.isLoading.set(true);
        this.selectedSale.set(undefined);

        this.saleService.getById(id)
        .pipe(finalize(() => this.isLoading.set(false)))
        .subscribe({
            next: (response) => {
                this.selectedSale.set(response.data);
                this.isDetailVisible.set(true);
            },
            error: (error) => {
                console.error('Error fetching sale details:', error);
                this.modalService.alert({ title: 'Error', message: 'No se pudo obtener el detalle de la venta.', type: 'error' });
            }
        });
    }

    async onCancelSale(id: number): Promise<void> {
        if (!this.authService.isAdmin()) {
            this.modalService.alert({
                title: 'Acceso Denegado',
                message: 'Solo los administradores tienen permiso para anular o invalidar ventas.',
                type: 'warning'
            });
            return;
        }

        const confirmed = await this.modalService.confirm({
            title: 'Confirmar Anulación',
            message: '¿Estás seguro de anular esta venta? Esta acción no se puede deshacer.',
            confirmText: 'Sí, anular',
            cancelText: 'Cancelar',
            btnColor: 'danger'
        });

        if (confirmed) {
            this.isLoading.set(true);
            this.saleService.cancel(id).subscribe({
                next: () => {
                    this.loadAllData();
                    this.modalService.alert({ title: 'Éxito', message: 'Venta anulada correctamente.', type: 'success' });
                },
                error: (err) => {
                    this.isLoading.set(false);
                    this.modalService.alert({ title: 'Error', message: 'Error al anular la venta.', type: 'error' });
                    console.error(err);
                }
            });
        }
    }

    async onEmitSunat(id: number): Promise<void> {
        const confirmed = await this.modalService.confirm({
            title: 'Confirmar Emisión',
            message: '¿Estás seguro de emitir este comprobante a SUNAT ahora?',
            confirmText: 'Sí, emitir',
            cancelText: 'Cancelar',
            btnColor: 'primary'
        });

        if (confirmed) {
            this.isLoading.set(true);
            this.sunatService.emitInvoice(id).subscribe({
                next: (res) => {
                    this.loadAllData();
                    this.modalService.alert({ 
                        title: 'Comprobante Emitido', 
                        message: res.message || 'El comprobante ha sido emitido exitosamente a SUNAT.', 
                        type: 'success' 
                    });
                },
                error: (err) => {
                    this.isLoading.set(false);
                    this.modalService.alert({ 
                        title: 'Error de Emisión', 
                        message: err.error?.message || 'Ocurrió un error al enviar el comprobante a SUNAT.', 
                        type: 'error' 
                    });
                }
            });
        }
    }
}
