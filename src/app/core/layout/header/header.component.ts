import { Component, inject, signal, Output, EventEmitter, Input, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { AuthService } from '../../services/auth.service';
import { EstablishmentService } from '../../services/establishment.service';
import { EstablishmentStateService } from '../../services/establishment-state.service';
import { EstablishmentResponse } from '../../models/maintenance.model';

@Component({
    selector: 'app-header',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './header.component.html',
    styleUrl: './header.component.scss',
    animations: [
        trigger('slideInOut', [
            state('void', style({
                width: '0',
                opacity: '0',
                marginRight: '0'
            })),
            state('*', style({
                width: '*',
                opacity: '1',
                marginRight: '*'
            })),
            transition('void <=> *', animate('300ms cubic-bezier(0.4, 0, 0.2, 1)'))
        ])
    ]
})
export class HeaderComponent implements OnInit {
    @Input() collapsed = false;
    @Output() toggleSidebar = new EventEmitter<void>();
    authService = inject(AuthService);
    private establishmentService = inject(EstablishmentService);
    private establishmentStateService = inject(EstablishmentStateService);
    isDarkMode = signal(false);
    currentLanguage = signal('Español');
    isProfileDropdownOpen = signal(false);

    // Establishments loaded from API
    availableServiceCenters = signal<EstablishmentResponse[]>([]);
    selectedServiceCenterId = signal<number | null>(null);

    ngOnInit() {
        this.loadEstablishments();
    }

    loadEstablishments() {
        this.establishmentService.getAll().subscribe({
            next: (establishments) => {
                // Filter only active establishments
                const activeEstablishments = establishments.filter(e => e.active);
                this.availableServiceCenters.set(activeEstablishments);

                // Set the first active establishment as selected by default
                if (activeEstablishments.length > 0) {
                    this.selectedServiceCenterId.set(activeEstablishments[0].id);
                    this.establishmentStateService.setSelectedEstablishment(activeEstablishments[0].id);
                }
            },
            error: (error) => {
                console.error('Error loading establishments:', error);
            }
        });
    }

    toggleProfileDropdown(event: Event) {
        event.stopPropagation();
        this.isProfileDropdownOpen.update(v => !v);
    }

    @HostListener('document:click', ['$event'])
    closeDropdown(event: MouseEvent) {
        const target = event.target as HTMLElement;
        const container = document.querySelector('.profile-menu-container');
        if (container && !container.contains(target)) {
            this.isProfileDropdownOpen.set(false);
        }
    }

    selectCareCenter(id: number) {
        this.selectedServiceCenterId.set(id);
        this.establishmentStateService.setSelectedEstablishment(id);
        this.isProfileDropdownOpen.set(false);
    }

    myAccount() {
        // Implementation for navigation to account settings
        this.isProfileDropdownOpen.set(false);
    }

    logout() {
        this.authService.logout();
        this.isProfileDropdownOpen.set(false);
    }

    toggleTheme() {
        this.isDarkMode.update(v => !v);
        document.body.classList.toggle('dark-theme', this.isDarkMode());
    }

    get userInitials(): string {
        const user = this.authService.currentUser();
        if (!user || !user.nombre) return 'U';
        const names = user.nombre.split(' ');
        if (names.length >= 2) {
            return (names[0][0] + names[1][0]).toUpperCase();
        }
        return names[0][0].toUpperCase();
    }
}
