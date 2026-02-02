import { Component, Input, OnChanges, Output, EventEmitter } from '@angular/core';
import { NgFor, NgIf, NgClass } from '@angular/common';
import { ButtonActionsComponent } from '../../Buttons/button-actions/button-actions.component';

@Component({
    selector: 'app-data-table',
    standalone: true,
    imports: [NgFor, NgIf, NgClass, ButtonActionsComponent],
    templateUrl: './data-table.component.html',
    styleUrls: ['./data-table.component.scss']
})
export class DataTableComponent implements OnChanges {
    @Input() headers: string[] = [];
    @Input() data: any[][] = [];
    @Input() isHoverEnabled: boolean = false;
    @Input() isActiveButtonAction: boolean = false;
    @Input() actions: string[] = [];
    @Input() isActiveInputFilter: boolean = false;
    @Input() InputFilter: string[] = [];
    @Input() isActiveTextFilter: boolean = false;
    @Input() TextFilter: any[] = [];

    @Output() toggleStateChange = new EventEmitter<{ id: number, state: boolean }>();
    @Output() GetRow = new EventEmitter<any[]>();
    @Input() IsRowClick: boolean = false;
    @Input() SelectListRowData: any;

    selectedRow: any[] | null = null;

    @Output() SendInputFilter = new EventEmitter<{ value: string, item: any }>();
    @Output() SendButtonAction = new EventEmitter<any>();

    ngOnChanges() {
        if (this.isActiveButtonAction) {
            if (!this.headers.includes("Acciones")) {
                this.headers.push("Acciones");
            }
        }
    }

    isBoolean(field: any): boolean {
        return typeof field === 'boolean';
    }

    onToggleChange(row: any[], field: any, event: Event): void {
        const target = event.target as HTMLInputElement;
        if (target) {
            const state = target.checked;
            const id = row[0]; // Assuming ID is in the first position
            this.toggleStateChange.emit({ id, state });
        }
    }

    OnRowClick(row: any[]) {
        this.GetRow.emit(row);
        this.selectedRow = this.selectedRow === row ? null : row;
    }

    SendButtonActions(action: any) {
        this.SendButtonAction.emit(action);
    }

    SendInputFilterValue(event: Event, item: any): void {
        const inputElement = event.target as HTMLInputElement;
        if (inputElement) {
            this.SendInputFilter.emit({ value: inputElement.value, item: item });
        }
    }

    isArray(field: any): boolean {
        return Array.isArray(field);
    }
}
