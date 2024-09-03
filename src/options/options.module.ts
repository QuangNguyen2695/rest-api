import { Module } from '@nestjs/common';
import { OptionsService } from './options.service';
import { OptionsController } from './options.controller';
import { FirebaseAdmin } from '@/config/firebase.setup';

@Module({
  controllers: [OptionsController],
  providers: [OptionsService, FirebaseAdmin],
})
export class OptionsModule { }
