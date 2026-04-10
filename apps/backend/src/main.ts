import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: false,
  });

  app.setGlobalPrefix("api");
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const config = app.get(ConfigService);
  const clientOrigin = config.get<string>("CLIENT_APP_URL", "http://localhost:5173");

  app.enableCors({
    origin: true,
    credentials: true,
  });

  const port = config.get<number>("PORT", 4000);
  await app.listen(port);
  console.log(`Damastic backend ready on http://localhost:${port}/api`);
}

bootstrap();
