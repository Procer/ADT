export declare enum LogLevel {
    INFO = "INFO",
    WARN = "WARN",
    ERROR = "ERROR",
    CRITICAL = "CRITICAL"
}
export declare class AppLog {
    id: string;
    timestamp: Date;
    contexto: string;
    level: LogLevel;
    mensaje: string;
    metadata: string;
    userId: string | null;
    tenantId: string | null;
}
