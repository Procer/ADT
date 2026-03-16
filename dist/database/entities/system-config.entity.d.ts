export declare class SystemConfig {
    id: string;
    configKey: string;
    smtpConfig: {
        host: string;
        port: number;
        user: string;
        pass: string;
        from: string;
        secure: boolean;
    };
    telegramConfig: {
        botToken: string;
        globalChatId: string;
        enabled: boolean;
    };
    geminiApiKey: string;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
}
