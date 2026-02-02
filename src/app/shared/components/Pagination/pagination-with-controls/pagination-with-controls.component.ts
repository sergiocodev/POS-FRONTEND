import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-pagination-with-controls',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './pagination-with-controls.component.html',
    styleUrl: './pagination-with-controls.component.scss'
})
export class PaginationWithControlsComponent implements OnChanges {

    @Input() descriptionIsActive: boolean = false;
    @Input() pageIndex: number = 1;
    @Input() totalPages: number = 1;
    @Input() totalItems: number = 0;
    @Input() maxPageLink: number = 5;
    @Input() pageItemsStartsAt: number = 0;
    @Input() pageItemsEndsAt: number = 0;
    @Input() hasPreviousPage: boolean = false;
    @Input() hasNextPage: boolean = false;

    @Output() pageChange = new EventEmitter<number>();

    currentPage: number = 1;

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['pageIndex']) {
            this.currentPage = this.pageIndex || 1;
        }
    }

    get visiblePages(): number[] {
        const total = this.totalPages;
        const maxVisible = this.maxPageLink;

        if (total <= maxVisible) {
            return Array.from({ length: total }, (_, i) => i + 1);
        } else {
            let start = this.currentPage - Math.floor(maxVisible / 2);
            if (start < 1) start = 1;

            let end = start + maxVisible - 1;
            if (end > total) {
                end = total;
                start = end - maxVisible + 1;
            }

            return Array.from({ length: end - start + 1 }, (_, i) => start + i);
        }
    }

    onPageChange(page: number): void {
        if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
            this.currentPage = page;
            this.pageChange.emit(this.currentPage);
        }
    }

    goPrevious(): void {
        if (this.hasPreviousPage) {
            this.onPageChange(this.currentPage - 1);
        }
    }

    goNext(): void {
        if (this.hasNextPage) {
            this.onPageChange(this.currentPage + 1);
        }
    }
}
