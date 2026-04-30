import type { ReactNode } from "react";
import { Source_Sans_3 } from "next/font/google";
import { StoreProvider } from "./StoreProvider";
import "./styles/globals.css";
import AppHeader from "./components/app-header";
import Footer from "./components/footer";
import AuthGuard from "./components/auth-guard";
import RouteChangeOverlay from "./components/route-change-overlay";
import AppNotifications from "./components/app-notifications";

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

interface Props {
  readonly children: ReactNode;
}

export default function RootLayout({ children }: Props) {
  return (
    <StoreProvider>
      <html lang="en" className={sourceSans.className}>
        <body className="flex min-h-screen flex-col">
          <AuthGuard>
            <RouteChangeOverlay />
            <AppNotifications />
            <AppHeader />
            <div className="flex-1">{children}</div>
            <Footer />
          </AuthGuard>
        </body>
      </html>
    </StoreProvider>
  );
}
