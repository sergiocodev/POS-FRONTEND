import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductListComponent } from './product-list/product-list.component';
import { ProductFormComponent } from './product-form/product-form.component';
import { ProductService } from '../../../core/services/product.service';
import { MaintenanceService } from '../../../core/services/maintenance.service';
import { ModalService } from '../../../shared/components/confirm-modal/service/modal.service';
import { ProductResponse, CategoryResponse, BrandResponse, ActiveIngredientResponse, TaxTypeResponse, PresentationResponse } from '../../../core/models/product.model';
import { PharmaceuticalFormResponse } from '../../../core/models/pharmaceutical-form.model';
import { TherapeuticActionResponse } from '../../../core/models/therapeutic-action.model';
import { ModalGenericComponent } from '../../../shared/components/modal-generic/modal-generic.component';
import { ModuleHeaderComponent } from '../../../shared/components/module-header/module-header.component';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { ModalAlertComponent } from '../../../shared/components/modal-alert/modal-alert.component';
import { forkJoin } from 'rxjs';

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
    private maintenanceService = inject(MaintenanceService);
    private modalService = inject(ModalService);

    // State
    products = signal<ProductResponse[]>([]);
    isLoading = signal(false);

    // Lookup Data
    categories = signal<CategoryResponse[]>([]);
    brands = signal<BrandResponse[]>([]);
    therapeuticActions = signal<TherapeuticActionResponse[]>([]);
    laboratories = signal<any[]>([]); // Need to check LaboratoryResponse type
    presentations = signal<PresentationResponse[]>([]);
    taxTypes = signal<TaxTypeResponse[]>([]);
    activeIngredients = signal<ActiveIngredientResponse[]>([]);
    pharmaceuticalForms = signal<PharmaceuticalFormResponse[]>([]);

    // Modal State
    showForm = signal(false);
    selectedProductId = signal<number | null>(null);

    ngOnInit() {
        this.loadMasterData();
        this.loadProducts();
    }

    loadMasterData() {
        forkJoin({
            categories: this.maintenanceService.getAllCategory(),
            brands: this.maintenanceService.getAllBrands(),
            therapeuticActions: this.maintenanceService.getAllTherapeuticActions(),
            laboratories: this.maintenanceService.getAllLaboratory(),
            presentations: this.maintenanceService.getAllPresentations(),
            taxTypes: this.maintenanceService.getAllTaxTypes(),
            activeIngredients: this.maintenanceService.getAllActiveIngredients(),
            pharmaceuticalForms: this.maintenanceService.getAllPharmaceuticalForms()
        }).subscribe({
            next: (data) => {
                this.categories.set(data.categories.data);
                this.brands.set(data.brands.data);
                this.therapeuticActions.set(data.therapeuticActions.data);
                this.laboratories.set(data.laboratories.data);
                this.presentations.set(data.presentations.data);
                this.taxTypes.set(data.taxTypes.data);
                this.activeIngredients.set(data.activeIngredients.data);
                this.pharmaceuticalForms.set(data.pharmaceuticalForms.data);
            }
        });
    }

    loadProducts() {
        this.isLoading.set(true);
        this.productService.getAll().subscribe({
            next: (res) => {
                this.products.set(res.data);
                this.isLoading.set(false);
            },
            error: (err) => {
                console.error('Error loading products:', err);
                this.modalService.alert({ title: 'Error', message: 'No se pudieron cargar los productos', type: 'error' });
                this.isLoading.set(false);
            }
        });
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
