import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "STUDENT" | "GUARDIAN";
    } & DefaultSession["user"];
  }

  interface User {
    role: "STUDENT" | "GUARDIAN";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: "STUDENT" | "GUARDIAN";
  }
}
