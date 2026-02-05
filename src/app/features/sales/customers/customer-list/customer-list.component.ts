import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { CustomerService } from '../../../../core/services/customer.service';
import { CustomerResponse } from '../../../../core/models/customer.model';
import { ModalGenericComponent } from '../../../../shared/modal-generic/modal-generic.component';
import { CustomerFormComponent } from '../customer-form/customer-form.component';
import { ModuleHeaderComponent } from '../../../../shared/components/module-header/module-header.component';

@Component({
    selector: 'app-customer-list',
    standalone: true,
    imports: [CommonModule, RouterModule, ModalGenericComponent, CustomerFormComponent, ModuleHeaderComponent],
    templateUrl: './customer-list.component.html',
    styleUrl: './customer-list.component.scss'
})
export class CustomerListComponent implements OnInit {
    private customerService = inject(CustomerService);
    private router = inject(Router);

    customers = signal<CustomerResponse[]>([]);
    filteredCustomers = signal<CustomerResponse[]>([]);
    isLoading = signal<boolean>(false);
    errorMessage = signal<string>('');
    searchTerm = signal<string>('');
    isModalOpen = signal<boolean>(false);
    selectedCustomerId = signal<number | null>(null);

    ngOnInit(): void {
        this.loadCustomers();
    }

    loadCustomers(): void {
        this.isLoading.set(true);
        this.errorMessage.set('');

        this.customerService.getAll().subscribe({
            next: (data) => {
                this.customers.set(data);
                this.filteredCustomers.set(data);
                this.isLoading.set(false);
            },
            error: (error) => {
                this.errorMessage.set('Error al cargar clientes. Intenta de nuevo.');
                this.isLoading.set(false);
                console.error('Error loading customers:', error);
            }
        });
    }

    onSearch(event: Event): void {
        const input = event.target as HTMLInputElement;
        const term = input.value.toLowerCase();
        this.searchTerm.set(term);

        if (!term) {
            this.filteredCustomers.set(this.customers());
            return;
        }

        const filtered = this.customers().filter(customer =>
            customer.name.toLowerCase().includes(term) ||
            customer.documentNumber.includes(term) ||
            customer.email?.toLowerCase().includes(term) ||
            customer.phone?.includes(term)
        );
        this.filteredCustomers.set(filtered);
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

    onNew(): void {
        this.selectedCustomerId.set(null);
        this.isModalOpen.set(true);
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
