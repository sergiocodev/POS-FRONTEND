import { Component, Input } from '@angular/core';
import { NgFor, NgIf, NgClass } from '@angular/common';
import { RouterLink, RouterModule, RouterLinkActive } from '@angular/router';

@Component({
    selector: 'app-item-list-accordion',
    standalone: true,
    imports: [NgFor, NgIf, NgClass, RouterLink, RouterModule, RouterLinkActive],
    templateUrl: './item-list-accordion.component.html',
    styleUrl: './item-list-accordion.component.scss'
})
export class ItemListAccordionComponent {
    
    @Input() MenuName: string = '';

    
    @Input() MenuIcon: string = '';

    
    @Input() Items: { ItemName: string; ItemLink: string }[] = [];

    
    @Input() Link: string = '';

    get isVisible(): boolean {
        return true; 
    }
}
