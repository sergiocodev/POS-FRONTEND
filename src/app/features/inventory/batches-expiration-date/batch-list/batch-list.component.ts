import { Component, OnInit, OnChanges, SimpleChanges, signal, Input, Output, EventEmitter, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductLotResponse } from '../../../../core/models/inventory.model';
import { CustomTableComponent, TableColumn } from '../../../../shared/components/custom-table/custom-table.component';
import { TableFilterComponent } from '../../../../shared/components/table-filter/table-filter.component';

@Component({
    selector: 'app-batch-list',
    standalone: true,
    imports: [CommonModule, FormsModule, CustomTableComponent, TableFilterComponent],
    templateUrl: './batch-list.component.html',
    styleUrl: './batch-list.component.scss'
})
export class BatchListComponent implements OnInit, OnChanges {
    @ViewChild('productTemplate', { static: true }) productTemplate!: TemplateRef<any>;
    @ViewChild('lotTemplate', { static: true }) lotTemplate!: TemplateRef<any>;
    @ViewChild('expiryDateTemplate', { static: true }) expiryDateTemplate!: TemplateRef<any>;
    @ViewChild('statusTemplate', { static: true }) statusTemplate!: TemplateRef<any>;
    @ViewChild('daysRemainingTemplate', { static: true }) daysRemainingTemplate!: TemplateRef<any>;

    @Input() lots: ProductLotResponse[] = [];
    @Input() isLoading = false;

    @Output() create = new EventEmitter<void>();

    searchTerm = signal('');
    filteredLots = signal<ProductLotResponse[]>([]);
    columns: TableColumn[] = [];

    ngOnInit() {
        this.setupColumns();
        this.applyLocalFilters();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['lots']) {
            this.applyLocalFilters();
        }
    }

    applyLocalFilters() {
        const term = this.searchTerm().toLowerCase();
        const lotsList = this.lots || [];
        if (!term) {
            this.filteredLots.set(lotsList);
            return;
        }

        const filtered = lotsList.filter(lot =>
            lot.productName.toLowerCase().includes(term) ||
            lot.lotCode.toLowerCase().includes(term)
        );
        this.filteredLots.set(filtered);
    }

    setupColumns() {
        this.columns = [
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

    resetFilters(): void {
        this.searchTerm.set('');
        this.applyLocalFilters();
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
