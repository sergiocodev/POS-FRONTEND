import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomerService } from '../../../core/services/customer.service';
import { CustomerResponse } from '../../../core/models/customer.model';
import { CustomerListComponent } from './customer-list/customer-list.component';
import { CustomerFormComponent } from './customer-form/customer-form.component';
import { ModalGenericComponent } from '../../../shared/components/modal-generic/modal-generic.component';
import { ModuleHeaderComponent } from '../../../shared/components/module-header/module-header.component';

@Component({
    selector: 'app-customers',
    standalone: true,
    imports: [
        CommonModule,
        CustomerListComponent,
        CustomerFormComponent,
        ModalGenericComponent,
        ModuleHeaderComponent
    ],
    templateUrl: './customers.component.html'
})
export class CustomersComponent implements OnInit {
    private customerService = inject(CustomerService);

    // State
    customers = signal<CustomerResponse[]>([]);
    isLoading = signal<boolean>(false);
    errorMessage = signal<string>('');

    // Modal State
    isModalOpen = signal<boolean>(false);
    selectedCustomerId = signal<number | null>(null);

    ngOnInit(): void {
        this.loadCustomers();
    }

    loadCustomers(): void {
        this.isLoading.set(true);
        this.errorMessage.set('');

        this.customerService.getAll().subscribe({
            next: (response) => {
                this.customers.set(response.data);
                this.isLoading.set(false);
            },
            error: (error) => {
                this.errorMessage.set('Error al cargar clientes. Intenta de nuevo.');
                this.isLoading.set(false);
                console.error('Error loading customers:', error);
            }
        });
    }

    onNew(): void {
        this.selectedCustomerId.set(null);
        this.isModalOpen.set(true);
    }

    onEdit(id: number): void {
        this.selectedCustomerId.set(id);
        this.isModalOpen.set(true);
    }

    onDelete(customer: CustomerResponse): void {
        if (confirm(`¿Estás seguro de eliminar al cliente "${customer.name}"?`)) {
            this.customerService.delete(customer.id).subscribe({
                next: () => {
                    this.loadCustomers();
                },
                error: (error) => {
                    this.errorMessage.set('Error al eliminar el cliente. Intenta de nuevo.');
                    console.error('Error deleting customer:', error);
                }
            });
        }
    }

    closeModal(): void {
        this.isModalOpen.set(false);
        this.selectedCustomerId.set(null);
    }

    handleSaveSuccess(): void {
        this.closeModal();
        this.loadCustomers();
    }
}
