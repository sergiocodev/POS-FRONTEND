import { Component, EventEmitter, Output, OnDestroy } from '@angular/core';
import { Subject, debounceTime } from 'rxjs';

@Component({
    selector: 'app-auto-search-input',
    standalone: true,
    templateUrl: './auto-search-input.component.html',
    styleUrls: ['./auto-search-input.component.scss']
})
export class AutoSearchInputComponent implements OnDestroy {
    @Output() SendInputFilter: EventEmitter<string> = new EventEmitter();

    private inputSubject: Subject<string> = new Subject();
    private debounceTimeMs = 750;

    constructor() {
        this.inputSubject
            .pipe(debounceTime(this.debounceTimeMs))
            .subscribe(value => this.SendInputFilter.emit(value));
    }

    onInputChange(event: any): void {
        const value = event.target.value;
        this.inputSubject.next(value);
    }

    onEnter(event: Event): void {
        const keyboardEvent = event as KeyboardEvent;
        const input = (keyboardEvent.target as HTMLInputElement).value;
        this.SendInputFilter.emit(input);
    }

    ngOnDestroy(): void {
        this.inputSubject.unsubscribe();
    }
}
