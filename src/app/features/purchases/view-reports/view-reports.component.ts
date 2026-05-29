import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportService } from '../../../core/services/report.service';
import { EstablishmentStateService } from '../../../core/services/establishment-state.service';
import { EstablishmentService } from '../../../core/services/establishment.service';
import { MaintenanceService } from '../../../core/services/maintenance.service';
import { ProductService } from '../../../core/services/product.service';
import { EmployeeService } from '../../../core/services/employee.service';
import { SupplierService } from '../../../core/services/supplier.service';
import { EstablishmentResponse } from '../../../core/models/maintenance.model';
import { SupplierResponse } from '../../../core/models/supplier.model';
import { EmployeeResponse } from '../../../core/models/employee.model';

import { ModuleHeaderComponent } from '../../../shared/components/module-header/module-header.component';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';
import { CardReportComponent, CardReportOption } from '../../../shared/components/card-report/card-report.component';
import { PurchaseReportFiltersComponent } from './components/purchase-report-filters/purchase-report-filters.component';

export type PurchaseReportTab = 'comprobantes' | 'productos' | 'proveedores' | 'usuarios';

@Component({
    selector: 'app-purchase-view-reports',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ModuleHeaderComponent,
        SpinnerComponent,
        CardReportComponent,
        PurchaseReportFiltersComponent
    ],
    templateUrl: './view-reports.component.html',
    styleUrl: './view-reports.component.scss'
})
export class ViewReportsComponent implements OnInit {
    // Services
    private reportService = inject(ReportService);
    private establishmentStateService = inject(EstablishmentStateService);
    private establishmentService = inject(EstablishmentService);
    private maintenanceService = inject(MaintenanceService);
    private productService = inject(ProductService);
    private employeeService = inject(EmployeeService);
    private supplierService = inject(SupplierService);

    // Tab state
    activeTab = signal<PurchaseReportTab>('comprobantes');

    // Filter state (Global)
    startDate = signal('');
    endDate = signal('');
    
    establishments = signal<EstablishmentResponse[]>([]);
    selectedEstablishmentId = this.establishmentStateService.selectedEstablishmentId;
    
    suppliers = signal<SupplierResponse[]>([]);
    selectedSupplierId = signal<string | null>(null);
    
    buyers = signal<EmployeeResponse[]>([]);
    selectedBuyerId = signal<string | null>(null);

    // Local Card states
    categoriesOptions = signal<CardReportOption[]>([]);
    selectedCategoryIds = signal<number[]>([]);

    productOptions = signal<CardReportOption[]>([]);
    selectedProductId = signal<number | null>(null);

    supplierOptions = signal<CardReportOption[]>([]);
    selectedSupplierIdsForCard = signal<number[]>([]);

    buyerOptions = signal<CardReportOption[]>([]);
    selectedBuyerIdsForCard = signal<number[]>([]);

    // Loading
    isLoading = signal(false);

    // Tab definitions
    tabs: { key: PurchaseReportTab; label: string; icon: string }[] = [
        { key: 'comprobantes', label: 'Comprobantes', icon: 'bi-receipt' },
        { key: 'productos', label: 'Productos', icon: 'bi-box' },
        { key: 'proveedores', label: 'Proveedores', icon: 'bi-truck' },
        { key: 'usuarios', label: 'Compradores', icon: 'bi-person-badge' }
    ];

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
            next: (res) => this.establishments.set(res.data)
        });

        // Load Categories
        this.maintenanceService.getAllCategory().subscribe({
            next: (res) => {
                const options: CardReportOption[] = [
                    { id: 'all', label: 'Todas' },
                    ...res.data.map(cat => ({ id: cat.id, label: cat.name }))
                ];
                this.categoriesOptions.set(options);
            }
        });

        // Load Products
        this.productService.getAll().subscribe({
            next: (res) => {
                const options: CardReportOption[] = [
                    ...res.data.map(p => ({ id: p.id, label: p.tradeName }))
                ];
                this.productOptions.set(options);
            }
        });

        // Load Suppliers
        this.supplierService.getAll().subscribe({
            next: (res) => {
                this.suppliers.set(res.data);
                const options: CardReportOption[] = [
                    { id: 'all', label: 'Todos' },
                    ...res.data.map(s => ({ id: s.id, label: s.name }))
                ];
                this.supplierOptions.set(options);
            }
        });

        // Load Buyers (Employees)
        this.employeeService.getAll().subscribe({
            next: (res) => {
                this.buyers.set(res.data);
                const options: CardReportOption[] = [
                    { id: 'all', label: 'Todos' },
                    ...res.data.map(e => ({ id: e.id, label: `${e.firstName} ${e.lastName || ''}`.trim() }))
                ];
                this.buyerOptions.set(options);
            }
        });
    }

    setActiveTab(tab: PurchaseReportTab): void {
        this.activeTab.set(tab);
    }

    // ── Global Filter Handlers ──
    onEstablishmentChange(id: string): void {
        const estId = id ? parseInt(id, 10) : null;
        this.establishmentStateService.selectEstablishment(estId);
    }

    onSupplierGlobalChange(id: string): void {
        this.selectedSupplierId.set(id || null);
    }

    onBuyerGlobalChange(id: string): void {
        this.selectedBuyerId.set(id || null);
    }

    onDateRangeChange(range: { startDate: string, endDate: string }): void {
        this.startDate.set(range.startDate);
        this.endDate.set(range.endDate);
        this.loadTabData();
    }

    loadTabData(): void {
        // En compras no hay vista de tablas todavía, por lo que no es necesario cargar datos antes de descargar el PDF
    }

    // ── Dropdown Handlers ──

    onCategoryChange(option: CardReportOption | CardReportOption[] | null): void {
        this.handleMultipleSelection(option, this.selectedCategoryIds);
    }

    onSupplierCardChange(option: CardReportOption | CardReportOption[] | null): void {
        this.handleMultipleSelection(option, this.selectedSupplierIdsForCard);
    }

    onBuyerCardChange(option: CardReportOption | CardReportOption[] | null): void {
        this.handleMultipleSelection(option, this.selectedBuyerIdsForCard);
    }

    onSingleProductChange(option: CardReportOption | CardReportOption[] | null): void {
        if (!option) {
            this.selectedProductId.set(null);
            return;
        }
        if (!Array.isArray(option)) {
            this.selectedProductId.set(Number(option.id));
        }
    }

    private handleMultipleSelection(option: CardReportOption | CardReportOption[] | null, signalToUpdate: any): void {
        if (!option) {
            signalToUpdate.set([]);
            return;
        }
        if (Array.isArray(option)) {
            const hasAll = option.some(o => o.id === 'all');
            signalToUpdate.set(hasAll ? [] : option.map(o => Number(o.id)));
        } else {
            signalToUpdate.set(option.id === 'all' ? [] : [Number(option.id)]);
        }
    }

    // ── PDF Action Handlers ──

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

    private handlePdfError(): void {
        this.isLoading.set(false);
        alert('Error al generar el reporte PDF. Por favor, intente nuevamente.');
    }

    onViewPurchasePdfReport(): void {
        const estId = this.selectedEstablishmentId();
        if (estId === null) { alert('Seleccione un establecimiento'); return; }
        this.isLoading.set(true);
        this.reportService.getPurchasesFilteredPdf(this.startDate(), this.endDate(), estId).subscribe({
            next: (blob: Blob) => this.openPdf(blob, 'reporte_compras.pdf'),
            error: () => this.handlePdfError()
        });
    }

    onViewPurchaseStatusPdfReport(): void {
        const estId = this.selectedEstablishmentId();
        if (estId === null) { alert('Seleccione un establecimiento'); return; }
        this.isLoading.set(true);
        this.reportService.getPurchasesByStatusPdf(this.startDate(), this.endDate(), estId).subscribe({
            next: (blob: Blob) => this.openPdf(blob, 'reporte_compras_estados.pdf'),
            error: () => this.handlePdfError()
        });
    }

    onViewCategoryPdfReport(): void {
        const estId = this.selectedEstablishmentId();
        if (estId === null) { alert('Seleccione un establecimiento'); return; }
        this.isLoading.set(true);
        const categoryIds = this.selectedCategoryIds();
        this.reportService.getPurchasesByCategoryPdf(this.startDate(), this.endDate(), estId, categoryIds.length > 0 ? categoryIds : undefined).subscribe({
            next: (blob: Blob) => {
                this.openPdf(blob, 'reporte_compras_categorias.pdf');
                this.selectedCategoryIds.set([]);
            },
            error: () => this.handlePdfError()
        });
    }

    onViewPriceHistoryPdfReport(): void {
        const estId = this.selectedEstablishmentId();
        if (estId === null) { alert('Seleccione un establecimiento'); return; }
        this.isLoading.set(true);
        const productId = this.selectedProductId();
        this.reportService.getProductPriceHistoryPdf(this.startDate(), this.endDate(), estId, productId ? productId : undefined).subscribe({
            next: (blob: Blob) => {
                this.openPdf(blob, 'historial_precios.pdf');
                this.selectedProductId.set(null);
            },
            error: () => this.handlePdfError()
        });
    }

    onViewSupplierPdfReport(): void {
        const estId = this.selectedEstablishmentId();
        const supplierIds = this.selectedSupplierIdsForCard().length > 0 ? this.selectedSupplierIdsForCard() : (this.selectedSupplierId() ? [Number(this.selectedSupplierId())] : []);
        if (estId === null) { alert('Seleccione un establecimiento'); return; }
        this.isLoading.set(true);
        this.reportService.getPurchasesBySupplierPdf(this.startDate(), this.endDate(), estId, supplierIds.length > 0 ? supplierIds : undefined).subscribe({
            next: (blob: Blob) => this.openPdf(blob, 'reporte_compras_proveedores.pdf'),
            error: () => this.handlePdfError()
        });
    }

    onViewAccountsPayablePdfReport(): void {
        const estId = this.selectedEstablishmentId();
        const supplierIds = this.selectedSupplierIdsForCard().length > 0 ? this.selectedSupplierIdsForCard() : (this.selectedSupplierId() ? [Number(this.selectedSupplierId())] : []);
        if (estId === null) { alert('Seleccione un establecimiento'); return; }
        this.isLoading.set(true);
        this.reportService.getAccountsPayableBySupplierPdf(this.startDate(), this.endDate(), estId, supplierIds.length > 0 ? supplierIds : undefined).subscribe({
            next: (blob: Blob) => this.openPdf(blob, 'cuentas_por_pagar.pdf'),
            error: () => this.handlePdfError()
        });
    }

    onViewBuyerPdfReport(): void {
        const estId = this.selectedEstablishmentId();
        const buyerIds = this.selectedBuyerIdsForCard().length > 0 ? this.selectedBuyerIdsForCard() : (this.selectedBuyerId() ? [Number(this.selectedBuyerId())] : []);
        if (estId === null) { alert('Seleccione un establecimiento'); return; }
        this.isLoading.set(true);
        this.reportService.getPurchasesByBuyerPdf(this.startDate(), this.endDate(), estId, buyerIds.length > 0 ? buyerIds : undefined).subscribe({
            next: (blob: Blob) => this.openPdf(blob, 'reporte_compradores.pdf'),
            error: () => this.handlePdfError()
        });
    }
}
