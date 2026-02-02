import { RoleResponse } from './maintenance.model';
import { EstablishmentResponse } from './maintenance.model';

export interface UserRequest {
    username: string;
    email: string;
    password?: string;
    fullName: string;
    roleIds: number[];
    establishmentIds?: number[];
    active?: boolean;
}

export interface UserResponse {
    id: number;
    username: string;
    email: string;
    fullName: string;
    active: boolean;
    roles: RoleResponse[];
    establishments: EstablishmentResponse[];
    lastLogin?: string;
    createdAt: string;
    updatedAt: string;
}

export interface UserAssignRolesRequest {
    roleIds: number[];
}

export interface UserAssignEstablishmentsRequest {
    establishmentIds: number[];
}
