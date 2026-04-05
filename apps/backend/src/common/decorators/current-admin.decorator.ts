import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export interface AuthenticatedAdmin {
  id: bigint;
  email: string;
  role: "super_admin" | "alliance_admin";
  allianceId: bigint | null;
}

export const CurrentAdmin = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedAdmin => {
    const request = context.switchToHttp().getRequest();
    return request.admin as AuthenticatedAdmin;
  },
);
