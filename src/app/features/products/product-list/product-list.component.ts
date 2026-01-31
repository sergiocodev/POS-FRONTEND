import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ProductService } from '../../../core/services/product.service';
import { ProductResponse } from '../../../core/models/product.model';

@Component({
    selector: 'app-product-list',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './product-list.component.html',
    styleUrl: './product-list.component.scss'
})
export class ProductListComponent implements OnInit {
    private productService = inject(ProductService);
    private router = inject(Router);

    products = signal<ProductResponse[]>([]);
    filteredProducts = signal<ProductResponse[]>([]);
    isLoading = signal<boolean>(false);
    errorMessage = signal<string>('');
    searchTerm = signal<string>('');

    ngOnInit(): void {
        this.loadProducts();
    }

    loadProducts(): void {
        this.isLoading.set(true);
        this.errorMessage.set('');

        this.productService.getAll().subscribe({
            next: (data) => {
                this.products.set(data);
                this.filteredProducts.set(data);
                this.isLoading.set(false);
            },
            error: (error) => {
                this.errorMessage.set('Error al cargar productos. Intenta de nuevo.');
                this.isLoading.set(false);
                console.error('Error loading products:', error);
            }
        });
    }

    onSearch(event: Event): void {
        const input = event.target as HTMLInputElement;
        const term = input.value.toLowerCase();
        this.searchTerm.set(term);

        if (!term) {
            this.filteredProducts.set(this.products());
            return;
        }

        const filtered = this.products().filter(product =>
            product.name.toLowerCase().includes(term) ||
            product.code.toLowerCase().includes(term) ||
            product.categoryName?.toLowerCase().includes(term) ||
            product.brandName?.toLowerCase().includes(term) ||
            product.laboratoryName?.toLowerCase().includes(term)
        );
        this.filteredProducts.set(filtered);
    }

    onEdit(id: number): void {
        this.router.navigate(['/products/edit', id]);
    }

    onDelete(product: ProductResponse): void {
        if (confirm(`¿Estás seguro de eliminar el producto "${product.name}"?`)) {
            this.productService.delete(product.id).subscribe({
                next: () => {
                    this.loadProducts();
                },
                error: (error) => {
                    this.errorMessage.set('Error al eliminar el producto. Intenta de nuevo.');
                    console.error('Error deleting product:', error);
                }
            });
        }
    }

    onToggleStatus(product: ProductResponse): void {
        // Logic for toggling active/inactive if needed
    }

    onNew(): void {
        this.router.navigate(['/products/new']);
    }
}
