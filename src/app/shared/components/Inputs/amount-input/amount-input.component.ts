import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgClass } from '@angular/common';

export type AmountMode = "amount" | "percentage"

export interface AmountChangeEvent {
    value: string
    mode: AmountMode
}

@Component({
    selector: 'app-amount-input',
    standalone: true,
    imports: [NgClass],
    templateUrl: './amount-input.component.html',
    styleUrl: './amount-input.component.scss'
})
export class AmountInputComponent {
    @Input() value = ""
    @Input() mode: AmountMode = "amount"
    @Input() placeholder = "0"
    @Input() className = ""

    @Output() valueChange = new EventEmitter<AmountChangeEvent>()

    currentMode: AmountMode = "amount"
    inputValue = ""

    ngOnInit() {
        this.currentMode = this.mode
        this.inputValue = this.value
    }

    handleModeChange(newMode: AmountMode) {
        this.currentMode = newMode
        this.valueChange.emit({
            value: this.inputValue,
            mode: newMode,
        })
    }

    handleValueChange(event: Event) {
        const target = event.target as HTMLInputElement
        const numericValue = target.value.replace(/[^0-9.]/g, "")
        this.inputValue = numericValue
        target.value = numericValue

        this.valueChange.emit({
            value: numericValue,
            mode: this.currentMode,
        })
    }

    isAmountMode(): boolean {
        return this.currentMode === "amount"
    }

    isPercentageMode(): boolean {
        return this.currentMode === "percentage"
    }
}
