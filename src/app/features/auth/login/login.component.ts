import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule],
    templateUrl: './login.component.html',
    styleUrl: './login.component.scss'
})
export class LoginComponent {
    private fb = inject(FormBuilder);
    private authService = inject(AuthService); // Tu servicio
    private router = inject(Router);

    loginForm: FormGroup;
    errorMessage = signal<string>('');
    isLoading = signal<boolean>(false);
    showPassword = signal<boolean>(false); // Nuevo: Controlar visibilidad password

    constructor() {
        this.loginForm = this.fb.group({
            usernameOrEmail: ['', [Validators.required]],
            password: ['', [Validators.required, Validators.minLength(4)]]
        });
    }

    togglePassword(): void {
        this.showPassword.update(value => !value);
    }

    onSubmit(): void {
        if (this.loginForm.invalid) {
            this.loginForm.markAllAsTouched();
            return;
        }

        this.isLoading.set(true);
        this.errorMessage.set('');

        this.authService.login(this.loginForm.value).subscribe({
            next: () => this.router.navigate(['/home']),
            error: (err) => {
                this.isLoading.set(false);
                this.errorMessage.set(err.error?.message || 'Error de credenciales');
            },
            complete: () => this.isLoading.set(false)
        });
    }

    // Helpers para la vista
    isInvalid(fieldName: string): boolean {
        const field = this.loginForm.get(fieldName);
        return !!(field?.invalid && (field?.dirty || field?.touched));
    }
}