import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { CustomerService } from '../../../../core/services/customer.service';
import { CustomerResponse } from '../../../../core/models/customer.model';
import { ModalGenericComponent } from '../../../../shared/components/modal-generic/modal-generic.component';
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

    // Client-side pagination
    currentPage = signal(0);
    pageSize = signal(20);

    pagedCustomers = computed(() => {
        const start = this.currentPage() * this.pageSize();
        return this.filteredCustomers().slice(start, start + this.pageSize());
    });

    totalItems = computed(() => this.filteredCustomers().length);
    totalPages = computed(() => Math.ceil(this.totalItems() / this.pageSize()));

    get displayStart(): number {
        return this.totalItems() === 0 ? 0 : (this.currentPage() * this.pageSize()) + 1;
    }

    get displayEnd(): number {
        const end = (this.currentPage() + 1) * this.pageSize();
        return Math.min(end, this.totalItems());
    }

    get pageNumbers(): number[] {
        const total = this.totalPages();
        const current = this.currentPage();
        const pages: number[] = [];

        if (total <= 7) {
            for (let i = 0; i < total; i++) pages.push(i);
        } else {
            pages.push(0, 1, 2);
            if (current > 4) pages.push(-1);
            const start = Math.max(3, current - 1);
            const end = Math.min(total - 3, current + 1);
            for (let i = start; i <= end; i++) pages.push(i);
            if (current < total - 5) pages.push(-2);
            pages.push(total - 3, total - 2, total - 1);
        }

        return pages;
    }

    goToPage(page: number): void {
        if (page >= 0 && page < this.totalPages()) {
            this.currentPage.set(page);
        }
    }

    previousPage(): void {
        if (this.currentPage() > 0) {
            this.currentPage.set(this.currentPage() - 1);
        }
    }

    nextPage(): void {
        if (this.currentPage() < this.totalPages() - 1) {
            this.currentPage.set(this.currentPage() + 1);
        }
    }

    onPageClick(page: number): void {
        if (page < 0) return;
        this.goToPage(page);
    }

    isEllipsis(page: number): boolean {
        return page < 0;
    }

    ngOnInit(): void {
        this.loadCustomers();
    }

    loadCustomers(): void {
        this.isLoading.set(true);
        this.errorMessage.set('');

        this.customerService.getAll().subscribe({
            next: (response) => {
                const data = response.data;
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
        this.currentPage.set(0);

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
