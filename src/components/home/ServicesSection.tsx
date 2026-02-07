import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import serviceInstallation from "@/assets/service-tire-installation.jpg";
import serviceBalancing from "@/assets/service-balancing-rotation.jpg";
import serviceRepair from "@/assets/service-tire-repair.jpg";
import serviceSeasonal from "@/assets/service-seasonal-changeovers.jpg";

const services = [
  {
    title: "Tire Installation",
    image: serviceInstallation,
  },
  {
    title: "Balancing & Rotation",
    image: serviceBalancing,
  },
  {
    title: "Tire Repair",
    image: serviceRepair,
  },
  {
    title: "Seasonal Changeovers",
    image: serviceSeasonal,
  },
];

export function ServicesSection() {
  return (
    <section className="py-16 md:py-20 section-gray">
      <div className="container">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">
            Our Services
          </h2>
          <p className="text-muted-foreground">
            Professional Tire Care You Can Trust
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {services.map((service) => (
            <div
              key={service.title}
              className="classic-card tile-hover overflow-hidden"
            >
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src={service.image}
                  alt={service.title}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4 text-center">
                <h3 className="font-semibold text-sm md:text-base">
                  {service.title}
                </h3>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <Button variant="default" size="lg" asChild>
            <Link to="/services">
              Book a Service Appointment
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
