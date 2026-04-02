import { Controller, Get } from "@nestjs/common";

@Controller("health")
export class HealthController {
  @Get()
  getHealth() {
    return {
      status: "ok",
      service: "damastic-backend",
      time: new Date().toISOString(),
    };
  }
}
