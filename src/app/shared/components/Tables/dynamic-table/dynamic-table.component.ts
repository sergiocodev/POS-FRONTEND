import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { NgFor, NgIf, NgClass, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonActionsComponent } from "../../Buttons/button-actions/button-actions.component";
import { SubHeader, TableHeader } from './Interface/table-configuration';

@Component({
    selector: 'app-dynamic-table',
    standalone: true,
    imports: [NgFor, NgIf, NgClass, FormsModule, ButtonActionsComponent, DecimalPipe],
    templateUrl: './dynamic-table.component.html',
    styleUrl: './dynamic-table.component.scss'
})
export class DynamicTableComponent implements OnInit {

    @Input() headers: TableHeader[] = [];
    @Input() data: any[] = [];
    @Output() SendActionFilter = new EventEmitter<string>();
    @Output() SendDataAndAction = new EventEmitter<any>();
    @Output() SendRow = new EventEmitter<any>();
    @Output() SendStatus = new EventEmitter<any>();
    @Output() SendInputFilter = new EventEmitter<any>();

    @Input() isActiveActions: boolean = false;
    @Input() listActions: string[] = [];
    @Input() isRowClick: boolean = false;
    @Input() origin!: string;
    @Input() showFilters: boolean = true;

    @Input() showTotalRow: boolean = false;
    @Input() totalValueColumns: string[] = [];
    @Input() totalLabelColumn?: string;
    @Input() totalLabel: string = 'Total';

    currentSortIndex: number = -1;
    currentSortColumn: TableHeader | null = null;
    isSortedDescending: boolean = false;

    ngOnInit(): void {
        if (this.isActiveActions && !this.hasActionHeader()) {
            this.headers.push({
                label: 'Acciones',
                colspan: 1,
                filter: false,
                subHeaders: [{ key: 'action' }]
            });
        }
    }

    hasActionHeader(): boolean {
        return this.headers.some(header =>
            header.subHeaders?.some(subHeader => subHeader.key === 'action')
        );
    }

    get hasSubHeaders(): boolean {
        return this.headers.some((header) => (header.subHeaders?.length ?? 0) > 0);
    }

    isBoolean(obj: any): boolean {
        return typeof obj === 'boolean';
    }

    SendButtonActions(row: any, actionType: any) {
        this.SendDataAndAction.emit({ data: row, actionType: actionType.name });
    }

    SendStatusOfData(event: Event, row: any, key: string): void {
        const isChecked = (event.target as HTMLInputElement).checked;
        row[key] = isChecked;
        this.SendStatus.emit({ id: row.id, state: isChecked });
    }

    onInputChange(event: any, key: string): void {
        const value = event.target.value;
        this.SendInputFilter.emit({ value, key });
    }

    trackById(index: number, item: any): any {
        return item.id || index;
    }

    sendRow(row: any) {
        this.SendRow.emit(row);
    }

    handleSort(col: TableHeader) {
        if (!col.subHeaders || col.subHeaders.length === 0) {
            if (col.key) {
                this.toggleSort(col.key);
            }
            return;
        }

        if (this.currentSortColumn !== col) {
            this.currentSortIndex = 0;
            this.currentSortColumn = col;
            this.isSortedDescending = false;
        } else {
            this.currentSortIndex = (this.currentSortIndex + 1) % col.subHeaders.length;
            if (this.currentSortIndex === 0) {
                this.isSortedDescending = !this.isSortedDescending;
            }
        }

        const currentSubHeader = col.subHeaders[this.currentSortIndex];
        this.sortData(currentSubHeader.key);
    }

    private toggleSort(key: string) {
        if (this.currentSortColumn?.key === key) {
            this.isSortedDescending = !this.isSortedDescending;
        } else {
            this.isSortedDescending = false;
            this.currentSortColumn = { label: '', key };
        }
        this.sortData(key);
    }

    sortData(sortKey: string) {
        this.data.sort((a, b) => {
            const valueA = a[sortKey];
            const valueB = b[sortKey];

            if (valueA === null || valueA === undefined) return this.isSortedDescending ? -1 : 1;
            if (valueB === null || valueB === undefined) return this.isSortedDescending ? 1 : -1;

            if (valueA instanceof Date && valueB instanceof Date) {
                return this.isSortedDescending ? valueB.getTime() - valueA.getTime() : valueA.getTime() - valueB.getTime();
            }

            if (typeof valueA === 'string' && typeof valueB === 'string') {
                return this.isSortedDescending ? valueB.localeCompare(valueA) : valueA.localeCompare(valueB);
            }

            return this.isSortedDescending ? (Number(valueB) - Number(valueA)) : (Number(valueA) - Number(valueB));
        });

        this.data = [...this.data];
    }

    isTotalLabelColumn(col: TableHeader): boolean {
        if (!this.totalLabelColumn) return false;
        if (col.key === this.totalLabelColumn) return true;
        return !!col.subHeaders?.some(sub => sub.key === this.totalLabelColumn);
    }

    isTotalValueColumn(subCol: SubHeader): boolean {
        return this.totalValueColumns.includes(subCol.key);
    }

    isActionColumn(subCol: SubHeader): boolean {
        return subCol.key === 'action';
    }

    calculateTotal(columnKey: string): number {
        if (!columnKey || !this.data?.length) return 0;
        return this.data.reduce((sum, row) => {
            const value = parseFloat(row[columnKey]);
            return sum + (isNaN(value) ? 0 : value);
        }, 0);
    }
}
