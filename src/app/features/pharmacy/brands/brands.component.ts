import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrandsListComponent } from './brands-list/brands-list.component';
import { BrandFormComponent } from './brand-form/brand-form.component';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { ModalAlertComponent } from '../../../shared/components/modal-alert/modal-alert.component';
import { MaintenanceService } from '../../../core/services/maintenance.service';
import { ModalService } from '../../../shared/components/confirm-modal/service/modal.service';
import { BrandResponse } from '../../../core/models/brand.model';
import { ModalGenericComponent } from '../../../shared/components/modal-generic/modal-generic.component';
import { ModuleHeaderComponent } from '../../../shared/components/module-header/module-header.component';

@Component({
    selector: 'app-brands',
    standalone: true,
    imports: [
        CommonModule,
        BrandsListComponent,
        BrandFormComponent,
        ConfirmModalComponent,
        ModalAlertComponent,
        ModalGenericComponent,
        ModuleHeaderComponent
    ],
    templateUrl: './brands.component.html',
    styleUrl: './brands.component.scss'
})
export class BrandsComponent implements OnInit {
    private maintenanceService = inject(MaintenanceService);
    private modalService = inject(ModalService);

    // State
    brands = signal<BrandResponse[]>([]);
    isLoading = signal(false);

    // Modal State
    showBrandForm = signal(false);
    selectedBrandId = signal<number | null>(null);

    ngOnInit() {
        this.loadData();
    }

    loadData() {
        this.isLoading.set(true);

        this.maintenanceService.getAllBrands().subscribe({
            next: (response) => {
                this.brands.set(response.data);
                this.isLoading.set(false);
            },
            error: (error) => {
                console.error('Error loading brands:', error);
                this.modalService.alert({
                    title: 'Error',
                    message: 'No se pudieron cargar las marcas',
                    type: 'error'
                });
                this.isLoading.set(false);
            }
        });
    }

    onOpenForm(brandId: number | null = null) {
        this.selectedBrandId.set(brandId);
        this.showBrandForm.set(true);
    }

    onFormSaved() {
        this.showBrandForm.set(false);
        this.selectedBrandId.set(null);
        this.loadData();
    }

    onFormCancelled() {
        this.showBrandForm.set(false);
        this.selectedBrandId.set(null);
    }

    async onDeleteBrand(brand: BrandResponse) {
        const confirmed = await this.modalService.confirm({
            title: 'Eliminar Marca',
            message: `¿Está seguro de eliminar la marca <b>${brand.name}</b>? Esta acción no se puede deshacer.`,
            btnColor: 'danger',
            confirmText: 'Eliminar'
        });

        if (confirmed) {
            this.maintenanceService.deleteBrandById(brand.id).subscribe({
                next: () => {
                    this.loadData();
                    this.modalService.alert({ title: 'Eliminado', message: 'Marca eliminada correctamente', type: 'success' });
                },
                error: (error) => {
                    console.error(error);
                    this.modalService.alert({ title: 'Error', message: 'Error al eliminar la marca', type: 'error' });
                }
            });
        }
    }

}
