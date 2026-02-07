import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, Car } from "lucide-react";
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

const years = Array.from({ length: 30 }, (_, i) => (2026 - i).toString());
const makes = ["Acura", "Audi", "BMW", "Chevrolet", "Dodge", "Ford", "GMC", "Honda", "Hyundai", "Jeep", "Kia", "Lexus", "Mazda", "Mercedes-Benz", "Nissan", "RAM", "Subaru", "Tesla", "Toyota", "Volkswagen"];
const models: Record<string, string[]> = {
  Toyota: ["Camry", "Corolla", "RAV4", "Highlander", "Tacoma", "Tundra", "4Runner"],
  Honda: ["Civic", "Accord", "CR-V", "Pilot", "Odyssey", "HR-V"],
  Ford: ["F-150", "Escape", "Explorer", "Mustang", "Edge", "Bronco"],
  Chevrolet: ["Silverado", "Equinox", "Traverse", "Tahoe", "Malibu", "Colorado"],
};

export function TireSearchModule() {
  const [searchMode, setSearchMode] = useState<"size" | "vehicle">("size");
  const [width, setWidth] = useState("");
  const [aspect, setAspect] = useState("");
  const [rim, setRim] = useState("");
  const [year, setYear] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");

  const availableModels = make && models[make] ? models[make] : [];

  const buildSizeSearchUrl = () => {
    const params = new URLSearchParams();
    if (width) params.set("width", width);
    if (aspect) params.set("aspect", aspect);
    if (rim) params.set("rim", rim);
    return `/shop?${params.toString()}`;
  };

  const buildVehicleSearchUrl = () => {
    const params = new URLSearchParams();
    if (year) params.set("year", year);
    if (make) params.set("make", make);
    if (model) params.set("model", model);
    return `/tire-finder?${params.toString()}`;
  };

  return (
    <section className="py-12 md:py-16 section-gray">
      <div className="container">
        <div className="max-w-3xl mx-auto">
          <div className="classic-card p-6 md:p-8">
            {/* Toggle Tabs */}
            <div className="flex border-b border-border mb-6">
              <button
                onClick={() => setSearchMode("size")}
                className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
                  searchMode === "size"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Search className="h-4 w-4 inline mr-2" />
                Search by Size
              </button>
              <button
                onClick={() => setSearchMode("vehicle")}
                className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
                  searchMode === "vehicle"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Car className="h-4 w-4 inline mr-2" />
                Find by Vehicle
              </button>
            </div>

            {/* Search by Size */}
            {searchMode === "size" && (
              <div>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                      Width
                    </label>
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
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                      Aspect Ratio
                    </label>
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
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                      Rim Size
                    </label>
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
                <Button variant="default" className="w-full" asChild>
                  <Link to={buildSizeSearchUrl()}>
                    <Search className="h-4 w-4" />
                    Search Tires
                  </Link>
                </Button>
              </div>
            )}

            {/* Find by Vehicle */}
            {searchMode === "vehicle" && (
              <div>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                      Year
                    </label>
                    <Select value={year} onValueChange={setYear}>
                      <SelectTrigger>
                        <SelectValue placeholder="Year" />
                      </SelectTrigger>
                      <SelectContent>
                        {years.map((y) => (
                          <SelectItem key={y} value={y}>{y}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                      Make
                    </label>
                    <Select value={make} onValueChange={(v) => { setMake(v); setModel(""); }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Make" />
                      </SelectTrigger>
                      <SelectContent>
                        {makes.map((m) => (
                          <SelectItem key={m} value={m}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                      Model
                    </label>
                    <Select value={model} onValueChange={setModel} disabled={!make}>
                      <SelectTrigger>
                        <SelectValue placeholder="Model" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableModels.map((m) => (
                          <SelectItem key={m} value={m}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button variant="default" className="w-full" asChild>
                  <Link to={buildVehicleSearchUrl()}>
                    <Search className="h-4 w-4" />
                    Find Tires
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
