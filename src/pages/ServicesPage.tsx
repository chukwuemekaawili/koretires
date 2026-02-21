import { useState } from "react";
import {
  Phone, MessageCircle, Calendar, Clock, MapPin, Check, ArrowRight, Loader2, CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Layout } from "@/components/layout/Layout";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyInfo } from "@/hooks/useCompanyInfo";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import serviceInstallation from "@/assets/service-tire-installation.jpg";
import serviceBalancing from "@/assets/service-balancing-rotation.jpg";
import serviceRepair from "@/assets/service-tire-repair.jpg";
import serviceSeasonal from "@/assets/service-seasonal-changeovers.jpg";

const services = [
  {
    id: "installation",
    title: "Tire Installation",
    image: serviceInstallation,
    description: "Expert tire and wheel installation with seasonal changeover services.",
    features: [
      "Professional mounting and balancing",
      "Torque to manufacturer specifications",
      "Valve stem inspection and replacement",
      "Free tire pressure check",
    ],
  },
  {
    id: "rotation",
    title: "Balancing & Rotation",
    image: serviceBalancing,
    description: "Keeping your tires in top shape starts with regular rotations.",
    features: [
      "Even wear distribution",
      "Extended tire lifespan",
      "Improved fuel efficiency",
      "Visual tire inspection included",
    ],
  },
  {
    id: "repair",
    title: "Tire Repair",
    image: serviceRepair,
    description: "Fast, reliable tire repair services to get you back on the road.",
    features: [
      "Puncture repair",
      "Damage assessment",
      "Safety inspection",
      "Quick turnaround",
    ],
  },
  {
    id: "seasonal",
    title: "Seasonal Changeovers",
    image: serviceSeasonal,
    description: "Quick and efficient seasonal tire swaps for your vehicle.",
    features: [
      "Summer to winter swaps",
      "Winter to summer swaps",
      "Tire storage available",
      "Condition assessment",
    ],
  },
];

const timeSlots = [
  "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
  "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM",
];

export default function ServicesPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { companyInfo, formatPhone, getWhatsAppUrl, getFormattedHours, getFullAddress } = useCompanyInfo();
  const { settings } = useSiteSettings();
  const showTimeSlots = settings.services.booking_mode === "date_time" && settings.services.time_slots_enabled;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "", phone: "", email: "", service: "",
    date: "", time: "", vehicle: "", notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.phone || !formData.service || !formData.date) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("service_bookings").insert({
        user_id: user?.id || null,
        name: formData.name,
        email: formData.email || null,
        phone: formData.phone,
        service_type: formData.service,
        vehicle_info: formData.vehicle || null,
        preferred_date: formData.date,
        preferred_time: formData.time || null,
        notes: formData.notes || null,
      });

      if (error) throw error;

      setIsSubmitted(true);
      toast({
        title: "Booking Request Submitted!",
        description: "We'll contact you to confirm your appointment.",
      });
    } catch (error: any) {
      console.error("Booking error:", error);
      toast({
        title: "Booking Failed",
        description: error.message || "There was an error. Please try again or call us.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const phoneDisplay = companyInfo.contact.phone || null;
  const whatsappUrl = getWhatsAppUrl();
  const addressDisplay = getFullAddress() || null;
  const hoursDisplay = getFormattedHours() || null;

  return (
    <Layout>
      {/* Hero */}
      <section className="py-16 md:py-20 section-white border-b border-border">
        <div className="container">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Our Services
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Professional Tire Care You Can Trust
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button variant="default" size="lg" asChild>
                <a href="#booking">
                  <Calendar className="h-5 w-5" />
                  Book Service
                </a>
              </Button>
              {phoneDisplay && (
                <Button variant="outline" size="lg" asChild>
                  <a href={`tel:${formatPhone(phoneDisplay)}`}>
                    <Phone className="h-5 w-5" />
                    Call Now
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-16 md:py-20 section-gray">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-6">
            {services.map((service) => (
              <div key={service.id} className="classic-card overflow-hidden">
                <div className="aspect-video overflow-hidden">
                  <img
                    src={service.image}
                    alt={service.title}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2">{service.title}</h3>
                  <p className="text-muted-foreground mb-4">{service.description}</p>
                  <ul className="space-y-2 mb-6">
                    {service.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <div className="w-5 h-5 rounded-full bg-success flex items-center justify-center shrink-0">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button variant="default" asChild>
                    <a href="#booking">Book This Service</a>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Booking Form */}
      <section id="booking" className="py-16 md:py-20 section-white">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-4">
                Book Your Service
              </h2>
              <p className="text-muted-foreground mb-8">
                Request an appointment and our team will confirm your booking.
                For immediate assistance, call or WhatsApp us directly.
              </p>

              <div className="space-y-4">
                {phoneDisplay && (
                  <div className="flex items-start gap-4 p-4 classic-card">
                    <Phone className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <h3 className="font-medium">Call Us</h3>
                      <a href={`tel:${formatPhone(phoneDisplay)}`} className="text-primary hover:underline">
                        {phoneDisplay}
                      </a>
                    </div>
                  </div>
                )}

                {whatsappUrl && (
                  <div className="flex items-start gap-4 p-4 classic-card">
                    <MessageCircle className="h-5 w-5 text-success mt-0.5" />
                    <div>
                      <h3 className="font-medium">WhatsApp</h3>
                      <a href={whatsappUrl} className="text-success hover:underline">
                        Send a message
                      </a>
                    </div>
                  </div>
                )}

                {addressDisplay && (
                  <div className="flex items-start gap-4 p-4 classic-card">
                    <MapPin className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <h3 className="font-medium">Location</h3>
                      <p className="text-muted-foreground">{addressDisplay}</p>
                    </div>
                  </div>
                )}

                {hoursDisplay && (
                  <div className="flex items-start gap-4 p-4 classic-card">
                    <Clock className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <h3 className="font-medium">Hours</h3>
                      <p className="text-muted-foreground">{hoursDisplay}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              {isSubmitted ? (
                <div className="classic-card text-center p-12">
                  <div className="inline-flex p-4 rounded-full bg-success/10 mb-6">
                    <CheckCircle2 className="h-12 w-12 text-success" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">Booking Request Received!</h3>
                  <p className="text-muted-foreground mb-6">
                    Our team will contact you shortly to confirm your appointment.
                  </p>
                  <Button variant="outline" onClick={() => setIsSubmitted(false)}>
                    Book Another Service
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="classic-card p-6 space-y-5">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="bg-muted mt-1.5"
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
                      className="bg-muted mt-1.5"
                    />
                  </div>

                  <div>
                    <Label htmlFor="service">Service Needed *</Label>
                    <Select
                      value={formData.service}
                      onValueChange={(v) => setFormData({ ...formData, service: v })}
                    >
                      <SelectTrigger className="bg-muted mt-1.5">
                        <SelectValue placeholder="Select a service" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="installation">Tire Installation</SelectItem>
                        <SelectItem value="changeover">Seasonal Changeover</SelectItem>
                        <SelectItem value="rotation">Tire Rotation</SelectItem>
                        <SelectItem value="repair">Tire Repair</SelectItem>
                        <SelectItem value="balancing">Wheel Balancing</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className={showTimeSlots ? "grid sm:grid-cols-2 gap-4" : ""}>
                    <div>
                      <Label htmlFor="date">Preferred Date *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal mt-1.5",
                              !formData.date && "text-muted-foreground"
                            )}
                          >
                            <Calendar className="mr-2 h-4 w-4" />
                            {formData.date ? format(new Date(formData.date + 'T12:00:00'), "PPP") : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={formData.date ? new Date(formData.date + 'T12:00:00') : undefined}
                            onSelect={(date) => {
                              if (date) {
                                // Format as YYYY-MM-DD
                                setFormData({ ...formData, date: format(date, 'yyyy-MM-dd') });
                              }
                            }}
                            disabled={(date) => {
                              // Disable past dates and Sundays
                              return date < new Date(new Date().setHours(0, 0, 0, 0)) || date.getDay() === 0;
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    {showTimeSlots && (
                      <div>
                        <Label htmlFor="time">Preferred Time</Label>
                        <Select
                          value={formData.time}
                          onValueChange={(v) => setFormData({ ...formData, time: v })}
                        >
                          <SelectTrigger className="bg-muted mt-1.5">
                            <SelectValue placeholder="Select time" />
                          </SelectTrigger>
                          <SelectContent>
                            {timeSlots.map((time) => (
                              <SelectItem key={time} value={time}>{time}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="vehicle">Vehicle Info</Label>
                    <Input
                      id="vehicle"
                      placeholder="e.g., 2020 Honda CR-V"
                      value={formData.vehicle}
                      onChange={(e) => setFormData({ ...formData, vehicle: e.target.value })}
                      className="bg-muted mt-1.5"
                    />
                  </div>

                  <div>
                    <Label htmlFor="notes">Additional Notes</Label>
                    <Textarea
                      id="notes"
                      rows={3}
                      placeholder="Any additional details..."
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="bg-muted mt-1.5"
                    />
                  </div>

                  <Button variant="default" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Calendar className="h-4 w-4" />
                        Request Appointment
                      </>
                    )}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
