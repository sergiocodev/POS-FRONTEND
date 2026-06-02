import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductListComponent } from './product-list/product-list.component';
import { ProductFormComponent } from './product-form/product-form.component';
import { ProductService } from '../../../core/services/product.service';
import { ModalService } from '../../../shared/components/confirm-modal/service/modal.service';
import { ProductResponse } from '../../../core/models/product.model';
import { ModalGenericComponent } from '../../../shared/components/modal-generic/modal-generic.component';
import { ModuleHeaderComponent } from '../../../shared/components/module-header/module-header.component';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { ModalAlertComponent } from '../../../shared/components/modal-alert/modal-alert.component';

@Component({
    selector: 'app-product-catalog',
    standalone: true,
    imports: [
        CommonModule,
        ProductListComponent,
        ProductFormComponent,
        ModalGenericComponent,
        ModuleHeaderComponent,
        ConfirmModalComponent,
        ModalAlertComponent
    ],
    templateUrl: './product-catalog.component.html',
    styleUrl: './product-catalog.component.scss'
})
export class ProductCatalogComponent implements OnInit {
    private productService = inject(ProductService);
    private modalService = inject(ModalService);

    // State
    products = signal<ProductResponse[]>([]);
    isLoading = signal(false);

    currentPage = signal(0);
    pageSize = signal(10);
    totalElements = signal(0);
    tableFilters = signal<any>({});

    // Modal State
    showForm = signal(false);
    selectedProductId = signal<number | null>(null);

    ngOnInit() {
        this.loadProducts();
    }

    loadProducts() {
        this.isLoading.set(true);
        this.productService.getPaged(this.currentPage(), this.pageSize(), this.tableFilters()).subscribe({
            next: (res) => {
                const page = res.data;
                this.products.set(page.content || []);
                this.totalElements.set(page.totalElements || 0);
                this.isLoading.set(false);
            },
            error: (err) => {
                console.error('Error loading products:', err);
                this.modalService.alert({ title: 'Error', message: 'No se pudieron cargar los productos', type: 'error' });
                this.isLoading.set(false);
            }
        });
    }

    onPageChange(page: number) {
        this.currentPage.set(page);
        this.loadProducts();
    }

    onPageSizeChange(size: number) {
        this.pageSize.set(size);
        this.currentPage.set(0);
        this.loadProducts();
    }

    onFilterChange(filters: any) {
        this.tableFilters.set(filters);
        this.currentPage.set(0);
        this.loadProducts();
    }

    onOpenForm(id: number | null = null) {
        this.selectedProductId.set(id);
        this.showForm.set(true);
    }

    onFormSaved() {
        this.showForm.set(false);
        this.selectedProductId.set(null);
        this.loadProducts();
        this.modalService.alert({ title: 'Éxito', message: 'Producto guardado correctamente', type: 'success' });
    }

    onFormCancelled() {
        this.showForm.set(false);
        this.selectedProductId.set(null);
    }


    async onDelete(product: ProductResponse) {
        const confirmed = await this.modalService.confirm({
            title: 'Eliminar Producto',
            message: `¿Está seguro de eliminar el producto <b>${product.tradeName}</b>? Esta acción no se puede deshacer.`,
            btnColor: 'danger',
            confirmText: 'Eliminar'
        });

        if (confirmed) {
            this.productService.delete(product.id).subscribe({
                next: () => {
                    this.loadProducts();
                    this.modalService.alert({ title: 'Eliminado', message: 'Producto eliminado correctamente', type: 'success' });
                },
                error: (err) => {
                    console.error(err);
                    this.modalService.alert({ title: 'Error', message: 'No se pudo eliminar el producto', type: 'error' });
                }
            });
        }
    }
}
