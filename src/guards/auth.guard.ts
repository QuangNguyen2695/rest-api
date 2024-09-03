import { FirebaseAdmin } from '@/config/firebase.setup';
import {
    Injectable,
    CanActivate,
    ExecutionContext,
    UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private readonly admin: FirebaseAdmin,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        try {
            const app = this.admin.setup();

            const idToken = context.getArgs()[0]?.headers?.authorization.split(' ')[1];

            const permissions = this.reflector.get<string[]>(
                'permissions',
                context.getHandler(),
            );

            const claims = await app.auth().verifyIdToken(idToken);

            if (claims.role === permissions[0]) {
                return true;
            }
            throw new UnauthorizedException();
        } catch (error) {
            console.log('Error', error);
            throw new UnauthorizedException();
        }
    }
}