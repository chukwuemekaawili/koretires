import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, ShoppingBag, Wrench, Phone, MapPin } from "lucide-react";
import { useCompanyInfo } from "@/hooks/useCompanyInfo";
import { AnimatePresence, motion } from "framer-motion";

const navItems = [
  { name: "Home", href: "/", icon: Home },
  { name: "Shop", href: "/shop", icon: ShoppingBag },
  { name: "Services", href: "/services", icon: Wrench },
];

export function MobileBottomBar() {
  const location = useLocation();
  const { companyInfo, formatPhone, getGoogleMapsUrl } = useCompanyInfo();
  const [isHidden, setIsHidden] = useState(false);

  useEffect(() => {
    const handleChatToggle = (e: CustomEvent<{ isOpen: boolean }>) => {
      setIsHidden(e.detail.isOpen);
    };
    
    window.addEventListener('ai-chat-toggle', handleChatToggle as EventListener);
    return () => {
      window.removeEventListener('ai-chat-toggle', handleChatToggle as EventListener);
    };
  }, []);

  return (
    <AnimatePresence>
      {!isHidden && (
        <motion.div
          initial={{ y: 0 }}
          animate={{ y: 0 }}
          exit={{ y: 100 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background border-t border-border"
        >
          <div className="flex items-center justify-around h-14">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 transition-colors ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-[10px] font-medium">{item.name}</span>
                </Link>
              );
            })}
            
            <a
              href={`tel:${formatPhone(companyInfo.contact.phone)}`}
              className="flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 text-primary"
            >
              <Phone className="h-5 w-5" />
              <span className="text-[10px] font-medium">Call</span>
            </a>

            <a
              href={getGoogleMapsUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 text-muted-foreground"
            >
              <MapPin className="h-5 w-5" />
              <span className="text-[10px] font-medium">Directions</span>
            </a>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
