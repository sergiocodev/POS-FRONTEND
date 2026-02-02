import { ActionButton } from "../interface/action-button";

export const AVAILABLE_ACTIONS: ActionButton[] = [
    { name: 'Create', icon: 'bi bi-plus-circle', class: 'btn', backgroundColor: '#28a745', color: 'white', label: 'Crear' },
    { name: 'Edit', icon: 'bi bi-pencil-square', class: 'btn', backgroundColor: '#007bff', color: 'white', label: 'Editar' },
    { name: 'Delete', icon: 'bi bi-trash3', class: 'btn', backgroundColor: '#dc3545', color: 'white', label: 'Eliminar' },
    { name: 'Download', icon: 'bi bi-download', class: 'btn', backgroundColor: '#ffc107', color: 'white', label: 'Descargar' },
    { name: 'ExportExcel', icon: 'bi bi-file-earmark-excel', class: 'btn', backgroundColor: '#1d6f42', color: 'white', label: 'Exportar Excel' },
    { name: 'Search', icon: 'bi bi-search', class: 'btn', backgroundColor: '#007bff', color: 'white', label: 'Buscar' },
];
