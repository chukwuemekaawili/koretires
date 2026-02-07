import { ReactNode } from "react";
import { Helmet } from "react-helmet-async";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { MobileBottomBar } from "./MobileBottomBar";
import { ScrollToTop } from "./ScrollToTop";
import { AIConcierge } from "@/components/ai/AIConcierge";
import { useCompanyInfo } from "@/hooks/useCompanyInfo";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { getLocalBusinessSchema } = useCompanyInfo();
  const schema = getLocalBusinessSchema();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      </Helmet>
      <Header />
      <main className="flex-1 pt-[72px] lg:pt-20 pb-16 md:pb-0">
        {children}
      </main>
      <Footer />
      <MobileBottomBar />
      <ScrollToTop />
      <AIConcierge />
    </div>
  );
}
