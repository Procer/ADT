export declare class FinancialReportingService {
    private readonly logger;
    private fonts;
    constructor();
    generateFinanceExcel(data: {
        tenantName: string;
        period: string;
        rows: any[];
    }): Promise<Buffer>;
    generateStatusReportExcel(data: {
        tenantName: string;
        period: string;
        summary: any;
        breakdown: any[];
        history: any[];
        aging: any[];
    }): Promise<Buffer>;
    generatePreInvoice(data: any): Promise<Buffer>;
    generateDriverReceipt(data: any): Promise<Buffer>;
    generateProfitabilityPdf(data: {
        tenantName: string;
        period: string;
        stats: any;
    }): Promise<Buffer>;
    private createPdf;
}
