import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-date-time-picker',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './date-time-picker.component.html',
    styleUrl: './date-time-picker.component.scss'
})
export class DateTimePickerComponent implements OnInit {
    @Input() startLabel: string = 'Fecha Inicial';
    @Input() endLabel: string = 'Fecha Final';

    @Input() startValue: string = '';
    @Input() endValue: string = '';

    @Output() filter = new EventEmitter<{ start: string, end: string }>();

    ngOnInit(): void {
        if (!this.startValue && !this.endValue) {
            const now = new Date();
            const yesterday = new Date(now);
            yesterday.setDate(now.getDate() - 1);

            this.endValue = this.formatDate(now);
            this.startValue = this.formatDate(yesterday);
        }
    }

    private formatDate(date: Date): string {
        const year = date.getFullYear();
        const month = ('0' + (date.getMonth() + 1)).slice(-2);
        const day = ('0' + date.getDate()).slice(-2);
        const hours = ('0' + date.getHours()).slice(-2);
        const minutes = ('0' + date.getMinutes()).slice(-2);
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    }

    onFilterClick() {
        this.filter.emit({ start: this.startValue, end: this.endValue });
    }
}
