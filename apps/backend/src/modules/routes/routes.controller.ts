import { Controller, Get, Param, ParseIntPipe } from "@nestjs/common";
import { RoutesService } from "./routes.service";

@Controller("routes")
export class RoutesController {
  constructor(private readonly routesService: RoutesService) {}

  @Get()
  getRoutes() {
    return this.routesService.getRoutes();
  }

  @Get(":id")
  getRoute(@Param("id", ParseIntPipe) id: number) {
    return this.routesService.getRouteById(BigInt(id));
  }

  @Get(":id/points")
  getRoutePoints(@Param("id", ParseIntPipe) id: number) {
    return this.routesService.getRoutePoints(BigInt(id));
  }
}
