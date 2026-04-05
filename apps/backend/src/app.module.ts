import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { DatabaseModule } from "./database/database.module";
import { validateEnv } from "./config/validate-env";
import { HealthModule } from "./modules/health/health.module";
import { AuthModule } from "./modules/auth/auth.module";
import { AdminAuthModule } from "./modules/admin-auth/admin-auth.module";
import { AdminConsoleModule } from "./modules/admin-console/admin-console.module";
import { DriversModule } from "./modules/drivers/drivers.module";
import { RoutesModule } from "./modules/routes/routes.module";
import { LocationsModule } from "./modules/locations/locations.module";
import { QueuesModule } from "./modules/queues/queues.module";
import { PaymentsModule } from "./modules/payments/payments.module";
import { CashEntriesModule } from "./modules/cash-entries/cash-entries.module";
import { RealtimeModule } from "./modules/realtime/realtime.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
      validate: validateEnv,
    }),
    DatabaseModule,
    HealthModule,
    AuthModule,
    AdminAuthModule,
    AdminConsoleModule,
    DriversModule,
    RoutesModule,
    LocationsModule,
    QueuesModule,
    PaymentsModule,
    CashEntriesModule,
    RealtimeModule,
  ],
})
export class AppModule {}
