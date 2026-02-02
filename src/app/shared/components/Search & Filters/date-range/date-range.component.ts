import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';

@Component({
    selector: 'app-date-range',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './date-range.component.html',
    styleUrl: './date-range.component.scss'
})
export class DateRangeComponent {

    @Output() filterSales = new EventEmitter<{ startDate: Date, endDate: Date }>();

    form = new FormGroup({
        startDate: new FormControl(),
        endDate: new FormControl()
    });

    onSearch() {
        const { startDate, endDate } = this.form.value;
        if (startDate && endDate) {
            this.filterSales.emit({
                startDate: new Date(startDate),
                endDate: new Date(endDate)
            });
        }
    }

    onClear() {
        this.form.reset();
    }

}
