import { ExceptionFilter, ArgumentsHost } from '@nestjs/common';
import { DataSource } from 'typeorm';
export declare class AllExceptionsFilter implements ExceptionFilter {
    private dataSource;
    private readonly logger;
    constructor(dataSource: DataSource);
    catch(exception: unknown, host: ArgumentsHost): Promise<void>;
}
