import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";

import { QueryProvider } from "@/components/providers/query-client-provider";
import { MUIThemeProvider } from "@/components/providers/theme-provider";
import { AuthProvider } from "@/components/providers/auth-provider";
import { RealtimeProvider } from "@/components/providers/realtime-provider";

const roboto = Roboto({
  weight: ["300", "400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-roboto",
});

export const metadata: Metadata = {
  title: "WhatsApp Cloud API Front-End",
  description: "A web-based front-end application for managing WhatsApp conversations and campaigns",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={roboto.variable}>
      <body>
        <MUIThemeProvider>
          <QueryProvider>
            <AuthProvider>
              <RealtimeProvider>
                {children}
              </RealtimeProvider>
            </AuthProvider>
          </QueryProvider>
        </MUIThemeProvider>
      </body>
    </html>
  );
} 