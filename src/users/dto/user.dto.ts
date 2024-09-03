import {
    IsEmail,
    IsNotEmpty,
    MaxLength,
    MinLength,
    Matches,
    IsEnum,
    IsAlpha,
    IsString,
} from 'class-validator';

enum Roles {
    ADMIN = 'ADMIN',
    USER = 'USER',
    DEVELOPER = 'DEVELOPER',
}

export class UserDto {
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsNotEmpty()
    @MinLength(8)
    @MaxLength(20)
    @Matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*]).{8,20}$/, {
        message: 'password too weak',
    })
    password: string;

    @IsNotEmpty()
    @MinLength(2)
    @MaxLength(20)
    @IsAlpha()
    firstName: string;

    @IsNotEmpty()
    @MinLength(2)
    @MaxLength(20)
    @IsAlpha()
    lastName: string;

    @IsNotEmpty()
    @IsEnum(Roles)
    role: Roles;
}

export class UserLoginDto{

    @IsNotEmpty()
    @IsString()
    email:string;

    @IsNotEmpty()
    @IsString()
    password:string;
}