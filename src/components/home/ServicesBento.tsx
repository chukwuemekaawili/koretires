import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Wrench, RefreshCw, Settings, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import serviceInstallation from "@/assets/service-installation.jpg";
import serviceRotation from "@/assets/service-rotation.jpg";
import serviceRepair from "@/assets/service-repair.jpg";

const services = [
  {
    icon: Wrench,
    title: "Installation & Changeover",
    description: "Expert tire and wheel installation with seasonal changeover services.",
    image: serviceInstallation,
  },
  {
    icon: RefreshCw,
    title: "Tire Rotation",
    description: "Extend tire life with professional rotation services.",
    image: serviceRotation,
  },
  {
    icon: Settings,
    title: "Tire Repair",
    description: "Fast, reliable repair services to get you back on the road.",
    image: serviceRepair,
  },
];

export function ServicesBento() {
  return (
    <section className="py-16 md:py-24">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            Expert Tire Services
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Professional installation and maintenance services by experienced technicians.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group relative rounded-2xl overflow-hidden border border-border/40 bg-card"
              >
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={service.image}
                    alt={service.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-primary/20 backdrop-blur-sm">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-display font-semibold text-lg">{service.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">{service.description}</p>
                  <Button variant="outline" size="sm" className="group/btn" asChild>
                    <Link to="/services">
                      Learn More
                      <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                    </Link>
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-8"
        >
          <Button variant="hero" size="lg" asChild>
            <Link to="/services">
              View All Services
              <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
