import { Component, OnInit, OnChanges, SimpleChanges, inject, signal, ViewChild, TemplateRef, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductResponse, CategoryResponse, BrandResponse } from '../../../../core/models/product.model';
import { TherapeuticActionResponse } from '../../../../core/models/therapeutic-action.model';
import { CustomTableComponent, TableColumn, BadgeItem } from '../../../../shared/components/custom-table/custom-table.component';

import { TableFilterComponent } from '../../../../shared/components/table-filter/table-filter.component';

@Component({
    selector: 'app-product-list',
    standalone: true,
    imports: [CommonModule, CustomTableComponent, TableFilterComponent, FormsModule],
    templateUrl: './product-list.component.html',
    styleUrl: './product-list.component.scss'
})
export class ProductListComponent implements OnInit, OnChanges {
    @ViewChild('codeTemplate', { static: true }) codeTemplate!: TemplateRef<any>;
    @ViewChild('productInfoTemplate', { static: true }) productInfoTemplate!: TemplateRef<any>;

    @Input() products: ProductResponse[] = [];
    @Input() isLoading = false;
    @Input() categories: CategoryResponse[] = [];
    @Input() brands: BrandResponse[] = [];
    @Input() therapeuticActions: TherapeuticActionResponse[] = [];

    @Output() create = new EventEmitter<void>();
    @Output() edit = new EventEmitter<number>();
    @Output() delete = new EventEmitter<ProductResponse>();
    @Output() toggleStatus = new EventEmitter<ProductResponse>();
    searchTerm = signal<string>('');

    // Filter Signals
    selectedCategory = signal<number | null>(null);
    selectedBrand = signal<number | null>(null);
    selectedTherapeuticAction = signal<number | null>(null);

    columns: TableColumn[] = [];
    filteredProducts = signal<ProductResponse[]>([]);

    ngOnInit(): void {
        this.setupColumns();
        this.applyLocalFilters();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['products'] || changes['categories'] || changes['brands'] || changes['therapeuticActions']) {
            this.applyLocalFilters();
        }
    }

    applyLocalFilters(): void {
        let filtered = this.products || [];
        const term = this.searchTerm().toLowerCase();

        if (term) {
            filtered = filtered.filter(product =>
                product.barcode?.toLowerCase().includes(term) ||
                product.digemidCode?.toLowerCase().includes(term) ||
                product.code.toLowerCase().includes(term) ||
                product.tradeName.toLowerCase().includes(term)
            );
        }

        if (this.selectedCategory() !== null) {
            const category = this.categories.find(c => c.id === this.selectedCategory());
            if (category) {
                filtered = filtered.filter(p => p.categoryName === category.name);
            }
        }

        if (this.selectedBrand() !== null) {
            const brand = this.brands.find(b => b.id === this.selectedBrand());
            if (brand) {
                filtered = filtered.filter(p => p.brandName === brand.name);
            }
        }

        if (this.selectedTherapeuticAction() !== null) {
            const action = this.therapeuticActions.find(a => a.id === this.selectedTherapeuticAction());
            if (action) {
                filtered = filtered.filter(p => p.therapeuticActionNames?.includes(action.name));
            }
        }

        this.filteredProducts.set(filtered);
    }

    setupColumns() {
        this.columns = [
            { key: 'index', label: 'N°', type: 'index', width: '50px' },
            {
                key: 'code',
                label: 'Código',
                type: 'template',
                filterable: true,
                templateRef: this.codeTemplate
            },
            {
                key: 'tradeName',
                label: 'Producto',
                type: 'template',
                filterable: true,
                templateRef: this.productInfoTemplate
            },
            {
                key: 'therapeuticActionNames',
                label: 'Acción Terapéutica',
                type: 'text',
                filterable: true
            },
            { key: 'categoryName', label: 'Categoría', type: 'text', filterable: true },
            { key: 'brandName', label: 'Marca', type: 'text', filterable: true },
            { key: 'laboratoryName', label: 'Laboratorio', type: 'text', filterable: true },
            {
                key: 'active',
                label: 'Estado',
                type: 'toggle'
            },
            { key: 'actions', label: 'Acciones', type: 'action' }
        ];
    }


    resetFilters(): void {
        this.searchTerm.set('');
        this.selectedCategory.set(null);
        this.selectedBrand.set(null);
        this.selectedTherapeuticAction.set(null);
        this.applyLocalFilters();
    }

    handleTableAction(event: { action: string, row: ProductResponse }) {
        if (event.action === 'edit') {
            this.edit.emit(event.row.id);
        } else if (event.action === 'delete') {
            this.delete.emit(event.row);
        }
    }

    handleTableToggle(event: { row: ProductResponse, key: string, checked: boolean }) {
        if (event.key === 'active') {
            this.toggleStatus.emit(event.row);
        }
    }

    onNew(): void {
        this.create.emit();
    }

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