export interface LoginRequest {
    usernameOrEmail: string;
    password: string;
}

export interface RegisterRequest {
    username: string;
    password: string;
    email: string;
    nombre: string;
}

export interface LoginResponse {
    token: string;
    username: string;
    email: string;
    nombre: string;
    rol: string;
}

export interface User {
    id?: number;
    username: string;
    email: string;
    nombre: string;
    rol: string;
}
