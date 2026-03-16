"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var TelegramService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelegramService = void 0;
const common_1 = require("@nestjs/common");
const telegraf_1 = require("telegraf");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const driver_entity_1 = require("../database/entities/driver.entity");
const user_entity_1 = require("../database/entities/user.entity");
const client_entity_1 = require("../database/entities/client.entity");
let TelegramService = TelegramService_1 = class TelegramService {
    driverRepository;
    userRepository;
    clientRepository;
    bot;
    logger = new common_1.Logger(TelegramService_1.name);
    constructor(driverRepository, userRepository, clientRepository) {
        this.driverRepository = driverRepository;
        this.userRepository = userRepository;
        this.clientRepository = clientRepository;
        const token = process.env.TELEGRAM_BOT_TOKEN || '7545078862:AAHPBq5VwX2PnIl5PWW10rGCjiswyuG9xps';
        if (token) {
            this.bot = new telegraf_1.Telegraf(token);
            this.logger.log('Bot de Telegram instanciado correctamente');
        }
        else {
            this.logger.error('CRÍTICO: No se encontró TELEGRAM_BOT_TOKEN en el entorno');
        }
    }
    async onModuleInit() {
        if (!this.bot) {
            this.logger.warn('Telegram Bot no disponible por falta de token');
            return;
        }
        this.setupCommands();
        this.logger.log('Intentando limpiar sesiones previas de Telegram...');
        try {
            await this.bot.telegram.getUpdates(-1, 1, 0, []);
        }
        catch (e) {
            this.logger.debug('Error esperado al limpiar sesión: ' + e.message);
        }
        this.logger.log('Esperando 2s para iniciar el bot (evitar conflictos 409)...');
        setTimeout(async () => {
            try {
                await this.bot.launch();
                this.logger.log('Telegram Bot iniciado y escuchando comandos');
            }
            catch (err) {
                if (err.response?.error_code === 409) {
                    this.logger.warn('AVISO: El bot ya está corriendo en otra instancia. Se omite el inicio en este proceso para evitar crasheos.');
                }
                else {
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
    setupCommands() {
        this.bot.start(async (ctx) => {
            await ctx.reply('¡Bienvenido a ADT! 🚚\n\nPor favor, escribe tu DNI para vincular tu cuenta y empezar a recibir viajes.');
        });
        this.bot.on('text', async (ctx) => {
            const text = ctx.message.text.trim();
            const chatId = ctx.chat.id.toString();
            this.logger.log(`Mensaje recibido en Telegram de ${ctx.from.username || 'usuario'}: ${text}`);
            if (text.startsWith('/'))
                return;
            const driver = await this.driverRepository.findOne({ where: { dni: text } });
            if (driver) {
                driver.telegramChatId = chatId;
                await this.driverRepository.save(driver);
                return ctx.reply(`¡Hola ${driver.nombre}! Tu cuenta de Chofer ha sido vinculada correctamente. A partir de ahora recibirás aquí las notificaciones de tus viajes. 🚀`);
            }
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
    async sendMessage(chatId, message) {
        if (!this.bot || !chatId) {
            this.logger.error(`Error: Bot inicializado: ${!!this.bot}, ChatId: ${chatId}`);
            return;
        }
        try {
            this.logger.log(`Intentando enviar mensaje a ${chatId}...`);
            await this.bot.telegram.sendMessage(chatId, message, { parse_mode: 'Markdown' });
            this.logger.log(`Mensaje enviado exitosamente a ${chatId}`);
        }
        catch (error) {
            this.logger.error(`Error enviando mensaje a ${chatId}: ${error.message}`);
        }
    }
    async sendDocument(chatId, url, caption) {
        if (!this.bot || !chatId)
            return;
        try {
            await this.bot.telegram.sendDocument(chatId, url, { caption });
        }
        catch (error) {
            this.logger.error(`Error enviando documento a ${chatId}`, error);
        }
    }
    async notify(clientId, type, chatId, message) {
        this.logger.log(`Procesando notificación tipo ${type} para cliente ${clientId}`);
        const client = await this.clientRepository.findOne({ where: { id: clientId } });
        if (!client) {
            this.logger.error(`No se encontró el cliente ${clientId}`);
            return;
        }
        const isEnabled = (type === 'new_trip' && client.notifyNewTrip) ||
            (type === 'speeding' && client.notifySpeeding) ||
            (type === 'settlement' && client.notifySettlement);
        this.logger.log(`Preferencia del cliente para ${type}: ${isEnabled}`);
        if (isEnabled && chatId) {
            await this.sendMessage(chatId, message);
        }
        else {
            this.logger.warn(`Notificación no enviada: Habilitado=${isEnabled}, ChatID=${chatId}`);
        }
    }
};
exports.TelegramService = TelegramService;
exports.TelegramService = TelegramService = TelegramService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(driver_entity_1.Driver)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(2, (0, typeorm_1.InjectRepository)(client_entity_1.Client)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], TelegramService);
//# sourceMappingURL=telegram.service.js.map