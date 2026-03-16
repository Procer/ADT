import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { TenantPricing } from './tenant-pricing.entity';
import { TransportUnit } from './transport-unit.entity';
import { Driver } from './driver.entity';
import { CartaPorte } from './carta-porte.entity';
import { TravelCredit } from './travel-credit.entity';
import { Salesperson } from './salesperson.entity';

@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'nombre_empresa' })
  nombreEmpresa: string;

  @Column({ type: 'simple-json', default: '{"radio_geocerca": 500, "moneda": "ARS", "frecuencia_gps": 120}' })
  config: any;

  @Column({ name: 'logo_url', nullable: true })
  logoUrl: string;

  @Column({ name: 'telegram_chat_id', nullable: true })
  telegramChatId: string;

  @Column({ name: 'imap_host', nullable: true })
  imapHost: string;

  @Column({ name: 'imap_port', type: 'int', nullable: true, default: 993 })
  imapPort: number;

  @Column({ name: 'imap_user', nullable: true })
  imapUser: string;

  @Column({ name: 'imap_pass', nullable: true })
  imapPass: string;

  @Column({ name: 'gemini_api_key', nullable: true })
  geminiApiKey: string;

  // Configuración de Correo Saliente (SMTP del Cliente Logístico)
  @Column({ name: 'smtp_host', nullable: true })
  smtpHost: string;

  @Column({ name: 'smtp_port', type: 'int', nullable: true, default: 587 })
  smtpPort: number;

  @Column({ name: 'smtp_user', nullable: true })
  smtpUser: string;

  @Column({ name: 'smtp_pass', nullable: true })
  smtpPass: string;

  @Column({ name: 'smtp_from', nullable: true })
  smtpFrom: string;

  @Column({ name: 'smtp_secure', default: false })
  smtpSecure: boolean;

  @Column({ name: 'limite_credito_global', type: 'decimal', precision: 12, scale: 2, default: 0 })
  limiteCreditoGlobal: number;

  @Column({ name: 'deuda_actual', type: 'decimal', precision: 12, scale: 2, default: 0 })
  deudaActual: number;

  @Column({ default: true })
  activo: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'salesperson_id', nullable: true })
  salespersonId: string;

  @ManyToOne(() => Salesperson, salesperson => salesperson.tenants, { nullable: true })
  @JoinColumn({ name: 'salesperson_id' })
  salesperson: Salesperson;

  @OneToMany(() => TenantPricing, pricing => pricing.tenant)
  pricings: TenantPricing[];

  @OneToMany(() => TransportUnit, unit => unit.tenant)
  units: TransportUnit[];

  @OneToMany(() => Driver, driver => driver.tenant)
  drivers: Driver[];

  @OneToMany(() => CartaPorte, trip => trip.tenant)
  trips: CartaPorte[];

  @OneToMany(() => TravelCredit, credit => credit.tenant)
  credits: TravelCredit[];
}
