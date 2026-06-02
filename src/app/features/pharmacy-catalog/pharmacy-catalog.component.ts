import { Component, signal, inject, OnInit, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { MaintenanceService } from '../../core/services/maintenance.service';
import { ModalService } from '../../shared/components/confirm-modal/service/modal.service';
import { AuthService } from '../../core/services/auth.service';
import { PermissionConstants } from '../../core/constants/permission-constants';
import { CustomTableComponent, TableColumn } from '../../shared/components/custom-table/custom-table.component';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal/confirm-modal.component';
import { ModalAlertComponent } from '../../shared/components/modal-alert/modal-alert.component';
import { ModalGenericComponent } from '../../shared/components/modal-generic/modal-generic.component';
import { ModuleHeaderComponent } from '../../shared/components/module-header/module-header.component';
import { SpinnerComponent } from '../../shared/components/spinner/spinner.component';
// Form components
import { ActiveIngredientFormComponent } from './active-ingredients/active-ingredient-form/active-ingredient-form.component';
import { BrandFormComponent } from './brands/brand-form/brand-form.component';
import { CategoryFormComponent } from './categories/category-form/category-form.component';
import { LaboratoryFormComponent } from './laboratories/laboratory-form/laboratory-form.component';
import { PresentationFormComponent } from './presentations/presentation-form/presentation-form.component';
import { PharmaceuticalFormFormComponent } from './pharmaceutical-forms/pharmaceutical-form-form/pharmaceutical-form-form.component';
import { TherapeuticActionFormComponent } from './therapeutic-actions/therapeutic-action-form/therapeutic-action-form.component';
import { CustomTabsComponent, CustomTab } from '../../shared/components/custom-tabs/custom-tabs.component';

export interface CatalogTab extends CustomTab {
    key: string;
    label: string;
    icon: string;
    permission: string;
    columns: TableColumn[];
    loadFn: string;
    deleteFn: string;
    deleteLabel: string;
    createLabel: string;
    formTitle: string;
    editFormTitle: string;
}

@Component({
    selector: 'app-pharmacy-catalog',
    standalone: true,
    imports: [
        CommonModule,
        CustomTableComponent,
        ConfirmModalComponent,
        ModalAlertComponent,
        ModalGenericComponent,
        ModuleHeaderComponent,
        SpinnerComponent,
        ActiveIngredientFormComponent,
        BrandFormComponent,
        CategoryFormComponent,
        LaboratoryFormComponent,
        PresentationFormComponent,
        PharmaceuticalFormFormComponent,
        TherapeuticActionFormComponent,
        CustomTabsComponent
    ],
    templateUrl: './pharmacy-catalog.component.html',
    styleUrl: './pharmacy-catalog.component.scss'
})
export class PharmacyCatalogComponent implements OnInit {
    private maintenanceService = inject(MaintenanceService);
    private modalService = inject(ModalService);
    private authService = inject(AuthService);
    private route = inject(ActivatedRoute);
    private router = inject(Router);

    // All possible tabs
    private allTabs: CatalogTab[] = [
        {
            key: 'active-ingredients',
            label: 'P. Activos',
            icon: 'bi-capsule',
            permission: PermissionConstants.FARMACIA_PRINCIPIOS_ACTIVOS,
            columns: [
                { key: 'index', label: 'N°', type: 'index', width: '50px', align: 'center' },
                { key: 'name', label: 'Nombre', type: 'text', filterable: true },
                { key: 'description', label: 'Descripción', type: 'text', format: (v: string) => v || '-', filterable: false },
                { key: 'actions', label: 'Acciones', type: 'action', width: '100px', align: 'center' }
            ],
            loadFn: 'getPagedActiveIngredients',
            deleteFn: 'deleteActiveIngredientById',
            deleteLabel: 'principio activo',
            createLabel: 'Nuevo Principio Activo',
            formTitle: 'Nuevo Principio Activo',
            editFormTitle: 'Editar Principio Activo'
        },
        {
            key: 'brands',
            label: 'Marcas',
            icon: 'bi-tag-fill',
            permission: PermissionConstants.FARMACIA_MARCAS,
            columns: [
                { key: 'index', label: 'N°', type: 'index', width: '50px', align: 'center' },
                { key: 'name', label: 'Marca', type: 'text', filterable: true },
                { key: 'actions', label: 'Acciones', type: 'action', width: '100px', align: 'center' }
            ],
            loadFn: 'getPagedBrands',
            deleteFn: 'deleteBrandById',
            deleteLabel: 'marca',
            createLabel: 'Nueva Marca',
            formTitle: 'Nueva Marca',
            editFormTitle: 'Editar Marca'
        },
        {
            key: 'categories',
            label: 'Categorías',
            icon: 'bi-grid-fill',
            permission: PermissionConstants.FARMACIA_CATEGORIAS,
            columns: [
                { key: 'index', label: 'N°', type: 'index', width: '50px', align: 'center' },
                { key: 'name', label: 'Categoría', type: 'text', filterable: true },
                { key: 'actions', label: 'Acciones', type: 'action', width: '100px', align: 'center' }
            ],
            loadFn: 'getPagedCategories',
            deleteFn: 'deleteCategoryById',
            deleteLabel: 'categoría',
            createLabel: 'Nueva Categoría',
            formTitle: 'Nueva Categoría',
            editFormTitle: 'Editar Categoría'
        },
        {
            key: 'laboratories',
            label: 'Laboratorios',
            icon: 'bi-building-fill',
            permission: PermissionConstants.FARMACIA_LABORATORIOS,
            columns: [
                { key: 'index', label: 'N°', type: 'index', width: '50px', align: 'center' },
                { key: 'name', label: 'Laboratorio', type: 'text', filterable: true },
                { key: 'actions', label: 'Acciones', type: 'action', width: '100px', align: 'center' }
            ],
            loadFn: 'getPagedLaboratories',
            deleteFn: 'deleteLaboratoryById',
            deleteLabel: 'laboratorio',
            createLabel: 'Nuevo Laboratorio',
            formTitle: 'Nuevo Laboratorio',
            editFormTitle: 'Editar Laboratorio'
        },
        {
            key: 'presentations',
            label: 'Presentaciones',
            icon: 'bi-box-seam',
            permission: PermissionConstants.FARMACIA_PRESENTACIONES,
            columns: [
                { key: 'index', label: 'N°', type: 'index', width: '50px', align: 'center' },
                { key: 'description', label: 'Presentación', type: 'text', filterable: true },
                { key: 'actions', label: 'Acciones', type: 'action', width: '100px', align: 'center' }
            ],
            loadFn: 'getPagedPresentations',
            deleteFn: 'deletePresentationById',
            deleteLabel: 'presentación',
            createLabel: 'Nueva Presentación',
            formTitle: 'Nueva Presentación',
            editFormTitle: 'Editar Presentación'
        },
        {
            key: 'pharmaceutical-forms',
            label: 'F. Farmacéuticas',
            icon: 'bi-capsule',
            permission: PermissionConstants.FARMACIA_FORMAS,
            columns: [
                { key: 'index', label: 'N°', type: 'index', width: '50px', align: 'center' },
                { key: 'name', label: 'Forma Farmacéutica', type: 'text', filterable: true },
                { key: 'actions', label: 'Acciones', type: 'action', width: '100px', align: 'center' }
            ],
            loadFn: 'getPagedPharmaceuticalForms',
            deleteFn: 'deletePharmaceuticalFormById',
            deleteLabel: 'forma farmacéutica',
            createLabel: 'Nueva Forma Farmacéutica',
            formTitle: 'Nueva Forma Farmacéutica',
            editFormTitle: 'Editar Forma Farmacéutica'
        },
        {
            key: 'therapeutic-actions',
            label: 'A. Terapéuticas',
            icon: 'bi-shield-check',
            permission: PermissionConstants.FARMACIA_ACCIONES,
            columns: [
                { key: 'index', label: 'N°', type: 'index', width: '50px', align: 'center' },
                { key: 'name', label: 'Acción Terapéutica', type: 'text', filterable: true },
                { key: 'description', label: 'Descripción', type: 'text', format: (v: string) => v || '-' },
                { key: 'actions', label: 'Acciones', type: 'action', width: '100px', align: 'center' }
            ],
            loadFn: 'getPagedTherapeuticActions',
            deleteFn: 'deleteTherapeuticActionById',
            deleteLabel: 'acción terapéutica',
            createLabel: 'Nueva Acción Terapéutica',
            formTitle: 'Nueva Acción Terapéutica',
            editFormTitle: 'Editar Acción Terapéutica'
        }
    ];

    // Filtered tabs based on permissions
    tabs = computed(() => {
        return this.allTabs.filter(tab =>
            this.authService.hasAnyPermission([tab.permission])
        );
    });

    // Active tab
    activeTabKey = signal('');

    activeTab = computed(() => {
        return this.tabs().find(t => t.key === this.activeTabKey()) || this.tabs()[0];
    });

    // Data state
    data = signal<any[]>([]);
    isLoading = signal(false);
    isInitialLoading = signal(true);
    currentPage = signal(0);
    pageSize = signal(10);
    totalItems = signal(0);
    tableFilters = signal<any>({});

    // Cache to prevent re-fetching on tab change
    private tabCache = new Map<string, { data: any[], totalItems: number, currentPage: number, pageSize: number, filters: any }>();

    // Modal state
    showForm = signal(false);
    selectedItemId = signal<number | null>(null);

    constructor() {
        // Sync tab to URL query param
        effect(() => {
            const key = this.activeTabKey();
            if (key) {
                this.router.navigate([], {
                    relativeTo: this.route,
                    queryParams: { tab: key },
                    queryParamsHandling: 'merge',
                    replaceUrl: true
                });
            }
        });
    }

    ngOnInit() {
        // Read initial tab from query param
        const tabParam = this.route.snapshot.queryParamMap.get('tab');
        const availableTabs = this.tabs();
        if (tabParam && availableTabs.find(t => t.key === tabParam)) {
            this.activeTabKey.set(tabParam);
        } else if (availableTabs.length > 0) {
            this.activeTabKey.set(availableTabs[0].key);
        }
        
        // Load all tabs initially
        this.loadAllTabsInitially();
    }

    loadAllTabsInitially() {
        this.isInitialLoading.set(true);
        const availableTabs = this.tabs();
        const observables: Record<string, any> = {};

        // Prepare initial calls for all available tabs
        availableTabs.forEach(tab => {
            const loadFn = (this.maintenanceService as any)[tab.loadFn];
            if (loadFn) {
                // Initialize cache with default values for each tab
                this.tabCache.set(tab.key, { data: [], totalItems: 0, currentPage: 0, pageSize: 10, filters: {} });
                observables[tab.key] = loadFn.call(this.maintenanceService, 0, 10, {});
            }
        });

        if (Object.keys(observables).length === 0) {
            this.isInitialLoading.set(false);
            return;
        }

        forkJoin(observables).subscribe({
            next: (results: any) => {
                Object.keys(results).forEach(key => {
                    const pageData = results[key].data;
                    const cache = this.tabCache.get(key);
                    if (cache) {
                        cache.data = pageData.content || [];
                        cache.totalItems = pageData.totalElements || 0;
                    }
                });
                // Restore state for the currently active tab
                this.restoreTabState(this.activeTabKey());
                this.isInitialLoading.set(false);
            },
            error: (error) => {
                console.error('Error loading catalog data:', error);
                this.isInitialLoading.set(false);
                // Fallback to loading just the current tab if forkJoin fails
                this.loadData();
            }
        });
    }

    saveCurrentTabState() {
        const key = this.activeTabKey();
        if (this.tabCache.has(key)) {
            this.tabCache.set(key, {
                data: this.data(),
                totalItems: this.totalItems(),
                currentPage: this.currentPage(),
                pageSize: this.pageSize(),
                filters: this.tableFilters()
            });
        }
    }

    restoreTabState(key: string) {
        const cache = this.tabCache.get(key);
        if (cache) {
            this.data.set(cache.data);
            this.totalItems.set(cache.totalItems);
            this.currentPage.set(cache.currentPage);
            this.pageSize.set(cache.pageSize);
            this.tableFilters.set(cache.filters);
        }
    }

    onTabChangeByKey(key: string) {
        if (key === this.activeTabKey()) return;
        
        // Save current tab state before switching
        this.saveCurrentTabState();
        
        this.activeTabKey.set(key);
        
        // Restore next tab state if cached, otherwise load
        if (this.tabCache.has(key)) {
            this.restoreTabState(key);
        } else {
            this.currentPage.set(0);
            this.tableFilters.set({});
            this.data.set([]);
            this.loadData();
        }
    }

    onPageChange(page: number) {
        this.currentPage.set(page);
        this.loadData();
    }

    onPageSizeChange(size: number) {
        this.pageSize.set(size);
        this.currentPage.set(0);
        this.loadData();
    }

    onTableFilter(filters: any) {
        this.tableFilters.set(filters);
        this.currentPage.set(0);
        this.loadData();
    }

    loadData() {
        const tab = this.activeTab();
        if (!tab) return;

        // If it's the initial full-screen load, don't show the inline spinner
        if (!this.isInitialLoading()) {
            this.isLoading.set(true);
        }
        
        const loadFn = (this.maintenanceService as any)[tab.loadFn];
        if (!loadFn) {
            this.isLoading.set(false);
            return;
        }

        loadFn.call(this.maintenanceService, this.currentPage(), this.pageSize(), this.tableFilters()).subscribe({
            next: (response: any) => {
                const page = response.data;
                this.data.set(page.content || []);
                this.totalItems.set(page.totalElements || 0);
                this.saveCurrentTabState(); // Update cache
                this.isLoading.set(false);
            },
            error: (error: any) => {
                console.error(`Error loading ${tab.key}:`, error);
                this.modalService.alert({
                    title: 'Error',
                    message: `No se pudieron cargar los datos de ${tab.deleteLabel}s`,
                    type: 'error'
                });
                this.isLoading.set(false);
            }
        });
    }

    // --- CRUD Actions ---

    onOpenForm(itemId: number | null = null) {
        this.selectedItemId.set(itemId);
        this.showForm.set(true);
    }

    onFormSaved() {
        this.showForm.set(false);
        this.selectedItemId.set(null);
        this.loadData();
    }

    onFormCancelled() {
        this.showForm.set(false);
        this.selectedItemId.set(null);
    }

    handleTableAction(e: { action: string, row: any }) {
        if (e.action === 'edit') {
            this.onOpenForm(e.row.id);
        } else if (e.action === 'delete') {
            this.onDeleteItem(e.row);
        }
    }

    async onDeleteItem(item: any) {
        const tab = this.activeTab();
        if (!tab) return;

        const itemName = item.name || item.description || `ID ${item.id}`;

        const confirmed = await this.modalService.confirm({
            title: `Eliminar ${tab.deleteLabel}`,
            message: `¿Está seguro de eliminar ${tab.deleteLabel} <b>${itemName}</b>? Esta acción no se puede deshacer.`,
            btnColor: 'danger',
            confirmText: 'Eliminar'
        });

        if (confirmed) {
            const deleteFn = (this.maintenanceService as any)[tab.deleteFn];
            if (!deleteFn) return;

            deleteFn.call(this.maintenanceService, item.id).subscribe({
                next: () => {
                    this.loadData();
                    this.modalService.alert({
                        title: 'Eliminado',
                        message: `${tab.deleteLabel.charAt(0).toUpperCase() + tab.deleteLabel.slice(1)} eliminado(a) correctamente`,
                        type: 'success'
                    });
                },
                error: (error: any) => {
                    console.error(error);
                    this.modalService.alert({
                        title: 'Error',
                        message: `Error al eliminar ${tab.deleteLabel}`,
                        type: 'error'
                    });
                }
            });
        }
    }
}
