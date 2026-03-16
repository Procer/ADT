ADT

# Guía Rápida de Pruebas: Sistema ADT

Sigue estos pasos en orden para poner en marcha todo el sistema.

## 1. Infraestructura (BD y Redis)
Asegúrate de tener **Docker Desktop** abierto.
1. Abre una terminal en la raíz (`c:\laragon\www\ADT`).
2. Ejecuta:
   ```bash
   docker-compose up -d
   ```

## 2. Backend (Servidor Nest)
1. En otra terminal (en la raíz), ejecuta:
   ```bash
   npm run start:dev
   ```
2. Espera a que la consola indique que está listo.

## 3. Interfaces (PWA y Dashboard)
Debes iniciar ambos para una prueba completa:

*   **PWA (Chofer):**
    1. Ve a `c:\laragon\www\ADT/pwa`.
    2. Ejecuta `npm run dev`.
    3. URL: `http://localhost:5173` (PIN: `1234`).

*   **Dashboard (Admin):**
    1. Ve a `c:\laragon\www\ADT/dashboard`.
    2. Ejecuta `npm run dev`.
    3. URL: `http://localhost:5174`.

## 4. Datos de Prueba (Primer inicio)
Si la base de datos está vacía, entra a Adminer (`http://localhost:8080`) y ejecuta este SQL:

```sql
INSERT INTO tenants (id, nombre_empresa) VALUES ('00000000-0000-0000-0000-000000000000', 'Empresa Test ADT');
INSERT INTO drivers (id, tenant_id, nombre, pin) VALUES ('00000000-0000-0000-0000-111111111111', '00000000-0000-0000-0000-000000000000', 'Juan Pérez', '1234');
INSERT INTO transport_units (id, tenant_id, patente) VALUES ('00000000-0000-0000-0000-222222222222', '00000000-0000-0000-0000-000000000000', 'AF 123 BK');
```

---
**Nota:** Si vas a probar el modo offline en la PWA, usa las herramientas de desarrollador (F12) -> Network -> Offline.



Las funcionalidades adicionales pendientes, enumeradas en el punto 5 de la lista de tareas, son:


   * Inalterabilidad (Hard Lock): Implementar la lógica para que las Cartas de Porte (CP) se vuelvan de solo lectura después de 60 minutos, permitiendo la edición    
     solo a Super-Administradores bajo registro de auditoría.
   * Cierre Forzoso: Si el GPS detecta que un camión se desvía más de 10 km del destino sin un cierre manual, el sistema debe cerrar la CP automáticamente, marcándola
     con CIERRE_SISTEMA.
   * Auditoría Silenciosa (Geocercas y Validación de Hitos):
       * Establecer un radio de geocerca paramétrico (por defecto 500m) alrededor del destino.
       * Al confirmar la llegada ("Ya Llegué"), el sistema comparará las coordenadas GPS con el destino; si la desviación es mayor a 1 km, registrará fuera_de_rango: 
         true sin notificar al chofer.
   * PWA Chofer (Enfoque "Acción Única"):
       * Diseñar una interfaz de usuario simple con un botón central que cambie de estado secuencialmente: [INICIAR] -> [LLEGUÉ] -> [ENTRÉ A CARGA] -> [FINALIZAR].   
       * Implementar una estrategia "Offline-First" utilizando IndexedDB para guardar hitos localmente y sincronizarlos cuando haya conexión.
       * Al finalizar el viaje, obligar a la activación de la cámara nativa para la captura de un remito.
       * Utilizar Service Workers para mantener el seguimiento GPS cada 2-5 minutos, incluso con la pantalla bloqueada.
   * Dashboard Admin (Gestión por Excepción):
       * Crear un monitor en vivo con mapa (Leaflet/OpenStreetMap) que alerte visualmente (en rojo) sobre discrepancias entre el GPS y las acciones manuales.
       * Desarrollar un algoritmo "Smart ETA": ETA = Distancia_Restante / Velocidad_Media_15min.
       * Implementar un procesador de Excel para la importación masiva de CPs, validando previamente Patente y Chofer (y sus vencimientos).
   * Reportes e Integración:
       * Generar informes mensuales detallados (PDF/Excel) de las CPs creadas, indicando costos aplicados o créditos consumidos.
       * Preparar la base de datos para la integración con Telegram, permitiendo vincular chat_id con tenant_id para futuras consultas de Smart ETA y descarga de     
         documentos vía Bot.
