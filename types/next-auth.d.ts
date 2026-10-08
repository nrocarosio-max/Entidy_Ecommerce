import { DefaultSession } from "next-auth";
import type { RoleCode } from "./role";

declare module "next-auth" {
 interface Session {
  user: {
   id: string;
   roleId: string;
   role: RoleCode;
   permissions: string[];
   storeId: string | null;
  } & DefaultSession["user"];
 }

 interface User {
  id: string;
  roleId: string;
  role: RoleCode;
  permissions: string[];
  storeId: string | null;
 }
}

declare module "next-auth/jwt" {
 interface JWT {
  id: string;
  roleId: string;
  role: RoleCode;
  permissions: string[];
  storeId: string | null;
 }
}
