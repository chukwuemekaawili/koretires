import { motion } from "framer-motion";
import { MapPin, Phone, Clock, Star, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCompanyInfo } from "@/hooks/useCompanyInfo";

const reviews = [
  { name: "Michael R.", rating: 5, text: "Great prices and quick service. My go-to tire shop in Edmonton!" },
  { name: "Sarah T.", rating: 5, text: "Professional installation, competitive pricing. Highly recommend!" },
  { name: "David K.", rating: 5, text: "Free delivery was a lifesaver. Quality tires at wholesale prices." },
];

export function LocalTrust() {
  const { companyInfo, formatPhone, getGoogleMapsUrl, getFormattedHours } = useCompanyInfo();

  return (
    <section className="py-16 md:py-24">
      <div className="container">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Map & Contact */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-6">
              Visit Us in {companyInfo.location.city}
            </h2>
            
            {/* Map placeholder */}
            <div className="aspect-video rounded-2xl overflow-hidden border border-border/50 mb-6 bg-secondary/30">
              <iframe
                src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(
                  `${companyInfo.location.address}, ${companyInfo.location.city}, ${companyInfo.location.province}`
                )}`}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Kore Tires Location"
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{companyInfo.location.address}</p>
                  <p className="text-muted-foreground">
                    {companyInfo.location.city}, {companyInfo.location.province} {companyInfo.location.postal_code}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{getFormattedHours()}</p>
                  <p className="text-muted-foreground">{getFormattedHours()}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Phone className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{companyInfo.contact.phone}</p>
                  <p className="text-muted-foreground">{companyInfo.contact.email}</p>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="hero" asChild>
                  <a href={`tel:${formatPhone(companyInfo.contact.phone)}`}>
                    <Phone className="h-4 w-4" />
                    Call Now
                  </a>
                </Button>
                <Button variant="outline" asChild>
                  <a 
                    href={getGoogleMapsUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Navigation className="h-4 w-4" />
                    Get Directions
                  </a>
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Reviews */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h3 className="font-display text-2xl font-bold mb-6">
              What Our Customers Say
            </h3>

            <div className="space-y-4">
              {reviews.map((review, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bento-card"
                >
                  <div className="flex items-center gap-1 mb-3">
                    {Array.from({ length: review.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                    ))}
                  </div>
                  <p className="text-foreground mb-3">"{review.text}"</p>
                  <p className="text-sm text-muted-foreground">— {review.name}</p>
                </motion.div>
              ))}
            </div>

            <div className="mt-6 p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-yellow-500 text-yellow-500" />
                  ))}
                </div>
                <span className="font-semibold">4.9 / 5</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Based on Google Reviews
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
