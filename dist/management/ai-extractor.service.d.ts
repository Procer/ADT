import { DataSource } from 'typeorm';
export declare class AiExtractorService {
    private dataSource;
    private readonly logger;
    private genAI;
    constructor(dataSource: DataSource);
    extractTripData(text: string, apiKey?: string): Promise<any>;
    private callWithRetry;
    processFinanceCopilot(userInput: string, context: any, apiKey?: string): Promise<any>;
    private executeReadOnlyQuery;
}
