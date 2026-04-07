export interface CompanyMinimalResponse {
    ruc: string;
    name: string;
    secondaryName?: string;
    address: string;
    ubigeo?: string;
    urbanization?: string;
    phone?: string;
    email?: string;
    logoUrl?: string;
}

export interface CompanyResponse extends CompanyMinimalResponse {
    id: number;
    createdAt: string;
    updatedAt: string;
}
