import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized({ req, token }) {
      if (req.nextUrl.pathname.startsWith("/admin")) {
        return token?.role === "ADMIN";
      }
      if (req.nextUrl.pathname.startsWith("/dashboard")) {
        return !!token;
      }
      return true;
    },
  },
});

export const config = { matcher: ["/admin/:path*", "/dashboard/:path*"] };
