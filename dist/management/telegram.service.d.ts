import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Driver } from '../database/entities/driver.entity';
import { User } from '../database/entities/user.entity';
import { Client } from '../database/entities/client.entity';
export declare class TelegramService implements OnModuleInit, OnModuleDestroy {
    private driverRepository;
    private userRepository;
    private clientRepository;
    private bot;
    private readonly logger;
    constructor(driverRepository: Repository<Driver>, userRepository: Repository<User>, clientRepository: Repository<Client>);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    private setupCommands;
    sendMessage(chatId: string, message: string): Promise<void>;
    sendDocument(chatId: string, url: string, caption?: string): Promise<void>;
    notify(clientId: string, type: 'new_trip' | 'speeding' | 'settlement', chatId: string, message: string): Promise<void>;
}
