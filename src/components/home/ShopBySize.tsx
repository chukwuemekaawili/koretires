import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const widthOptions = ["185", "195", "205", "215", "225", "235", "245", "255", "265", "275", "285"];
const aspectOptions = ["35", "40", "45", "50", "55", "60", "65", "70", "75"];
const rimOptions = ["15", "16", "17", "18", "19", "20", "22"];

const tireTypes = [
  { id: "all-season", label: "All Season" },
  { id: "winter", label: "Winter" },
  { id: "all-weather", label: "All Weather" },
  { id: "terrain", label: "Terrain" },
  { id: "summer", label: "Summer" },
];

export function ShopBySize() {
  const [width, setWidth] = useState("");
  const [aspect, setAspect] = useState("");
  const [rim, setRim] = useState("");
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const buildSearchUrl = () => {
    const params = new URLSearchParams();
    if (width) params.set("width", width);
    if (aspect) params.set("aspect", aspect);
    if (rim) params.set("rim", rim);
    if (selectedType) params.set("type", selectedType);
    return `/shop?${params.toString()}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="search-module"
    >
      <h3 className="font-display text-lg font-semibold mb-5 flex items-center gap-2.5">
        <div className="p-2 rounded-lg bg-primary/10">
          <Search className="h-5 w-5 text-primary" />
        </div>
        Shop by Size
      </h3>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-2 block">Width</label>
          <Select value={width} onValueChange={setWidth}>
            <SelectTrigger>
              <SelectValue placeholder="Width" />
            </SelectTrigger>
            <SelectContent>
              {widthOptions.map((w) => (
                <SelectItem key={w} value={w}>{w}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-2 block">Aspect</label>
          <Select value={aspect} onValueChange={setAspect}>
            <SelectTrigger>
              <SelectValue placeholder="Aspect" />
            </SelectTrigger>
            <SelectContent>
              {aspectOptions.map((a) => (
                <SelectItem key={a} value={a}>{a}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-2 block">Rim</label>
          <Select value={rim} onValueChange={setRim}>
            <SelectTrigger>
              <SelectValue placeholder="Rim" />
            </SelectTrigger>
            <SelectContent>
              {rimOptions.map((r) => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tire type chips */}
      <div className="flex flex-wrap gap-2 mb-5">
        {tireTypes.map((type) => (
          <button
            key={type.id}
            onClick={() => setSelectedType(selectedType === type.id ? null : type.id)}
            className={`chip ${
              selectedType === type.id ? "chip-active" : "chip-inactive"
            }`}
          >
            {type.label}
          </button>
        ))}
      </div>

      <Button variant="default" className="w-full btn-glow" asChild>
        <Link to={buildSearchUrl()}>
          <Search className="h-4 w-4" />
          Search Tires
        </Link>
      </Button>
    </motion.div>
  );
}
