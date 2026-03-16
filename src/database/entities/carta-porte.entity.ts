import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Index } from 'typeorm';
import { Tenant } from './tenant.entity';
import { Driver } from './driver.entity';
import { TransportUnit } from './transport-unit.entity';
import { Client } from './client.entity';
import { FinancialLot } from './financial-lot.entity';
import { PaymentLot } from './payment-lot.entity';
import { SettlementBatch } from './settlement-batch.entity';

@Entity('cartas_de_porte')
@Index('idx_unidad_viaje_activo', ['unidadId'], { unique: true, where: "(estado = 'EN_CAMINO')" })
@Index('idx_chofer_viaje_activo', ['choferId'], { unique: true, where: "(estado = 'EN_CAMINO')" })
export class CartaPorte {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'tenant_id' })
    tenantId: string;

    @ManyToOne(() => Tenant, tenant => tenant.trips)
    @JoinColumn({ name: 'tenant_id' })
    tenant: Tenant;

    @Column({ name: 'numero_secuencial', nullable: true })
    numeroSecuencial: number;

    @Column({ name: 'chofer_id', type: 'uuid', nullable: true })
    choferId: string;

    @ManyToOne(() => Driver, driver => driver.trips, { nullable: true })
    @JoinColumn({ name: 'chofer_id' })
    chofer: Driver;

    @Column({ name: 'unidad_id', type: 'uuid', nullable: true })
    unidadId: string;

    @ManyToOne(() => TransportUnit, unit => unit.trips, { nullable: true })
    @JoinColumn({ name: 'unidad_id' })
    unidad: TransportUnit;

    @Column({ name: 'client_id', type: 'uuid', nullable: true })
    clientId: string;

    @ManyToOne(() => Client, client => client.trips)
    @JoinColumn({ name: 'client_id' })
    client: Client;

    @Column({ name: 'numero_cp', unique: true, nullable: true })
    numeroCP: string;

    @Column({ default: 'PENDIENTE' })
    estado: string; // PENDING, IN_PROGRESS, FINALIZED, VOID_CREDIT

    @Column({ name: 'origen_nombre', nullable: true })
    origenNombre: string;

    @Column('decimal', { name: 'origen_lat', precision: 10, scale: 8, nullable: true })
    origenLat: number;

    @Column('decimal', { name: 'origen_lng', precision: 11, scale: 8, nullable: true })
    origenLng: number;

    @Column({ name: 'destino_nombre', nullable: true })
    destinoNombre: string;

    @Column('decimal', { name: 'destino_lat', precision: 10, scale: 8, nullable: true })
    destinoLat: number;

    @Column('decimal', { name: 'destino_lng', precision: 11, scale: 8, nullable: true })
    destinoLng: number;

    @Column({ name: 'mercaderia_tipo', length: 255, nullable: true })
    mercaderiaTipo: string;

    @Column({ name: 'volumen', length: 100, nullable: true })
    volumen: string;

    @Column('decimal', { name: 'peso_toneladas', precision: 10, scale: 3, default: 0 })
    pesoToneladas: number;

    @Column({ name: 'radio_geocerca_km', default: 1 })
    radioGeocercaKm: number;

    @Column('decimal', { name: 'precio_congelado', precision: 12, scale: 2, nullable: true })
    precioCongelado: number;

    @Column('decimal', { name: 'precio_dador_snap', precision: 12, scale: 2, nullable: true })
    precioDadorSnap: number;

    @Column({ name: 'financial_lot_id', type: 'uuid', nullable: true })
    financialLotId: string;

    @ManyToOne(() => FinancialLot, lot => lot.trips, { nullable: true })
    @JoinColumn({ name: 'financial_lot_id' })
    financialLot: FinancialLot;

    @Column({ name: 'payment_lot_id', type: 'uuid', nullable: true })
    paymentLotId: string;

    @ManyToOne(() => PaymentLot, lot => lot.trips, { nullable: true })
    @JoinColumn({ name: 'payment_lot_id' })
    paymentLot: PaymentLot;

    @Column('decimal', { name: 'deuda_upcharge', precision: 12, scale: 2, default: 0 })
    deudaUpcharge: number;

    @Column('decimal', { name: 'monto_abonado_original', precision: 12, scale: 2, default: 0 })
    montoAbonadoOriginal: number;

    @Column({ name: 'pago_confirmado', default: false })
    pagoConfirmado: boolean;

    @Column({ name: 'batch_cobro_id', type: 'uuid', nullable: true })
    batchCobroId: string;

    @Column({ name: 'settlement_id', type: 'uuid', nullable: true })
    settlementId: string;

    @ManyToOne(() => SettlementBatch)
    @JoinColumn({ name: 'settlement_id' })
    settlement: SettlementBatch;

    @Column('decimal', { name: 'cost_at_execution', precision: 15, scale: 2, nullable: true })
    costAtExecution: number;

    @Column('decimal', { name: 'revenue_at_execution', precision: 15, scale: 2, nullable: true })
    revenueAtExecution: number;

    @Column({ name: 'es_credito', default: false })
    esCredito: boolean;

    @Column('decimal', { name: 'monto_upcharge', precision: 12, scale: 2, default: 0 })
    montoUpcharge: number;

    @CreateDateColumn({ name: 'ts_creacion' })
    tsCreacion: Date;

    @Column({ name: 'ts_inicio_real', nullable: true })
    tsInicioReal: Date;

    @Column({ name: 'ts_finalizacion_real', nullable: true })
    tsFinalizacionReal: Date;

    @Column({ name: 'ts_cierre_interno', nullable: true })
    tsCierreInterno: Date;

    @Column({ name: 'ts_cierre', nullable: true }) // Alias/Compatibilidad
    tsCierre: Date;

    @Column({ name: 'cierre_motivo', length: 50, nullable: true })
    cierreMotivo: string; // MANUAL, AUTO_GEO, AUTO_SEQUENTIAL

    @Column('decimal', { name: 'distancia_total_recorrida_km', precision: 10, scale: 2, default: 0 })
    distanciaTotalRecorridaKm: number;

    @Column({ name: 'reached_destination', default: false })
    reachedDestination: boolean;

    @Column({ name: 'url_foto_remito', type: 'text', nullable: true })
    urlFotoRemito: string;
    @Column({ name: 'applied_rule_info', length: 255, nullable: true })
    appliedRuleInfo: string;
}
