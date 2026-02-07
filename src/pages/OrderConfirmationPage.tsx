import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle, Phone, Mail, ArrowRight, Home, Package, Clock, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/layout/Layout";
import { useCompanyInfo } from "@/hooks/useCompanyInfo";

export default function OrderConfirmationPage() {
  const location = useLocation();
  const orderNumber = location.state?.orderNumber;
  const { companyInfo, formatPhone, getFormattedHours } = useCompanyInfo();

  return (
    <Layout>
      <div className="container py-16 md:py-24">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-lg mx-auto text-center"
        >
          <div className="inline-flex p-4 rounded-full bg-green-500/20 mb-6">
            <CheckCircle className="h-12 w-12 text-green-500" />
          </div>
          
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-4">
            Order Placed Successfully!
          </h1>
          
          {orderNumber && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-mono text-lg mb-4">
              <Package className="h-5 w-5" />
              {orderNumber}
            </div>
          )}
          
          <p className="text-lg text-muted-foreground mb-8">
            Thank you for your order. Our team will contact you shortly to confirm details and arrange delivery or pickup.
          </p>

          <div className="bento-card text-left mb-8">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              What happens next?
            </h2>
            <ol className="space-y-4 text-sm">
              <li className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 text-xs font-bold">1</span>
                <div>
                  <p className="font-medium">Order Review</p>
                  <p className="text-muted-foreground">Our team reviews your order and checks availability (usually within 1-2 hours during business hours).</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 text-xs font-bold">2</span>
                <div>
                  <p className="font-medium">Confirmation Call</p>
                  <p className="text-muted-foreground">We'll contact you via your preferred method to confirm pricing, availability, and schedule.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 text-xs font-bold">3</span>
                <div>
                  <p className="font-medium">Delivery / Pickup</p>
                  <p className="text-muted-foreground">Receive your tires and pay in-person on delivery. Cash, debit, or credit accepted.</p>
                </div>
              </li>
            </ol>
          </div>

          {/* Store location */}
          <div className="bento-card text-left mb-8">
            <h2 className="font-semibold mb-3 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Pickup Location
            </h2>
            <p className="text-sm text-muted-foreground mb-2">
              Kore Tires {companyInfo.location.city}
            </p>
            <p className="text-sm">
              {companyInfo.location.address}<br />
              {companyInfo.location.city}, {companyInfo.location.province} {companyInfo.location.postal_code}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {getFormattedHours()}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
            <Button variant="hero" size="lg" asChild>
              <Link to="/">
                <Home className="h-5 w-5" />
                Back to Home
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/shop">
                Continue Shopping
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
          </div>

          <div className="text-sm text-muted-foreground">
            <p className="mb-2">Questions about your order?</p>
            <div className="flex flex-wrap justify-center gap-4">
              {companyInfo.contact.phone && (
                <a href={`tel:${formatPhone(companyInfo.contact.phone)}`} className="flex items-center gap-2 text-primary hover:underline">
                  <Phone className="h-4 w-4" />
                  {companyInfo.contact.phone}
                </a>
              )}
              {companyInfo.contact.email && (
                <a href={`mailto:${companyInfo.contact.email}`} className="flex items-center gap-2 text-primary hover:underline">
                  <Mail className="h-4 w-4" />
                  {companyInfo.contact.email}
                </a>
              )}
              {!companyInfo.contact.phone && !companyInfo.contact.email && (
                <Link to="/contact" className="text-primary hover:underline">
                  Visit our Contact page
                </Link>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
