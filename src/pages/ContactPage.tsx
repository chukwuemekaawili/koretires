import { Phone, Mail, MapPin, Clock, MessageCircle, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Layout } from "@/components/layout/Layout";
import { useCompanyInfo } from "@/hooks/useCompanyInfo";

export default function ContactPage() {
  const { companyInfo, formatPhone, getWhatsAppUrl, getGoogleMapsUrl, getFormattedHours } = useCompanyInfo();

  return (
    <Layout>
      <div className="section-gray min-h-screen">
        <div className="container py-12 md:py-20">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">Contact Us</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Need a hand? Our team is here to help with all your tire needs.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
            {/* Contact Info */}
            <div>
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 classic-card">
                  <Phone className="h-6 w-6 text-primary mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Phone</h3>
                    <a href={`tel:${formatPhone(companyInfo.contact.phone)}`} className="text-primary hover:underline text-lg">
                      {companyInfo.contact.phone}
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 classic-card">
                  <Mail className="h-6 w-6 text-primary mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Email</h3>
                    <a href={`mailto:${companyInfo.contact.email}`} className="text-primary hover:underline">
                      {companyInfo.contact.email}
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 classic-card">
                  <MapPin className="h-6 w-6 text-primary mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Location</h3>
                    <p>
                      {companyInfo.location.address}<br />
                      {companyInfo.location.city}, {companyInfo.location.province} {companyInfo.location.postal_code}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 classic-card">
                  <Clock className="h-6 w-6 text-primary mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Hours</h3>
                    <p>{getFormattedHours()}</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 mt-6">
                <Button variant="default" asChild>
                  <a href={`tel:${formatPhone(companyInfo.contact.phone)}`}>
                    <Phone className="h-4 w-4" />
                    Call Now
                  </a>
                </Button>
                <Button variant="outline" asChild>
                  <a href={getWhatsAppUrl()}>
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp
                  </a>
                </Button>
                <Button variant="outline" asChild>
                  <a href={getGoogleMapsUrl()} target="_blank" rel="noopener noreferrer">
                    <Navigation className="h-4 w-4" />
                    Directions
                  </a>
                </Button>
              </div>
            </div>

            {/* Contact Form */}
            <form className="classic-card p-6 space-y-5">
              <h2 className="text-xl font-bold">Send us a message</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Name</Label>
                  <Input className="bg-muted mt-1.5" />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input className="bg-muted mt-1.5" />
                </div>
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" className="bg-muted mt-1.5" />
              </div>
              <div>
                <Label>Message</Label>
                <Textarea rows={4} className="bg-muted mt-1.5" />
              </div>
              <Button variant="default" className="w-full">Send Message</Button>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}
