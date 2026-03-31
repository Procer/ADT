import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DataSource } from 'typeorm';
import { AllExceptionsFilter } from './common/all-exceptions.filter';
import { ValidationPipe } from '@nestjs/common';
import * as express from 'express';
import * as dotenv from 'dotenv';

dotenv.config();
process.env.TZ = 'UTC';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Habilitar Validación Global de DTOs
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));

  // Registrar Filtro Global de Errores con PERSISTENCIA EN DB
  const dataSource = app.get(DataSource);
  app.useGlobalFilters(new AllExceptionsFilter(dataSource));

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization',
    credentials: true,
  });

  // Middleware de diagnóstico para ver el tamaño de la petición antes de que falle
  app.use((req, res, next) => {
    const size = req.headers['content-length'];
    if (size) {
      console.log(`[Diagnostic] Incoming request: ${req.method} ${req.url} - Size: ${size} bytes`);
    }
    next();
  });

  // Aumentar el límite del body a un nivel extremo para descartar restricciones de Nest/Express
  app.use(express.json({ limit: '500mb' }));
  app.use(express.urlencoded({ limit: '500mb', extended: true }));

  console.log('[Nest] Body parser configured with 500mb limit');

  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0');
  console.log(`[Nest] Application is running on: http://0.0.0.0:${port}`);
}
bootstrap();
