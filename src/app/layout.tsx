import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Nav } from "@/components/Nav";
import { ToastProvider } from "@/components/ToastProvider";

export const metadata: Metadata = {
  title: "Policy LC Ops Hub",
  description: "Event operations dashboard for the Yale YSE Policy Learning Community",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Nav />
          <main className="ml-0 sm:ml-56 min-h-screen">
            {children}
          </main>
          <ToastProvider />
        </Providers>
      </body>
    </html>
  );
}
