import { Link, useLocation } from "react-router-dom";
import { Home, ShoppingBag, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export function MobileBottomNav() {
    const location = useLocation();
    const { user, isApprovedDealer } = useAuth();

    // Hide on admin pages
    if (location.pathname.startsWith("/admin")) {
        return null;
    }

    const navItems = [
        { icon: Home, label: "Home", path: "/" },
        { icon: ShoppingBag, label: "Shop", path: "/shop" },
        {
            icon: User,
            label: isApprovedDealer ? "Dealer" : "Account",
            path: isApprovedDealer ? "/dealers" : (user ? "/account" : "/dealers")
        },
    ];

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-secondary border-t border-border pb-safe">
            <div className="flex items-center justify-around h-16">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;

                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${isActive
                                    ? "text-primary"
                                    : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            <Icon className={`h-5 w-5 mb-1 ${item.label === "Shop" ? "h-6 w-6" : ""}`} />
                            <span className="text-xs font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
