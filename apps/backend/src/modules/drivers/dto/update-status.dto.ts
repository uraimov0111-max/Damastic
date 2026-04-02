import { IsIn } from "class-validator";

export class UpdateStatusDto {
  @IsIn(["offline", "online"])
  status!: "offline" | "online";
}
