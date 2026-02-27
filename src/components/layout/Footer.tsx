import { Link, useNavigate, useLocation } from "react-router-dom";
import { Phone, Mail, MapPin, Clock, MessageCircle } from "lucide-react";
import { useState } from "react";
import { useCompanyInfo } from "@/hooks/useCompanyInfo";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import koreLogo from "@/assets/kore-logo.png";

const footerLinks = {
  quickLinks: [
    { name: "Home", href: "/" },
    { name: "Shop Tires", href: "/shop" },
    { name: "Wholesale", href: "/dealers" },
    { name: "About Us", href: "/about" },
    { name: "Contact", href: "/contact" },
  ],
  services: [
    { name: "Tire Installation", href: "/services" },
    { name: "Balancing & Rotation", href: "/services" },
    { name: "Tire Repair", href: "/services" },
    { name: "Seasonal Changeovers", href: "/services" },
  ],
  company: [
    { name: "Tire Care Tips", href: "/tire-care" },
    { name: "Warranty & Returns", href: "/warranty" },
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms of Service", href: "/terms" },
  ],
};

export function Footer() {
  const { companyInfo, formatPhone, getFormattedHours, getWhatsAppUrl } = useCompanyInfo();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [isSubscribing, setIsSubscribing] = useState(false);

  const handleHomeClick = (e: React.MouseEvent) => {
    if (location.pathname === "/") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleNewsletterSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedEmail = email.trim().toLowerCase();
    if (!cleanedEmail) return;

    setIsSubscribing(true);
    try {
      const { error } = await supabase
        .from("newsletter_subscribers")
        .insert({ email: cleanedEmail, source: "website_footer" });

      if (error) {
        // Check if already subscribed
        if (error.code === "23505") {
          toast({
            title: "Already subscribed!",
            description: "This email is already on our list.",
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: "✓ Subscribed!",
          description: "You'll receive our latest offers and tire tips.",
        });
        setEmail("");
      }
    } catch (error) {
      console.error("Newsletter signup error:", error);
      toast({
        title: "Subscription failed",
        description: "Please try again or contact us directly.",
        variant: "destructive",
      });
    } finally {
      setIsSubscribing(false);
    }
  };

  return (
    <footer className="bg-secondary text-secondary-foreground">
      <div className="container py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10">
          {/* Logo & Contact */}
          <div className="lg:col-span-2">
            <Link to="/" className="inline-block mb-5">
              <img src={koreLogo} alt="Kore Tires" className="h-14 w-auto brightness-0 invert" />
            </Link>
            <p className="text-secondary-foreground/80 mb-5 max-w-sm text-sm">
              Your trusted source for quality tires and professional installation services in Edmonton.
            </p>

            <div className="space-y-2.5 text-sm">
              <a href={`tel:${formatPhone(companyInfo.contact.phone)}`} className="flex items-center gap-2.5 text-secondary-foreground/90 hover:text-white transition-colors">
                <Phone className="h-4 w-4 text-primary" />
                {companyInfo.contact.phone}
              </a>
              {companyInfo.contact.whatsapp && (
                <a href={getWhatsAppUrl()} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 text-secondary-foreground/90 hover:text-white transition-colors">
                  <MessageCircle className="h-4 w-4 text-green-500" />
                  Chat on WhatsApp
                </a>
              )}
              <a href={`mailto:${companyInfo.contact.email}`} className="flex items-center gap-2.5 text-secondary-foreground/90 hover:text-white transition-colors">
                <Mail className="h-4 w-4 text-primary" />
                {companyInfo.contact.email}
              </a>
              <div className="flex items-start gap-2.5 text-secondary-foreground/70">
                <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <span>{companyInfo.location.address}, {companyInfo.location.city}</span>
              </div>
              <div className="flex items-center gap-2.5 text-secondary-foreground/70">
                <Clock className="h-4 w-4 text-primary" />
                {getFormattedHours()}
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-white mb-4 text-sm uppercase tracking-wide">Quick Links</h3>
            <ul className="space-y-2">
              {footerLinks.quickLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    onClick={link.href === "/" ? handleHomeClick : undefined}
                    className="text-sm text-secondary-foreground/70 hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-semibold text-white mb-4 text-sm uppercase tracking-wide">Services</h3>
            <ul className="space-y-2">
              {footerLinks.services.map((link) => (
                <li key={link.name}>
                  <Link to={link.href} className="text-sm text-secondary-foreground/70 hover:text-white transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold text-white mb-4 text-sm uppercase tracking-wide">Company</h3>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link to={link.href} className="text-sm text-secondary-foreground/70 hover:text-white transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Newsletter Signup */}
        <div className="mt-12 pb-8">
          <div className="max-w-2xl mx-auto text-center">
            <h3 className="font-semibold text-white mb-2 text-lg">Stay Updated</h3>
            <p className="text-secondary-foreground/70 text-sm mb-4">
              Get seasonal tire tips, exclusive offers, and reminders delivered to your inbox.
            </p>
            <form onSubmit={handleNewsletterSignup} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
              <Button
                type="submit"
                variant="default"
                disabled={isSubscribing}
                className="whitespace-nowrap"
              >
                {isSubscribing ? "Subscribing..." : "Subscribe"}
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="container py-5 pb-24 md:pb-5 flex flex-col md:flex-row items-center justify-between gap-3 text-sm text-secondary-foreground/60">
          <p>© {new Date().getFullYear()} Kore Tires Sales and Services. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-success"></span>
              Free Edmonton Delivery
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
