import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomTabsConfig, TabConfig } from './interface/custom-tabs-config.interface';

@Component({
    selector: 'app-custom-tabs',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './custom-tabs.component.html',
    styleUrls: ['./custom-tabs.component.scss'],
})
export class CustomTabsComponent implements OnInit {
    @Input() config!: CustomTabsConfig;
    @Input() storageKey: string = 'active-tab';
    @Output() tabChanged = new EventEmitter<string>();

    activeTab: string = '';
    visibleTabs: TabConfig[] = [];

    ngOnInit() {
        this.visibleTabs = this.config.tabs.filter(t => t.visible !== false);

        const stored = localStorage.getItem(this.storageKey);
        const validStored = this.visibleTabs.find(t => t.id === stored);
        const defaultTabValid = this.visibleTabs.find(t => t.id === this.config.defaultTab);

        if (validStored) {
            this.activeTab = validStored.id;
            this.tabChanged.emit(validStored.id);
        } else if (defaultTabValid) {
            this.activeTab = defaultTabValid.id;
        } else if (this.visibleTabs.length > 0) {
            this.activeTab = this.visibleTabs[0].id;
        }
    }

    selectTab(tabId: string) {
        if (this.activeTab === tabId) return;
        this.activeTab = tabId;
        localStorage.setItem(this.storageKey, tabId);
        this.tabChanged.emit(tabId);
    }

    isActive(tabId: string): boolean {
        return this.activeTab === tabId;
    }
}
