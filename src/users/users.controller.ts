import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { UserDto, UserLoginDto } from './dto/user.dto';
import { UsersService } from './users.service';
import { Auth } from '@/decorators/auth.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly userService: UsersService) { }

  @Post('signup')
  signUp(@Body() userRequest: UserDto): Promise<void> {
    return this.userService.createUser(userRequest);
  }

  @Get(':id')
  getToken(@Param('id') id: string): Promise<void> {
    return this.userService.getToken(id);
  }
}