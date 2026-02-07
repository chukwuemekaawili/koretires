import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Truck, Users, Wrench, Clock, Shield, DollarSign, 
  Phone, Mail, CheckCircle2, Building2, Car
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Layout } from "@/components/layout/Layout";
import { useToast } from "@/hooks/use-toast";
import { useCompanyInfo } from "@/hooks/useCompanyInfo";
import { supabase } from "@/integrations/supabase/client";

const benefits = [
  {
    icon: DollarSign,
    title: "Volume Pricing",
    description: "Competitive fleet rates that scale with your business needs.",
  },
  {
    icon: Clock,
    title: "Priority Service",
    description: "Dedicated scheduling to minimize vehicle downtime.",
  },
  {
    icon: Wrench,
    title: "Mobile Service",
    description: "On-site tire service available for your fleet location.",
  },
  {
    icon: Shield,
    title: "Fleet Tracking",
    description: "Track tire health and replacement schedules for all vehicles.",
  },
  {
    icon: Users,
    title: "Dedicated Account Manager",
    description: "Personal support for all your fleet tire needs.",
  },
  {
    icon: Truck,
    title: "Emergency Support",
    description: "24/7 roadside assistance for fleet emergencies.",
  },
];

const vehicleTypeOptions = [
  "Light Trucks",
  "Commercial Vans",
  "Delivery Vehicles",
  "Service Trucks",
  "Heavy Equipment",
  "Passenger Vehicles",
];

const fleetSizeOptions = [
  "5-10 vehicles",
  "11-25 vehicles",
  "26-50 vehicles",
  "51-100 vehicles",
  "100+ vehicles",
];

export default function FleetPage() {
  const { toast } = useToast();
  const { companyInfo, formatPhone } = useCompanyInfo();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    companyName: "",
    contactName: "",
    email: "",
    phone: "",
    fleetSize: "",
    vehicleTypes: [] as string[],
    currentSupplier: "",
    notes: "",
  });

  const handleVehicleTypeChange = (type: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      vehicleTypes: checked
        ? [...prev.vehicleTypes, type]
        : prev.vehicleTypes.filter(t => t !== type),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.companyName || !formData.contactName || !formData.email || !formData.phone || !formData.fleetSize) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("fleet_inquiries").insert({
        company_name: formData.companyName,
        contact_name: formData.contactName,
        email: formData.email,
        phone: formData.phone,
        fleet_size: formData.fleetSize,
        vehicle_types: formData.vehicleTypes,
        current_supplier: formData.currentSupplier || null,
        notes: formData.notes || null,
      });

      if (error) throw error;

      setIsSubmitted(true);
      toast({
        title: "Inquiry Submitted!",
        description: "We'll contact you within 24 hours to discuss your fleet needs.",
      });
    } catch (error) {
      console.error("Error submitting fleet inquiry:", error);
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your inquiry. Please try again or call us directly.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <Layout>
        <div className="container py-16 md:py-24">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-lg mx-auto text-center"
          >
            <div className="inline-flex p-4 rounded-full bg-green-500/10 mb-6">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
            </div>
            <h1 className="font-display text-3xl font-bold mb-4">Thank You!</h1>
            <p className="text-muted-foreground mb-6">
              Your fleet inquiry has been submitted. Our fleet specialist will contact you 
              within 24 hours to discuss your tire needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {companyInfo.contact.phone && (
                <Button variant="hero" asChild>
                  <a href={`tel:${formatPhone(companyInfo.contact.phone)}`}>
                    <Phone className="h-5 w-5" />
                    Call Now: {companyInfo.contact.phone}
                  </a>
                </Button>
              )}
              {companyInfo.contact.email && (
                <Button variant="outline" asChild>
                  <a href={`mailto:${companyInfo.contact.email}`}>
                    <Mail className="h-5 w-5" />
                    {companyInfo.contact.email}
                  </a>
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 gradient-dark" />
        <div className="container relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
              <Truck className="h-4 w-4" />
              <span className="text-sm font-medium">Fleet Program</span>
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-6">
              Keep Your Fleet{" "}
              <span className="text-gradient">Rolling</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Tailored tire solutions for businesses of all sizes. From delivery vans to 
              heavy equipment, we keep your fleet on the road with priority service and 
              competitive pricing.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Benefits Grid */}
      <section className="py-16 md:py-24">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Fleet Program Benefits
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Everything your business needs to keep vehicles running safely and efficiently.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bento-card"
                >
                  <div className="p-3 rounded-xl bg-primary/10 w-fit mb-4">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-display font-semibold text-lg mb-2">{benefit.title}</h3>
                  <p className="text-muted-foreground text-sm">{benefit.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Inquiry Form */}
      <section className="py-16 md:py-24 bg-secondary/30">
        <div className="container">
          <div className="max-w-2xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-8"
            >
              <h2 className="font-display text-3xl font-bold mb-4">
                Request Fleet Pricing
              </h2>
              <p className="text-muted-foreground">
                Tell us about your fleet and we'll create a customized tire program for your business.
              </p>
            </motion.div>

            <motion.form
              onSubmit={handleSubmit}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bento-card space-y-6"
            >
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="companyName">Company Name *</Label>
                  <Input
                    id="companyName"
                    required
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="bg-secondary/50 mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="contactName">Contact Name *</Label>
                  <Input
                    id="contactName"
                    required
                    value={formData.contactName}
                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                    className="bg-secondary/50 mt-1.5"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="bg-secondary/50 mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="bg-secondary/50 mt-1.5"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="fleetSize">Fleet Size *</Label>
                <select
                  id="fleetSize"
                  required
                  value={formData.fleetSize}
                  onChange={(e) => setFormData({ ...formData, fleetSize: e.target.value })}
                  className="w-full mt-1.5 px-3 py-2 rounded-lg border border-border bg-secondary/50 text-foreground"
                >
                  <option value="">Select fleet size</option>
                  {fleetSizeOptions.map((size) => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </div>

              <div>
                <Label className="mb-3 block">Vehicle Types</Label>
                <div className="grid sm:grid-cols-2 gap-3">
                  {vehicleTypeOptions.map((type) => (
                    <div key={type} className="flex items-center gap-2">
                      <Checkbox
                        id={type}
                        checked={formData.vehicleTypes.includes(type)}
                        onCheckedChange={(checked) => handleVehicleTypeChange(type, !!checked)}
                      />
                      <label htmlFor={type} className="text-sm cursor-pointer">{type}</label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="currentSupplier">Current Tire Supplier (Optional)</Label>
                <Input
                  id="currentSupplier"
                  value={formData.currentSupplier}
                  onChange={(e) => setFormData({ ...formData, currentSupplier: e.target.value })}
                  className="bg-secondary/50 mt-1.5"
                  placeholder="Who do you currently use for tires?"
                />
              </div>

              <div>
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="bg-secondary/50 mt-1.5"
                  placeholder="Tell us about your specific needs, challenges, or questions..."
                  rows={4}
                />
              </div>

              <Button variant="hero" size="lg" className="w-full" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit Fleet Inquiry"}
              </Button>
            </motion.form>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-12 md:py-16">
        <div className="container">
          <div className="bento-card max-w-3xl mx-auto text-center">
            <h2 className="font-display text-2xl font-bold mb-4">
              Prefer to Talk?
            </h2>
            <p className="text-muted-foreground mb-6">
              Our fleet specialist is ready to discuss your tire needs and create a 
              customized program for your business.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {companyInfo.contact.phone && (
                <Button variant="hero" size="lg" asChild>
                  <a href={`tel:${formatPhone(companyInfo.contact.phone)}`}>
                    <Phone className="h-5 w-5" />
                    Call {companyInfo.contact.phone}
                  </a>
                </Button>
              )}
              {companyInfo.contact.email && (
                <Button variant="outline" size="lg" asChild>
                  <a href={`mailto:${companyInfo.contact.email}`}>
                    <Mail className="h-5 w-5" />
                    {companyInfo.contact.email}
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
