import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { OptionsModule } from './options/options.module';
import { UsersModule } from './users/users.module';
import { FirebaseAdmin } from './config/firebase.setup';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env`,
    }),

    UsersModule,
    OptionsModule,
  ],
  controllers: [AppController],
  providers: [AppService, FirebaseAdmin],
})
export class AppModule { }