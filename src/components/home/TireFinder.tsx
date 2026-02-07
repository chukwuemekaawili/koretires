import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Car, Search, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCompanyInfo } from "@/hooks/useCompanyInfo";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Mock data - would come from API/database
const years = Array.from({ length: 30 }, (_, i) => (2026 - i).toString());
const makes = ["Acura", "Audi", "BMW", "Chevrolet", "Dodge", "Ford", "GMC", "Honda", "Hyundai", "Jeep", "Kia", "Lexus", "Mazda", "Mercedes-Benz", "Nissan", "RAM", "Subaru", "Tesla", "Toyota", "Volkswagen"];
const models: Record<string, string[]> = {
  Toyota: ["Camry", "Corolla", "RAV4", "Highlander", "Tacoma", "Tundra", "4Runner"],
  Honda: ["Civic", "Accord", "CR-V", "Pilot", "Odyssey", "HR-V"],
  Ford: ["F-150", "Escape", "Explorer", "Mustang", "Edge", "Bronco"],
  Chevrolet: ["Silverado", "Equinox", "Traverse", "Tahoe", "Malibu", "Colorado"],
};

export function TireFinder() {
  const [year, setYear] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const { getWhatsAppUrl } = useCompanyInfo();

  const availableModels = make && models[make] ? models[make] : [];

  const buildSearchUrl = () => {
    const params = new URLSearchParams();
    if (year) params.set("year", year);
    if (make) params.set("make", make);
    if (model) params.set("model", model);
    return `/tire-finder?${params.toString()}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bento-card"
    >
      <h3 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
        <Car className="h-5 w-5 text-primary" />
        Find by Vehicle
      </h3>

      <div className="space-y-3 mb-4">
        <Select value={year} onValueChange={setYear}>
          <SelectTrigger className="bg-secondary/50 border-border/50">
            <SelectValue placeholder="Select Year" />
          </SelectTrigger>
          <SelectContent>
            {years.map((y) => (
              <SelectItem key={y} value={y}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={make} onValueChange={(v) => { setMake(v); setModel(""); }}>
          <SelectTrigger className="bg-secondary/50 border-border/50">
            <SelectValue placeholder="Select Make" />
          </SelectTrigger>
          <SelectContent>
            {makes.map((m) => (
              <SelectItem key={m} value={m}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={model} onValueChange={setModel} disabled={!make}>
          <SelectTrigger className="bg-secondary/50 border-border/50">
            <SelectValue placeholder="Select Model" />
          </SelectTrigger>
          <SelectContent>
            {availableModels.map((m) => (
              <SelectItem key={m} value={m}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Button variant="hero" className="w-full" asChild>
          <Link to={buildSearchUrl()}>
            <Search className="h-4 w-4" />
            Find Tires
          </Link>
        </Button>
        <Button variant="outline" size="sm" className="w-full" asChild>
          <a href={getWhatsAppUrl("Hi! I need help finding tires for my vehicle")} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="h-4 w-4" />
            Ask a Specialist
          </a>
        </Button>
      </div>
    </motion.div>
  );
}
