export interface RoleRequest {
    name: string;
    description?: string;
    active?: boolean;
}

export interface RoleResponse {
    id: number;
    name: string;
    description?: string;
    active: boolean;
    permissions?: PermissionResponse[];
    createdAt: string;
}

export interface PermissionResponse {
    id: number;
    name: string;
    description?: string;
    createdAt: string;
}

export interface EstablishmentRequest {
    name: string;
    address?: string;
    codeSunat?: string;
    active?: boolean;
}

export interface EstablishmentResponse {
    id: number;
    name: string;
    address?: string;
    codeSunat: string;
    active: boolean;
}

export interface UserRequest {
    username: string;
    email: string;
    password?: string;
    fullName?: string;
    active?: boolean;
}

export interface UserResponse {
    id: number;
    username: string;
    email: string;
    fullName?: string;
    active: boolean;
    lastLogin?: string;
    createdAt: string;
    updatedAt: string;
}
