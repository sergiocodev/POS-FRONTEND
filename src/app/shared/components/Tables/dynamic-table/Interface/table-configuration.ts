export interface SubHeader {
    key: string;
    fieldType?: 'text' | 'input' | 'select' | 'checkbox';
    label?: string;
    options?: { id: number; name: string; value?: string }[];
    dynamicOptions?: (row: any) => { id: number; name: string; value?: string }[];
}

export interface TableHeader {
    label: string;
    colspan?: number;
    rowspan?: number;
    filter?: boolean;
    key?: string;
    subHeaders?: SubHeader[];
    sortable?: boolean;
}

export interface TableRow {
    [key: string]: any;
}
