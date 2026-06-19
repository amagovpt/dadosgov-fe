import { NextRequest } from "next/server";
import { proxy } from "./src/proxy";

export const config = {
  matcher: [
    {
      source:
        "/((?!_next/static|.*\\..*|_next/image|favicon.ico|favicon.png|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|woff2?|ttf|eot)$).*)",
    },
  ],
};

export function middleware(request: NextRequest) {
  return proxy(request);
}
