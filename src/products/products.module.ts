import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { FirebaseAdmin } from '@/config/firebase.setup';
import { ImageUploadModule } from '@/image-upload/image-upload.module';

@Module({
  controllers: [ProductsController],
  providers: [ProductsService, FirebaseAdmin],
  imports: [ImageUploadModule]
})
export class ProductsModule { }
