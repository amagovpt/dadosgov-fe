import { Noto_Sans, Noto_Sans_Mono } from "next/font/google";

/**
 * The portal's typefaces, declared once and shared.
 *
 * `next/font` hashes the loaded font per call site, so declaring them here
 * rather than in the layout lets `global-error.tsx` — which renders its own
 * `<html>`/`<body>` outside the layout — apply the very same
 * `--font-noto-sans` variable that the `@theme` block in `globals.css` maps
 * `font-sans` to, instead of falling back to the generic `sans-serif`.
 */
export const notoSans = Noto_Sans({
  variable: "--font-noto-sans",
  subsets: ["latin"],
});

export const notoSansMono = Noto_Sans_Mono({
  variable: "--font-noto-sans-mono",
  subsets: ["latin"],
});
