import { motion } from "framer-motion";
import { Layout } from "@/components/layout/Layout";
import { Helmet } from "react-helmet-async";
import { useCompanyInfo } from "@/hooks/useCompanyInfo";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

export default function PrivacyPage() {
  const { companyInfo, getLocalBusinessSchema, isLoading: companyLoading } = useCompanyInfo();

  const { data: policies, isLoading: policiesLoading } = useQuery({
    queryKey: ["policies", "privacy"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("policies")
        .select("*")
        .eq("is_active", true)
        .in("key", ["privacy_policy", "data_collection", "data_usage", "data_sharing", "data_security", "user_rights", "cookies", "contact_privacy"]);
      
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
        <title>Privacy Policy | Kore Tires Edmonton</title>
        <meta name="description" content="Privacy Policy for Kore Tires Edmonton. Learn how we collect, use, and protect your personal information." />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://koretires.lovable.app/privacy" />
        <meta property="og:title" content="Privacy Policy | Kore Tires Edmonton" />
        <meta property="og:description" content="Privacy Policy for Kore Tires Edmonton. Learn how we collect, use, and protect your personal information." />
        <meta property="og:url" content="https://koretires.lovable.app/privacy" />
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
            Privacy Policy
          </h1>
          
          {isLoading ? (
            <div className="space-y-8">
              {[...Array(6)].map((_, i) => (
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
                <h2 className="font-display text-xl font-semibold mb-4">1. Information We Collect</h2>
                {getPolicyContent("data_collection") ? (
                  <div className="text-muted-foreground whitespace-pre-wrap">
                    {getPolicyContent("data_collection")}
                  </div>
                ) : (
                  <>
                    <p className="text-muted-foreground mb-4">
                      Kore Tires collects information you provide directly to us, including:
                    </p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-2">
                      <li>Name, email address, phone number, and mailing address</li>
                      <li>Vehicle information when you request quotes or services</li>
                      <li>Order history and transaction details</li>
                      <li>Communication preferences</li>
                      <li>Business information for dealer applications</li>
                    </ul>
                  </>
                )}
              </section>

              <section>
                <h2 className="font-display text-xl font-semibold mb-4">2. How We Use Your Information</h2>
                {getPolicyContent("data_usage") ? (
                  <div className="text-muted-foreground whitespace-pre-wrap">
                    {getPolicyContent("data_usage")}
                  </div>
                ) : (
                  <>
                    <p className="text-muted-foreground mb-4">
                      We use the information we collect to:
                    </p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-2">
                      <li>Process and fulfill your orders</li>
                      <li>Communicate about products, services, and promotions</li>
                      <li>Provide customer support</li>
                      <li>Schedule service appointments</li>
                      <li>Process dealer applications</li>
                      <li>Improve our website and services</li>
                    </ul>
                  </>
                )}
              </section>

              <section>
                <h2 className="font-display text-xl font-semibold mb-4">3. Information Sharing</h2>
                {getPolicyContent("data_sharing") ? (
                  <div className="text-muted-foreground whitespace-pre-wrap">
                    {getPolicyContent("data_sharing")}
                  </div>
                ) : (
                  <>
                    <p className="text-muted-foreground">
                      We do not sell your personal information. We may share your information with service providers who assist in our operations. For full details on our data sharing practices, please contact us.
                    </p>
                  </>
                )}
              </section>

              <section>
                <h2 className="font-display text-xl font-semibold mb-4">4. Data Security</h2>
                {getPolicyContent("data_security") ? (
                  <div className="text-muted-foreground whitespace-pre-wrap">
                    {getPolicyContent("data_security")}
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. This includes encryption of data in transit and at rest, secure server infrastructure, and regular security audits.
                  </p>
                )}
              </section>

              <section>
                <h2 className="font-display text-xl font-semibold mb-4">5. Your Rights</h2>
                {getPolicyContent("user_rights") ? (
                  <div className="text-muted-foreground whitespace-pre-wrap">
                    {getPolicyContent("user_rights")}
                  </div>
                ) : (
                  <>
                    <p className="text-muted-foreground mb-4">
                      Under Canadian privacy law (PIPEDA), you have the right to:
                    </p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-2">
                      <li>Access your personal information</li>
                      <li>Correct inaccurate information</li>
                      <li>Withdraw consent for certain uses</li>
                      <li>Request deletion of your data</li>
                    </ul>
                  </>
                )}
              </section>

              <section>
                <h2 className="font-display text-xl font-semibold mb-4">6. Cookies & Tracking</h2>
                {getPolicyContent("cookies") ? (
                  <div className="text-muted-foreground whitespace-pre-wrap">
                    {getPolicyContent("cookies")}
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    Our website uses cookies and similar technologies to improve your browsing experience, analyze site traffic, and personalize content. You can control cookie preferences through your browser settings.
                  </p>
                )}
              </section>

              <section>
                <h2 className="font-display text-xl font-semibold mb-4">7. Contact Us</h2>
                <p className="text-muted-foreground">
                  For questions about this privacy policy or your personal information, please contact us:
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

              <section>
                <h2 className="font-display text-xl font-semibold mb-4">8. Changes to This Policy</h2>
                <p className="text-muted-foreground">
                  We may update this privacy policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the "Last updated" date.
                </p>
              </section>
            </div>
          )}
        </motion.div>
      </div>
    </Layout>
  );
}
