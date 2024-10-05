import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { OptionsModule } from './options/options.module';
import { UsersModule } from './users/users.module';
import { FirebaseAdmin } from './config/firebase.setup';
import { ProductsModule } from './products/products.module';
import { ImageUploadModule } from './image-upload/image-upload.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env`,
    }),

    UsersModule,
    OptionsModule,
    ProductsModule,
    ImageUploadModule,
  ],
  controllers: [AppController],
  providers: [AppService, FirebaseAdmin],
})
export class AppModule { }