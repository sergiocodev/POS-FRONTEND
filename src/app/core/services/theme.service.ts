import { Injectable, signal } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class ThemeService {
    private darkMode = signal<boolean>(false);
    isDarkMode = this.darkMode.asReadonly();

    constructor() {
        
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            this.setDarkMode(true);
        } else {
            this.setDarkMode(false);
        }
    }

    toggleTheme() {
        this.setDarkMode(!this.darkMode());
    }

    private setDarkMode(isDark: boolean) {
        this.darkMode.set(isDark);
        if (isDark) {
            document.body.classList.add('dark-theme');
            localStorage.setItem('theme', 'dark');
        } else {
            document.body.classList.remove('dark-theme');
            localStorage.setItem('theme', 'light');
        }
    }
}
