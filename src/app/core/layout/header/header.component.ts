import { Component, inject, signal, Output, EventEmitter, Input, HostListener, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { EstablishmentService } from '../../services/establishment.service';
import { EstablishmentStateService } from '../../services/establishment-state.service';
import { EstablishmentResponse } from '../../models/maintenance.model';
import { ProfileDropdown } from './components/profile-dropdown/profile-dropdown';

@Component({
    selector: 'app-header',
    standalone: true,
    imports: [CommonModule, ProfileDropdown],
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
    @Output() toggleSidebar = new EventEmitter<void>();
    authService = inject(AuthService);
    themeService = inject(ThemeService);
    private establishmentService = inject(EstablishmentService);
    private establishmentStateService = inject(EstablishmentStateService);
    currentLanguage = signal('Español');
    isProfileDropdownOpen = signal(false);
    imageError = signal(false);

    get isDarkMode() {
        return this.themeService.isDarkMode();
    }

    constructor() {
        effect(() => {
            // Accessing currentUser to track changes
            this.authService.currentUser();
            this.imageError.set(false);
        });
    }


    availableServiceCenters = signal<EstablishmentResponse[]>([]);
    selectedServiceCenterId = signal<number | null>(null);

    ngOnInit() {
        this.loadEstablishments();
    }

    loadEstablishments() {
        this.establishmentService.getAll().subscribe({
            next: (response) => {
                const establishments = response.data;
                this.availableServiceCenters.set(establishments);

                if (establishments.length > 0) {
                    // Respect previously saved selection from localStorage
                    const savedId = this.establishmentStateService.getSelectedEstablishment();
                    const savedExists = savedId && establishments.some(e => e.id === savedId);

                    if (savedExists) {
                        // Sync the local header signal with the already-saved state
                        this.selectedServiceCenterId.set(savedId);
                    } else {
                        // First load or saved establishment was deleted: auto-select first
                        const firstId = establishments[0].id;
                        this.selectedServiceCenterId.set(firstId);
                        this.establishmentStateService.setSelectedEstablishment(firstId);
                    }
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

        this.isProfileDropdownOpen.set(false);
    }

    logout() {
        this.authService.logout();
        this.isProfileDropdownOpen.set(false);
    }

    toggleTheme() {
        this.themeService.toggleTheme();
    }

    get userInitials(): string {
        const user = this.authService.currentUser();
        if (!user || !user.fullName) return 'U';
        const names = user.fullName.split(' ');
        if (names.length >= 2) {
            return (names[0][0] + names[1][0]).toUpperCase();
        }
        return names[0][0].toUpperCase();
    }
}

