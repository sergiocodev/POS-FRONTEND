import { NgFor, NgIf } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
    selector: 'app-select-generic',
    standalone: true,
    imports: [FormsModule, ReactiveFormsModule, NgFor, NgIf],
    templateUrl: './select-generic.component.html',
    styleUrl: './select-generic.component.scss'
})
export class SelectGenericComponent {
    @Input() options: any[] = [];
    @Input() label: string = 'Seleccione';
    @Input() placeholder: string = 'Seleccione una opción';
    @Input() control: FormControl = new FormControl();
    @Input() required: boolean = false;

    searchText: string = '';

    get filteredOptions() {
        if (!this.searchText) return this.options;
        return this.options.filter(option =>
            (option.name || '').toLowerCase().includes(this.searchText.toLowerCase())
        );
    }
}
