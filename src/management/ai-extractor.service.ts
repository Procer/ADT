import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { DataSource } from 'typeorm';

@Injectable()
export class AiExtractorService {
    private readonly logger = new Logger(AiExtractorService.name);
    private genAI: GoogleGenerativeAI;

    constructor(private dataSource: DataSource) {
        const apiKey = process.env.GEMINI_API_KEY;
        if (apiKey) {
            this.genAI = new GoogleGenerativeAI(apiKey);
        } else {
            this.logger.warn('GEMINI_API_KEY no configurada. La extracción por IA no funcionará.');
        }
    }

    async extractTripData(text: string, apiKey?: string): Promise<any> {
        const clientApiKey = apiKey;
        if (!clientApiKey) throw new Error('Servicio de IA no configurado para esta empresa');

        const genAI = new GoogleGenerativeAI(clientApiKey);

        // Intentamos con varios modelos en orden de preferencia si falla por "not found"
        const modelsToTry = [
            "gemini-2.5-flash",
            "gemini-2.5-pro",
            "gemini-2.0-flash",
            "gemini-1.5-flash",
            "gemini-1.5-pro",
            "gemini-pro"
        ];
        let lastError: any = null;

        for (const modelName of modelsToTry) {
            try {
                this.logger.log(`[V2-FALLBACK] Intentando extracción con modelo: ${modelName}`);
                const model = genAI.getGenerativeModel({ model: modelName });

                const prompt = `
                Analiza el siguiente pedido de transporte recibido por correo electrónico y extrae la información requerida.
                
                CAMPOS A EXTRAER:
                - Origen
                - Destino
                - Fecha de carga
                - Tipo de Mercadería
                - Volumen (ej: 30 pallets, 20 toneladas, etc.)

                REGLAS:
                1. El resultado debe ser un JSON ESTRICTO.
                2. Si un dato no está presente, pon null en el campo correspondiente. No inventes información.
                3. Formato de fecha esperado: YYYY-MM-DD.

                CUERPO DEL CORREO:
                """
                ${text}
                """

                JSON RESULTANTE:`;

                const result = await this.callWithRetry(() => model.generateContent(prompt));
                const response = await result.response;
                const jsonText = response.text().replace(/```json|```/g, '').trim();
                return { success: true, data: JSON.parse(jsonText) };
            } catch (error: any) {
                lastError = error;
                const errText = (error.message || String(error)).toLowerCase();
                this.logger.warn(`Fallo con ${modelName}: ${errText}`);

                // Si no se encuentra el modelo o no está soportado, probamos el siguiente
                if (errText.includes('not found') || errText.includes('404') || errText.includes('not supported') || errText.includes('invalid')) {
                    this.logger.warn(`Modelo ${modelName} no disponible o no soportado. Probando siguiente...`);
                    continue;
                }
                // Si es un error de cuota (429), el callWithRetry ya lo intentó. 
                break;
            }
        }

        this.logger.error('Fallo final tras intentar todos los modelos: ' + lastError?.message);
        return { success: false, error: 'IA Saturada', details: lastError?.message };
    }

    private async callWithRetry(fn: () => Promise<any>, retries = 3, delay = 2000): Promise<any> {
        try {
            return await fn();
        } catch (error: any) {
            if (error.message?.includes('429') && retries > 0) {
                this.logger.warn(`Límite de cuota alcanzado. Reintentando en ${delay}ms... (Intentos restantes: ${retries})`);
                await new Promise(resolve => setTimeout(resolve, delay));
                return this.callWithRetry(fn, retries - 1, delay * 2);
            }
            throw error;
        }
    }

    async processFinanceCopilot(userInput: string, context: any, apiKey?: string): Promise<any> {
        const clientApiKey = apiKey;
        if (!clientApiKey) throw new Error('Servicio de IA no configurado para esta empresa');

        const genAI = new GoogleGenerativeAI(clientApiKey);
        const modelsToTry = [
            "gemini-2.5-flash",
            "gemini-2.5-pro",
            "gemini-2.0-flash",
            "gemini-1.5-flash",
            "gemini-1.5-pro",
            "gemini-pro"
        ];
        let lastError: any = null;

        for (const modelName of modelsToTry) {
            try {
                const isClient = context.role === 'CLIENT';
                this.logger.log(`[Copilot] Contexto recibido: Role=${context.role}, Client=${context.clientName}, Tenant=${context.tenantId}`);

                const systemInstruction = `
                ROL: ${isClient ? `Asistente Financiero de ADT para el cliente "${context.clientName}".` : 'Arquitecto Financiero Maestro de ADT.'}
                EMPRESA (TENANT): ${context.tenantId}
                HOLA, ESTÁS HABLANDO CON: ${isClient ? `El cliente "${context.clientName}" (ID: ${context.clientId}).` : 'El Administrador del sistema.'}
                FECHA ACTUAL DEL SERVIDOR: ${context.serverTime}

                DB_SCHEMA:
                - cartas_de_porte (id, client_id, revenue_at_execution, cost_at_execution, ts_finalizacion_real, estado)
                - revenue_at_execution: LO QUE EL CLIENTE DEBE PAGAR A ADT.
                - cost_at_execution: LO QUE ADT PAGA AL FLETERO/CHOFER.
                - estados: 'FINALIZADO', 'EN_CAMINO', 'PENDIENTE'.

                REGLAS CRÍTICAS:
                1. RESPUESTA SIEMPRE EN JSON: { "action": "QUERY_INSIGHT" | "TALK", "sql": "string", "message": "string" }
                2. SEGURIDAD: 
                   ${isClient
                        ? `OBLIGATORIO: Filtra SIEMPRE por client_id = '${context.clientId}'. NO preguntes datos al usuario, ya los tienes.`
                        : `OBLIGATORIO: Filtra SIEMPRE por tenant_id = '${context.tenantId}'.`}
                3. SI PREGUNTAN "¿CUÁNTO DEBO?": 
                   - Sumar 'revenue_at_execution' de viajes FINALIZADOS.
                   - Action: "QUERY_INSIGHT" con el SQL correspondiente.
                4. SI PREGUNTAN POR "ESTE MES": Usa la fecha ${context.serverTime} para filtrar ts_finalizacion_real.
                5. IDIOMA: Español.
                `;

                const model = genAI.getGenerativeModel({
                    model: modelName,
                    systemInstruction: systemInstruction
                });

                const result = await this.callWithRetry(() => model.generateContent(userInput));
                const response = await result.response;
                const jsonText = response.text().replace(/```json|```/g, '').trim();
                const aiResponse = JSON.parse(jsonText);

                if (aiResponse.action === 'QUERY_INSIGHT' && aiResponse.sql) {
                    this.logger.log(`[Copilot] Ejecutando SQL sugerido: ${aiResponse.sql}`);
                    const results = await this.executeReadOnlyQuery(aiResponse.sql, context.tenantId);
                    return { ...aiResponse, data: results };
                }

                return aiResponse;
            } catch (error: any) {
                lastError = error;
                const errText = (error.message || String(error)).toLowerCase();
                if (errText.includes('not found') || errText.includes('404') || errText.includes('not supported') || errText.includes('invalid') || errText.includes('systeminstruction')) {
                    this.logger.warn(`Modelo ${modelName} no disponible o no soporta systemInstruction. Probando siguiente...`);
                    continue;
                }
                break;
            }
        }

        this.logger.error('Error en Copilot tras intentar todos los modelos: ' + lastError?.message);
        return { error: 'IA Saturada', details: lastError?.message };
    }

    private async executeReadOnlyQuery(sql: string, tenantId: string): Promise<any> {
        const normalizedSql = sql.trim().toUpperCase();

        if (!normalizedSql.startsWith('SELECT')) {
            throw new Error('Seguridad: Solo se permiten consultas SELECT.');
        }

        const forbiddenKeywords = ['UPDATE', 'DELETE', 'INSERT', 'DROP', 'TRUNCATE', 'ALTER', 'CREATE', 'EXEC', 'SP_', 'INTO'];
        for (const word of forbiddenKeywords) {
            if (normalizedSql.includes(word)) {
                throw new Error(`Seguridad: Palabra prohibida detectada: ${word}`);
            }
        }

        const wrappedSql = `SELECT * FROM (${sql.replace(/;/g, '')}) AS ai_insight_sub WHERE tenant_id = '${tenantId}'`;

        this.logger.log(`[AI-Insight] Ejecutando consulta protegida para tenant ${tenantId}`);
        return await this.dataSource.query(wrappedSql);
    }
}
