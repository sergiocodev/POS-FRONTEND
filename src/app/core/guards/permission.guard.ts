import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const permissionGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    // Get required permissions from route data
    const requiredPermissions = route.data['requiredPermissions'] as string[];

    if (!requiredPermissions || requiredPermissions.length === 0) {
        return true; 
    }

    if (authService.hasAnyPermission(requiredPermissions)) {
        return true;
    }

    // Redirect to home if user lacks permissions, 
    // but avoid infinite loops if home itself is protected and failing
    if (state.url !== '/home') {
        router.navigate(['/home']);
    } else {
        // If home is what's failing, we might want to redirect to a 403 page or login
        // For now, let's redirect to login to be safe, or just return false
        router.navigate(['/login']);
    }
    return false;
};
