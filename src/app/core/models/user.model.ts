import { RoleResponse } from './maintenance.model';

/**
 * DTO para crear o actualizar un usuario.
 * El backend asigna el rol por defecto si roleIds está vacío o no se envía.
 */
export interface UserRequest {
  username: string;
  email: string;
  password?: string;
  fullName: string;
  roleIds: number[];
  profilePicture?: string;
}

/**
 * DTO de respuesta del usuario.
 * Las fechas (lastLogin, createdAt, updatedAt) vienen como Instant ISO 8601 UTC
 * con sufijo "Z", ejemplo: "2024-01-01T00:00:00Z"
 */
export interface UserResponse {
  id: number;
  username: string;
  email: string;
  fullName: string;
  roles: RoleResponse[];
  profilePicture?: string;
  /** ISO 8601 UTC (Instant). Ej: "2024-01-15T10:30:00Z". Null si nunca inició sesión. */
  lastLogin?: string;
  /** ISO 8601 UTC (Instant). */
  createdAt: string;
  /** ISO 8601 UTC (Instant). */
  updatedAt: string;
}

export interface UserAssignRolesRequest {
  roleIds: number[];
}

export interface ExternalLookupResponse {
  nombres?: string;
  apellidoPaterno?: string;
  apellidoMaterno?: string;
  tipoDocumento?: string;
  numeroDocumento?: string;
  razonSocial?: string;
  estado?: string;
  condicion?: string;
  direccion?: string;
  distrito?: string;
  provincia?: string;
  departamento?: string;
}
