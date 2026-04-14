import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { of, throwError } from 'rxjs';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

describe('AuthService', () => {
    let service: AuthService;
    let router: Router;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                provideRouter([]),
                { provide: Router, useValue: routerSpy }
            ]
        });

        service = TestBed.inject(AuthService);
        router = TestBed.inject(Router);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        sessionStorage.clear();
        localStorage.clear();
        httpMock.verify();
    });

    describe('isAuthenticated', () => {
        it('should return false when no token exists', () => {
            expect(service.isAuthenticated()).toBeFalse();
        });

        it('should return false when token is expired', () => {
            const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
            const payload = btoa(JSON.stringify({ sub: 'testuser', exp: Math.floor(Date.now() / 1000) - 3600 }));
            const fakeToken = `${header}.${payload}.fakesignature`;
            sessionStorage.setItem('auth_token', fakeToken);

            expect(service.isAuthenticated()).toBeFalse();
        });

        it('should return true when token exists and is not expired', () => {
            const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
            const payload = btoa(JSON.stringify({ sub: 'testuser', exp: Math.floor(Date.now() / 1000) + 3600 }));
            const fakeToken = `${header}.${payload}.fakesignature`;
            sessionStorage.setItem('auth_token', fakeToken);

            expect(service.isAuthenticated()).toBeTrue();
        });

        it('should return false when token is malformed', () => {
            sessionStorage.setItem('auth_token', 'not-a-valid-jwt');

            expect(service.isAuthenticated()).toBeFalse();
        });
    });

    describe('getToken', () => {
        it('should return null when no token in sessionStorage', () => {
            expect(service.getToken()).toBeNull();
        });

        it('should return token from sessionStorage', () => {
            sessionStorage.setItem('auth_token', 'test-token');
            expect(service.getToken()).toBe('test-token');
        });
    });

    describe('getRefreshToken', () => {
        it('should return null when no refresh token in localStorage', () => {
            expect(service.getRefreshToken()).toBeNull();
        });

        it('should return refresh token from localStorage', () => {
            localStorage.setItem('refresh_token', 'refresh-token-value');
            expect(service.getRefreshToken()).toBe('refresh-token-value');
        });
    });

    describe('hasPermission', () => {
        it('should return false when no user is logged in', () => {
            expect(service.hasPermission('VENTAS_POS')).toBeFalse();
        });

        it('should return true when user has the permission', () => {
            const user = {
                id: 1, username: 'test', email: 'test@test.com', fullName: 'Test User',
                roles: ['USER'], permissions: ['VENTAS_POS', 'INVENTARIO_ACTUAL'],
                profilePicture: null
            };
            service.updateCurrentUser(user);
            expect(service.hasPermission('VENTAS_POS')).toBeTrue();
        });

        it('should return false when user does not have the permission', () => {
            const user = {
                id: 1, username: 'test', email: 'test@test.com', fullName: 'Test User',
                roles: ['USER'], permissions: ['INVENTARIO_ACTUAL'],
                profilePicture: null
            };
            service.updateCurrentUser(user);
            expect(service.hasPermission('VENTAS_POS')).toBeFalse();
        });

        it('should return false when user permissions is undefined', () => {
            const user = {
                id: 1, username: 'test', email: 'test@test.com', fullName: 'Test User',
                roles: ['USER'], permissions: undefined as unknown as string[],
                profilePicture: null
            };
            service.updateCurrentUser(user);
            expect(service.hasPermission('VENTAS_POS')).toBeFalse();
        });
    });

    describe('hasAnyPermission', () => {
        it('should return true when permissions array is empty', () => {
            expect(service.hasAnyPermission([])).toBeTrue();
        });

        it('should return true when user has at least one of the required permissions', () => {
            const user = {
                id: 1, username: 'test', email: 'test@test.com', fullName: 'Test User',
                roles: ['USER'], permissions: ['VENTAS_POS'],
                profilePicture: null
            };
            service.updateCurrentUser(user);
            expect(service.hasAnyPermission(['VENTAS_POS', 'INVENTARIO_ACTUAL'])).toBeTrue();
        });

        it('should return false when user has none of the required permissions', () => {
            const user = {
                id: 1, username: 'test', email: 'test@test.com', fullName: 'Test User',
                roles: ['USER'], permissions: ['CAJA_APERTURA_CIERRE'],
                profilePicture: null
            };
            service.updateCurrentUser(user);
            expect(service.hasAnyPermission(['VENTAS_POS', 'INVENTARIO_ACTUAL'])).toBeFalse();
        });

        it('should return false when no user is logged in', () => {
            expect(service.hasAnyPermission(['VENTAS_POS'])).toBeFalse();
        });

        it('should return true when permissions array is null or undefined', () => {
            expect(service.hasAnyPermission(null as unknown as string[])).toBeTrue();
        });
    });

    describe('hasAllPermissions', () => {
        it('should return true when permissions array is empty', () => {
            expect(service.hasAllPermissions([])).toBeTrue();
        });

        it('should return true when user has all required permissions', () => {
            const user = {
                id: 1, username: 'test', email: 'test@test.com', fullName: 'Test User',
                roles: ['USER'], permissions: ['VENTAS_POS', 'INVENTARIO_ACTUAL'],
                profilePicture: null
            };
            service.updateCurrentUser(user);
            expect(service.hasAllPermissions(['VENTAS_POS', 'INVENTARIO_ACTUAL'])).toBeTrue();
        });

        it('should return false when user does not have all required permissions', () => {
            const user = {
                id: 1, username: 'test', email: 'test@test.com', fullName: 'Test User',
                roles: ['USER'], permissions: ['VENTAS_POS'],
                profilePicture: null
            };
            service.updateCurrentUser(user);
            expect(service.hasAllPermissions(['VENTAS_POS', 'INVENTARIO_ACTUAL'])).toBeFalse();
        });
    });

    describe('getUserPermissions', () => {
        it('should return empty array when no user is logged in', () => {
            expect(service.getUserPermissions()).toEqual([]);
        });

        it('should return user permissions when logged in', () => {
            const user = {
                id: 1, username: 'test', email: 'test@test.com', fullName: 'Test User',
                roles: ['USER'], permissions: ['VENTAS_POS', 'INVENTARIO_ACTUAL'],
                profilePicture: null
            };
            service.updateCurrentUser(user);
            expect(service.getUserPermissions()).toEqual(['VENTAS_POS', 'INVENTARIO_ACTUAL']);
        });
    });

    describe('getUserRoles', () => {
        it('should return empty array when no user is logged in', () => {
            expect(service.getUserRoles()).toEqual([]);
        });

        it('should return user roles when logged in', () => {
            const user = {
                id: 1, username: 'test', email: 'test@test.com', fullName: 'Test User',
                roles: ['ADMIN', 'USER'], permissions: [],
                profilePicture: null
            };
            service.updateCurrentUser(user);
            expect(service.getUserRoles()).toEqual(['ADMIN', 'USER']);
        });
    });

    describe('hasRole', () => {
        it('should return false when no user is logged in', () => {
            expect(service.hasRole('ADMIN')).toBeFalse();
        });

        it('should return true when user has the role', () => {
            const user = {
                id: 1, username: 'test', email: 'test@test.com', fullName: 'Test User',
                roles: ['ADMIN', 'USER'], permissions: [],
                profilePicture: null
            };
            service.updateCurrentUser(user);
            expect(service.hasRole('ADMIN')).toBeTrue();
        });

        it('should return false when user does not have the role', () => {
            const user = {
                id: 1, username: 'test', email: 'test@test.com', fullName: 'Test User',
                roles: ['USER'], permissions: [],
                profilePicture: null
            };
            service.updateCurrentUser(user);
            expect(service.hasRole('ADMIN')).toBeFalse();
        });
    });

    describe('hasAnyRole', () => {
        it('should return true when roles array is empty', () => {
            expect(service.hasAnyRole([])).toBeTrue();
        });

        it('should return true when user has at least one of the required roles', () => {
            const user = {
                id: 1, username: 'test', email: 'test@test.com', fullName: 'Test User',
                roles: ['USER'], permissions: [],
                profilePicture: null
            };
            service.updateCurrentUser(user);
            expect(service.hasAnyRole(['ADMIN', 'USER'])).toBeTrue();
        });

        it('should return false when user has none of the required roles', () => {
            const user = {
                id: 1, username: 'test', email: 'test@test.com', fullName: 'Test User',
                roles: ['USER'], permissions: [],
                profilePicture: null
            };
            service.updateCurrentUser(user);
            expect(service.hasAnyRole(['ADMIN', 'SUPER_ADMIN'])).toBeFalse();
        });
    });

    describe('logout', () => {
        it('should clear sessionStorage and localStorage and navigate to login', () => {
            sessionStorage.setItem('auth_token', 'test');
            sessionStorage.setItem('current_user', '{}');
            localStorage.setItem('refresh_token', 'test');

            service.logout();

            expect(sessionStorage.getItem('auth_token')).toBeNull();
            expect(sessionStorage.getItem('current_user')).toBeNull();
            expect(localStorage.getItem('refresh_token')).toBeNull();
            expect(service.currentUser()).toBeNull();
            expect(router.navigate).toHaveBeenCalledWith(['/login']);
        });
    });

    describe('updateCurrentUser', () => {
        it('should update the currentUser signal and sessionStorage', () => {
            const user = {
                id: 1, username: 'test', email: 'test@test.com', fullName: 'Test User',
                roles: ['USER'], permissions: ['VENTAS_POS'],
                profilePicture: null
            };

            service.updateCurrentUser(user);

            expect(service.currentUser()).toEqual(user);
            expect(sessionStorage.getItem('current_user')).toBe(JSON.stringify(user));
        });
    });

    describe('getUserFromStorage', () => {
        it('should handle corrupted JSON gracefully', () => {
            sessionStorage.setItem('current_user', '{invalid json');

            const service2 = TestBed.inject(AuthService);
            expect(service2.currentUser()).toBeNull();
        });

        it('should return null when no user data in storage', () => {
            expect(service.currentUser()).toBeNull();
        });
    });

    describe('login', () => {
        it('should save auth data on successful login', fakeAsync(() => {
            const mockResponse = {
                status: 200,
                message: 'Login successful',
                data: {
                    token: 'fake-jwt-token',
                    refreshToken: 'fake-refresh-token',
                    id: 1,
                    username: 'testuser',
                    email: 'test@test.com',
                    fullName: 'Test User',
                    roles: ['USER'],
                    permissions: ['VENTAS_POS'],
                    profilePicture: null
                }
            };

            service.login({ usernameOrEmail: 'test', password: 'password' }).subscribe(response => {
                expect(response).toEqual(mockResponse);
            });

            const req = httpMock.expectOne('/api/v1/auth/login');
            expect(req.request.method).toBe('POST');
            expect(req.request.body).toEqual({ usernameOrEmail: 'test', password: 'password' });
            req.flush(mockResponse);

            expect(sessionStorage.getItem('auth_token')).toBe('fake-jwt-token');
            expect(localStorage.getItem('refresh_token')).toBe('fake-refresh-token');
            expect(service.currentUser()?.username).toBe('testuser');
        }));

        it('should not save auth data when status is not 200', fakeAsync(() => {
            const mockResponse = {
                status: 401,
                message: 'Invalid credentials',
                data: null
            };

            service.login({ usernameOrEmail: 'test', password: 'wrong' }).subscribe(response => {
                expect(response).toEqual(mockResponse);
            });

            const req = httpMock.expectOne('/api/v1/auth/login');
            req.flush(mockResponse);

            expect(sessionStorage.getItem('auth_token')).toBeNull();
        }));
    });

    describe('register', () => {
        it('should save auth data on successful registration', fakeAsync(() => {
            const mockResponse = {
                status: 201,
                message: 'Registration successful',
                data: {
                    token: 'new-jwt-token',
                    refreshToken: 'new-refresh-token',
                    id: 2,
                    username: 'newuser',
                    email: 'new@test.com',
                    fullName: 'New User',
                    roles: ['USER'],
                    permissions: [],
                    profilePicture: null
                }
            };

            service.register({
                username: 'newuser',
                password: 'password',
                email: 'new@test.com',
                fullName: 'New User'
            }).subscribe(response => {
                expect(response).toEqual(mockResponse);
            });

            const req = httpMock.expectOne('/api/v1/auth/register');
            expect(req.request.method).toBe('POST');
            req.flush(mockResponse);

            expect(sessionStorage.getItem('auth_token')).toBe('new-jwt-token');
            expect(service.currentUser()?.username).toBe('newuser');
        }));
    });

    describe('refreshToken', () => {
        it('should call refresh endpoint and update tokens', fakeAsync(() => {
            localStorage.setItem('refresh_token', 'valid-refresh-token');

            const mockResponse = {
                status: 200,
                message: 'Token refreshed',
                data: {
                    token: 'new-access-token',
                    refreshToken: 'new-refresh-token',
                    id: 1,
                    username: 'testuser',
                    email: 'test@test.com',
                    fullName: 'Test User',
                    roles: ['USER'],
                    permissions: ['VENTAS_POS'],
                    profilePicture: null
                }
            };

            service.refreshToken().subscribe(response => {
                expect(response).toEqual(mockResponse);
            });

            const req = httpMock.expectOne('/api/v1/auth/refresh');
            expect(req.request.body).toEqual({ refreshToken: 'valid-refresh-token' });
            req.flush(mockResponse);

            expect(sessionStorage.getItem('auth_token')).toBe('new-access-token');
            expect(localStorage.getItem('refresh_token')).toBe('new-refresh-token');
        }));

        it('should logout when no refresh token exists', () => {
            expect(() => service.refreshToken()).toThrow('No refresh token available');
            expect(router.navigate).toHaveBeenCalledWith(['/login']);
        });

        it('should logout when refresh returns non-200', fakeAsync(() => {
            localStorage.setItem('refresh_token', 'expired-refresh-token');

            const mockResponse = {
                status: 401,
                message: 'Invalid refresh token',
                data: null
            };

            service.refreshToken().subscribe(response => {
                expect(response).toEqual(mockResponse);
            });

            const req = httpMock.expectOne('/api/v1/auth/refresh');
            req.flush(mockResponse);

            expect(sessionStorage.getItem('auth_token')).toBeNull();
            expect(router.navigate).toHaveBeenCalledWith(['/login']);
        }));
    });
});
