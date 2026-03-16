import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Telegraf } from 'telegraf';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Driver } from '../database/entities/driver.entity';
import { User } from '../database/entities/user.entity';
import { Client } from '../database/entities/client.entity';

@Injectable()
export class TelegramService implements OnModuleInit, OnModuleDestroy {
  private bot: Telegraf;
  private readonly logger = new Logger(TelegramService.name);

  constructor(
    @InjectRepository(Driver)
    private driverRepository: Repository<Driver>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Client)
    private clientRepository: Repository<Client>,
  ) {
    const token = process.env.TELEGRAM_BOT_TOKEN || '7545078862:AAHPBq5VwX2PnIl5PWW10rGCjiswyuG9xps';

    if (token) {
      this.bot = new Telegraf(token);
      this.logger.log('Bot de Telegram instanciado correctamente');
    } else {
      this.logger.error('CRÍTICO: No se encontró TELEGRAM_BOT_TOKEN en el entorno');
    }
  }

  async onModuleInit() {
    if (!this.bot) {
      this.logger.warn('Telegram Bot no disponible por falta de token');
      return;
    }

    this.setupCommands();

    // Forzar cierre de sesiones previas y esperar un momento
    this.logger.log('Intentando limpiar sesiones previas de Telegram...');
    try {
      // Forzar reset de offset para liberar sesiones de polling previas
      await this.bot.telegram.getUpdates(-1, 1, 0, []);
    } catch (e) {
      this.logger.debug('Error esperado al limpiar sesión: ' + e.message);
    }

    this.logger.log('Esperando 2s para iniciar el bot (evitar conflictos 409)...');
    setTimeout(async () => {
      try {
        await this.bot.launch();
        this.logger.log('Telegram Bot iniciado y escuchando comandos');
      } catch (err) {
        if (err.response?.error_code === 409) {
          this.logger.warn('AVISO: El bot ya está corriendo en otra instancia. Se omite el inicio en este proceso para evitar crasheos.');
        } else {
          this.logger.error('Error no crítico al lanzar el Bot de Telegram', err);
        }
      }
    }, 2000);
  }

  async onModuleDestroy() {
    if (this.bot) {
      this.logger.log('Deteniendo Bot de Telegram...');
      await this.bot.stop();
    }
  }

  private setupCommands() {
    this.bot.start(async (ctx) => {
      await ctx.reply('¡Bienvenido a ADT! 🚚\n\nPor favor, escribe tu DNI para vincular tu cuenta y empezar a recibir viajes.');
    });

    // Escuchar cualquier mensaje de texto (para vinculación por DNI directa)
    this.bot.on('text', async (ctx) => {
      const text = ctx.message.text.trim();
      const chatId = ctx.chat.id.toString();

      this.logger.log(`Mensaje recibido en Telegram de ${ctx.from.username || 'usuario'}: ${text}`);

      // Si es un comando, no procesar como DNI aquí
      if (text.startsWith('/')) return;

      // Intentar vincular por DNI (buscando chofer)
      const driver = await this.driverRepository.findOne({ where: { dni: text } });
      if (driver) {
        driver.telegramChatId = chatId;
        await this.driverRepository.save(driver);
        return ctx.reply(`¡Hola ${driver.nombre}! Tu cuenta de Chofer ha sido vinculada correctamente. A partir de ahora recibirás aquí las notificaciones de tus viajes. 🚀`);
      }

      // Intentar vincular por Email (buscando admin)
      if (text.includes('@')) {
        const user = await this.userRepository.findOne({ where: { email: text } });
        if (user) {
          user.telegramChatId = chatId;
          await this.userRepository.save(user);
          return ctx.reply(`¡Hola ${user.nombreCompleto}! Tu cuenta de Administrador ha sido vinculada correctamente.`);
        }
      }

      return ctx.reply('No pudimos encontrar una cuenta con ese DNI o Email. Por favor, asegúrate de que el DNI sea el mismo que figura en tu legajo.');
    });

    this.bot.command('status', (ctx) => ctx.reply('ADT Bot operando normalmente. 🚀'));
  }

  async sendMessage(chatId: string, message: string) {
    if (!this.bot || !chatId) {
      this.logger.error(`Error: Bot inicializado: ${!!this.bot}, ChatId: ${chatId}`);
      return;
    }
    try {
      this.logger.log(`Intentando enviar mensaje a ${chatId}...`);
      await this.bot.telegram.sendMessage(chatId, message, { parse_mode: 'Markdown' });
      this.logger.log(`Mensaje enviado exitosamente a ${chatId}`);
    } catch (error) {
      this.logger.error(`Error enviando mensaje a ${chatId}: ${error.message}`);
    }
  }

  async sendDocument(chatId: string, url: string, caption?: string) {
    if (!this.bot || !chatId) return;
    try {
      await this.bot.telegram.sendDocument(chatId, url, { caption });
    } catch (error) {
      this.logger.error(`Error enviando documento a ${chatId}`, error);
    }
  }

  /**
   * Envía una notificación basada en las preferencias del cliente
   */
  async notify(clientId: string, type: 'new_trip' | 'speeding' | 'settlement', chatId: string, message: string) {
    this.logger.log(`Procesando notificación tipo ${type} para cliente ${clientId}`);
    const client = await this.clientRepository.findOne({ where: { id: clientId } });
    if (!client) {
      this.logger.error(`No se encontró el cliente ${clientId}`);
      return;
    }

    const isEnabled =
      (type === 'new_trip' && client.notifyNewTrip) ||
      (type === 'speeding' && client.notifySpeeding) ||
      (type === 'settlement' && client.notifySettlement);

    this.logger.log(`Preferencia del cliente para ${type}: ${isEnabled}`);

    if (isEnabled && chatId) {
      await this.sendMessage(chatId, message);
    } else {
      this.logger.warn(`Notificación no enviada: Habilitado=${isEnabled}, ChatID=${chatId}`);
    }
  }
}
