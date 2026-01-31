import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { SupplierService } from '../../../core/services/supplier.service';
import { SupplierResponse } from '../../../core/models/supplier.model';

@Component({
    selector: 'app-supplier-list',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './supplier-list.component.html',
    styleUrl: './supplier-list.component.scss'
})
export class SupplierListComponent implements OnInit {
    private supplierService = inject(SupplierService);
    private router = inject(Router);

    suppliers = signal<SupplierResponse[]>([]);
    filteredSuppliers = signal<SupplierResponse[]>([]);
    isLoading = signal<boolean>(false);
    errorMessage = signal<string>('');
    searchTerm = signal<string>('');

    ngOnInit(): void {
        this.loadSuppliers();
    }

    loadSuppliers(): void {
        this.isLoading.set(true);
        this.errorMessage.set('');

        this.supplierService.getAll().subscribe({
            next: (data) => {
                this.suppliers.set(data);
                this.filteredSuppliers.set(data);
                this.isLoading.set(false);
            },
            error: (error) => {
                this.errorMessage.set('Error al cargar proveedores. Intenta de nuevo.');
                this.isLoading.set(false);
                console.error('Error loading suppliers:', error);
            }
        });
    }

    onSearch(event: Event): void {
        const input = event.target as HTMLInputElement;
        const term = input.value.toLowerCase();
        this.searchTerm.set(term);

        if (!term) {
            this.filteredSuppliers.set(this.suppliers());
            return;
        }

        const filtered = this.suppliers().filter(supplier =>
            supplier.name.toLowerCase().includes(term) ||
            supplier.ruc?.toLowerCase().includes(term) ||
            supplier.email?.toLowerCase().includes(term) ||
            supplier.phone?.includes(term)
        );
        this.filteredSuppliers.set(filtered);
    }

    onEdit(id: number): void {
        this.router.navigate(['/suppliers/edit', id]);
    }

    onDelete(supplier: SupplierResponse): void {
        if (confirm(`¿Estás seguro de eliminar al proveedor "${supplier.name}"?`)) {
            this.supplierService.delete(supplier.id).subscribe({
                next: () => {
                    this.loadSuppliers();
                },
                error: (error) => {
                    this.errorMessage.set('Error al eliminar el proveedor. Intenta de nuevo.');
                    console.error('Error deleting supplier:', error);
                }
            });
        }
    }

    toggleActive(supplier: SupplierResponse): void {
        const updatedSupplier = { ...supplier, active: !supplier.active };
        this.supplierService.update(supplier.id, updatedSupplier).subscribe({
            next: () => {
                this.loadSuppliers();
            },
            error: (error) => {
                this.errorMessage.set('Error al actualizar el estado. Intenta de nuevo.');
                console.error('Error updating supplier status:', error);
            }
        });
    }

    onNew(): void {
        this.router.navigate(['/suppliers/new']);
    }
}
