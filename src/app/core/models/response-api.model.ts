export interface ResponseApi<T> {
    status: number;
    message: string;
    data: T;
    timestamp: string;
}
