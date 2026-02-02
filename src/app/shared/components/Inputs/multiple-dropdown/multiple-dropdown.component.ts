import { NgClass, NgFor, NgIf } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-multiple-dropdown',
    standalone: true,
    imports: [FormsModule, NgIf, NgFor, NgClass],
    templateUrl: './multiple-dropdown.component.html',
    styleUrl: './multiple-dropdown.component.scss'
})
export class MultipleDropdownComponent {
    @Input() options: any[] = [];
    @Input() selectedItems: number[] = [];
    @Output() selectionChange = new EventEmitter<number[]>();

    selectedOptions: number[] = [];

    ngOnChanges(): void {
        this.selectedOptions = [...this.selectedItems];
    }

    toggleSelection(id: number): void {
        if (this.selectedOptions.includes(id)) {
            this.selectedOptions = this.selectedOptions.filter(o => o !== id);
        } else {
            this.selectedOptions.push(id);
        }
        this.selectionChange.emit(this.selectedOptions);
    }

    removeSelection(id: number): void {
        this.selectedOptions = this.selectedOptions.filter(o => o !== id);
        this.selectionChange.emit(this.selectedOptions);
    }

    getOptionName(id: number): string {
        const option = this.options.find(o => o.id === id);
        return option ? option.name ?? '' : '';
    }
}
