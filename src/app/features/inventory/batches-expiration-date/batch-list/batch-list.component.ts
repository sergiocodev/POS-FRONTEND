import { Component, OnInit, signal, computed, input, output, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductLotResponse } from '../../../../core/models/inventory.model';
import { CustomTableComponent, TableColumn } from '../../../../shared/components/custom-table/custom-table.component';
import { TableFilterComponent } from '../../../../shared/components/table-filter/table-filter.component';

@Component({
    selector: 'app-batch-list',
    standalone: true,
    imports: [CommonModule, FormsModule, CustomTableComponent],
    templateUrl: './batch-list.component.html',
    styleUrl: './batch-list.component.scss'
})
export class BatchListComponent implements OnInit {
    @ViewChild('productTemplate', { static: true }) productTemplate!: TemplateRef<any>;
    @ViewChild('lotTemplate', { static: true }) lotTemplate!: TemplateRef<any>;
    @ViewChild('expiryDateTemplate', { static: true }) expiryDateTemplate!: TemplateRef<any>;
    @ViewChild('statusTemplate', { static: true }) statusTemplate!: TemplateRef<any>;
    @ViewChild('daysRemainingTemplate', { static: true }) daysRemainingTemplate!: TemplateRef<any>;
    lots = input<ProductLotResponse[]>([]);
    isLoading = input(false);

    pageSize = input<number>(10);
    totalElements = input<number>(0);
    currentPage = input<number>(0);

    create = output<void>();

    pageChange = output<number>();
    pageSizeChange = output<number>();
    filterChange = output<any>();

    columns: TableColumn[] = [];

    ngOnInit() {
        this.setupColumns();
    }

    setupColumns() {
        this.columns = [
            { key: 'index', label: 'N°', type: 'index', width: '50px', align: 'center' },
            {
                key: 'productName',
                label: 'Producto',
                type: 'template',
                filterable: true,
                templateRef: this.productTemplate
            },
            {
                key: 'lotCode',
                label: 'Lote / Serie',
                type: 'template',
                filterable: true,
                templateRef: this.lotTemplate
            },
            {
                key: 'expiryDate',
                label: 'Vencimiento',
                type: 'template',
                templateRef: this.expiryDateTemplate
            },
            {
                key: 'status',
                label: 'Estado',
                type: 'template',
                templateRef: this.statusTemplate
            },
            {
                key: 'daysRemaining',
                label: 'Días Rest.',
                type: 'template',
                templateRef: this.daysRemainingTemplate
            }
        ];
    }

    handlePageChange(page: number) {
        this.pageChange.emit(page);
    }

    handlePageSizeChange(size: number) {
        this.pageSizeChange.emit(size);
    }

    handleFilterChange(filters: any) {
        this.filterChange.emit(filters);
    }

    onCreate() {
        this.create.emit();
    }

    getExpiryStatus(expiryDate: string): { class: string, text: string, color: string } {
        const today = new Date();
        const expiry = new Date(expiryDate);
        const diffTime = expiry.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return { class: 'bg-dark', text: 'Vencido', color: '#fff' };
        if (diffDays <= 30) return { class: 'bg-danger', text: 'Crítico (< 30 días)', color: '#fff' };
        if (diffDays <= 90) return { class: 'bg-warning text-dark', text: 'Próximo (< 90 días)', color: '#000' };
        return { class: 'bg-success', text: 'Vigente', color: '#fff' };
    }

    getDaysRemaining(expiryDate: string): number {
        const today = new Date();
        const expiry = new Date(expiryDate);
        const diffTime = expiry.getTime() - today.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
}
