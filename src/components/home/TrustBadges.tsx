import { motion } from "framer-motion";
import { Truck, CreditCard, Shield, CheckCircle } from "lucide-react";
import { useCompanyInfo } from "@/hooks/useCompanyInfo";

export function TrustBadges() {
  const { companyInfo } = useCompanyInfo();
  const city = companyInfo.location.city;

  const trustItems = [
    {
      icon: Truck,
      title: city ? `Free ${city} Delivery` : "Free Local Delivery",
      description: "No-cost delivery within city limits",
    },
    {
      icon: CreditCard,
      title: "Pay on Delivery",
      description: "Cash or card in-person",
    },
    {
      icon: Shield,
      title: "Warranty & Returns",
      description: "30-day return policy",
    },
    {
      icon: CheckCircle,
      title: "Quality Tested",
      description: "Exceeds North American standards",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="grid grid-cols-2 lg:grid-cols-4 gap-3"
    >
      {trustItems.map((item, index) => {
        const Icon = item.icon;
        return (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + index * 0.1 }}
            className="trust-badge group"
          >
            <div className="icon-wrapper shrink-0">
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm text-foreground truncate">{item.title}</p>
              <p className="text-xs text-muted-foreground truncate">{item.description}</p>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
