

export interface RoleRequest {
    name: string;
    description?: string;
}

export interface RoleResponse {
    id: number;
    name: string;
    description?: string;
    permissionCount?: number;
    createdAt: string;
}

export interface RoleDetailResponse {
    id: number;
    name: string;
    description?: string;
    permissions: PermissionResponse[];
    createdAt: string;
}



export interface PermissionResponse {
    id: number;
    name: string;
    description?: string;
    module?: string;
    createdAt: string;
}

export interface CreatePermissionRequest {
    name: string;
    description?: string;
    module?: string;
}

export interface AssignPermissionsRequest {
    permissionIds: number[];
}

export interface EstablishmentRequest {
    name: string;
    address?: string;
    codeSunat?: string;
}

export interface EstablishmentResponse {
    id: number;
    name: string;
    address?: string;
    codeSunat: string;
}

export interface UserRequest {
    username: string;
    email: string;
    password?: string;
    fullName?: string;
}

export interface UserResponse {
    id: number;
    username: string;
    email: string;
    fullName?: string;
    lastLogin?: string;
    createdAt: string;
    updatedAt: string;
}
