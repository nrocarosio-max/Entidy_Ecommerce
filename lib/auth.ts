import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

import type { RoleCode } from "~/types/role";
import { connectDB } from "~/lib/mongodb";
import { User } from "~/models/User";
import { Role } from "~/models/Role";

export const authOptions: NextAuthOptions = {
 session: {
  strategy: "jwt",
 },

 providers: [
  CredentialsProvider({
   name: "Credentials",

   credentials: {
    email: {
     label: "Email",
     type: "email",
    },

    password: {
     label: "Password",
     type: "password",
    },
   },

   async authorize(credentials) {
    if (!credentials?.email || !credentials?.password) {
     return null;
    }

    try {
     await connectDB();

     const email = credentials.email.trim().toLowerCase();

     const user = await User.findOne({
      email,
     }).lean();

     if (!user) {
      return null;
     }

     if (!user.isActive) {
      return null;
     }

     const passwordValid = await bcrypt.compare(credentials.password, user.passwordHash);

     if (!passwordValid) {
      return null;
     }

     const role = await Role.findById(user.roleId).lean();

     if (!role) {
      console.error("AUTH ERROR: User role not found.");

      return null;
     }

     if (!role.isActive) {
      return null;
     }

     await User.updateOne(
      {
       _id: user._id,
      },
      {
       $set: {
        lastLoginAt: new Date(),
       },
      },
     );

     return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,

      roleId: role._id.toString(),

      role: role.code as RoleCode,

      permissions: role.permissions,

      storeId: user.storeId ? user.storeId.toString() : null,
     };
    } catch (error) {
     console.error("AUTH ERROR:", error);

     return null;
    }
   },
  }),
 ],

 callbacks: {
  async jwt({ token, user }) {
   if (user) {
    token.id = user.id;

    token.roleId = user.roleId;

    token.role = user.role;

    token.permissions = user.permissions;

    token.storeId = user.storeId;
   }

   return token;
  },

  async session({ session, token }) {
   if (session.user) {
    session.user.id = token.id as string;

    session.user.roleId = token.roleId as string;

    session.user.role = token.role as RoleCode;

    session.user.permissions = (token.permissions as string[]) ?? [];

    session.user.storeId = (token.storeId as string | null) ?? null;
   }

   return session;
  },
 },

 pages: {
  signIn: "/admin/login",
 },

 secret: process.env.AUTH_SECRET,
};
