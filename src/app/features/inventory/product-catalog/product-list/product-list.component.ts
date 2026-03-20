import { Component, OnInit, inject, signal, computed, input, output, ViewChild, TemplateRef } from '@angular/core';
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
export class ProductListComponent implements OnInit {
    @ViewChild('codeTemplate', { static: true }) codeTemplate!: TemplateRef<any>;
    @ViewChild('productInfoTemplate', { static: true }) productInfoTemplate!: TemplateRef<any>;

    products = input<ProductResponse[]>([]);
    isLoading = input(false);
    categories = input<CategoryResponse[]>([]);
    brands = input<BrandResponse[]>([]);
    therapeuticActions = input<TherapeuticActionResponse[]>([]);

    create = output<void>();
    edit = output<number>();
    delete = output<ProductResponse>();

    searchTerm = signal<string>('');

    // Filter Signals
    selectedCategory = signal<number | null>(null);
    selectedBrand = signal<number | null>(null);
    selectedTherapeuticAction = signal<number | null>(null);

    columns: TableColumn[] = [];

    filteredProducts = computed(() => {
        let result = this.products();
        const term = this.searchTerm().toLowerCase();

        if (term) {
            result = result.filter(product =>
                product.digemidCode?.toLowerCase().includes(term) ||
                product.code.toLowerCase().includes(term) ||
                product.tradeName.toLowerCase().includes(term)
            );
        }

        const currentCategoryId = this.selectedCategory();
        if (currentCategoryId !== null) {
            const category = this.categories().find(c => c.id === currentCategoryId);
            if (category) {
                result = result.filter(p => p.categoryName === category.name);
            }
        }

        const currentBrandId = this.selectedBrand();
        if (currentBrandId !== null) {
            const brand = this.brands().find(b => b.id === currentBrandId);
            if (brand) {
                result = result.filter(p => p.brandName === brand.name);
            }
        }

        const currentActionId = this.selectedTherapeuticAction();
        if (currentActionId !== null) {
            const action = this.therapeuticActions().find(a => a.id === currentActionId);
            if (action) {
                result = result.filter(p => p.therapeuticActionNames?.includes(action.name));
            }
        }

        return result;
    });

    ngOnInit(): void {
        this.setupColumns();
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
            { key: 'actions', label: 'Acciones', type: 'action' }
        ];
    }


    resetFilters(): void {
        this.searchTerm.set('');
        this.selectedCategory.set(null);
        this.selectedBrand.set(null);
        this.selectedTherapeuticAction.set(null);
    }

    handleTableAction(event: { action: string, row: ProductResponse }) {
        if (event.action === 'edit') {
            this.edit.emit(event.row.id);
        } else if (event.action === 'delete') {
            this.delete.emit(event.row);
        }
    }

    handleTableToggle(event: { row: ProductResponse, key: string, checked: boolean }) {
        // No longer toggling product active status
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