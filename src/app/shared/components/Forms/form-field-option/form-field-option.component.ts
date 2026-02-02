import { Component, forwardRef, Input, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-form-field-option',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => FormFieldOptionComponent),
            multi: true
        }
    ],
    templateUrl: './form-field-option.component.html',
    styleUrls: ['./form-field-option.component.scss']
})
export class FormFieldOptionComponent implements OnInit, ControlValueAccessor, OnDestroy {
    @Input() formGroup!: FormGroup;
    @Input() formControlName!: string;
    @Input() label?: string;
    @Input() type: string = 'text';
    @Input() placeholder: string = '';
    @Input() required: boolean = false;
    @Input() minLength?: number;
    @Input() maxLength?: number;
    @Input() options: any[] = []; // Simplified to any[]
    @Input() forceShowErrors: boolean = false;
    @Output() valueChange = new EventEmitter<void>();

    private _control!: FormControl;
    private valueChangesSub?: Subscription;
    today: string = new Date().toISOString().split('T')[0];
    isDisabled = false;

    private onChange: (_: any) => void = () => { };
    private onTouched: () => void = () => { };

    ngOnInit() {
        const ctrl = this.formGroup.get(this.formControlName);
        if (!(ctrl instanceof FormControl)) {
            throw new Error(`Control '${this.formControlName}' must be a FormControl instance`);
        }
        this._control = ctrl;
    }

    ngOnDestroy() {
        this.valueChangesSub?.unsubscribe();
    }

    writeValue(obj: any): void {
        if (this._control && this._control.value !== obj) {
            this._control.setValue(obj, { emitEvent: false });
        }
    }

    registerOnChange(fn: any): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: any): void {
        this.onTouched = fn;
    }

    setDisabledState?(isDisabled: boolean): void {
        this.isDisabled = isDisabled;
        if (this.isDisabled) {
            this._control.disable({ emitEvent: false });
        } else {
            this._control.enable({ emitEvent: false });
        }
    }

    onInput(event: Event) {
        const target = event.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
        let value: any = target.value;

        if (this.type === 'number') {
            value = value !== '' ? Number(value) : null;
        }

        if (this.maxLength && typeof value === 'string' && value.length > this.maxLength) {
            value = value.substring(0, this.maxLength);
            target.value = value;
        }

        this._control.setValue(value);
        this.onChange(value);
        this.valueChange.emit();
    }

    onBlur() {
        this.onTouched();
    }

    get control(): FormControl {
        return this._control;
    }

    public hasValue(): boolean {
        const value = this.control?.value;
        if (value === null || value === undefined || value === '' || value === 0) {
            return false;
        }
        if (typeof value === 'string') {
            return value.trim().length > 0;
        }
        if (this.type === 'number') {
            return !isNaN(value) && value !== '';
        }
        return true;
    }

    get isValid(): boolean {
        const isControlValid = !!this.control?.valid;
        const wasInteracted = !!(this.control?.touched || this.control?.dirty || this.forceShowErrors);
        if (!this.required) {
            return isControlValid && wasInteracted && this.hasValue();
        }
        return isControlValid && wasInteracted;
    }

    get showError(): boolean {
        return !!this.control?.invalid && (this.control?.touched || this.control?.dirty || this.forceShowErrors);
    }
}
