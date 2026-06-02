import { Component, OnInit, inject, signal, input, output, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductResponse } from '../../../../core/models/product.model';
import { CustomTableComponent, TableColumn, BadgeItem } from '../../../../shared/components/custom-table/custom-table.component';

@Component({
    selector: 'app-product-list',
    standalone: true,
    imports: [CommonModule, CustomTableComponent],
    templateUrl: './product-list.component.html',
    styleUrl: './product-list.component.scss'
})
export class ProductListComponent implements OnInit {
    @ViewChild('codeTemplate', { static: true }) codeTemplate!: TemplateRef<any>;
    @ViewChild('productInfoTemplate', { static: true }) productInfoTemplate!: TemplateRef<any>;

    products = input<ProductResponse[]>([]);
    isLoading = input(false);
    
    pageSize = input<number>(10);
    totalElements = input<number>(0);
    currentPage = input<number>(0);

    create = output<void>();
    edit = output<number>();
    delete = output<ProductResponse>();
    
    pageChange = output<number>();
    pageSizeChange = output<number>();
    filterChange = output<any>();

    columns: TableColumn[] = [];

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

    handlePageChange(page: number) {
        this.pageChange.emit(page);
    }

    handlePageSizeChange(size: number) {
        this.pageSizeChange.emit(size);
    }

    handleFilterChange(filters: any) {
        this.filterChange.emit(filters);
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