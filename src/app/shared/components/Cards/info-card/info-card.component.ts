import { Component, Input } from "@angular/core"
import { CommonModule } from "@angular/common"

export interface InfoCardItem {
    label: string;
    value: string | number;
    icon?: string;
    color?: 'primary' | 'success' | 'danger' | 'warning' | 'info';
    currency?: boolean;
}

@Component({
    selector: "app-info-card",
    standalone: true,
    imports: [CommonModule],
    templateUrl: "./info-card.component.html",
    styleUrl: "./info-card.component.scss",
})
export class InfoCardComponent {
    @Input() title?: string;
    @Input() items: InfoCardItem[] = [];
}
