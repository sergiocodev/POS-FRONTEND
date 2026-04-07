import { Component, OnInit, Output, EventEmitter, ElementRef, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-date-range-search',
  imports: [CommonModule, FormsModule],
  templateUrl: './date-range-search.component.html',
  styleUrl: './date-range-search.component.scss',
})
export class DateRangeSearchComponent implements OnInit {
  private elementRef = inject(ElementRef);
  @Output() filterChange = new EventEmitter<{ startDate: string, endDate: string }>();

  // Estado de los popovers
  showStartPicker = false;
  showEndPicker = false;

  // Valores seleccionados
  startDate: Date = new Date();
  endDate: Date = new Date();

  // Estado de la vista del calendario (Navegación)
  viewDate: Date = new Date();
  currentMonthName = '';
  calendarDays: (number | null)[] = [];
  weekDays = ['DO', 'LU', 'MA', 'MI', 'JU', 'VI', 'SA'];

  // Datos para renderizar la UI del tiempo
  hours: string[] = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  minutes: string[] = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

  // Estado temporal para el picker activo
  activePicker: 'start' | 'end' | null = null;
  selectedDay = 0;
  selectedHour = '12';
  selectedMinute = '00';
  selectedPeriod: 'a. m.' | 'p. m.' = 'a. m.';

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.showStartPicker = false;
      this.showEndPicker = false;
      this.activePicker = null;
    }
  }

  ngOnInit(): void {
    this.startDate.setHours(0, 0, 0, 0);
    this.endDate.setHours(23, 59, 59, 999);
    this.generateCalendar();
  }

  generateCalendar() {
    const year = this.viewDate.getFullYear();
    const month = this.viewDate.getMonth();
    
    this.currentMonthName = new Intl.DateTimeFormat('es-PE', { month: 'long', year: 'numeric' }).format(this.viewDate);
    this.currentMonthName = this.currentMonthName.charAt(0).toUpperCase() + this.currentMonthName.slice(1);

    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    this.calendarDays = [
      ...Array(firstDayOfMonth).fill(null),
      ...Array.from({ length: daysInMonth }, (_, i) => i + 1)
    ];
  }

  prevMonth() {
    this.viewDate.setMonth(this.viewDate.getMonth() - 1);
    this.generateCalendar();
  }

  nextMonth() {
    this.viewDate.setMonth(this.viewDate.getMonth() + 1);
    this.generateCalendar();
  }

  toggleStartPicker() {
    this.showStartPicker = !this.showStartPicker;
    this.showEndPicker = false;
    if (this.showStartPicker) {
      this.activePicker = 'start';
      this.initTempStates(this.startDate);
    }
  }

  toggleEndPicker() {
    this.showEndPicker = !this.showEndPicker;
    this.showStartPicker = false;
    if (this.showEndPicker) {
      this.activePicker = 'end';
      this.initTempStates(this.endDate);
    }
  }

  private initTempStates(date: Date) {
    this.viewDate = new Date(date);
    this.generateCalendar();
    this.selectedDay = date.getDate();
    let h = date.getHours();
    this.selectedPeriod = h >= 12 ? 'p. m.' : 'a. m.';
    h = h % 12;
    if (h === 0) h = 12;
    this.selectedHour = h.toString().padStart(2, '0');
    this.selectedMinute = date.getMinutes().toString().padStart(2, '0');
  }

  // Métodos de selección
  selectDay(day: number | null) {
    if (day === null) return;
    this.selectedDay = day;
    this.updateDate();
  }

  selectHour(hour: string) {
    this.selectedHour = hour;
    this.updateDate();
  }

  selectMinute(minute: string) {
    this.selectedMinute = minute;
    this.updateDate();
  }

  selectPeriod(period: 'a. m.' | 'p. m.') {
    this.selectedPeriod = period;
    this.updateDate();
  }

  private updateDate() {
    const targetDate = this.activePicker === 'start' ? this.startDate : this.endDate;
    targetDate.setFullYear(this.viewDate.getFullYear());
    targetDate.setMonth(this.viewDate.getMonth());
    targetDate.setDate(this.selectedDay);

    let h = parseInt(this.selectedHour);
    if (this.selectedPeriod === 'p. m.' && h < 12) h += 12;
    if (this.selectedPeriod === 'a. m.' && h === 12) h = 0;
    
    targetDate.setHours(h);
    targetDate.setMinutes(parseInt(this.selectedMinute));
    targetDate.setSeconds(0);
  }

  setToday() {
    const today = new Date();
    this.viewDate = new Date(today);
    this.generateCalendar();
    this.selectDay(today.getDate());
  }

  // Formateadores simples para los inputs
  getFormattedStartDate(): string {
    return this.formatDate(this.startDate);
  }

  getFormattedEndDate(): string {
    return this.endDate ? this.formatDate(this.endDate) : 'Seleccionar fecha';
  }

  private formatDate(date: Date): string {
    return date.toLocaleString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).replace(',', '');
  }

  onSearch() {
    const startStr = this.startDate.toISOString().split('T')[0];
    const endStr = this.endDate ? this.endDate.toISOString().split('T')[0] : startStr;
    
    this.filterChange.emit({ startDate: startStr, endDate: endStr });
    console.log('Buscando rango:', { start: startStr, end: endStr });
  }

}
