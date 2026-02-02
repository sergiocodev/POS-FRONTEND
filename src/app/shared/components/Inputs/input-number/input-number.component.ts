import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-input-number',
    standalone: true,
    imports: [FormsModule],
    templateUrl: './input-number.component.html',
    styleUrl: './input-number.component.scss'
})
export class InputNumberComponent {
    @Input() value: string = '';
    @Output() valueChange = new EventEmitter<string>();

    onInput(event: Event) {
        const inputElement = event.target as HTMLInputElement;
        this.valueChange.emit(inputElement.value);
    }
}
