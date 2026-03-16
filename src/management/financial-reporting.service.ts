import { Injectable, Logger } from '@nestjs/common';
import * as XLSX from 'xlsx';
const pdfmake = require('pdfmake/js/index');

@Injectable()
export class FinancialReportingService {
    private readonly logger = new Logger(FinancialReportingService.name);
    private fonts = {
        Courier: { normal: 'Courier', bold: 'Courier-Bold', italics: 'Courier-Oblique', bolditalics: 'Courier-BoldOblique' },
        Helvetica: { normal: 'Helvetica', bold: 'Helvetica-Bold', italics: 'Helvetica-Oblique', bolditalics: 'Helvetica-BoldOblique' },
        Times: { normal: 'Times-Roman', bold: 'Times-Bold', italics: 'Times-Italic', bolditalics: 'Times-BoldItalic' }
    };

    constructor() {
        if (pdfmake.setFonts) {
            pdfmake.setFonts(this.fonts);
        } else if (pdfmake.default && pdfmake.default.setFonts) {
            pdfmake.default.setFonts(this.fonts);
        }
    }

    async generateFinanceExcel(data: { tenantName: string, period: string, rows: any[] }): Promise<Buffer> {
        this.logger.log(`Generando Excel de rentabilidad para ${data.tenantName}`);

        const worksheet = XLSX.utils.json_to_sheet(data.rows.map(r => ({
            'Fecha': r.fecha,
            'CP': r.numeroCP,
            'Dador': r.cliente,
            'Chofer': r.chofer,
            'Ingreso (Cobro)': r.revenue,
            'Costo (Pago)': r.cost,
            'Comisión ADT': r.adtFee,
            'Margen Neto': r.profit
        })));

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Rentabilidad');

        return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    }

    async generateStatusReportExcel(data: {
        tenantName: string,
        period: string,
        summary: any,
        breakdown: any[],
        history: any[],
        aging: any[]
    }): Promise<Buffer> {
        this.logger.log(`Generando Reporte Excel Multi-Solapa para ${data.tenantName}`);

        const workbook = XLSX.utils.book_new();

        // 1. Solapa RESUMEN
        const summaryRows = [
            ["REPORTE DE ESTADO DE CUENTA ADT"],
            ["Empresa", data.tenantName],
            ["Período", data.period],
            [""],
            ["MÉTRICAS DEL PERÍODO"],
            ["Total Despachos", data.summary.totalDespachos],
            ["Consumo Nuevo (Mes)", data.summary.directDebt],
            ["Ajustes por Vales", data.summary.upchargeDebt],
            ["Créditos Disponibles", data.summary.credits],
            [""],
            ["ESTADO DE DEUDA (AGING)"],
            ...data.aging.map(a => [a.periodo, a.monto]),
            [""],
            ["SALDO TOTAL A PAGAR", data.summary.totalAmountOwed]
        ];
        const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
        XLSX.utils.book_append_sheet(workbook, wsSummary, "RESUMEN");

        // 2. Solapa DESGLOSE POR CLIENTE
        const breakdownWS = XLSX.utils.json_to_sheet(data.breakdown.map(b => ({
            'Cliente': b.nombre,
            'Cant. Viajes': b.totalCps,
            'Viajes Nuevos': b.newTripsCount,
            'Uso Valos': b.usedValesCount,
            'Créditos Disponibles': b.credits,
            'Deuda Directa': b.directDebt,
            'Deuda Upcharge': b.upchargeDebt,
            'Total a Pagar': b.amountOwed
        })));
        XLSX.utils.book_append_sheet(workbook, breakdownWS, "DESGLOSE_CLIENTES");

        // 3. Solapa HISTORIAL
        const historyWS = XLSX.utils.json_to_sheet(data.history.map(h => ({
            'Fecha': new Date(h.fecha).toLocaleDateString(),
            'Concepto': h.concepto,
            'Referencia': h.referencia,
            'Monto': h.costo,
            'Descripción': h.descripcion,
            'Usuario/Motivo': h.usuario
        })));
        XLSX.utils.book_append_sheet(workbook, historyWS, "HISTORIAL_VIAJES");

        return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    }

    async generatePreInvoice(data: any): Promise<Buffer> {
        this.logger.log(`Generando pre-factura para ${data.clientName}`);

        const docDefinition = {
            content: [
                { text: 'PRE-FACTURA DE TRANSPORTE', style: 'header' },
                { text: `Tenant: ${data.tenantName}`, margin: [0, 10, 0, 5] },
                { text: `Cliente: ${data.clientName}`, margin: [0, 0, 0, 5] },
                { text: `Periodo: ${data.period}`, margin: [0, 0, 0, 20] },
                {
                    table: {
                        headerRows: 1,
                        widths: ['*', 'auto', 'auto', 'auto'],
                        body: [
                            ['Fecha', 'Origen - Destino', 'KM', 'Monto'],
                            ...(data.trips || []).map(t => [
                                t.fecha.toLocaleDateString(),
                                `${t.origen} -> ${t.destino}`,
                                t.km.toString(),
                                `$ ${t.monto.toLocaleString()}`
                            ])
                        ]
                    }
                },
                { text: `TOTAL: $ ${data.total.toLocaleString()}`, style: 'total', margin: [0, 20, 0, 0] }
            ],
            defaultStyle: { font: 'Helvetica' },
            styles: {
                header: { fontSize: 18, bold: true, alignment: 'center', margin: [0, 0, 0, 10] },
                total: { fontSize: 16, bold: true, alignment: 'right' }
            }
        };

        return this.createPdf(docDefinition);
    }

    async generateDriverReceipt(data: any): Promise<Buffer> {
        this.logger.log(`Generando recibo para ${data.driverName}`);

        const docDefinition = {
            content: [
                { text: 'RECIBO DE PAGO CHOFER', style: 'header' },
                { text: `Tenant: ${data.tenantName}`, margin: [0, 10, 0, 5] },
                { text: `Chofer: ${data.driverName}`, margin: [0, 0, 0, 5] },
                { text: `Semana/Periodo: ${data.period}`, margin: [0, 0, 0, 20] },
                {
                    table: {
                        headerRows: 1,
                        widths: ['*', 'auto', 'auto'],
                        body: [
                            ['Fecha', 'Concepto', 'Monto'],
                            ...(data.trips || []).map(t => [
                                t.fecha.toLocaleDateString(),
                                t.concepto,
                                `$ ${t.monto.toLocaleString()}`
                            ])
                        ]
                    }
                },
                { text: `TOTAL A PAGAR: $ ${data.total.toLocaleString()}`, style: 'total', margin: [0, 20, 0, 0] },
                { text: '\n\n\n__________________________', alignment: 'center' },
                { text: 'Firma Chofer', alignment: 'center' }
            ],
            defaultStyle: { font: 'Helvetica' },
            styles: {
                header: { fontSize: 18, bold: true, alignment: 'center', margin: [0, 0, 0, 10] },
                total: { fontSize: 16, bold: true, alignment: 'right' }
            }
        };

        return this.createPdf(docDefinition);
    }

    async generateProfitabilityPdf(data: {
        tenantName: string,
        period: string,
        stats: any
    }): Promise<Buffer> {
        this.logger.log(`Generando PDF de Rentabilidad para ${data.tenantName}`);

        const docDefinition = {
            content: [
                { text: 'REPORTE DE RENTABILIDAD NETA', style: 'header' },
                { text: `Empresa: ${data.tenantName}`, margin: [0, 10, 0, 5] },
                { text: `Período: ${data.period}`, margin: [0, 0, 0, 20] },

                { text: 'RESUMEN EJECUTIVO', style: 'subheader', margin: [0, 10, 0, 10] },
                {
                    table: {
                        widths: ['*', 'auto'],
                        body: [
                            ['Ingresos Brutos', `$ ${data.stats.ingresoBruto.toLocaleString()}`],
                            ['Costo Operativo Total', `$ ${data.stats.costoOperativo.toLocaleString()}`],
                            ['Margen Neto', { text: `$ ${data.stats.margenNeto.toLocaleString()}`, bold: true, color: data.stats.margenNeto >= 0 ? 'green' : 'red' }],
                            ['Total Viajes', data.stats.totalViajes.toString()],
                            ['- Viajes Nuevos', data.stats.newTripsCount.toString()],
                            ['- Viajes con Crédito', data.stats.creditTripsCount.toString()]
                        ]
                    },
                    margin: [0, 0, 0, 20]
                },

                { text: 'DESGLOSE DE COSTOS', style: 'subheader', margin: [0, 10, 0, 10] },
                {
                    table: {
                        widths: ['*', 'auto'],
                        body: [
                            ['Pagos a Choferes', `$ ${data.stats.breakdown.driverPayouts.toLocaleString()}`],
                            ['Tasas / Fees ADT', `$ ${data.stats.breakdown.platformFees.toLocaleString()}`],
                            ['Ajustes Upcharge', `$ ${data.stats.breakdown.upcharges.toLocaleString()}`]
                        ]
                    },
                    margin: [0, 0, 0, 20]
                },

                { text: 'DETALLE POR CLIENTE / DADOR', style: 'subheader', margin: [0, 10, 0, 10] },
                {
                    table: {
                        headerRows: 1,
                        widths: ['*', 'auto', 'auto', 'auto', 'auto'],
                        body: [
                            ['Cliente', 'Viajes', 'Revenue', 'Profit', 'Margen'],
                            ...Object.entries(data.stats.byClient || {}).map(([name, d]: [string, any]) => [
                                name,
                                d.trips.toString(),
                                `$ ${d.revenue.toLocaleString()}`,
                                `$ ${d.profit.toLocaleString()}`,
                                `${d.margin}%`
                            ])
                        ]
                    }
                }
            ],
            defaultStyle: { font: 'Helvetica', fontSize: 10 },
            styles: {
                header: { fontSize: 18, bold: true, alignment: 'center', margin: [0, 0, 0, 10] },
                subheader: { fontSize: 14, bold: true, color: '#2563eb', borderBottom: '1px solid #eee' },
                total: { fontSize: 16, bold: true, alignment: 'right' }
            }
        };

        return this.createPdf(docDefinition);
    }

    private createPdf(docDefinition: any): Promise<Buffer> {
        const instance = pdfmake.createPdf ? pdfmake : pdfmake.default;
        return instance.createPdf(docDefinition).getBuffer();
    }
}


