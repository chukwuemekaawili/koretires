import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, ShoppingBag, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { AnimatePresence, motion } from "framer-motion";

export function MobileBottomBar() {
  const location = useLocation();
  const { user, isApprovedDealer } = useAuth();
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

  // Dynamic nav items per PRD: Home, Shop, Account/Dealer
  const navItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "Shop", href: "/shop", icon: ShoppingBag, isPrimary: true },
    {
      name: isApprovedDealer ? "Dealer" : "Account",
      href: isApprovedDealer ? "/dealers" : (user ? "/account" : "/dealers"),
      icon: User
    },
  ];

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
          <div className="flex items-center justify-around h-16">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${isActive ? "text-primary" : "text-muted-foreground"
                    }`}
                >
                  <Icon className={`h-5 w-5 mb-1 ${item.isPrimary ? "h-6 w-6" : ""}`} />
                  <span className="text-xs font-medium">{item.name}</span>
                </Link>
              );
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
