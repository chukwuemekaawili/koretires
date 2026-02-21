import { useState } from "react";
import { Phone, Mail, MapPin, Clock, MessageCircle, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Layout } from "@/components/layout/Layout";
import { useCompanyInfo } from "@/hooks/useCompanyInfo";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function ContactPage() {
  const { companyInfo, formatPhone, getWhatsAppUrl, getGoogleMapsUrl, getFormattedHours } = useCompanyInfo();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    message: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("ai_leads").insert({
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        notes: formData.message,
        lead_type: "general_inquiry",
        source_channel: "website_contact_form",
        status: "new"
      });

      if (error) throw error;

      // Notify admin of new contact inquiry
      supabase.functions.invoke("send-notification", {
        body: {
          type: "contact_inquiry",
          recipientEmail: formData.email,
          recipientName: formData.name,
          data: {
            phone: formData.phone,
            message: formData.message,
          },
        },
      }).catch((e) => console.error("Notify error:", e));

      toast({
        title: "Message Sent!",
        description: "We'll get back to you as soon as possible.",
      });

      setFormData({ name: "", phone: "", email: "", message: "" });
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again or call us directly.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
                <Button variant="outline" asChild className="border-green-600 text-green-700 hover:text-green-800 hover:bg-green-50">
                  <a href={getWhatsAppUrl("Hi Kore Tires, I have a question about...")} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Chat on WhatsApp
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
            <form onSubmit={handleSubmit} className="classic-card p-6 space-y-5">
              <h2 className="text-xl font-bold">Send us a message</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="bg-muted mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="bg-muted mt-1.5"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="bg-muted mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  required
                  rows={4}
                  className="bg-muted mt-1.5"
                />
              </div>
              <Button type="submit" variant="default" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Sending..." : "Send Message"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}
