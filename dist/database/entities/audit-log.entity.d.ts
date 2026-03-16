export declare class AuditLog {
    id: string;
    usuarioId: string;
    accion: string;
    descripcion: string;
    dataAnterior: any;
    dataNueva: any;
    tenantId: string;
    resuelto: boolean;
    comentarioResolucion: string;
    resueltoPor: string;
    fecha: Date;
}
