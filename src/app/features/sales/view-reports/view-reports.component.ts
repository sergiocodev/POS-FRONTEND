import { Component, OnInit, inject, signal, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { ReportService } from '../../../core/services/report.service';
import { EstablishmentStateService } from '../../../core/services/establishment-state.service';
import {
    SalesReport, SalesSummary,
    SalesByProductReport, SalesByPaymentMethodReport,
    SalesByLaboratoryReport, CategorySalesReport,
    EmployeeSalesReport, SalesByEmployeeCategoryReport,
    SalesByCategoryDetailReport, SalesByCustomerReport
} from '../../../core/models/report.model';
import { ResponseApi } from '../../../core/models/response-api.model';
import { BrandResponse, LaboratoryResponse, ProductResponse } from '../../../core/models/product.model';
import { TherapeuticActionResponse } from '../../../core/models/therapeutic-action.model';
import { EstablishmentResponse } from '../../../core/models/maintenance.model';
import { EstablishmentService } from '../../../core/services/establishment.service';
import { ModuleHeaderComponent } from '../../../shared/components/module-header/module-header.component';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';
import { CardReportComponent, CardReportOption, CardReportDropdownConfig } from '../../../shared/components/card-report/card-report.component';
import { MaintenanceService } from '../../../core/services/maintenance.service';
import { ProductService } from '../../../core/services/product.service';
import { EmployeeService } from '../../../core/services/employee.service';
import { CustomerService } from '../../../core/services/customer.service';
import { ReportFilters } from './components/report-filters/report-filters';
import { CustomTabsComponent, CustomTab } from '../../../shared/components/custom-tabs/custom-tabs.component';

export type ReportTab = 'comprobantes' | 'productos' | 'clientes' | 'vendedor';

@Component({
    selector: 'app-view-reports',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ModuleHeaderComponent,
        SpinnerComponent,
        CardReportComponent,
        ReportFilters,
        CustomTabsComponent
    ],
    templateUrl: './view-reports.component.html',
    styleUrl: './view-reports.component.scss'
})
export class ViewReportsComponent implements OnInit {
    private reportService = inject(ReportService);
    private establishmentStateService = inject(EstablishmentStateService);
    private establishmentService = inject(EstablishmentService);
    private maintenanceService = inject(MaintenanceService);
    private productService = inject(ProductService);
    private employeeService = inject(EmployeeService);
    private customerService = inject(CustomerService);

    // Tab state
    activeTab = signal<ReportTab>('comprobantes');

    // Filter state
    startDate = signal('');
    endDate = signal('');
    selectedDocumentType = signal<string>('');
    selectedSeries = signal<string>('');
    availableSeries = signal<string[]>([]);
    selectedSellerIds = signal<number[]>([]);
    selectedCustomerIds = signal<number[]>([]);
    selectedSellerIdsForSellerCard = signal<number[]>([]);
    sellers = signal<{ id: number, name: string }[]>([]);
    sellerOptions = computed(() => [
        { id: 0, label: 'Todos' },
        ...this.sellers().map(s => ({ id: s.id, label: s.name }))
    ]);

    // Customer state for card
    customers = signal<{ id: number, name: string }[]>([]);
    customerOptions = computed(() => [
        { id: 0, label: 'Todos' },
        ...this.customers().map(c => ({ id: c.id, label: c.name }))
    ]);
    selectedCustomerIdsForCard = signal<number[]>([]);

    // Category filter for card
    categoriesOptions = signal<CardReportOption[]>([]);
    selectedCategoryIds = signal<number[]>([]);

    selectedSeriesForCard = signal<string[]>([]);

    seriesOptionsForCard = signal<CardReportOption[]>([]);

    // Product, Brand, Therapeutic Action filter for card
    allProductsData = signal<ProductResponse[]>([]);
    productOptions = signal<CardReportOption[]>([]);
    brandOptions = signal<CardReportOption[]>([]);
    therapeuticActionOptions = signal<CardReportOption[]>([]);

    selectedProductIdsForCard = signal<number[]>([]);
    selectedBrandIdsForCard = signal<number[]>([]);
    selectedTherapeuticActionIdsForCard = signal<number[]>([]);

    productCardDropdownConfigs = computed<CardReportDropdownConfig[]>(() => {
        const selectedBrandIds = this.selectedBrandIdsForCard();
        const selectedActionIds = this.selectedTherapeuticActionIdsForCard();

        // Get names for selected brands to match with ProductResponse.brandName
        const selectedBrandNames = this.brandOptions()
            .filter(b => selectedBrandIds.includes(Number(b.id)))
            .map(b => b.label.toLowerCase());

        // Filter products based on selected Brand and/or Therapeutic Action
        let filteredProducts = this.allProductsData();

        if (selectedBrandNames.length > 0) {
            filteredProducts = filteredProducts.filter(p =>
                p.brandName && selectedBrandNames.includes(p.brandName.toLowerCase())
            );
        }

        if (selectedActionIds.length > 0) {
            filteredProducts = filteredProducts.filter(p =>
                p.therapeuticActionIds?.some(id => selectedActionIds.includes(id))
            );
        }

        const productOpts: CardReportOption[] = [
            { id: 'all', label: 'Todos' },
            ...filteredProducts.map(p => ({ id: p.id, label: p.tradeName }))
        ];

        return [
            {
                key: 'therapeuticAction',
                options: this.therapeuticActionOptions(),
                placeholder: 'Seleccione Acción Terapéutica',
                multiple: true
            },
            {
                key: 'brand',
                options: this.brandOptions(),
                placeholder: 'Seleccione Marca',
                multiple: true
            },
            {
                key: 'product',
                options: productOpts,
                placeholder: 'Seleccione Producto',
                multiple: true
            }


        ];
    });

    isProductCombinationValid = computed(() => {
        const pIds = this.selectedProductIdsForCard();
        const bIds = this.selectedBrandIdsForCard();
        const tIds = this.selectedTherapeuticActionIdsForCard();

        // Valid if no specific products are selected (we use filters)
        if (pIds.length === 0) return true;

        // If products are selected, check if any of them match the brand/action filters
        // to avoid empty reports.
        const selectedBrandNames = this.brandOptions()
            .filter(b => bIds.includes(Number(b.id)))
            .map(b => b.label.toLowerCase());

        const matchingProducts = this.allProductsData().filter(p => pIds.includes(p.id));

        const validCount = matchingProducts.filter(p => {
            const matchesBrand = bIds.length === 0 || (p.brandName && selectedBrandNames.includes(p.brandName.toLowerCase()));
            const matchesAction = tIds.length === 0 || p.therapeuticActionIds?.some(id => tIds.includes(id));
            return matchesBrand && matchesAction;
        }).length;

        return validCount > 0;
    });

    cardDropdownConfigs = computed<CardReportDropdownConfig[]>(() => [
        {
            key: 'series',
            options: this.seriesOptionsForCard(),
            placeholder: 'Seleccione Serie',
            multiple: true
        }
    ]);

    singleProductDropdownConfig = computed<CardReportDropdownConfig[]>(() => [
        {
            key: 'product',
            options: this.productOptions(),
            placeholder: 'Seleccione Producto',
            multiple: true
        }
    ]);

    // Loading
    isLoading = signal(false);

    // Establishment
    selectedEstablishmentId = this.establishmentStateService.selectedEstablishmentId;
    establishments = signal<EstablishmentResponse[]>([]);

    // Data signals for each tab
    salesFiltered = signal<SalesReport[]>([]);
    salesSummary = signal<SalesSummary | null>(null);
    salesByProduct = signal<SalesByProductReport[]>([]);
    salesByPaymentMethod = signal<SalesByPaymentMethodReport[]>([]);
    salesByLaboratory = signal<SalesByLaboratoryReport[]>([]);
    salesByCategory = signal<CategorySalesReport[]>([]);
    salesByEmployee = signal<EmployeeSalesReport[]>([]);
    salesByEmployeeCategory = signal<SalesByEmployeeCategoryReport[]>([]);
    salesByCategoryDetail = signal<SalesByCategoryDetailReport[]>([]);
    salesByCustomer = signal<SalesByCustomerReport[]>([]);

    // Document types available
    documentTypes = [
        { value: '', label: 'Todos' },
        { value: 'BOLETA', label: 'Boleta' },
        { value: 'FACTURA', label: 'Factura' },
        { value: 'NOTA_DE_VENTA', label: 'Nota de Venta' },
        { value: 'NOTA_CREDITO', label: 'Nota de Crédito' },
        { value: 'NOTA_DEBITO', label: 'Nota de Débito' }
    ];

    // Tab definitions
    tabs: CustomTab[] = [
        { key: 'comprobantes', label: 'Comprobantes', icon: 'bi-receipt' },
        { key: 'productos', label: 'Productos', icon: 'bi-box' },
        { key: 'clientes', label: 'Clientes', icon: 'bi-people' },
        { key: 'vendedor', label: 'Vendedor', icon: 'bi-person-badge' }
    ];

    // Computed totals for summary
    summaryTotals = computed(() => {
        const summary = this.salesSummary();
        if (!summary) return null;
        return {
            revenue: summary.totalRevenue,
            transactions: summary.totalTransactions,
            tax: summary.totalTax,
            voided: summary.voidedCount,
            voidedAmount: summary.voidedAmount
        };
    });

    constructor() {
        effect(() => {
            // Only fetch series, do not load tab data automatically
        }, { allowSignalWrites: true });

        effect(() => {
            const docType = this.selectedDocumentType();
            const estId = this.selectedEstablishmentId();

            if (docType && estId) {
                this.reportService.getAvailableSeries(estId, docType).subscribe({
                    next: (res) => {
                        this.availableSeries.set(res.data);
                        // Optional: Reset selected series if it's no longer in the list
                        if (this.selectedSeries() && !res.data.includes(this.selectedSeries())) {
                            this.selectedSeries.set('');
                        }
                    },
                    error: () => this.availableSeries.set([])
                });
            } else {
                this.availableSeries.set([]);
                this.selectedSeries.set('');
            }
        }, { allowSignalWrites: true });

        // Sync card series with global establishment
        effect(() => {
            const estId = this.selectedEstablishmentId();
            this.selectedSeriesForCard.set([]); // Reset when establishment changes

            if (estId) {
                this.reportService.getAvailableSeries(estId).subscribe({
                    next: (res) => {
                        const seriesOpts: CardReportOption[] = [
                            { id: 'all', label: 'Todos' },
                            ...res.data.map((s: string) => ({ id: s, label: s }))
                        ];
                        this.seriesOptionsForCard.set(seriesOpts);
                    },
                    error: () => this.seriesOptionsForCard.set([])
                });
            } else {
                this.seriesOptionsForCard.set([]);
            }
        }, { allowSignalWrites: true });
    }

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

        this.loadEstablishments();
        this.loadCategories();
        this.loadProductFilters();
        this.loadSellers();
        this.loadCustomers();
    }

    private loadCustomers(): void {
        this.customerService.getAll().subscribe({
            next: (res) => {
                this.customers.set(res.data.map(c => ({
                    id: c.id,
                    name: c.name
                })));
            }
        });
    }

    private loadProductFilters(): void {
        // Load Brands (Laboratories)
        this.maintenanceService.getAllBrands().subscribe({
            next: (res: ResponseApi<BrandResponse[]>) => {
                this.brandOptions.set([
                    { id: 'all', label: 'Todos' },
                    ...res.data.map((brand: BrandResponse) => ({ id: brand.id, label: brand.name }))
                ]);
            }
        });

        // Load Therapeutic Actions
        this.maintenanceService.getAllTherapeuticActions().subscribe({
            next: (res: ResponseApi<TherapeuticActionResponse[]>) => {
                this.therapeuticActionOptions.set([
                    { id: 'all', label: 'Todos' },
                    ...res.data.map((ta: TherapeuticActionResponse) => ({ id: ta.id, label: ta.name }))
                ]);
            }
        });

        // We'll use the getAllProducts from MaintenanceService or ProductService
        // But for a searchable dropdown, we might want to just load all for now or use search.
        // For simplicity in the card, we'll load all.
        this.productService.getAll().subscribe({
            next: (res: ResponseApi<ProductResponse[]>) => {
                this.allProductsData.set(res.data);
                this.productOptions.set([
                    { id: 'all', label: 'Todos' },
                    ...res.data.map((p: ProductResponse) => ({ id: p.id, label: p.tradeName }))
                ]);
            }
        });
    }

    private loadSellers(): void {
        this.employeeService.getAll().subscribe({
            next: (res) => {
                this.sellers.set(res.data.map(e => ({
                    id: e.id,
                    name: `${e.firstName} ${e.lastName || ''}`.trim()
                })));
            }
        });
    }

    private loadCategories(): void {
        this.maintenanceService.getAllCategory().subscribe({
            next: (res) => {
                const options: CardReportOption[] = [
                    { id: 'all', label: 'Todos' },
                    ...res.data.map(cat => ({ id: cat.id, label: cat.name }))
                ];
                this.categoriesOptions.set(options);
                this.selectedCategoryIds.set([]); // Default to "Todos" (empty array)
            }
        });
    }

    onCategoryChange(option: CardReportOption | CardReportOption[] | null): void {
        if (!option) {
            this.selectedCategoryIds.set([]);
            return;
        }

        if (Array.isArray(option)) {
            // Check if "all" was just selected
            const hasAll = option.some(o => o.id === 'all');
            if (hasAll) {
                this.selectedCategoryIds.set([]);
            } else {
                this.selectedCategoryIds.set(option.map(o => Number(o.id)));
            }
        } else {
            if (option.id === 'all') {
                this.selectedCategoryIds.set([]);
            } else {
                this.selectedCategoryIds.set([Number(option.id)]);
            }
        }
    }

    onCardDropdownChange(event: { key: string, value: CardReportOption | CardReportOption[] | null }): void {
        if (event.key === 'series') {
            const options = Array.isArray(event.value) ? event.value : (event.value ? [event.value] : []);

            // Check if "all" was just selected
            const hasAll = options.some(o => o.id === 'all');
            if (hasAll) {
                this.selectedSeriesForCard.set([]);
            } else {
                this.selectedSeriesForCard.set(options.map(o => String(o.id)));
            }
        }
    }

    onProductCardDropdownChange(event: { key: string, value: CardReportOption | CardReportOption[] | null }): void {
        const options = Array.isArray(event.value) ? event.value : (event.value ? [event.value] : []);
        const hasAll = options.some(o => o.id === 'all');
        const selectedIds = hasAll ? [] : options.map(o => Number(o.id));

        if (event.key === 'product') {
            this.selectedProductIdsForCard.set(selectedIds);
        } else if (event.key === 'brand') {
            this.selectedBrandIdsForCard.set(selectedIds);
        } else if (event.key === 'therapeuticAction') {
            this.selectedTherapeuticActionIdsForCard.set(selectedIds);
        }
    }

    private loadEstablishments(): void {
        this.establishmentService.getAll().subscribe({
            next: (res) => {
                this.establishments.set(res.data);
            }
        });
    }

    onEstablishmentChange(id: string): void {
        const estId = id ? parseInt(id, 10) : null;
        this.establishmentStateService.selectEstablishment(estId);
    }

    onSellerChange(id: string): void {
        this.selectedSellerIds.set(id ? [parseInt(id, 10)] : []);
    }

    onCustomerChange(id: string): void {
        this.selectedCustomerIds.set(id ? [parseInt(id, 10)] : []);
    }

    onSellerCardChange(option: CardReportOption | CardReportOption[] | null): void {
        if (!option) {
            this.selectedSellerIdsForSellerCard.set([]);
            return;
        }

        if (Array.isArray(option)) {
            // Check if "Todos" (0) was selected
            const hasAll = option.some(o => Number(o.id) === 0);
            if (hasAll) {
                this.selectedSellerIdsForSellerCard.set([0]);
            } else {
                this.selectedSellerIdsForSellerCard.set(option.map(o => Number(o.id)));
            }
        } else {
            this.selectedSellerIdsForSellerCard.set([Number(option.id)]);
        }
    }

    onCustomerCardChange(option: CardReportOption | CardReportOption[] | null): void {
        if (!option) {
            this.selectedCustomerIdsForCard.set([]);
            return;
        }

        if (Array.isArray(option)) {
            const hasAll = option.some(o => Number(o.id) === 0);
            if (hasAll) {
                this.selectedCustomerIdsForCard.set([0]);
            } else {
                this.selectedCustomerIdsForCard.set(option.map(o => Number(o.id)));
            }
        } else {
            this.selectedCustomerIdsForCard.set([Number(option.id)]);
        }
    }

    setActiveTab(tab: string): void {
        this.activeTab.set(tab as ReportTab);
    }

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

    onViewPdfReport(): void {
        const estId = this.selectedEstablishmentId();
        if (!estId) { alert('Seleccione un establecimiento'); return; }

        this.isLoading.set(true);
        const start = this.startDate();
        const end = this.endDate();
        const docType = this.selectedDocumentType() || undefined;
        const series = this.selectedSeries() || undefined;

        this.reportService.getSalesFilteredPdf(start, end, estId, docType, series).subscribe({
            next: (blob: Blob) => this.openPdf(blob, 'reporte_ventas.pdf'),
            error: () => this.handlePdfError()
        });
    }

    onViewCategoryPdfReport(): void {
        const estId = this.selectedEstablishmentId();
        if (!estId) { alert('Seleccione un establecimiento'); return; }

        this.isLoading.set(true);
        const start = this.startDate();
        const end = this.endDate();
        const categoryIds = this.selectedCategoryIds();

        this.reportService.getSalesByCategoryPdf(start, end, estId, categoryIds.length > 0 ? categoryIds : undefined).subscribe({
            next: (blob: Blob) => {
                this.openPdf(blob, 'reporte_ventas_categorias.pdf');
                this.selectedCategoryIds.set([]);
            },
            error: () => this.handlePdfError()
        });
    }

    onViewEstablishmentSeriesPdfReport(): void {
        const estId = this.selectedEstablishmentId();
        if (!estId) { alert('Seleccione un establecimiento'); return; }

        this.isLoading.set(true);
        const start = this.startDate();
        const end = this.endDate();
        const series = this.selectedSeriesForCard();

        this.reportService.getSalesBySeriesPdf(
            start,
            end,
            estId,
            series.length > 0 ? series : undefined
        ).subscribe({
            next: (blob: Blob) => {
                this.openPdf(blob, 'reporte_ventas_series.pdf');
                this.selectedSeriesForCard.set([]);
            },
            error: () => this.handlePdfError()
        });
    }

    onViewProductBrandTherapeuticPdfReport(): void {
        const estId = this.selectedEstablishmentId();
        if (!estId) { alert('Seleccione un establecimiento'); return; }

        this.isLoading.set(true);
        const start = this.startDate();
        const end = this.endDate();

        const productIds = this.selectedProductIdsForCard();
        const brandIds = this.selectedBrandIdsForCard();
        const therapeuticActionIds = this.selectedTherapeuticActionIdsForCard();

        this.reportService.getSalesByProductBrandTherapeuticPdf(
            start, end, estId,
            productIds.length > 0 ? productIds : undefined,
            brandIds.length > 0 ? brandIds : undefined,
            therapeuticActionIds.length > 0 ? therapeuticActionIds : undefined
        ).subscribe({
            next: (blob: Blob) => {
                this.openPdf(blob, 'reporte_ventas_productos.pdf');
                this.selectedProductIdsForCard.set([]);
                this.selectedBrandIdsForCard.set([]);
                this.selectedTherapeuticActionIdsForCard.set([]);
            },
            error: () => this.handlePdfError()
        });
    }

    // ── Seller-specific PDF handlers ──

    onViewSellerPdfReport(): void {
        const estId = this.selectedEstablishmentId();
        // Use local card selection if present, otherwise fallback to global filter selection
        const sellerIds = this.selectedSellerIdsForSellerCard().length > 0
            ? this.selectedSellerIdsForSellerCard()
            : this.selectedSellerIds();

        if (estId === null) { alert('Seleccione un establecimiento'); return; }
        if (sellerIds.length === 0) { alert('Seleccione un vendedor'); return; }

        this.isLoading.set(true);
        const start = this.startDate();
        const end = this.endDate();

        this.reportService.getSellerPdf(start, end, estId, sellerIds).subscribe({
            next: (blob: Blob) => this.openPdf(blob, 'reporte_ventas_vendedor.pdf'),
            error: () => this.handlePdfError()
        });
    }

    onViewSellerCategoryPdfReport(): void {
        const estId = this.selectedEstablishmentId();
        const sellerIds = this.selectedSellerIds();
        if (estId === null) { alert('Seleccione un establecimiento'); return; }
        if (sellerIds.length === 0) { alert('Seleccione un vendedor'); return; }

        this.isLoading.set(true);
        const start = this.startDate();
        const end = this.endDate();
        const categoryIds = this.selectedCategoryIds();

        this.reportService.getSellerCategoriesPdf(
            start, end, estId, sellerIds,
            categoryIds.length > 0 ? categoryIds : undefined
        ).subscribe({
            next: (blob: Blob) => {
                this.openPdf(blob, 'ventas_vendedor_categorias.pdf');
                this.selectedCategoryIds.set([]);
            },
            error: () => this.handlePdfError()
        });
    }

    onViewSellerProductPdfReport(): void {
        const estId = this.selectedEstablishmentId();
        const sellerIds = this.selectedSellerIds();
        if (estId === null) { alert('Seleccione un establecimiento'); return; }
        if (sellerIds.length === 0) { alert('Seleccione un vendedor'); return; }

        this.isLoading.set(true);
        const start = this.startDate();
        const end = this.endDate();
        const productIds = this.selectedProductIdsForCard();

        this.reportService.getSellerProductsPdf(
            start, end, estId, sellerIds,
            productIds.length > 0 ? productIds : undefined
        ).subscribe({
            next: (blob: Blob) => {
                this.openPdf(blob, 'ventas_vendedor_productos.pdf');
                this.selectedProductIdsForCard.set([]);
            },
            error: () => this.handlePdfError()
        });
    }

    // ── Customer-specific PDF handler ──

    onViewCustomerPdfReport(): void {
        const estId = this.selectedEstablishmentId();
        const customerIds = this.selectedCustomerIdsForCard().length > 0 
            ? this.selectedCustomerIdsForCard() 
            : this.selectedCustomerIds();

        if (estId === null) { alert('Seleccione un establecimiento'); return; }
        if (customerIds.length === 0) { alert('Seleccione un cliente'); return; }

        this.isLoading.set(true);
        const start = this.startDate();
        const end = this.endDate();

        this.reportService.getSalesByCustomerPdf(start, end, estId, customerIds).subscribe({
            next: (blob: Blob) => this.openPdf(blob, 'reporte_ventas_cliente.pdf'),
            error: () => this.handlePdfError()
        });
    }

    onFilter(): void {
        if (this.activeTab() !== 'comprobantes') {
            this.loadTabData();
        }
    }

    onDateRangeChange(range: { startDate: string, endDate: string }): void {
        this.startDate.set(range.startDate);
        this.endDate.set(range.endDate);
        this.loadTabData();
    }

    loadTabData(): void {
        const estId = this.selectedEstablishmentId();
        if (!estId) return;

        this.isLoading.set(true);
        const start = this.startDate();
        const end = this.endDate();

        switch (this.activeTab()) {
            case 'comprobantes':
                this.loadComprobantes(start, end, estId);
                break;
            case 'productos':
                this.loadProductos(start, end, estId);
                break;
            case 'clientes':
                this.loadClientes(start, end, estId);
                break;
            case 'vendedor':
                this.loadVendedor(start, end, estId);
                break;
        }
    }

    private loadComprobantes(start: string, end: string, estId: number): void {
        const docType = this.selectedDocumentType() || undefined;
        const series = this.selectedSeries() || undefined;

        this.reportService.getSalesFiltered(start, end, estId, docType, series).subscribe({
            next: (res) => {
                this.salesFiltered.set(res.data);
                this.loadSummary(start, end, estId);
            },
            error: () => {
                this.isLoading.set(false);
            }
        });
    }

    private loadProductos(start: string, end: string, estId: number): void {
        this.reportService.getSalesByProduct(start, end, estId).subscribe({
            next: (res) => {
                this.salesByProduct.set(res.data);
                this.isLoading.set(false);
            },
            error: () => {
                this.isLoading.set(false);
            }
        });
    }



    private loadClientes(start: string, end: string, estId: number): void {
        const customerIds = this.selectedCustomerIds();
        this.reportService.getSalesByCustomer(start, end, estId, customerIds.length > 0 ? customerIds : undefined).subscribe({
            next: (res) => {
                this.salesByCustomer.set(res.data);
                this.isLoading.set(false);
            },
            error: () => this.isLoading.set(false)
        });
    }

    private loadVendedor(start: string, end: string, estId: number): void {
        let completed = 0;
        const checkDone = () => { if (++completed >= 2) this.isLoading.set(false); };

        this.reportService.getSalesByEmployee(start, end, estId).subscribe({
            next: (res) => { this.salesByEmployee.set(res.data); checkDone(); },
            error: () => checkDone()
        });
        this.reportService.getSalesByEmployeeCategory(start, end, estId).subscribe({
            next: (res) => { this.salesByEmployeeCategory.set(res.data); checkDone(); },
            error: () => checkDone()
        });
    }

    private loadSummary(start: string, end: string, estId: number): void {
        this.reportService.getSalesSummary(start, end, estId).subscribe({
            next: (res) => {
                this.salesSummary.set(res.data);
                this.isLoading.set(false);
            },
            error: () => {
                this.isLoading.set(false);
            }
        });
    }

    getStatusClass(status: string): string {
        switch (status) {
            case 'COMPLETED': return 'badge-status-success';
            case 'CANCELED': return 'badge-status-danger';
            default: return 'badge-status-secondary';
        }
    }

    getStatusLabel(status: string): string {
        switch (status) {
            case 'COMPLETED': return 'Completada';
            case 'CANCELED': return 'Anulada';
            default: return status;
        }
    }

    getPaymentMethodLabel(method: string): string {
        const labels: Record<string, string> = {
            'EFECTIVO': 'Efectivo',
            'TRANSFERENCIA': 'Transferencia',
            'YAPE': 'Yape',
            'PLIN': 'Plin',
            'TARJETA': 'Tarjeta'
        };
        return labels[method] || method;
    }

    getPaymentMethodIcon(method: string): string {
        const icons: Record<string, string> = {
            'EFECTIVO': 'bi-cash-stack',
            'TRANSFERENCIA': 'bi-bank',
            'YAPE': 'bi-phone',
            'PLIN': 'bi-phone',
            'TARJETA': 'bi-credit-card'
        };
        return icons[method] || 'bi-wallet2';
    }

    getDocumentTypeLabel(docType: string): string {
        const labels: Record<string, string> = {
            'BOLETA': 'Boleta',
            'FACTURA': 'Factura',
            'TICKET': 'Ticket',
            'NOTA_DE_VENTA': 'Nota de Venta',
            'NOTA_CREDITO': 'Nota de Crédito',
            'NOTA_DEBITO': 'Nota de Débito'
        };
        return labels[docType] || docType;
    }

    // Expandable row state for category detail
    expandedCategories = signal<Set<number>>(new Set());

    toggleCategoryExpand(categoryId: number): void {
        const current = new Set(this.expandedCategories());
        if (current.has(categoryId)) {
            current.delete(categoryId);
        } else {
            current.add(categoryId);
        }
        this.expandedCategories.set(current);
    }

    isCategoryExpanded(categoryId: number): boolean {
        return this.expandedCategories().has(categoryId);
    }
}
