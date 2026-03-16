import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { CartaPorte } from './carta-porte.entity';

@Entity('gps_tracking')
export class GpsTracking {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    id: string;

    @Column({ name: 'cp_id', type: 'uuid' })
    cpId: string;

    @ManyToOne(() => CartaPorte)
    @JoinColumn({ name: 'cp_id' })
    cartaPorte: CartaPorte;

    @Column('decimal', { precision: 10, scale: 8 })
    latitud: number;

    @Column('decimal', { precision: 11, scale: 8 })
    longitud: number;

    @Column('decimal', { precision: 5, scale: 2, nullable: true })
    velocidad: number;

    @Column({ name: 'es_manual', default: false })
    esManual: boolean;

    @Column({ name: 'tipo_registro', length: 20, default: 'AUTOMATICO' })
    tipoRegistro: string; // 'AUTOMATICO' o 'MANUAL'

    @Column({ name: 'evento_manual', length: 50, nullable: true })
    eventoManual: string; // 'INICIAR', 'LLEGUE', 'CARGA', 'FINALIZAR'

    @Column({ name: 'cierre_interno_disparado', default: false })
    cierreInternoDisparado: boolean;

    @Column({ name: 'fuera_de_rango', default: false })
    fueraDeRango: boolean;

    @Column({ name: 'resuelto', default: false })
    resuelto: boolean;

    @Column({ name: 'comentario_resolucion', type: 'text', nullable: true })
    comentarioResolucion: string;

    @Column({ name: 'resuelto_por', nullable: true })
    resueltoPor: string;

    @Column({ name: 'distancia_destino_metros', type: 'decimal', precision: 12, scale: 2, nullable: true })
    distanciaDestinoMetros: number;

    @Column({ name: 'timestamp_dispositivo' })
    timestampDispositivo: Date;

    @CreateDateColumn({ name: 'timestamp_servidor' })
    timestampServidor: Date;
}
