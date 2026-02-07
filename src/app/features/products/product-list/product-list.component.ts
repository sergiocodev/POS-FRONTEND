import { Component, OnInit, inject, signal, ViewChild, TemplateRef, effect } from '@angular/core';
import { TableFilterComponent } from '../../../shared/components/table-filter/table-filter.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ProductService } from '../../../core/services/product.service';
import { MaintenanceService } from '../../../core/services/maintenance.service';
import { ProductResponse, CategoryResponse, BrandResponse } from '../../../core/models/product.model';
import { TherapeuticActionResponse } from '../../../core/models/therapeutic-action.model';

// Importa tu componente de tabla y las interfaces
import { CustomTableComponent, TableColumn, BadgeItem } from '../../../shared/components/custom-table/custom-table.component';
import { ModuleHeaderComponent } from '../../../shared/components/module-header/module-header.component';
import { ModalGenericComponent } from '../../../shared/components/modal-generic/modal-generic.component';
import { ProductFormComponent } from '../product-form/product-form.component';

@Component({
    selector: 'app-product-list',
    standalone: true,
    imports: [CommonModule, RouterModule, CustomTableComponent, ModuleHeaderComponent, TableFilterComponent, FormsModule, ModalGenericComponent, ProductFormComponent], // <--- Importante agregar CustomTableComponent y ModuleHeaderComponent
    templateUrl: './product-list.component.html',
    styleUrl: './product-list.component.scss'
})
export class ProductListComponent implements OnInit {
    private productService = inject(ProductService);
    private maintenanceService = inject(MaintenanceService);
    private router = inject(Router);

    @ViewChild('codeTemplate', { static: true }) codeTemplate!: TemplateRef<any>;
    @ViewChild('productInfoTemplate', { static: true }) productInfoTemplate!: TemplateRef<any>;

    products = signal<ProductResponse[]>([]);
    filteredProducts = signal<ProductResponse[]>([]);
    isLoading = signal<boolean>(false);
    errorMessage = signal<string>('');
    searchTerm = signal<string>('');

    // Master Data Signals
    categories = signal<CategoryResponse[]>([]);
    brands = signal<BrandResponse[]>([]);
    therapeuticActions = signal<TherapeuticActionResponse[]>([]);

    // Filter Signals
    selectedCategory = signal<number | null>(null);
    selectedBrand = signal<number | null>(null);
    selectedTherapeuticAction = signal<number | null>(null);

    // Modal Signals
    showProductModal = signal<boolean>(false);
    selectedProductId = signal<number | null>(null);

    // 2. Definición de columnas para la Tabla Genérica
    columns: TableColumn[] = [];

    constructor() {
        effect(() => {
            this.searchTerm();
            this.selectedCategory();
            this.selectedBrand();
            this.selectedTherapeuticAction();
            this.applyLocalFilters();
        });
    }

    ngOnInit(): void {
        this.loadMasterData();
        this.loadProducts();
    }

    // Configuración de columnas (se llama después de que la vista inicializa el template)
    setupColumns() {
        this.columns = [
            {
                key: 'index',
                label: 'N°',
                type: 'index',
                width: '50px'
            },
            {
                key: 'code',
                label: 'Código',
                type: 'template', // <--- CAMBIO IMPORTANTE: Ahora es 'template'
                filterable: true,
                templateRef: this.codeTemplate // <--- Asignamos el nuevo template
            },
            {
                key: 'tradeName', // La key principal, pero usaremos template
                label: 'Producto',
                type: 'template',
                filterable: true,
                templateRef: this.productInfoTemplate // <--- Aquí pasamos el diseño complejo
            },
            {
                key: 'therapeuticActionNames',
                label: 'Acción Terapéutica',
                type: 'text',
                filterable: true,
                format: (val) => val // Podrías concatenar digemidCode aquí si quisieras simplificar
            },
            { key: 'categoryName', label: 'Categoría', type: 'text', filterable: true },
            { key: 'brandName', label: 'Marca', type: 'text', filterable: true },
            { key: 'laboratoryName', label: 'Laboratorio', type: 'text', filterable: true },
            {
                key: 'active',
                label: 'Estado',
                type: 'toggle',
                format: (val) => val ? 'Activo' : 'Inactivo'
            },
            { key: 'actions', label: 'Acciones', type: 'action' }
        ];
    }

    loadProducts(): void {
        this.isLoading.set(true);
        this.productService.getAll().subscribe({
            next: (response) => {
                const data = response.data;
                this.products.set(data);
                this.filteredProducts.set(data);
                this.setupColumns(); // Configuramos columnas al tener datos (o al inicio)
                this.isLoading.set(false);
            },
            error: (error) => {
                this.errorMessage.set('Error al cargar productos.');
                this.isLoading.set(false);
            }
        });
    }

    loadMasterData(): void {
        this.maintenanceService.getCategories().subscribe(res => this.categories.set(res.data));
        this.maintenanceService.getBrands().subscribe(res => this.brands.set(res.data));
        this.maintenanceService.getTherapeuticActions().subscribe(res => this.therapeuticActions.set(res.data));
    }

    // --- LÓGICA DE BÚSQUEDA ---
    applyLocalFilters(): void {
        let filtered = this.products();
        const term = this.searchTerm().toLowerCase();

        // Filter by Search Term
        if (term) {
            filtered = filtered.filter(product =>
                product.tradeName.toLowerCase().includes(term) ||
                product.genericName?.toLowerCase().includes(term) ||
                product.code.toLowerCase().includes(term)
            );
        }

        // Filter by Category
        if (this.selectedCategory() !== null) {
            const category = this.categories().find(c => c.id === this.selectedCategory());
            if (category) {
                filtered = filtered.filter(p => p.categoryName === category.name);
            }
        }

        // Filter by Brand
        if (this.selectedBrand() !== null) {
            const brand = this.brands().find(b => b.id === this.selectedBrand());
            if (brand) {
                filtered = filtered.filter(p => p.brandName === brand.name);
            }
        }

        // Filter by Therapeutic Action
        if (this.selectedTherapeuticAction() !== null) {
            const action = this.therapeuticActions().find(a => a.id === this.selectedTherapeuticAction());
            if (action) {
                filtered = filtered.filter(p => p.therapeuticActionNames?.includes(action.name));
            }
        }

        this.filteredProducts.set(filtered);
    }

    resetFilters(): void {
        this.selectedCategory.set(null);
        this.selectedBrand.set(null);
        this.selectedTherapeuticAction.set(null);
        // El effect se encargará de llamar a applyLocalFilters
    }

    // --- MANEJO DE ACCIONES DE LA TABLA ---
    handleTableAction(event: { action: string, row: ProductResponse }) {
        if (event.action === 'edit') {
            this.onEdit(event.row.id);
        } else if (event.action === 'delete') {
            this.onDelete(event.row);
        }
    }

    handleTableToggle(event: { row: ProductResponse, key: string, checked: boolean }) {
        if (event.key === 'active') {
            this.onToggleStatus(event.row);
        }
    }

    onEdit(id: number): void {
        this.selectedProductId.set(id);
        this.showProductModal.set(true);
    }

    onDelete(product: ProductResponse): void {
        if (confirm(`¿Estás seguro de eliminar "${product.tradeName}"?`)) {
            this.productService.delete(product.id).subscribe({
                next: () => this.loadProducts(),
                error: () => this.errorMessage.set('Error al eliminar.')
            });
        }
    }

    onToggleStatus(product: ProductResponse): void {
        this.productService.updateStatus(product.id, !product.active).subscribe({
            next: () => {
                this.loadProducts();
            },
            error: (error: any) => {
                this.errorMessage.set('Error al actualizar el estado.');
                console.error('Error updating product status:', error);
            }
        });
    }

    onNew(): void {
        this.selectedProductId.set(null);
        this.showProductModal.set(true);
    }

    onProductSaved(): void {
        this.showProductModal.set(false);
        this.loadProducts();
    }

    onProductCancelled(): void {
        this.showProductModal.set(false);
    }

    // --- HELPER PARA LOS BADGES DENTRO DEL TEMPLATE ---
    getProductBadges(product: ProductResponse): BadgeItem[] {
        const badges: BadgeItem[] = [];
        if (product.pharmaceuticalFormName) {
            badges.push({ label: product.pharmaceuticalFormName, class: 'bg-dark text-white' });
        }
        if (product.isGeneric) {
            badges.push({ label: 'Genérico', class: 'bg-info text-dark' });
        }
        if (product.requiresPrescription) {
            badges.push({ label: 'Receta', class: 'bg-warning text-dark' });
        }
        return badges;
    }
}