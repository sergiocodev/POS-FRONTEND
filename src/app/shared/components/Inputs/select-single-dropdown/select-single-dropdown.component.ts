import { Component, forwardRef, Input } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
    selector: 'app-select-single-dropdown',
    standalone: true,
    imports: [FormsModule],
    templateUrl: './select-single-dropdown.component.html',
    styleUrl: './select-single-dropdown.component.scss',
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => SelectSingleDropdownComponent),
            multi: true
        }
    ]
})
export class SelectSingleDropdownComponent implements ControlValueAccessor {
    @Input() label!: string;
    @Input() options: any[] = [];
    @Input() optionLabel!: string;
    @Input() optionValue!: string;

    value: any;
    onChange: any = () => { };

    writeValue(value: any): void {
        this.value = value;
    }

    registerOnChange(fn: any): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: any): void { }
}
