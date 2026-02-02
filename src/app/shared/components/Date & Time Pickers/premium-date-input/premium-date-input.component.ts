import { Component, Input, forwardRef, Injector, ElementRef, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';

@Component({
    selector: 'app-premium-date-input',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './premium-date-input.component.html',
    styleUrls: ['./premium-date-input.component.scss'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => PremiumDateInputComponent),
            multi: true
        }
    ]
})
export class PremiumDateInputComponent implements ControlValueAccessor, OnInit {
    @Input() label: string = 'Seleccionar fecha';
    @Input() includeTime: boolean = false;
    @Input() daysBefore: number | null = null;
    @Input() daysAfter: number | null = null;
    @Input() required: boolean = false;
    @Input() defaultTimeMode: 'start' | 'end' | 'preserve' = 'preserve';

    value: string = '';
    isDisabled: boolean = false;
    isOpen: boolean = false;
    currentDate: Date = new Date();
    selectedDate: Date | null = null;
    selectedHour: number = 12;
    selectedMinute: number = 0;
    isPM: boolean = false;

    daysOfWeek = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'];
    months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    calendarDays: any[] = [];
    hours: number[] = Array.from({ length: 12 }, (_, i) => i + 1);
    minutes: number[] = Array.from({ length: 60 }, (_, i) => i);

    onChange: (value: string) => void = () => { };
    onTouched: () => void = () => { };

    constructor(private el: ElementRef) { }

    ngOnInit() {
        this.generateCalendar();
    }

    get displayValue(): string {
        const dateToUse = this.selectedDate || (this.value ? new Date(this.value) : null);
        if (!dateToUse || isNaN(dateToUse.getTime())) return '';

        const dateStr = dateToUse.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
        if (!this.includeTime) return dateStr;

        let hours = dateToUse.getHours();
        const ampm = hours >= 12 ? 'p. m.' : 'a. m.';
        hours = hours % 12;
        hours = hours ? hours : 12;
        const minutes = dateToUse.getMinutes().toString().padStart(2, '0');
        return `${dateStr} ${hours}:${minutes} ${ampm}`;
    }

    togglePopup() {
        if (this.isDisabled) return;
        this.isOpen = !this.isOpen;
        if (this.isOpen) {
            this.initializeFromValue();
            this.generateCalendar();
        } else {
            this.onTouched();
        }
    }

    @HostListener('document:click', ['$event'])
    onClickOutside(event: Event) {
        if (!this.el.nativeElement.contains(event.target)) {
            this.isOpen = false;
            this.onTouched();
        }
    }

    initializeFromValue() {
        if (this.value) {
            let date: Date;
            if (typeof this.value === 'string' && this.value.indexOf('T') === -1 && this.value.length === 10) {
                const [y, m, d] = this.value.split('-').map(Number);
                date = new Date(y, m - 1, d, 0, 0, 0);
                if (this.includeTime && this.defaultTimeMode !== 'preserve') {
                    if (this.defaultTimeMode === 'start') {
                        date.setHours(0, 0, 0, 0);
                    } else if (this.defaultTimeMode === 'end') {
                        date.setHours(23, 59, 59, 999);
                    }
                }
            } else {
                date = new Date(this.value);
            }

            if (!isNaN(date.getTime())) {
                this.currentDate = new Date(date);
                this.selectedDate = new Date(date);

                if (this.includeTime) {
                    let h = date.getHours();
                    this.isPM = h >= 12;
                    this.selectedHour = h % 12 || 12;
                    this.selectedMinute = date.getMinutes();
                }
            }
        } else {
            this.currentDate = new Date();
            if (this.includeTime) {
                const now = new Date();
                let h = now.getHours();
                let m = now.getMinutes();

                if (this.defaultTimeMode === 'start') {
                    h = 0; m = 0;
                } else if (this.defaultTimeMode === 'end') {
                    h = 23; m = 59;
                }

                this.isPM = h >= 12;
                this.selectedHour = h % 12 || 12;
                this.selectedMinute = m;
            }
        }
    }

    generateCalendar() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();

        const firstDayStr = new Date(year, month, 1);
        const lastDayStr = new Date(year, month + 1, 0);
        const daysInMonth = lastDayStr.getDate();
        const startingDayOfWeek = firstDayStr.getDay();

        this.calendarDays = [];

        for (let i = 0; i < startingDayOfWeek; i++) {
            this.calendarDays.push({ isEmpty: true });
        }

        const now = new Date();
        now.setHours(0, 0, 0, 0);

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const isDisabled = this.isDateDisabled(date);
            const isSelected = this.selectedDate &&
                this.selectedDate.getDate() === day &&
                this.selectedDate.getMonth() === month &&
                this.selectedDate.getFullYear() === year;

            this.calendarDays.push({
                day,
                date,
                isEmpty: false,
                isDisabled,
                isSelected,
                isToday: date.getTime() === now.getTime()
            });
        }
    }

    isToday(date: Date): boolean {
        const today = new Date();
        return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
    }

    isDateDisabled(date: Date): boolean {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const checkDate = new Date(date);
        checkDate.setHours(0, 0, 0, 0);

        if (this.daysBefore !== null) {
            const minDate = new Date(now);
            minDate.setDate(now.getDate() - this.daysBefore);
            if (checkDate < minDate) return true;
        }

        if (this.daysAfter !== null) {
            const maxDate = new Date(now);
            maxDate.setDate(now.getDate() + this.daysAfter);
            if (checkDate > maxDate) return true;
        }
        return false;
    }

    prevMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        this.currentDate = new Date(this.currentDate);
        this.generateCalendar();
    }

    nextMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        this.currentDate = new Date(this.currentDate);
        this.generateCalendar();
    }

    selectDay(dayObj: any) {
        if (dayObj.isEmpty || dayObj.isDisabled) return;

        let h = 0, m = 0;
        if (this.includeTime) {
            if (this.selectedDate) {
                h = this.selectedDate.getHours();
                m = this.selectedDate.getMinutes();
            } else {
                if (this.defaultTimeMode === 'start') {
                    h = 0; m = 0;
                } else if (this.defaultTimeMode === 'end') {
                    h = 23; m = 59;
                } else {
                    const now = new Date();
                    h = now.getHours();
                    m = now.getMinutes();
                }
            }
        }

        const newDate = new Date(dayObj.date);
        newDate.setHours(h, m, 0, 0);

        this.selectedDate = newDate;
        this.updateValue();
        this.generateCalendar();
    }

    setHour(h: number) {
        this.selectedHour = h;
        this.updateTimeInValue();
    }

    setMinute(m: number) {
        this.selectedMinute = m;
        this.updateTimeInValue();
    }

    setAMPM(isPM: boolean) {
        this.isPM = isPM;
        this.updateTimeInValue();
    }

    updateTimeInValue() {
        const baseDate = this.selectedDate || new Date();

        let h = this.selectedHour === 12 ? 0 : this.selectedHour;
        if (this.isPM) h += 12;

        const newDate = new Date(baseDate);
        newDate.setHours(h, this.selectedMinute, 0, 0);
        this.selectedDate = newDate;
        this.updateValue();
    }

    updateValue() {
        if (!this.selectedDate) return;

        const year = this.selectedDate.getFullYear();
        const month = (this.selectedDate.getMonth() + 1).toString().padStart(2, '0');
        const day = this.selectedDate.getDate().toString().padStart(2, '0');

        let val = `${year}-${month}-${day}`;

        if (this.includeTime) {
            const hours = this.selectedDate.getHours().toString().padStart(2, '0');
            const minutes = this.selectedDate.getMinutes().toString().padStart(2, '0');
            val += `T${hours}:${minutes}`;
        }

        this.value = val;
        this.onChange(val);
    }

    clear() {
        this.value = '';
        this.selectedDate = null;
        this.onChange('');
        this.isOpen = false;
    }

    setToday() {
        const now = new Date();
        this.currentDate = new Date(now);
        this.selectedDate = new Date(now);
        if (this.includeTime) {
            let h = now.getHours();
            this.isPM = h >= 12;
            this.selectedHour = h % 12 || 12;
            this.selectedMinute = now.getMinutes();
        }
        this.updateValue();
        this.generateCalendar();
        this.isOpen = false;
    }

    get currentMonthName(): string {
        return this.months[this.currentDate.getMonth()];
    }

    get currentYearNum(): number {
        return this.currentDate.getFullYear();
    }

    writeValue(value: string): void {
        this.value = value;
        if (value) {
            this.initializeFromValue();
        } else {
            this.selectedDate = null;
        }
    }

    registerOnChange(fn: (value: string) => void): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: any): void {
        this.onTouched = fn;
    }

    setDisabledState?(isDisabled: boolean): void {
        this.isDisabled = isDisabled;
    }
}
