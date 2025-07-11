    // src/types/next-auth.d.ts
    import NextAuth from "next-auth";
    import { DefaultSession, DefaultJWT } from "next-auth";
    import { Role } from "@prisma/client"; // Pastikan path ini benar sesuai lokasi Role enum Anda

    declare module "next-auth" {
      /**
       * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
       */
      interface Session {
        user: {
          id: string; // Tambahkan properti id
          role: Role; // Tambahkan properti role
        } & DefaultSession["user"];
      }

      /**
       * Returned by the `jwt` callback and `getToken`
       */
      interface JWT extends DefaultJWT {
        id: string; // Tambahkan properti id
        role: Role; // Tambahkan properti role
      }
    }
    