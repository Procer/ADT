Este es el documento **SOP_Arquitectura_Master.md** basado estrictamente en el informe de auditoría técnica del sistema real. Este manual refleja la tecnología actual (MSSQL, NestJS, Gemini) y las reglas de negocio que ya están operativas.

---

# 📖 SOP: Arquitectura Maestra del Sistema ADT

**Versión:** 1.0

**Estado:** Basado en Auditoría Real (2026-03-02)

**Tecnologías:** NestJS, Microsoft SQL Server, Google Gemini.

---

## 1. Stack Tecnológico de Referencia

Para cualquier desarrollo o mantenimiento, se debe respetar el stack detectado en la auditoría:

* **Motor de Base de Datos:** Microsoft SQL Server (MSSQL) utilizando tipos `geography` nativos para cálculos espaciales (`STDistance`). *Nota: No utilizar PostGIS.*
* **Backend Framework:** NestJS (Node.js 22+) con TypeScript 5.7.
* **ORM:** TypeORM 0.3.x.
* **Motor de Inteligencia Artificial:** Google Gemini 1.5-flash (SDK oficial).
* **Mensajería y Colas:** Redis con BullMQ.
* **Notificaciones:** Telegram (Telegraf) con lógica de auto-recuperación ante conflictos 409.
* **Infraestructura de Red:** El servidor bindea a `0.0.0.0` en el puerto `3001` para permitir accesos desde la LAN (ej: `192.168.0.151`).

---

## 2. Diccionario de Datos Maestro (Esquema MSSQL)

El sistema se rige por las siguientes entidades principales. Todos los IDs deben tratarse como `uniqueidentifier` (UUID) o `bigint` según corresponda.

| Tabla | Función Principal | Campos Críticos |
| --- | --- | --- |
| **`tenants`** | Entidades logísticas (SaaS). | `id`, `deudaActual`, `limiteCreditoGlobal`, `config (JSONB)` |
| **`cartas_de_porte`** | Núcleo transaccional de viajes. | `numeroCP`, `estado`, `precio_al_liquidar`, `revenueAtExecution`, `costAtExecution` |
| **`gps_tracking`** | Historial de telemetría. | `latitud`, `longitud`, `velocidad`, `fuera_de_rango`, `timestamp_dispositivo` |
| **`financial_lotes`** | Proformas e ingresos dadores. | `id (UUID)`, `tenantId`, `clientId`, `totalNeto`, `status`, `proformaPath`, `updated_at` |
| **`payment_lotes`** | Pagos y egresos choferes. | `id (UUID)`, `tenantId`, `choferId`, `totalBruto`, `deduccionesTotal`, `netoFinal`, `comprobantePath` |
| **`adt_recaudaciones`** | Registro de ingresos ADT. | `id`, `tenantId`, `status [PENDIENTE, COBRADO]`, `fechaRecaudo`, `adminId` |
| **`adt_credits`** | Billetera de créditos (Anulados). | `id`, `dadorId`, `tripIdOriginal`, `montoNominalOriginal (Costo CP)`, `status` |
| **`pricing_rules`** | Motor de reglas de precios. | `baseCalculation (KM, TON, FIXED)`, `baseValue`, `conditionals (JSONB)` |
| **`audit_logs`** | Trazabilidad e inmutabilidad. | `accion`, `descripcion`, `dataAnterior`, `dataNueva`, `resueltoPor` |

---

## 3. Endpoints y Lógica de Servicios (SOP Operativo)

### 3.1. Gestión de Viajes (`TripsService`)

* **Regla de Inmutabilidad:** Una vez que una `CartaPorte` cambia de estado `PENDIENTE`, los campos `tenantId` and `clientId` quedan bloqueados.
* **Dualidad de Precios:** 
    - `precio_congelado`: Costo de la CP ADT (Fijo al crear).
    - `revenueAtExecution`: Tarifa flete dador (Dinámico hasta proformado).
* **Pricing Sync (Recálculo):** El `revenueAtExecution` se actualiza automáticamente ante cambios en `pricing_rules` para viajes con `financialLotId = NULL`.
* **Bloqueo por Lote:** Un viaje vinculado a un lote (`financial_lotes` o `payment_lotes`) bloquea cualquier edición manual o recálculo automático de peso, KM o tarifa.
* **Geocodificación:** Endpoint `GET /trips/geocode`. Utiliza Nominatim (OSM) para resolución de direcciones en tiempo real para la pantalla de Planificación de Viajes.
* **Importación Masiva (ALERTA):** La función `bulkImport` está actualmente **OFFLINE**. No invocar este método hasta su re-implementación.

### 3.2. Estado de Cuenta ADT (`FinanceController` V4)

* **Filtrado por Dador**: El endpoint principal acepta un query param `clientId` para segmentar todo el reporte (Deuda, Historial, Vales).
* **Agregación de Créditos**: El sistema suma el saldo de todos los dadores por `tenantId` para mostrar la visibilidad total de vales en el dashboard.
* **Respuesta Granular**: El reporte ahora incluye contadores y objetos específicos para justificación matemática y auditoría:
    - `totalNewTripsCount` / `totalUsedValesCount`: Contadores de origen de viaje.
    - `totalDirectDebt` / `totalUpchargeDebt`: Desglose monetario por tipo de cargo.
    - `aging`: Array de objetos `{periodo: string, monto: number}` con la deuda pendiente clasificada por mes/año para visualización de antigüedad.
    - `history`: Listado enriquecido con conceptos de cargo (CP Nueva vs Reutilización).
* **Reporting**: Soporte para exportación de datos en formato **Excel Profesional (.xlsx)** desde el frontend. El servidor genera un libro con múltiples solapas (Resumen, Desglose, Historial) garantizando la compatibilidad administrativa.
* **Cálculo de Diferencial Anti-Inflación**: 
    - Si el viaje utiliza un crédito, comparar `montoAbonadoOriginal` vs `precioActualCP`.
    - Si `precioActualCP > montoAbonadoOriginal`, generar un cargo por el diferencial en `tenants.deudaActual`.

### 3.3. Nuevos KPIs de Cobranzas (`FinanceController` V3)
* **Endpoint `GET /finance-v3/collect-kpis`**:
    - Centraliza el cálculo de salud financiera para el Dashboard.
    - **Por Proformar**: Suma de `revenueAtExecution` de viajes entregados sin ID de lote. **Prohibido fallback a `precio_congelado`**.
    - **A Cobrar**: Suma de `totalNeto` de lotes en estado `PROFORMADO`.
    - **Viajes Críticos**: Filtro de viajes con `tsCreacion` mayor a 7 días sin proforma.
    - **Recaudación Mes**: Utiliza la columna `updated_at` para filtrar lotes `CONCILIADO` del mes actual.

### 3.3. Telemetría y Geofencing (`TrackingService`)

* **Validación de Arribo:** El cambio de estado a `LLEGUE` solo es válido si `STDistance` entre `gps_tracking.point` and `destino.point` es menor al radio configurado en `tenants.config`.
* **Severidad de Alertas:** Si el radio es violado, registrar en `audit_logs` con severidad `ALTA` y tipo `GEOCERCA_VIOLADA`. Esta flag NO detiene el proceso de liquidación.

### 3.4. Administración y Seguridad (`ManagementController`)

* **System Reset (Kill-Switch):** Endpoint `POST /management/system/reset`. Ejecuta un `DELETE` en cascada respetando el orden de FKs:
    1. Telemetría y Logs.
    2. Lotes financieros y Aducciones.
    3. Viajes, Lotes de Liquidación y Créditos.
    4. Reglas de Precio y Saldos de Billetera.
    5. Maestros (Drivers, Units, Clients).
    6. Usuarios y Tenants (Excepto `admin@adt.com`).

* **Gestión de Empresas (Tenants):**
    - `GET /management/tenants/:id/admin-info`: Recupera info del `TENANT_ADMIN`.
    - `POST /management/tenants/:id/admin-update`: Actualiza datos del administrador.
    - `POST /management/tenants/:id/reset-password`: Genera nueva clave temporal.
    - `POST /management/tenants/:id/toggle-status`: Activa/Desactiva el Tenant.
    - `POST /management/cleanup`: Borrado selectivo de datos operativos de un tenant.

* **Gestión de Accesos Dadores (Clients):**
    - `GET /management/clients/:id/admin-info`: Lista usuarios `CLIENT`.
    - `POST /management/clients/:id/create-user`: Crea accesos dador.
    - `POST /management/users/:userId/resend-credentials`: Resetea clave a `ADT-321`.

* **Configuración IA (White-listing):** 
    - Tabla: `client_authorized_emails`.
    - Endpoints: `GET/POST/DELETE /management/authorized-emails`.
    - Lógica: El Copilot solo procesa remitentes autorizados por cada `clientId`.

* **Resiliencia Telegram Bot:** El servicio `TelegramService` está configurado para manejar errores de polling (Conflict 409) de forma no bloqueante, permitiendo que el servidor NestJS inicie correctamente incluso si ya existe otra instancia del bot activa.

---

## 4. Estrategia de Almacenamiento (Hierarchical Storage)

El sistema organiza los documentos (Proformas, Comprobantes, Logos) de forma jerárquica:

* **Raíz:** `/storage/{tenantId}/`
* **Sub-rutas:**
    - `dadores/{id}/lotes/`: PDFs de proformas generadas.
    - `choferes/{id}/pagos/`: Comprobantes de transferencia/pago.
    - `adt/recaudos/`: Respaldos de recaudación centralizada.

---

## 4. Protocolos de IA (Gemini Integration)

### 4.1. Extracción de Datos (Email Ingestion)

El sistema utiliza Gemini para procesar correos.

* **Requisito:** La variable `GEMINI_API_KEY` debe estar presente en el entorno.
* **Validación:** El objeto JSON retornado por la IA debe ser validado contra el esquema de `cartas_de_porte` antes de la inserción.

### 4.2. Generación de SQL

Las promps para el Copilot deben especificar explícitamente:

1. Uso de sintaxis T-SQL (MSSQL).
2. Manejo de UUIDs mediante strings o tipos compatibles.
3. Prohibición estricta de comandos `DROP`, `DELETE` o `UPDATE`.

---