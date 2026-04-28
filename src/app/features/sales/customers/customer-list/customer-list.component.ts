import { Component, OnInit, signal, computed, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CustomerResponse } from '../../../../core/models/customer.model';

@Component({
    selector: 'app-customer-list',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './customer-list.component.html',
    styleUrl: './customer-list.component.scss'
})
export class CustomerListComponent implements OnInit, OnChanges {
    // Inputs from Container
    @Input() customers: CustomerResponse[] = [];
    @Input() isLoading = false;
    @Input() errorMessage = '';

    // Outputs to Container
    @Output() newCustomer = new EventEmitter<void>();
    @Output() editCustomer = new EventEmitter<number>();
    @Output() deleteCustomer = new EventEmitter<CustomerResponse>();
    @Output() clearError = new EventEmitter<void>();

    searchTerm = signal<string>('');
    filteredCustomers = signal<CustomerResponse[]>([]);

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

    ngOnInit(): void {
        this.updateFilteredCustomers();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['customers']) {
            this.updateFilteredCustomers();
        }
    }

    updateFilteredCustomers(): void {
        const term = this.searchTerm().toLowerCase();
        if (!term) {
            this.filteredCustomers.set(this.customers);
        } else {
            const filtered = this.customers.filter(customer =>
                customer.name.toLowerCase().includes(term) ||
                customer.documentNumber.includes(term) ||
                customer.email?.toLowerCase().includes(term) ||
                customer.phone?.includes(term)
            );
            this.filteredCustomers.set(filtered);
        }
        this.currentPage.set(0);
    }

    onSearch(event: Event): void {
        const input = event.target as HTMLInputElement;
        this.searchTerm.set(input.value.toLowerCase());
        this.updateFilteredCustomers();
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

    onNew(): void {
        this.newCustomer.emit();
    }

    onEdit(id: number): void {
        this.editCustomer.emit(id);
    }

    onDelete(customer: CustomerResponse): void {
        this.deleteCustomer.emit(customer);
    }

    onClearError(): void {
        this.clearError.emit();
    }
}
