import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MaintenanceService } from '../../../../core/services/maintenance.service';
import { BrandResponse } from '../../../../core/models/brand.model';
import { CustomTableComponent, TableColumn } from '../../../../shared/components/custom-table/custom-table.component';
import { ModalGenericComponent } from '../../../../shared/components/modal-generic/modal-generic.component';
import { BrandFormComponent } from '../brand-form/brand-form.component';
import { ModuleHeaderComponent } from '../../../../shared/components/module-header/module-header.component';

@Component({
    selector: 'app-brands-list',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        FormsModule,
        CustomTableComponent,
        ModalGenericComponent,
        BrandFormComponent,
        ModuleHeaderComponent
    ],
    templateUrl: './brands-list.component.html',
    styleUrl: './brands-list.component.scss'
})
export class BrandsListComponent implements OnInit {
    private maintenanceService = inject(MaintenanceService);
    private router = inject(Router);

    // Configuración de la tabla
    cols: TableColumn[] = [
        { key: 'id', label: 'ID', type: 'text' },
        { key: 'name', label: 'Marca', type: 'text' },
        { key: 'active', label: 'Estado', type: 'toggle' },
        { key: 'actions', label: 'Acciones', type: 'action' }
    ];

    brands = signal<BrandResponse[]>([]);
    filteredBrands = signal<BrandResponse[]>([]);
    isLoading = signal(false);

    searchTerm = signal('');
    selectedStatusFilter = signal<boolean | null>(null);

    // Modal de Formulario
    showBrandModal = signal(false);
    selectedBrandId = signal<number | null>(null);

    // Pagination
    pageSize = 10;

    ngOnInit() {
        this.loadData();
    }

    loadData() {
        this.isLoading.set(true);
        this.maintenanceService.getBrands().subscribe({
            next: (response) => {
                const brands = response.data;
                this.brands.set(brands);
                this.filteredBrands.set(brands);
                this.isLoading.set(false);
            },
            error: (error) => {
                console.error('Error loading brands:', error);
                this.isLoading.set(false);
            }
        });
    }

    applyFilters() {
        let filtered = this.brands();

        const search = this.searchTerm().toLowerCase();
        if (search) {
            filtered = filtered.filter(brand =>
                brand.name.toLowerCase().includes(search)
            );
        }

        if (this.selectedStatusFilter() !== null) {
            filtered = filtered.filter(brand => brand.active === this.selectedStatusFilter());
        }

        this.filteredBrands.set(filtered);
    }

    onSearchChange(value: string) {
        this.searchTerm.set(value);
        this.applyFilters();
    }

    onStatusFilterChange(event: any) {
        const value = event === 'true' ? true : event === 'false' ? false : null;
        this.selectedStatusFilter.set(value);
        this.applyFilters();
    }

    // --- Actions ---

    handleTableAction(e: { action: string, row: BrandResponse }) {
        if (e.action === 'edit') {
            this.editBrand(e.row.id);
        } else if (e.action === 'delete') {
            this.deleteBrand(e.row);
        }
    }

    handleStatusToggle(e: { row: BrandResponse, key: string, checked: boolean }) {
        this.toggleBrandStatus(e.row);
    }

    createBrand() {
        this.selectedBrandId.set(null);
        this.showBrandModal.set(true);
    }

    editBrand(id: number) {
        this.selectedBrandId.set(id);
        this.showBrandModal.set(true);
    }

    onBrandSaved() {
        this.showBrandModal.set(false);
        this.loadData();
    }

    onBrandCancelled() {
        this.showBrandModal.set(false);
    }

    toggleBrandStatus(brand: BrandResponse) {
        if (confirm(`¿Está seguro de ${brand.active ? 'desactivar' : 'activar'} la marca "${brand.name}"?`)) {
            this.maintenanceService.updateBrand(brand.id, brand.name, !brand.active).subscribe({
                next: () => {
                    this.loadData();
                },
                error: (error) => {
                    console.error('Error toggling brand status:', error);
                    alert('Error al cambiar el estado de la marca');
                }
            });
        }
    }

    deleteBrand(brand: BrandResponse) {
        if (confirm(`¿Está seguro de eliminar la marca "${brand.name}"? Esta acción no se puede deshacer.`)) {
            this.maintenanceService.deleteBrand(brand.id).subscribe({
                next: () => {
                    this.loadData();
                },
                error: (error) => {
                    console.error('Error deleting brand:', error);
                    alert('Error al eliminar la marca');
                }
            });
        }
    }

    trackByBrandId(index: number, brand: BrandResponse): number {
        return brand.id;
    }
}
