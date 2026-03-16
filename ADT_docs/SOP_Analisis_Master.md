
# 📖 SOP_Analisis_Master.md: Ecosistema Financiero 360° ADT v5.3

**Estado:** Auditado y Validado | **Arquitectura:** NestJS + MSSQL + Gemini 1.5-Flash

---

## 1. Arquitectura de Datos y Verdad Técnica

El sistema opera sobre una infraestructura de **Microsoft SQL Server**, utilizando tipos de datos espaciales nativos para la precisión geográfica.

* **Motor Geográfico:** Uso exclusivo de `GEOGRAPHY` (MSSQL) y la función `STDistance` para cálculos de cercanía. Se descarta PostGIS.
* **Integridad de Telemetría:** El sistema prioriza el `timestamp_dispositivo` sobre el del servidor para evitar fraudes por latencia de red.
* **Seguridad Multitenant:** Aislamiento total por `tenantId`. El **Finance Copilot** opera mediante *Query Wrapping*, inyectando automáticamente el filtro de Tenant en cada consulta SQL generada por IA.

---

## 2. Módulo de Inteligencia Financiera y Tarifarios

El sistema garantiza rentabilidad mediante un motor de cálculo determinístico reforzado por IA.

### 2.1. Gestión de Tarifas (Ingresos y Egresos)

* **Lógica de Cálculo:** Soporta `baseCalculation` de tipo `KM`, `TON` o `FIXED`.
* **Estructura de Reglas:** Almacenadas en `pricing_rules`. Incluye un campo `conditionals` (JSON) para procesar esperas en planta, pernoctes y urgencias.
* **Separación de Tarifas (ADT vs Dador):** 
    - **Tarifa ADT (`precio_congelado`):** Es el costo de la Carta de Porte que ADT cobra al Tenant. Es fijo y snapshotted al crear el viaje.
    - **Tarifa Dador (`revenueAtExecution`):** Es el flete pactado con el dador. Se calcula mediante el motor de precios. **Nunca** debe caer en fallback al costo de la Carta de Porte.
* **Sincronización Automática (Pricing Sync):** Al actualizar una regla de tarifa, el sistema recalcula automáticamente el `revenueAtExecution` de todos los viajes pendientes (no proformados) para asegurar que el listado de cobranzas refleje la última verdad comercial.
* **Versionado e Inmutabilidad:** Una vez que un viaje es incluido en una proforma (`financialLotId`), su precio queda bloqueado y no es afectado por recálculos masivos.

### 2.2. Finanzas Dadores (Ingresos)

* **Flujo de Proforma:** `PENDIENTE` -> `PROFORMADO` (Snapshot Inmutable) -> `CONCILIADO`.
* **Operativa:** 
    - Selección masiva de viajes mediante checkboxes para generación de lotes.
    - Visor de logos dinámico por `tenantId` en la proforma.
    - **Origen de Datos:** El módulo de cobranzas utiliza **estrictamente** `revenueAtExecution`. Si el valor es $0, se marca en rojo indicando "Sin Tarifa Pactada".
    - **Congelamiento de Tarifa:** La tarifa se bloquea irreversiblemente al generar la proforma.

### 2.3. Finanzas Choferes (Egresos)

* **Periodicidad de Pago:** Definida en la entidad `periodicidadPago` (`DIARIO`, `SEMANAL`, `QUINCENAL`, `MENSUAL`).
* **Gestión de Deducciones:** Lógica de resta automática de anticipos y multas antes del cierre de lote de pago. El neto resultante es el valor final a liquidar.

### 2.4. Recaudación ADT y Motor de Créditos (REGLA DE CARGO TOTAL)

* **Regla de Oro:** Todo viaje creado genera un cargo de CP inmediato e irreversible. Si el viaje se anula, el cargo se mantiene pero se otorga un **Vale/Crédito** al tenant.
* **Sistema de Créditos (AdtCredit):** Los viajes anulados generan un crédito valorado estrictamente por el **Costo de la CP (Tarifa ADT)** vigente al momento de la creación, no por el ingreso del viaje.
* **Upcharge Logic (Diferencial de Inflación):** Al reutilizar un crédito, si el precio actual de la CP > Monto Nominal del Vale, el sistema calcula y cobra automáticamente la diferencia (Upcharge).
    - $$\text{Upcharge} = \text{Tarifa Actual} - \text{Valor Nominal del Vale}$$
* **Claridad Matemática (UX):** El sistema debe justificar la deuda total mediante la fórmula: `(Nuevas CPs * Tarifa) + Suma(Upcharges)`. El dashboard debe mostrar cuántos viajes fueron nuevos y cuántos reutilizaron vales para evitar confusiones en el monto final.
* **Seguridad:** Solo el `SUPERADMIN_ADT` está facultado para registrar ingresos directamente en la cuenta de ADT.

### 2.5. Dashboard de Ganancias Netas y Reportes
* **Fórmula Maestra:**
    $$\text{Deuda Total} = \text{Deuda Directa (CPs Nuevas)} + \text{Deuda por Ajuste (Upcharges)}$$
* **Transparencia de Deuda (Aging):** El sistema provee un objeto `aging` que desglosa la deuda total acumulada por mes y año (Antigüedad). Esto permite a los operadores identificar cuánta deuda pertenece a meses anteriores vs. el consumo corriente.
* **Exportación Administrativa:** Capacidad de exportar el estado de cuenta consolidado en formato **Excel Profesional (.xlsx)** con múltiples solapas (RESUMEN, DESGLOSE_CLIENTES, HISTORIAL_VIAJES) para auditoría avanzada.
* **UX y Desglose:** El sistema separa físicamente el costo de las CPs nuevas del costo de los ajustes por inflación en el visor por dador.

---

## 3. Control Operativo y Auditoría de Viajes

Ciclo de vida blindado para evitar fugas de capital y manipulación de datos.

### 3.1. Estados y Hard-Locks

1. **PENDIENTE:** Edición libre.
2. **EN_PROGRESO:** Bloqueo inmutable de campos críticos (Dador, Tenant, Chofer).
3. **VINCULADO A LOTE:** Bloqueo total de peso, KM y tarifa. No permite edición manual.
4. **FINALIZADO / ANULADO:** Bloqueo total. Ambos estados son facturables. El estado `ANULADO` genera el crédito correspondiente. Solo modificable por `SUPER_ADMIN`.

### 3.2. Geofencing y Auto-Close (Kill Switch)

* **Validación Dual:** El hito "Llegué" requiere que el ping GPS esté dentro del radio configurado (1-3km).
* **Auditoría:** La flag `GEOCERCA_VIOLADA` indica una anomalía, pero **NO** detiene el proceso de liquidación, permitiendo la trazabilidad posterior sin bloquear la cadena de pagos.
* **Kill Switch:** Si la unidad se aleja >15km del destino sin finalizar, el sistema marca el viaje como `FINALIZADO` de oficio para evitar la reutilización de la Carta de Porte.

---

## 4. ADT Copilot: IA Generativa Aplicada

Integración con **Google Gemini 1.5-flash** para automatización administrativa.

### 4.1. Email Ingestion (Email-to-Trip)

* **Función:** Lectura de IMAP y extracción de entidades (Origen, Destino, Dador).
* **Estado:** Requiere configuración de `GEMINI_API_KEY` en el entorno de producción.
* **Seguridad:** Los datos extraídos se guardan como `PENDIENTE` para validación humana.

### 4.2. Finance Copilot (Análisis Determinístico)

* **Interfaz:** Chat de lenguaje natural (App/Telegram).
* **Técnica:** La IA genera SQL puro. El sistema lo valida y lo ejecuta contra MSSQL.
* **Salida:** Reportes de rentabilidad: $\text{Neto} = \text{Revenue} - (\text{Cost} + \text{ADT Fee})$.

---

## 5. Mantenimiento Crítico y Seguridad (Kill-Switch)

### 5.1. Reset Total del Sistema
* **Función:** Restauración de la base de datos a un estado inicial limpio.
* **Seguridad:** Requiere rol `SUPERADMIN_ADT` y confirmación mediante frase de seguridad exacta: `RESETEAR SISTEMA TOTAL`.
* **Alcance:** Borrado transaccional de viajes, finanzas, logs, conductores, unidades y tenants. Mantiene únicamente la cuenta maestra de ADT.

### 5.2. Baja de Empresas (Tenants)
* **Lógica de Protección:** No se permite borrar un tenant con viajes activos.
* **Force Delete:** Opción técnica para borrar un tenant y **toda su cascada de datos históricos** ignorando bloqueos operativos (Uso restringido).

---

## 6. Gestión de Accesos y Portal de Clientes

### 6.1. Administración de Usuarios de Empresas (Tenants)
* **Control de Nodos:** El `SUPERADMIN_ADT` puede activar/desactivar el estado SaaS de cualquier empresa.
* **Gestión de Admins:** Capacidad de actualizar nombre/email y resetear contraseñas de los administradores principales (`TENANT_ADMIN`) mediante claves temporales seguras.

### 6.2. Gestión de Accesos Clientes (Dadores)
* El sistema permite crear múltiples usuarios de acceso para un mismo Cliente.
* **Credenciales:** Generación con `ADT-321` y obligación de cambio en primer login.

### 6.3. Configuración de IA para Dadores
* **Emails Autorizados:** Whitelisted IA por cliente.
* **Asunto Clave:** Patrones de identificación para el Copilot (ej: "SOLICITUD DE TRANSPORTE").

---

## 7. Mantenimiento y Limpieza de Datos

### 7.1. Limpieza por Empresa (Cleanup)
* **Función:** Permite purgar viajes y logs de un tenant específico sin afectar al resto del ecosistema.
* **Seguridad:** Requiere el secreto `ADT_CONFIRM_DELETE`.

### 7.2. Audit Logs
* Registro de `dataAnterior` y `dataNueva` para cada cambio crítico de estado o tarifa.

## 9. Operativa de Finanzas y Liquidaciones (Fase 6)

### 9.1. Registro de Choferes
* **Obligatoriedad:** El campo `Periodicidad de Cobro` es mandatorio en el alta del conductor.
* **Ciclos Soportados:** `DIARIO`, `SEMANAL`, `QUINCENAL`, `MENSUAL`.
* **Impacto:** Determina el agrupamiento de viajes en el módulo de `Liquidaciones a Choferes` y la visualización de su ciclo actual.

### 9.2. Cobranzas a Dadores (Finance 360 Collect)
Módulo diseñado para la gestión del flujo de caja entrante y seguimiento de deudas de clientes logísticos.

#### 1. Dashboard de Control (KPIs)
*   **Por Proformar:** Monto total de viajes en estado "ENTREGADO" que aún no han sido incluidos en un lote.
*   **A Cobrar:** Monto total de proformas generadas pendientes de pago (estado "PROFORMADO").
*   **Viajes Críticos:** Contador de viajes con más de 7 días de antigüedad sin proformar (Alerta Roja).
*   **Recaudación Mes:** Total acumulado de pagos conciliados en el mes en curso.

#### 2. Agrupamiento por Dador
*   El sistema agrupa automáticamente los viajes pendientes por **Dador de Carga**.
*   **Gestión Masiva:** Permite seleccionar todos los viajes de un dador con un solo clic para generar una proforma consolidada.

#### 3. Semáforo de Antigüedad (Aging)
*   **Verde (0-3 días):** Viaje reciente.
*   **Amarillo (4-7 días):** Requiere atención administrativa.
*   **Rojo (+7 días):** Deuda crítica, requiere reclamo inmediato.

#### 4. Flujo Operativo
1.  **Selección:** Filtrar por dador o buscar viajes específicos.
2.  **Proformado:** Seleccionar viajes y presionar "Generar Proforma". Se genera un Lote de Cobranza.
3.  **PDF:** Descargar la proforma consolidada para enviar al cliente.
4.  **Conciliación:** Una vez recibido el pago, marcar el lote como "COBRADO" desde el Historial.
* **Trazabilidad:** Una vez conciliado, el lote desaparece de la gestión de cobros activa y se archiva en historial permanente.

---

## 10. Semáforo de Implementación (Checklist de Ingeniería)

| Componente | Estado | Acción Requerida |
| --- | --- | --- |
| **Motor de Precios** | ✅ 100% | Ninguna. |
| **Upcharge Logic** | ✅ 100% | Auditado: Diferenciales calculados sobre Costo CP. |
| **Flujo Proformado** | ✅ 100% | Conciliación manual operativa. |
| **Motor de Créditos** | ✅ 100% | Lógica de agregación total y contadores (Nuevos vs Vales) activa. |
| **Estado de Cuenta ADT (UX)** | ✅ 100% | Dashboard con desglose matemático `(N x $Tarifa) + Ajuste` y **Aging Mensual**. |
| **Reportes Externos** | ✅ 100% | Exportación CSV activa para auditoría administrativa. |
| **Dashboard Net Profit** | ✅ 100% | Deuda real basada en Balance y créditos agregados por dador. |
| **Liquidaciones Chofer** | ✅ 100% | Filtros por período y periodicidad activos. |
| **Governance (Reset)** | ✅ 100% | Kill-switch operativo y seguro. |
| **Importación Excel** | ⚠️ 50% | Pendiente mapeo de campos extendidos. |

---