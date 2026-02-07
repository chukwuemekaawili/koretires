import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Truck, Calendar, Clock, Phone, Mail, MapPin, 
  CheckCircle, ArrowRight, Upload, Car, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Layout } from "@/components/layout/Layout";
import { useCompanyInfo } from "@/hooks/useCompanyInfo";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const serviceTypes = [
  { id: "swap", label: "Seasonal Tire Swap", description: "Switch between summer/winter tires" },
  { id: "install", label: "New Tire Installation", description: "Mount and balance new tires" },
  { id: "repair", label: "Tire Repair", description: "Flat repair or puncture fix" },
];

const timeWindows = [
  "Morning (8AM - 12PM)",
  "Afternoon (12PM - 4PM)",
  "Evening (4PM - 7PM)",
];

const benefits = [
  { icon: Truck, title: "We Come to You", description: "No need to visit a shop" },
  { icon: Clock, title: "Save Time", description: "Service at your home or work" },
  { icon: CheckCircle, title: "Professional Service", description: "Same quality as in-shop" },
];

export default function MobileSwapPage() {
  const { companyInfo, getWhatsAppUrl } = useCompanyInfo();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "Edmonton",
    postalCode: "",
    serviceType: "swap",
    preferredDate: "",
    preferredTimeWindow: "",
    vehicleYear: "",
    vehicleMake: "",
    vehicleModel: "",
    tireSize: "",
    numTires: "4",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.phone || !formData.address || !formData.preferredDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("mobile_swap_bookings").insert({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        postal_code: formData.postalCode,
        service_type: formData.serviceType,
        preferred_date: formData.preferredDate,
        preferred_time_window: formData.preferredTimeWindow,
        vehicle_year: formData.vehicleYear,
        vehicle_make: formData.vehicleMake,
        vehicle_model: formData.vehicleModel,
        tire_size: formData.tireSize,
        num_tires: parseInt(formData.numTires),
        notes: formData.notes,
      });

      if (error) throw error;

      setIsSubmitted(true);
      toast.success("Booking request submitted! We'll contact you shortly.");
    } catch (err) {
      console.error("Mobile swap booking error:", err);
      toast.error("Failed to submit booking. Please try again or call us.");
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
              <CheckCircle className="h-12 w-12 text-green-500" />
            </div>
            <h1 className="font-display text-3xl font-bold mb-4">Booking Request Received!</h1>
            <p className="text-muted-foreground mb-8">
              We'll contact you within 24 hours to confirm your appointment and provide a quote.
            </p>
            <div className="bento-card text-left mb-8">
              <h3 className="font-semibold mb-4">What happens next?</h3>
              <ol className="space-y-3 text-sm text-muted-foreground">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium">1</span>
                  <span>We'll call or text to confirm your preferred date and time</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium">2</span>
                  <span>We'll provide a quote based on your service needs</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium">3</span>
                  <span>Our technician arrives at your location at the scheduled time</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium">4</span>
                  <span>Pay on completion - cash or card accepted</span>
                </li>
              </ol>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="hero" asChild>
                <a href={`tel:${companyInfo.contact.phone}`}>
                  <Phone className="h-4 w-4" />
                  Call Us: {companyInfo.contact.phone}
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a href={getWhatsAppUrl("Hi, I just submitted a mobile swap booking request.")}>
                  WhatsApp Us
                </a>
              </Button>
            </div>
          </motion.div>
        </div>
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
              <Truck className="h-10 w-10 text-primary" />
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-6">
              Mobile Tire Service
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              We come to you! Professional tire service at your home or workplace{companyInfo.location.city ? ` in ${companyInfo.location.city}` : ""}.
            </p>
          </motion.div>

          {/* Benefits */}
          <div className="grid sm:grid-cols-3 gap-6 max-w-3xl mx-auto mt-12">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="inline-flex p-3 rounded-xl bg-primary/10 text-primary mb-3">
                  <benefit.icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold mb-1">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Booking Form */}
      <section className="py-16">
        <div className="container max-w-3xl">
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleSubmit}
            className="bento-card space-y-8"
          >
            <div>
              <h2 className="font-display text-2xl font-bold mb-2">Book Your Mobile Service</h2>
              <p className="text-muted-foreground">Fill out the form below and we'll contact you to confirm.</p>
            </div>

            {/* Service Type */}
            <div>
              <Label className="mb-3 block">Service Type *</Label>
              <RadioGroup
                value={formData.serviceType}
                onValueChange={(v) => setFormData({ ...formData, serviceType: v })}
                className="grid sm:grid-cols-3 gap-3"
              >
                {serviceTypes.map((type) => (
                  <div
                    key={type.id}
                    className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                      formData.serviceType === type.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                    onClick={() => setFormData({ ...formData, serviceType: type.id })}
                  >
                    <RadioGroupItem value={type.id} id={type.id} className="mt-1" />
                    <div>
                      <Label htmlFor={type.id} className="font-medium cursor-pointer">{type.label}</Label>
                      <p className="text-xs text-muted-foreground mt-1">{type.description}</p>
                    </div>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Contact Info */}
            <div className="space-y-4">
              <h3 className="font-semibold">Contact Information</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1.5"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="mt-1.5"
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="mt-1.5"
                  required
                />
              </div>
            </div>

            {/* Location */}
            <div className="space-y-4">
              <h3 className="font-semibold">Service Location</h3>
              <div>
                <Label htmlFor="address">Street Address *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="mt-1.5"
                  placeholder="123 Main Street"
                  required
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="postalCode">Postal Code</Label>
                  <Input
                    id="postalCode"
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    className="mt-1.5"
                    placeholder="T5M 1Y6"
                  />
                </div>
              </div>
            </div>

            {/* Scheduling */}
            <div className="space-y-4">
              <h3 className="font-semibold">Preferred Schedule</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="preferredDate">Preferred Date *</Label>
                  <Input
                    id="preferredDate"
                    type="date"
                    value={formData.preferredDate}
                    onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
                    className="mt-1.5"
                    min={new Date().toISOString().split("T")[0]}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="preferredTimeWindow">Preferred Time</Label>
                  <Select
                    value={formData.preferredTimeWindow}
                    onValueChange={(v) => setFormData({ ...formData, preferredTimeWindow: v })}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Select time window" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeWindows.map((tw) => (
                        <SelectItem key={tw} value={tw}>{tw}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Vehicle Info */}
            <div className="space-y-4">
              <h3 className="font-semibold">Vehicle Information (Optional)</h3>
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="vehicleYear">Year</Label>
                  <Input
                    id="vehicleYear"
                    value={formData.vehicleYear}
                    onChange={(e) => setFormData({ ...formData, vehicleYear: e.target.value })}
                    className="mt-1.5"
                    placeholder="2023"
                  />
                </div>
                <div>
                  <Label htmlFor="vehicleMake">Make</Label>
                  <Input
                    id="vehicleMake"
                    value={formData.vehicleMake}
                    onChange={(e) => setFormData({ ...formData, vehicleMake: e.target.value })}
                    className="mt-1.5"
                    placeholder="Toyota"
                  />
                </div>
                <div>
                  <Label htmlFor="vehicleModel">Model</Label>
                  <Input
                    id="vehicleModel"
                    value={formData.vehicleModel}
                    onChange={(e) => setFormData({ ...formData, vehicleModel: e.target.value })}
                    className="mt-1.5"
                    placeholder="Camry"
                  />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tireSize">Tire Size</Label>
                  <Input
                    id="tireSize"
                    value={formData.tireSize}
                    onChange={(e) => setFormData({ ...formData, tireSize: e.target.value })}
                    className="mt-1.5"
                    placeholder="225/65R17"
                  />
                </div>
                <div>
                  <Label htmlFor="numTires">Number of Tires</Label>
                  <Select
                    value={formData.numTires}
                    onValueChange={(v) => setFormData({ ...formData, numTires: v })}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Tire</SelectItem>
                      <SelectItem value="2">2 Tires</SelectItem>
                      <SelectItem value="4">4 Tires</SelectItem>
                      <SelectItem value="5">5 Tires (incl. spare)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="mt-1.5"
                placeholder="Any special instructions, access codes, or details about your tires..."
                rows={3}
              />
            </div>

            {/* Submit */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button type="submit" variant="hero" size="lg" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Request Booking
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </Button>
              <Button type="button" variant="outline" size="lg" asChild>
                <a href={`tel:${companyInfo.contact.phone}`}>
                  <Phone className="h-5 w-5" />
                  Call Instead
                </a>
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              We'll contact you within 24 hours to confirm your appointment and provide a quote.
              Payment is collected on completion - cash or card accepted.
            </p>
          </motion.form>
        </div>
      </section>
    </Layout>
  );
}
