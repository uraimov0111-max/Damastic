import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { DatabaseModule } from "./database/database.module";
import { HealthModule } from "./modules/health/health.module";
import { AuthModule } from "./modules/auth/auth.module";
import { DriversModule } from "./modules/drivers/drivers.module";
import { RoutesModule } from "./modules/routes/routes.module";
import { LocationsModule } from "./modules/locations/locations.module";
import { QueuesModule } from "./modules/queues/queues.module";
import { PaymentsModule } from "./modules/payments/payments.module";
import { RealtimeModule } from "./modules/realtime/realtime.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),
    DatabaseModule,
    HealthModule,
    AuthModule,
    DriversModule,
    RoutesModule,
    LocationsModule,
    QueuesModule,
    PaymentsModule,
    RealtimeModule,
  ],
})
export class AppModule {}
