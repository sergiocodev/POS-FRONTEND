import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AccountPayableService } from '../../../core/services/account-payable.service';
import { CashSessionService } from '../../../core/services/cash-session.service';
import { ModalService } from '../../../shared/components/confirm-modal/service/modal.service';
import { AccountPayableResponse, PayablePaymentMethod, AccountPayablePaymentRequest, AccountPayablePaymentResponse } from '../../../core/models/account-payable.model';
import { AccountPayableListComponent } from './account-payable-list/account-payable-list.component';
import { ModalGenericComponent } from '../../../shared/components/modal-generic/modal-generic.component';
import { ModalAlertComponent } from '../../../shared/components/modal-alert/modal-alert.component';
import { ModuleHeaderComponent } from '../../../shared/components/module-header/module-header.component';
import { SmartKpiCardsComponent, SmartKpiItem } from '../../../shared/components/smart-kpi-cards/smart-kpi-cards.component';
import { RegisterPayComponent } from './register-pay/register-pay.component';
import { PaymentHistoryComponent } from './payment-history/payment-history.component';

@Component({
    selector: 'app-account-payables',
    standalone: true,
    imports: [
        CommonModule,
        AccountPayableListComponent,
        ModalGenericComponent,
        ModalAlertComponent,
        ModuleHeaderComponent,
        SmartKpiCardsComponent,
        RegisterPayComponent,
        PaymentHistoryComponent,
    ],
    templateUrl: './account-payables.component.html',
    styleUrl: './account-payables.component.scss'
})
export class AccountPayablesComponent implements OnInit {
    private accountPayableService = inject(AccountPayableService);
    private cashSessionService = inject(CashSessionService);
    private modalService = inject(ModalService);

    // State
    payables = signal<AccountPayableResponse[]>([]);
    isLoading = signal<boolean>(false);
    kpiItems = signal<SmartKpiItem[]>([]);

    // Pagination & Filtering
    totalElements = signal<number>(0);
    pageSize = signal<number>(10);
    currentPage = signal<number>(0);
    filterValues = signal<any>({});

    // Modal State for Payment
    showPaymentModal = signal<boolean>(false);
    selectedPayable = signal<AccountPayableResponse | null>(null);

    // Modal State for History
    showHistoryModal = signal<boolean>(false);

    ngOnInit(): void {
        this.loadDashboard();
        this.loadPayables();
    }

    loadPayables() {
        this.isLoading.set(true);
        const params = {
            page: this.currentPage(),
            size: this.pageSize(),
            supplierName: this.filterValues().supplierName || '',
            purchaseIdentifier: this.filterValues().purchaseIdentifier || '',
            createdAt: this.filterValues().createdAt || '',
            status: this.filterValues().status || '',
            dueDate: this.filterValues().dueDate || ''
        };

        this.accountPayableService.getAllPaged(params).subscribe({
            next: (response: any) => {
                const data = response.data;
                const mappedData = data.content.map((item: AccountPayableResponse) => ({
                    ...item,
                    actions: [
                        { id: 'pay', icon: 'bi-cash-stack', class: 'btn-success', title: 'Pagar' },
                        { id: 'view', icon: 'bi-search', class: 'btn-primary', title: 'Ver Historial' }
                    ]
                }));
                this.payables.set(mappedData);
                this.totalElements.set(data.totalElements);
                this.isLoading.set(false);
            },
            error: (err: any) => {
                this.isLoading.set(false);
                this.modalService.alert({ title: 'Error', message: 'No se pudieron cargar las cuentas por pagar', type: 'error' });
            }
        });
    }

    onPageChange(page: number) {
        this.currentPage.set(page);
        this.loadPayables();
    }

    onPageSizeChange(size: number) {
        this.pageSize.set(size);
        this.currentPage.set(0);
        this.loadPayables();
    }

    onFilterChange(filters: any) {
        this.filterValues.set(filters);
        this.currentPage.set(0);
        this.loadPayables();
    }

    loadDashboard() {
        this.accountPayableService.getDashboard().subscribe({
            next: (response: any) => {
                const data = response.data ? response.data : response;

                const styles: any = {
                    'TOTAL PENDIENTE': { icon: 'bi-cash', color: 'blue' },
                    'MONTO VENCIDO': { icon: 'bi-exclamation-triangle', color: 'orange' },
                    'POR VENCER': { icon: 'bi-clock', color: 'purple' },
                    'TASA EFECTIVA': { icon: 'bi-check-circle', color: 'green' }
                };

                const mappedData = data.map((item: any) => ({
                    ...item,
                    ...(styles[item.label] || { icon: 'bi-info-circle', color: 'blue' })
                }));

                this.kpiItems.set(mappedData);
            },
            error: (err: any) => {
                console.error("Error loading dashboard KPIs", err);
            }
        });
    }

    onPayAction(payable: AccountPayableResponse) {
        if (payable.status === 'PAID') {
            this.modalService.alert({ title: 'Aviso', message: 'Esta cuenta ya está totalmente pagada.', type: 'warning' });
            return;
        }
        if (payable.status === 'CANCELED') {
            this.modalService.alert({ title: 'Aviso', message: 'Esta cuenta está anulada.', type: 'warning' });
            return;
        }
        this.selectedPayable.set(payable);
        this.showPaymentModal.set(true);
    }

    closePaymentModal() {
        this.showPaymentModal.set(false);
        this.selectedPayable.set(null);
    }

    onPaymentSuccess() {
        this.closePaymentModal();
        this.loadPayables();
    }

    onViewAction(payable: AccountPayableResponse) {
        this.selectedPayable.set(payable);
        this.showHistoryModal.set(true);
    }

    closeHistoryModal() {
        this.showHistoryModal.set(false);
        if (!this.showPaymentModal()) {
            this.selectedPayable.set(null);
        }
    }
}
