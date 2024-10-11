import { Injectable, BadRequestException } from '@nestjs/common';
import { UserDto, UserLoginDto } from './dto/user.dto';
import { FirebaseAdmin } from '@/config/firebase.setup';
@Injectable()
export class UsersService {
  constructor(private readonly admin: FirebaseAdmin) { }

  async createUser(userRequest: UserDto): Promise<any> {
    const { email, password, firstName, lastName, role } = userRequest;
    const app = this.admin.setup();

    try {
      const createdUser = await app.auth().createUser({
        email,
        password,
        displayName: `${firstName} ${lastName}`,
      });
      await app.auth().setCustomUserClaims(createdUser.uid, { role });
      return createdUser;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getToken(userId: any): Promise<any> {

    try {
      const app = this.admin.setup();
      const additionalClaims = {
        premiumAccount: true,
      };
      const createdUser = await app.auth()
        .createCustomToken(userId, additionalClaims);
      return createdUser;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}