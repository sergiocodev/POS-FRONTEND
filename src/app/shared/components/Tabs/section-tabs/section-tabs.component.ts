import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-section-tabs',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './section-tabs.component.html',
    styleUrl: './section-tabs.component.scss'
})
export class SectionTabsComponent implements OnInit {
    @Input() titles: { name: string, id: string, icon?: string }[] = [];
    @Input() activeId!: string;
    @Input() disableAutoSelect: boolean = false;

    @Output() tabChange = new EventEmitter<string>();

    ngOnInit(): void {
        if (!this.activeId && !this.disableAutoSelect && this.titles.length > 0) {
            this.activeId = this.titles[0].id;
            this.tabChange.emit(this.activeId);
        }
    }

    selectTab(tabId: string) {
        if (tabId === this.activeId) return;
        this.activeId = tabId;
        this.tabChange.emit(tabId);
    }
}
