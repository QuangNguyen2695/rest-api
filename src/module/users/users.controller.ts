import { Controller, Post, Body, Get, Param, Query } from '@nestjs/common';
import { UserDto, UserLoginDto } from './dto/user.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly userService: UsersService) { }

  @Post()
  signUp(@Body() userRequest: UserDto) {
    return this.userService.createUser(userRequest);
  }

  @Get('getToken')
  getToken(@Query('id') id: string) {
    console.log("🚀 ~ UsersController ~ getToken ~ id:", id);
    return this.userService.getToken(id);
  }
}