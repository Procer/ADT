import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TelegramService } from '../management/telegram.service';
import { Driver } from '../database/entities/driver.entity';
import { User } from '../database/entities/user.entity';
import { Client } from '../database/entities/client.entity';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([Driver, User, Client]),
  ],
  providers: [TelegramService],
  exports: [TelegramService],
})
export class CommonModule {}
