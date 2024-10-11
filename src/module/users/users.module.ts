import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { FirebaseAdmin } from '@/config/firebase.setup';

@Module({
  controllers: [UsersController],
  providers: [UsersService, FirebaseAdmin],
})
export class UsersModule { }