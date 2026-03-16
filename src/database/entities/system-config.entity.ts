import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('system_config')
export class SystemConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: 'GLOBAL_SETTINGS' })
  configKey: string;

  @Column({ type: 'simple-json', nullable: true })
  smtpConfig: {
    host: string;
    port: number;
    user: string;
    pass: string;
    from: string;
    secure: boolean;
  };

  @Column({ type: 'simple-json', nullable: true })
  telegramConfig: {
    botToken: string;
    globalChatId: string;
    enabled: boolean;
  };

  @Column({ name: 'gemini_api_key', nullable: true })
  geminiApiKey: string;

  @Column({ default: true })
  active: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
