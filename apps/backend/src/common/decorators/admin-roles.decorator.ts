import { SetMetadata } from "@nestjs/common";

export const ADMIN_ROLES_KEY = "admin_roles";
export const AdminRoles = (...roles: Array<"super_admin" | "alliance_admin">) =>
  SetMetadata(ADMIN_ROLES_KEY, roles);
