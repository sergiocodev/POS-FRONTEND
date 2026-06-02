import { Component, input, output } from '@angular/core';

export interface CustomTab {
    key: string;
    label: string;
    icon?: string;
}

@Component({
  selector: 'app-custom-tabs',
  standalone: true,
  imports: [],
  templateUrl: './custom-tabs.component.html',
  styleUrl: './custom-tabs.component.scss',
})
export class CustomTabsComponent {
    tabs = input<CustomTab[]>([]);
    activeTab = input<string>('');
    tabChange = output<string>();

    onTabClick(key: string): void {
        this.tabChange.emit(key);
    }
}
