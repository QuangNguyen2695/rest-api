import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { FirebaseAdmin } from './config/firebase.setup';
import { UsersModule } from './module/users/users.module';
import { OptionsModule } from './module/categories/categories.module';
import { ProductsModule } from './module/products/products.module';
import { ImageUploadModule } from './module/image-upload/image-upload.module';

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