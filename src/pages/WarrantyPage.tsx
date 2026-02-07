import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  Shield, Check, AlertTriangle, Phone, Mail, 
  ArrowRight, FileText, Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Layout } from "@/components/layout/Layout";
import { useCompanyInfo } from "@/hooks/useCompanyInfo";
import { usePageContent } from "@/hooks/usePageContent";

interface HeroContent {
  headline: string;
  body: string;
}

interface PolicyContent {
  title: string;
  body: string;
}

interface ExclusionsContent {
  title: string;
  items: string[];
}

// Default warranty items (what's covered vs not covered)
const defaultWarrantyItems = [
  {
    title: "Manufacturing Defects",
    description: "Coverage against defects in materials and workmanship for the life of the tire's usable tread.",
    covered: true,
  },
  {
    title: "Workmanship Issues",
    description: "Defects resulting from the manufacturing process that affect tire performance or safety.",
    covered: true,
  },
  {
    title: "Tread Separation",
    description: "Coverage if the tread separates from the tire body under normal use conditions.",
    covered: true,
  },
  {
    title: "Sidewall Bulging",
    description: "Bulges or bumps in the sidewall caused by manufacturing defects.",
    covered: true,
  },
];

export default function WarrantyPage() {
  const { companyInfo, formatPhone, getFullAddress } = useCompanyInfo();
  const { isLoading, getSectionAs } = usePageContent("warranty");
  
  const phoneDisplay = companyInfo.contact.phone || null;
  const emailDisplay = companyInfo.contact.email || null;
  const addressDisplay = getFullAddress() || null;

  // Get DB content with fallbacks
  const hero = getSectionAs<HeroContent>("hero", {
    headline: "Warranty & Returns",
    body: "We stand behind every tire we sell. Our warranty protects you against manufacturing defects and ensures you can buy with confidence."
  });

  const pcrWarranty = getSectionAs<PolicyContent>("pcr_warranty", {
    title: "PCR Tire Warranty",
    body: "All Passenger Car Radial (PCR) tires purchased from Kore Tires include manufacturer warranty coverage. The warranty begins from the date of purchase and covers defects in workmanship and materials. Keep your receipt as proof of purchase for warranty claims."
  });

  const returnPolicy = getSectionAs<PolicyContent>("return_policy", {
    title: "Return Policy",
    body: "Returns are accepted within 30 days of purchase for unused tires in original condition. Tires that have been installed or used are not eligible for return. Please contact us to initiate a return and receive return authorization."
  });

  const exclusions = getSectionAs<ExclusionsContent>("exclusions", {
    title: "Warranty Exclusions",
    items: [
      "Damage from road hazards, punctures, or impacts",
      "Wear from improper inflation or alignment",
      "Damage from improper installation",
      "Normal wear and tear",
      "Cosmetic imperfections"
    ]
  });

  // Dynamic FAQ items using company info
  const faqItems = [
    {
      question: "How long is the warranty period?",
      answer: "Our warranty covers manufacturing defects for 50,000 km or 1 year from the date of purchase, whichever comes first. Coverage is prorated based on remaining tread depth.",
    },
    {
      question: "How do I file a warranty claim?",
      answer: addressDisplay 
        ? `Bring the tire to our location at ${addressDisplay}. Our technicians will inspect the tire and process your claim. Please bring your original receipt or order confirmation.`
        : "Bring the tire to our location. Our technicians will inspect the tire and process your claim. Please bring your original receipt or order confirmation. See our Contact page for our address.",
    },
    {
      question: "What if I bought tires online?",
      answer: "Online purchases are covered under the same warranty. Simply bring the tire and your order confirmation email to our location for inspection.",
    },
    {
      question: "Are installation issues covered?",
      answer: "If tires were installed by Kore Tires and installation-related issues arise, we'll correct them at no charge. Issues from third-party installation are not covered.",
    },
    {
      question: "Can I get a refund?",
      answer: "Unused tires may be returned within 30 days of purchase for a full refund. Mounted or used tires cannot be returned but may be eligible for warranty replacement.",
    },
  ];

  // Build warranty items from DB exclusions
  const warrantyNotCovered = exclusions.items.map((item) => ({
    title: item.split(" ")[0] + " " + (item.split(" ")[1] || ""),
    description: item,
    covered: false,
  }));

  const allWarrantyItems = [...defaultWarrantyItems, ...warrantyNotCovered];

  if (isLoading) {
    return (
      <Layout>
        <section className="py-16 md:py-24">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center space-y-4">
              <Skeleton className="h-16 w-16 mx-auto rounded-full" />
              <Skeleton className="h-12 w-3/4 mx-auto" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-2/3 mx-auto" />
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Hero */}
      <section className="relative py-16 md:py-24 bg-gradient-to-br from-background via-secondary/30 to-background">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto text-center"
          >
            <div className="inline-flex p-4 rounded-2xl bg-primary/10 mb-6">
              <Shield className="h-10 w-10 text-primary" />
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-6">
              {hero.headline}
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              {hero.body}
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 text-green-500">
              <Check className="h-5 w-5" />
              <span className="font-medium">50,000 km / 1 Year Warranty</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* PCR Warranty Section */}
      <section className="py-16 md:py-24">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto"
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              {pcrWarranty.title}
            </h2>
            <p className="text-muted-foreground mb-8">
              {pcrWarranty.body}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              What's Covered
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Understanding what's included in your warranty helps you know when to reach out for support.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {allWarrantyItems.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className={`bento-card flex items-start gap-4 ${
                  item.covered 
                    ? "border-green-500/20" 
                    : "border-border/50 bg-secondary/30"
                }`}
              >
                <div className={`p-2 rounded-lg ${
                  item.covered 
                    ? "bg-green-500/10 text-green-500" 
                    : "bg-muted text-muted-foreground"
                }`}>
                  {item.covered ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <AlertTriangle className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <h3 className="font-display font-semibold mb-1">
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Return Policy */}
      <section className="py-16 md:py-24 bg-secondary/30">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-6">
                {returnPolicy.title}
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <p>{returnPolicy.body}</p>
              </div>

              <div className="mt-8 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">30-Day Returns</h3>
                    <p className="text-sm text-muted-foreground">
                      Unused, unmounted tires can be returned within 30 days for a full refund.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">Receipt Required</h3>
                    <p className="text-sm text-muted-foreground">
                      Please bring your original receipt or order confirmation for all returns.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">Warranty Exchanges</h3>
                    <p className="text-sm text-muted-foreground">
                      Defective tires are replaced at prorated value based on remaining tread.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bento-card"
            >
              <h3 className="font-display font-semibold text-xl mb-6">Need Help?</h3>
              <p className="text-muted-foreground mb-6">
                Have questions about your warranty or need to make a claim? We're here to help.
              </p>
              
              <div className="space-y-4 mb-6">
                {phoneDisplay && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-primary" />
                    <a href={`tel:${formatPhone(phoneDisplay)}`} className="text-primary hover:underline">
                      {phoneDisplay}
                    </a>
                  </div>
                )}
                {emailDisplay && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-primary" />
                    <a href={`mailto:${emailDisplay}`} className="text-primary hover:underline">
                      {emailDisplay}
                    </a>
                  </div>
                )}
              </div>

              <Button variant="hero" className="w-full" asChild>
                <Link to="/contact">
                  Contact Support
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 md:py-24">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Frequently Asked Questions
            </h2>
          </motion.div>

          <div className="max-w-3xl mx-auto space-y-4">
            {faqItems.map((item, index) => (
              <motion.div
                key={item.question}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="bento-card"
              >
                <h3 className="font-display font-semibold mb-2">{item.question}</h3>
                <p className="text-sm text-muted-foreground">{item.answer}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-primary/10 to-background">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto text-center"
          >
            <h2 className="font-display text-3xl font-bold mb-4">
              Ready to Shop with Confidence?
            </h2>
            <p className="text-muted-foreground mb-8">
              Browse our selection of quality tires, all backed by our comprehensive warranty.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button variant="hero" size="lg" asChild>
                <Link to="/shop">
                  Shop Tires
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              {phoneDisplay && (
                <Button variant="outline" size="lg" asChild>
                  <a href={`tel:${formatPhone(phoneDisplay)}`}>
                    <Phone className="h-5 w-5" />
                    Call Us
                  </a>
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}
