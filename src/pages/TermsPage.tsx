import { motion } from "framer-motion";
import { Layout } from "@/components/layout/Layout";
import { Helmet } from "react-helmet-async";
import { useCompanyInfo } from "@/hooks/useCompanyInfo";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

export default function TermsPage() {
  const { companyInfo, getLocalBusinessSchema, isLoading: companyLoading } = useCompanyInfo();

  const { data: policies, isLoading: policiesLoading } = useQuery({
    queryKey: ["policies", "terms"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("policies")
        .select("*")
        .eq("is_active", true)
        .in("key", ["terms_acceptance", "products_services", "pricing_policy", "orders_policy", "returns_policy", "warranty_policy", "payment_policy", "user_accounts", "liability", "intellectual_property", "governing_law"]);
      
      if (error) throw error;
      return data || [];
    },
  });

  const getPolicyContent = (key: string) => {
    const policy = policies?.find(p => p.key === key);
    return policy?.content || null;
  };

  const isLoading = companyLoading || policiesLoading;

  return (
    <Layout>
      <Helmet>
        <title>Terms of Service | Kore Tires Edmonton</title>
        <meta name="description" content="Terms of Service for Kore Tires Edmonton. Review our terms and conditions for using our website and services." />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://koretires.lovable.app/terms" />
        <meta property="og:title" content="Terms of Service | Kore Tires Edmonton" />
        <meta property="og:description" content="Terms of Service for Kore Tires Edmonton. Review our terms and conditions for using our website and services." />
        <meta property="og:url" content="https://koretires.lovable.app/terms" />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">
          {JSON.stringify(getLocalBusinessSchema())}
        </script>
      </Helmet>

      <div className="container py-16 md:py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto"
        >
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-8">
            Terms of Service
          </h1>
          
          {isLoading ? (
            <div className="space-y-8">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ))}
            </div>
          ) : (
            <div className="prose prose-invert max-w-none space-y-8">
              <p className="text-lg text-muted-foreground">
                Last updated: January 2026
              </p>
              
              <section>
                <h2 className="font-display text-xl font-semibold mb-4">1. Acceptance of Terms</h2>
                {getPolicyContent("terms_acceptance") ? (
                  <div className="text-muted-foreground whitespace-pre-wrap">
                    {getPolicyContent("terms_acceptance")}
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    By accessing and using the Kore Tires website and services, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
                  </p>
                )}
              </section>

              <section>
                <h2 className="font-display text-xl font-semibold mb-4">2. Products and Services</h2>
                {getPolicyContent("products_services") ? (
                  <div className="text-muted-foreground whitespace-pre-wrap">
                    {getPolicyContent("products_services")}
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    Kore Tires provides tire sales and related automotive services. Product availability, pricing, and services are subject to change. For current information, please contact us directly or check our website.
                  </p>
                )}
              </section>

              <section>
                <h2 className="font-display text-xl font-semibold mb-4">3. Pricing</h2>
                {getPolicyContent("pricing_policy") ? (
                  <div className="text-muted-foreground whitespace-pre-wrap">
                    {getPolicyContent("pricing_policy")}
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    All prices are in Canadian Dollars (CAD) and subject to applicable taxes. Prices may change without notice. Wholesale pricing is available to approved dealers only. For current pricing information, please contact us.
                  </p>
                )}
              </section>

              <section>
                <h2 className="font-display text-xl font-semibold mb-4">4. Orders</h2>
                {getPolicyContent("orders_policy") ? (
                  <div className="text-muted-foreground whitespace-pre-wrap">
                    {getPolicyContent("orders_policy")}
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    Order placement constitutes an offer to purchase. We reserve the right to accept or decline any order. For details on our order process, please contact us or visit our shop.
                  </p>
                )}
              </section>

              <section>
                <h2 className="font-display text-xl font-semibold mb-4">5. Returns</h2>
                {getPolicyContent("returns_policy") ? (
                  <div className="text-muted-foreground whitespace-pre-wrap">
                    {getPolicyContent("returns_policy")}
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    We offer returns on eligible products. Please contact us for our current return policy and any applicable conditions or timeframes.
                  </p>
                )}
              </section>

              <section>
                <h2 className="font-display text-xl font-semibold mb-4">6. Warranty</h2>
                {getPolicyContent("warranty_policy") ? (
                  <div className="text-muted-foreground whitespace-pre-wrap">
                    {getPolicyContent("warranty_policy")}
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    Tire warranties are provided by manufacturers. Coverage varies by product. Please contact us for warranty information specific to your purchase.
                  </p>
                )}
              </section>

              <section>
                <h2 className="font-display text-xl font-semibold mb-4">7. Payment</h2>
                {getPolicyContent("payment_policy") ? (
                  <div className="text-muted-foreground whitespace-pre-wrap">
                    {getPolicyContent("payment_policy")}
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    We accept payment in-person at the time of delivery or service completion. Cash and card payments are accepted in-person. Online payment options are coming soon. For current payment options, please contact us.
                  </p>
                )}
              </section>

              <section>
                <h2 className="font-display text-xl font-semibold mb-4">8. User Accounts & Dealer Accounts</h2>
                {getPolicyContent("user_accounts") ? (
                  <div className="text-muted-foreground whitespace-pre-wrap">
                    {getPolicyContent("user_accounts")}
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    Users may create accounts to track orders and access additional features. Dealer accounts provide access to wholesale pricing upon approval. You are responsible for maintaining the confidentiality of your account credentials.
                  </p>
                )}
              </section>

              <section>
                <h2 className="font-display text-xl font-semibold mb-4">9. Limitation of Liability</h2>
                {getPolicyContent("liability") ? (
                  <div className="text-muted-foreground whitespace-pre-wrap">
                    {getPolicyContent("liability")}
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    Kore Tires shall not be liable for indirect, incidental, or consequential damages arising from the use of our products or services, to the extent permitted by law.
                  </p>
                )}
              </section>

              <section>
                <h2 className="font-display text-xl font-semibold mb-4">10. Intellectual Property</h2>
                {getPolicyContent("intellectual_property") ? (
                  <div className="text-muted-foreground whitespace-pre-wrap">
                    {getPolicyContent("intellectual_property")}
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    All content on this website, including logos, text, images, and software, is the property of Kore Tires or its licensors and is protected by copyright and trademark laws.
                  </p>
                )}
              </section>

              <section>
                <h2 className="font-display text-xl font-semibold mb-4">11. Governing Law</h2>
                {getPolicyContent("governing_law") ? (
                  <div className="text-muted-foreground whitespace-pre-wrap">
                    {getPolicyContent("governing_law")}
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    These terms are governed by the laws of the Province of Alberta, Canada. Any disputes shall be resolved in the courts of Alberta.
                  </p>
                )}
              </section>

              <section>
                <h2 className="font-display text-xl font-semibold mb-4">12. Changes to Terms</h2>
                <p className="text-muted-foreground">
                  We reserve the right to modify these terms at any time. Changes will be effective upon posting to this page. Continued use of our services constitutes acceptance of modified terms.
                </p>
              </section>

              <section>
                <h2 className="font-display text-xl font-semibold mb-4">13. Contact Information</h2>
                <p className="text-muted-foreground">
                  For questions about these terms, please contact us:
                </p>
                <div className="mt-4 p-4 rounded-xl bg-secondary/50">
                  <p className="font-medium">Kore Tires Edmonton</p>
                  {companyInfo.contact.email && (
                    <p className="text-muted-foreground">Email: {companyInfo.contact.email}</p>
                  )}
                  {companyInfo.contact.phone && (
                    <p className="text-muted-foreground">Phone: {companyInfo.contact.phone}</p>
                  )}
                  {companyInfo.location.address && (
                    <p className="text-muted-foreground">
                      Address: {companyInfo.location.address}, {companyInfo.location.city}, {companyInfo.location.province} {companyInfo.location.postal_code}
                    </p>
                  )}
                  {!companyInfo.contact.email && !companyInfo.contact.phone && (
                    <p className="text-muted-foreground">Please visit our Contact page for current contact information.</p>
                  )}
                </div>
              </section>
            </div>
          )}
        </motion.div>
      </div>
    </Layout>
  );
}
