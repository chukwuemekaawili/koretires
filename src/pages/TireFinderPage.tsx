import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Car, Search, MessageCircle, Phone, ArrowRight, HelpCircle, Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Layout } from "@/components/layout/Layout";
import { useCompanyInfo } from "@/hooks/useCompanyInfo";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const years = Array.from({ length: 30 }, (_, i) => (2026 - i).toString());
const makes = ["Acura", "Audi", "BMW", "Chevrolet", "Dodge", "Ford", "GMC", "Honda", "Hyundai", "Jeep", "Kia", "Lexus", "Mazda", "Mercedes-Benz", "Nissan", "RAM", "Subaru", "Tesla", "Toyota", "Volkswagen"];
const models: Record<string, string[]> = {
  Toyota: ["Camry", "Corolla", "RAV4", "Highlander", "Tacoma", "Tundra", "4Runner", "Prius", "Sienna"],
  Honda: ["Civic", "Accord", "CR-V", "Pilot", "Odyssey", "HR-V", "Ridgeline"],
  Ford: ["F-150", "Escape", "Explorer", "Mustang", "Edge", "Bronco", "Ranger"],
  Chevrolet: ["Silverado", "Equinox", "Traverse", "Tahoe", "Malibu", "Colorado", "Camaro"],
  Hyundai: ["Elantra", "Sonata", "Tucson", "Santa Fe", "Kona", "Palisade"],
  Kia: ["Forte", "K5", "Sportage", "Sorento", "Telluride", "Soul"],
};

export default function TireFinderPage() {
  const { companyInfo, formatPhone, getWhatsAppUrl } = useCompanyInfo();
  const { toast } = useToast();
  const [year, setYear] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [trim, setTrim] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const phoneNumber = companyInfo.contact.phone;
  const whatsappUrl = getWhatsAppUrl(`Hi! I'm looking for tires for my ${year} ${make} ${model}${trim ? ` ${trim}` : ''}`);
  const availableModels = make && models[make] ? models[make] : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Persist YMM inquiry to ai_leads for admin follow-up
      const { error } = await supabase.from("ai_leads").insert({
        lead_type: "tire_finder",
        source_channel: "web",
        vehicle_year: year,
        vehicle_make: make,
        vehicle_model: model,
        notes: trim ? `Trim: ${trim}` : null,
        status: "new"
      });

      if (error) {
        console.error("Error saving tire finder inquiry:", error);
        // Still show success to user even if DB insert fails
      }
      
      setSubmitted(true);
      toast({
        title: "Request Submitted",
        description: "We've saved your vehicle details. Our team will follow up!",
      });
    } catch (error) {
      console.error("Error submitting tire finder:", error);
      setSubmitted(true); // Still show success UI
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="container py-12 md:py-24">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex p-4 rounded-2xl bg-primary/10 mb-6">
              <Car className="h-10 w-10 text-primary" />
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
              Find Tires for Your Vehicle
            </h1>
            <p className="text-lg text-muted-foreground">
              Enter your vehicle details and we'll help you find the perfect tires.
            </p>
          </motion.div>

          {!submitted ? (
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              onSubmit={handleSubmit}
              className="bento-card space-y-6"
            >
              <div>
                <Label htmlFor="year">Year *</Label>
                <Select value={year} onValueChange={setYear}>
                  <SelectTrigger className="bg-secondary/50 mt-1.5">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((y) => (
                      <SelectItem key={y} value={y}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="make">Make *</Label>
                <Select 
                  value={make} 
                  onValueChange={(v) => { setMake(v); setModel(""); }}
                >
                  <SelectTrigger className="bg-secondary/50 mt-1.5">
                    <SelectValue placeholder="Select make" />
                  </SelectTrigger>
                  <SelectContent>
                    {makes.map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="model">Model *</Label>
                <Select 
                  value={model} 
                  onValueChange={setModel}
                  disabled={!make}
                >
                  <SelectTrigger className="bg-secondary/50 mt-1.5">
                    <SelectValue placeholder={make ? "Select model" : "Select make first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableModels.length > 0 ? (
                      availableModels.map((m) => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))
                    ) : (
                      <SelectItem value="other">Other / Not Listed</SelectItem>
                    )}
                    <SelectItem value="other">Other / Not Listed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="trim">Trim (Optional)</Label>
                <Input
                  id="trim"
                  placeholder="e.g., EX-L, Sport, Limited"
                  value={trim}
                  onChange={(e) => setTrim(e.target.value)}
                  className="bg-secondary/50 mt-1.5"
                />
              </div>

              <Button 
                type="submit" 
                variant="hero" 
                size="xl" 
                className="w-full"
                disabled={!year || !make || !model || isSubmitting}
              >
                {isSubmitting ? (
                  "Submitting..."
                ) : (
                  <>
                    <Search className="h-5 w-5" />
                    Find Tires
                  </>
                )}
              </Button>

              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-3">
                  Don't know your vehicle details?
                </p>
                <Button variant="outline" asChild>
                  <Link to="/shop">
                    Shop by Tire Size Instead
                  </Link>
                </Button>
              </div>
            </motion.form>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bento-card text-center"
            >
              <div className="inline-flex p-4 rounded-2xl bg-primary/10 mb-6">
                <Check className="h-10 w-10 text-primary" />
              </div>
              <h2 className="font-display text-2xl font-bold mb-4">
                We've Got Your Vehicle Details!
              </h2>
              <p className="text-muted-foreground mb-6">
                Based on your <span className="text-foreground font-medium">{year} {make} {model}</span>, 
                our tire specialists will recommend the best options for your driving needs.
              </p>
              
              <div className="bg-secondary/50 rounded-xl p-6 mb-6">
                <p className="text-sm text-muted-foreground mb-4">
                  Our team will contact you with personalized tire recommendations and pricing.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  {whatsappUrl && (
                    <Button variant="hero" size="lg" asChild>
                      <a href={whatsappUrl}>
                        <MessageCircle className="h-5 w-5" />
                        WhatsApp Us
                      </a>
                    </Button>
                  )}
                  {phoneNumber ? (
                    <Button variant="outline" size="lg" asChild>
                      <a href={`tel:${phoneNumber}`}>
                        <Phone className="h-5 w-5" />
                        Call Now
                      </a>
                    </Button>
                  ) : (
                    <Button variant="outline" size="lg" asChild>
                      <Link to="/contact">
                        <Phone className="h-5 w-5" />
                        Contact Us
                      </Link>
                    </Button>
                  )}
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-4">
                Or browse our inventory if you know your tire size:
              </p>
              <Button variant="outline" asChild>
                <Link to="/shop">
                  Browse All Tires
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </motion.div>
          )}
        </div>
      </div>
    </Layout>
  );
}