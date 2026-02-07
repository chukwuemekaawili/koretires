import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import bgFooter from "@/assets/bg-footer-strip.jpg";

export function FinalCTABar() {
  return (
    <section 
      className="cta-bar py-12 md:py-16"
      style={{ backgroundImage: `url(${bgFooter})` }}
    >
      <div className="container relative z-10">
        {/* Heading with decorative lines */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className="hidden sm:block h-px w-16 bg-white/40" />
          <h2 className="text-xl md:text-2xl font-bold text-white text-center">
            Ready to Get the Right Tires?
          </h2>
          <div className="hidden sm:block h-px w-16 bg-white/40" />
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button variant="default" size="lg" className="w-full sm:w-auto min-w-[180px]" asChild>
            <Link to="/shop">
              Shop Tires
            </Link>
          </Button>
          <Button variant="secondary" size="lg" className="w-full sm:w-auto min-w-[200px]" asChild>
            <Link to="/dealers">
              Request Wholesale Pricing
            </Link>
          </Button>
          <Button variant="secondary" size="lg" className="w-full sm:w-auto min-w-[160px]" asChild>
            <Link to="/services">
              Book a Service
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
