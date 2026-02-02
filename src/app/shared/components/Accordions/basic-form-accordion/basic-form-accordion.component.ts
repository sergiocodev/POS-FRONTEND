import { Component, EventEmitter, Input, Output, SimpleChanges, OnInit } from '@angular/core';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { FormGroup } from '@angular/forms';

@Component({
    selector: 'app-basic-form-accordion',
    standalone: true,
    imports: [CommonModule, NgFor, NgIf],
    templateUrl: './basic-form-accordion.component.html',
    styleUrl: './basic-form-accordion.component.scss'
})
export class BasicFormAccordionComponent implements OnInit {
    @Input() formIsFilled: boolean | null = null;
    @Input() title: string = '';
    @Input() numeration: string = '';
    @Input() formGroup!: FormGroup;
    @Input() summaryFields: string[] = [];
    @Input() isExpanded: boolean = false;

    @Output() expandedChange = new EventEmitter<boolean>();

    internalExpanded = false;
    formIsValid: boolean = false;
    summaryValues: string[] = [];

    ngOnInit(): void {
        this.internalExpanded = this.isExpanded;
        this.updateHeader();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['isExpanded'] && changes['isExpanded'].currentValue !== undefined) {
            this.internalExpanded = changes['isExpanded'].currentValue;
        }
    }

    toggleExpanded(): void {
        this.internalExpanded = !this.internalExpanded;
        this.expandedChange.emit(this.internalExpanded);
    }

    async updateHeader() {
        if (this.formIsFilled === null) return;

        if (this.formGroup?.valid) {
            this.formIsValid = true;
            this.summaryValues = this.summaryFields.map(
                (field) => `${field}: ${this.formGroup.get(field)?.value || 'N/A'}`
            );
        } else {
            this.formIsValid = false;
            this.summaryValues = [];
        }
    }

    getTargetId(): string {
        return 'collapse-' + this.title.replace(/\s+/g, '-').toLowerCase();
    }
}
