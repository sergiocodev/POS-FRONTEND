import { Component, EventEmitter, Input, OnChanges, Output } from "@angular/core";
import { ActionButton } from "./interface/action-button";
import { AVAILABLE_ACTIONS } from "./constants/available-actions";
import { NgFor } from "@angular/common";
import { NgClass, NgStyle, NgIf } from "@angular/common";
import { TooltipDirective } from '../../../directives/tooltip.directive';

@Component({
    selector: 'app-button-actions',
    standalone: true,
    imports: [NgFor, NgClass, NgStyle, NgIf, TooltipDirective],
    templateUrl: './button-actions.component.html',
    styleUrls: ['./button-actions.component.scss'],
})
export class ButtonActionsComponent implements OnChanges {
    @Input() actions: string[] = [];
    @Input() customColors: { [key: string]: string } = {};
    @Input() showLabels = false;
    @Input() size: 'small' | 'medium' | 'large' = 'small';
    @Output() actionClicked = new EventEmitter<ActionButton>();
    @Input() showTooltip: boolean = false;

    selectedActions: ActionButton[] = [];

    ngOnChanges(): void {
        this.selectedActions = this.actions
            .map(actionName => AVAILABLE_ACTIONS.find(action => action.name === actionName))
            .filter((action): action is ActionButton => !!action)
            .map(action => ({
                ...action,
                color: action.color || 'primary',
                backgroundColor: this.customColors[action.name] || action.backgroundColor,
                size: this.size,
            }));
    }

    onActionClick(action: ActionButton): void {
        this.actionClicked.emit(action);
    }
}
