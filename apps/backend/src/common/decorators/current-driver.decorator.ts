import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export interface AuthenticatedDriver {
  id: bigint;
  phone: string;
}

export const CurrentDriver = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedDriver => {
    const request = context.switchToHttp().getRequest();
    return request.user as AuthenticatedDriver;
  },
);
