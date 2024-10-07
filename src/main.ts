import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config/dist/config.service";
import { SizeLimitMiddleware } from "./middleware/size-limit-middleware";
import * as bodyParser from 'body-parser';

async function bootstrap() {

  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());

  const configService = app.get(ConfigService);
  const port = configService.get('PORT');
  app.use(bodyParser.json({limit: '50mb'}));
  app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
  app.enableCors({
    origin: ['http://localhost:4200'],
    methods: ['GET', 'POST'],
    credentials: true,
   });
  // Method 2: Apply Custom Middleware for Request Size
  app.use(new SizeLimitMiddleware().use);
  await app.listen(port);
}
bootstrap();