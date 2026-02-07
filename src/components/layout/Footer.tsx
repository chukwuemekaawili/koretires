import { Link, useNavigate, useLocation } from "react-router-dom";
import { Phone, Mail, MapPin, Clock } from "lucide-react";
import { useCompanyInfo } from "@/hooks/useCompanyInfo";
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
  const { companyInfo, formatPhone, getFormattedHours } = useCompanyInfo();
  const navigate = useNavigate();
  const location = useLocation();

  const handleHomeClick = (e: React.MouseEvent) => {
    if (location.pathname === "/") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
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
