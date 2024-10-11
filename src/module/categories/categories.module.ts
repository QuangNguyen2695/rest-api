import { Module } from '@nestjs/common';
import { FirebaseAdmin } from '@/config/firebase.setup';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';

@Module({
  controllers: [CategoriesController],
  providers: [CategoriesService, FirebaseAdmin],
})
export class OptionsModule { }
