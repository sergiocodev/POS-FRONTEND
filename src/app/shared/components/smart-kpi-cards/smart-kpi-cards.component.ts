import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface SmartKpiItem {
    label: string;
    value: string | number;
    prefix?: string;
    suffix?: string;
    icon: string;      // Bootstrap icon class
    color: 'blue' | 'green' | 'purple' | 'orange';
    trendValue?: string;
    trendDirection?: 'up' | 'down' | 'neutral';
    trendText?: string;
}

@Component({
    selector: 'app-smart-kpi-cards',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './smart-kpi-cards.component.html',
    styleUrl: './smart-kpi-cards.component.scss'
})
export class SmartKpiCardsComponent {
    @Input() items: SmartKpiItem[] = [];
    @Input() showTrend: boolean = true;
    @Input() showChart: boolean = true;
}
