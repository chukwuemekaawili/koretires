import { Link } from "react-router-dom";
import { Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function WhyChooseUs() {
  return (
    <section className="py-14 md:py-16 section-white">
      <div className="container">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-8">
            Why Choose Kore Tires?
          </h2>

          {/* 3-column layout matching reference */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-8 gap-y-3 mb-10 text-left max-w-2xl mx-auto">
            {/* Column 1 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-success shrink-0" />
                <span className="text-sm font-medium text-foreground">Competitive Prices</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-success shrink-0" />
                <span className="text-sm font-medium text-foreground">Fast, Reliable Service</span>
              </div>
            </div>
            
            {/* Column 2 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-success shrink-0" />
                <span className="text-sm font-medium text-foreground">Top Brands You Trust</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-success shrink-0" />
                <span className="text-sm font-medium text-foreground">Fast, Reliable Service</span>
              </div>
            </div>
            
            {/* Column 3 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-success shrink-0" />
                <span className="text-sm font-semibold text-foreground">Locally Owned & Operated</span>
              </div>
            </div>
          </div>

          <Button variant="default" size="lg" asChild>
            <Link to="/get-quote">
              Get a Quote Today
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
