import { Module } from '@nestjs/common';
import { ImageUploadService } from './image-upload.service';
import { ImageUploadController } from './image-upload.controller';
import { FirebaseAdmin } from '@/config/firebase.setup';

@Module({
  controllers: [ImageUploadController],
  providers: [ImageUploadService, FirebaseAdmin],
  exports: [ImageUploadService]
})
export class ImageUploadModule {}
