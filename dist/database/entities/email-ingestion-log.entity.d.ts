export declare class EmailIngestionLog {
    id: string;
    tenantId: string;
    remitente: string;
    asunto: string;
    cuerpoRaw: string;
    jsonExtraido: any;
    estadoIngesta: 'EXITOSO' | 'RECHAZADO_FILTRO' | 'ERROR_IA' | 'ERROR_TECNICO';
    errorDetalle: string;
    createdAt: Date;
}
