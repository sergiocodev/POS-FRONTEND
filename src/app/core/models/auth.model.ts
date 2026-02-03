export interface LoginRequest {
    usernameOrEmail: string;
    password: string;
}

export interface RegisterRequest {
    username: string;
    password: string;
    email: string;
    fullName: string;
}

export interface LoginResponse {
    token: string;
    refreshToken?: string;
    type?: string;
    id: number;
    username: string;
    email: string;
    fullName: string;
    roles: string[];
    permissions: string[];
}

export interface User {
    id?: number;
    username: string;
    email: string;
    fullName: string;
    roles: string[];
    permissions: string[];
}
