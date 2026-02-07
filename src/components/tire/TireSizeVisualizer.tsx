import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Info, AlertTriangle, Check } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TireSizeVisualizerProps {
  selectedSize: string; // e.g., "225/45R17"
  className?: string;
}

// Parse tire size string like "225/45R17" or "225/45/17"
function parseTireSize(sizeString: string): { width: number; aspect: number; rim: number } | null {
  // Handle formats: 225/45R17, 225/45/17, 225-45-17
  const match = sizeString.match(/(\d{3})\D*(\d{2})\D*(\d{2})/);
  if (!match) return null;
  
  return {
    width: parseInt(match[1], 10),
    aspect: parseInt(match[2], 10),
    rim: parseInt(match[3], 10),
  };
}

// Calculate tire dimensions in mm
function calculateDimensions(width: number, aspect: number, rim: number) {
  const rimMm = rim * 25.4; // Convert inches to mm
  const sidewallHeight = width * (aspect / 100);
  const overallDiameter = rimMm + (2 * sidewallHeight);
  const circumference = overallDiameter * Math.PI;
  
  return {
    width,
    sidewallHeight,
    overallDiameter,
    rimDiameter: rimMm,
    circumference,
  };
}

// Standard comparison sizes
const comparisonSizes = [
  "195/65R15",
  "205/55R16",
  "215/55R17",
  "225/45R17",
  "225/50R17",
  "235/45R18",
  "245/40R18",
  "255/35R19",
  "265/35R20",
];

export function TireSizeVisualizer({ selectedSize, className = "" }: TireSizeVisualizerProps) {
  const [compareSize, setCompareSize] = useState<string>("");
  
  const selectedParsed = useMemo(() => parseTireSize(selectedSize), [selectedSize]);
  const compareParsed = useMemo(() => compareSize ? parseTireSize(compareSize) : null, [compareSize]);
  
  const selectedDims = useMemo(() => 
    selectedParsed ? calculateDimensions(selectedParsed.width, selectedParsed.aspect, selectedParsed.rim) : null,
    [selectedParsed]
  );
  
  const compareDims = useMemo(() => 
    compareParsed ? calculateDimensions(compareParsed.width, compareParsed.aspect, compareParsed.rim) : null,
    [compareParsed]
  );

  // Calculate differences
  const differences = useMemo(() => {
    if (!selectedDims || !compareDims) return null;
    
    const diameterDiff = selectedDims.overallDiameter - compareDims.overallDiameter;
    const diameterPct = (diameterDiff / compareDims.overallDiameter) * 100;
    const widthDiff = selectedDims.width - compareDims.width;
    const speedoDiff = -diameterPct; // Negative diameter change = speedometer reads higher
    
    return {
      diameter: diameterDiff,
      diameterPct,
      width: widthDiff,
      speedoDiff,
    };
  }, [selectedDims, compareDims]);

  // SVG scaling - normalize to fit in viewport
  const maxDiameter = Math.max(selectedDims?.overallDiameter || 0, compareDims?.overallDiameter || 0) || 700;
  const scale = 180 / maxDiameter; // Fit in 180px viewport

  if (!selectedParsed || !selectedDims) {
    return (
      <div className={`p-4 rounded-lg bg-secondary/30 text-center text-muted-foreground ${className}`}>
        <Info className="h-5 w-5 mx-auto mb-2" />
        <p className="text-sm">Unable to parse tire size</p>
      </div>
    );
  }

  return (
    <div className={`bento-card ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-semibold flex items-center gap-2">
          <Info className="h-4 w-4 text-primary" />
          Size Comparison
        </h3>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="text-muted-foreground hover:text-foreground">
                <Info className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="text-sm">Compare your selected tire size with your current tires to understand fitment differences.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Compare selector */}
      <div className="mb-4">
        <Label className="text-sm text-muted-foreground mb-1.5 block">Compare with current tire size</Label>
        <Select value={compareSize || "none"} onValueChange={(v) => setCompareSize(v === "none" ? "" : v)}>
          <SelectTrigger className="bg-secondary/50">
            <SelectValue placeholder="Select size to compare" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No comparison</SelectItem>
            {comparisonSizes.filter(s => s !== selectedSize).map((size) => (
              <SelectItem key={size} value={size}>{size}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* SVG Visualization */}
      <div className="flex justify-center mb-4">
        <svg width="200" height="200" viewBox="-100 -100 200 200" className="overflow-visible">
          {/* Comparison tire (gray, behind) */}
          {compareDims && (
            <motion.g
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {/* Outer tire */}
              <circle
                cx="0"
                cy="0"
                r={(compareDims.overallDiameter / 2) * scale}
                fill="none"
                stroke="hsl(var(--muted-foreground))"
                strokeWidth="2"
                strokeDasharray="4 2"
                opacity="0.5"
              />
              {/* Rim */}
              <circle
                cx="0"
                cy="0"
                r={(compareDims.rimDiameter / 2) * scale}
                fill="hsl(var(--secondary))"
                stroke="hsl(var(--muted-foreground))"
                strokeWidth="1"
                opacity="0.3"
              />
            </motion.g>
          )}

          {/* Selected tire (primary color, front) */}
          <motion.g
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {/* Outer tire (rubber) */}
            <circle
              cx="0"
              cy="0"
              r={(selectedDims.overallDiameter / 2) * scale}
              fill="hsl(var(--foreground) / 0.1)"
              stroke="hsl(var(--primary))"
              strokeWidth="3"
            />
            {/* Sidewall pattern */}
            <circle
              cx="0"
              cy="0"
              r={(selectedDims.overallDiameter / 2 - 5) * scale}
              fill="none"
              stroke="hsl(var(--primary) / 0.3)"
              strokeWidth="1"
            />
            {/* Rim */}
            <circle
              cx="0"
              cy="0"
              r={(selectedDims.rimDiameter / 2) * scale}
              fill="hsl(var(--secondary))"
              stroke="hsl(var(--border))"
              strokeWidth="2"
            />
            {/* Rim center */}
            <circle
              cx="0"
              cy="0"
              r="8"
              fill="hsl(var(--muted))"
              stroke="hsl(var(--border))"
              strokeWidth="1"
            />
            {/* Rim spokes */}
            {[0, 60, 120, 180, 240, 300].map((angle) => (
              <line
                key={angle}
                x1="0"
                y1="0"
                x2={Math.cos(angle * Math.PI / 180) * ((selectedDims.rimDiameter / 2) * scale - 2)}
                y2={Math.sin(angle * Math.PI / 180) * ((selectedDims.rimDiameter / 2) * scale - 2)}
                stroke="hsl(var(--border))"
                strokeWidth="1"
              />
            ))}
          </motion.g>

          {/* Size label */}
          <text
            x="0"
            y="0"
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="10"
            fontWeight="bold"
            fill="hsl(var(--foreground))"
          >
            {selectedSize}
          </text>
        </svg>
      </div>

      {/* Dimensions info */}
      <div className="grid grid-cols-2 gap-3 text-sm mb-4">
        <div className="p-2 rounded-lg bg-secondary/30">
          <p className="text-muted-foreground text-xs">Overall Diameter</p>
          <p className="font-medium">{selectedDims.overallDiameter.toFixed(0)} mm</p>
        </div>
        <div className="p-2 rounded-lg bg-secondary/30">
          <p className="text-muted-foreground text-xs">Width</p>
          <p className="font-medium">{selectedDims.width} mm</p>
        </div>
        <div className="p-2 rounded-lg bg-secondary/30">
          <p className="text-muted-foreground text-xs">Sidewall Height</p>
          <p className="font-medium">{selectedDims.sidewallHeight.toFixed(0)} mm</p>
        </div>
        <div className="p-2 rounded-lg bg-secondary/30">
          <p className="text-muted-foreground text-xs">Rim Size</p>
          <p className="font-medium">{selectedParsed.rim}"</p>
        </div>
      </div>

      {/* Comparison results */}
      {differences && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-t border-border pt-4 space-y-3"
        >
          <h4 className="text-sm font-medium flex items-center gap-2">
            Compared to {compareSize}:
          </h4>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Diameter change</span>
              <span className={`font-medium ${Math.abs(differences.diameterPct) > 3 ? 'text-yellow-500' : 'text-green-500'}`}>
                {differences.diameter > 0 ? '+' : ''}{differences.diameter.toFixed(0)} mm ({differences.diameterPct > 0 ? '+' : ''}{differences.diameterPct.toFixed(1)}%)
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Width change</span>
              <span className="font-medium">
                {differences.width > 0 ? '+' : ''}{differences.width} mm
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Speedometer difference</span>
              <span className={`font-medium ${Math.abs(differences.speedoDiff) > 3 ? 'text-yellow-500' : 'text-green-500'}`}>
                {differences.speedoDiff > 0 ? '+' : ''}{differences.speedoDiff.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Fitment warning */}
          {Math.abs(differences.diameterPct) > 3 ? (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-yellow-500">Fitment Advisory</p>
                <p className="text-xs text-muted-foreground">
                  Size difference exceeds 3%. Check with our team to ensure compatibility with your vehicle.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-green-500">Compatible Size</p>
                <p className="text-xs text-muted-foreground">
                  This size is within acceptable fitment range.
                </p>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Disclaimer */}
      <p className="text-xs text-muted-foreground mt-4">
        * Visual representation is approximate. Always verify fitment with your vehicle manufacturer specifications before purchasing.
      </p>
    </div>
  );
}
