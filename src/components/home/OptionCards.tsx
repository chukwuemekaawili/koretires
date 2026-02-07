import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function OptionCards() {
  return (
    <section className="py-12 md:py-16 section-gray">
      <div className="container">
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Retail Card */}
          <div className="classic-card p-6 md:p-8 text-center">
            <h3 className="text-xl font-bold mb-3">For Retail Customers</h3>
            <p className="text-muted-foreground mb-6">
              Quality tires for cars, SUVs, and trucks.
            </p>
            <Button variant="default" asChild>
              <Link to="/shop">
                Browse Retail Tires
              </Link>
            </Button>
          </div>

          {/* Wholesale Card */}
          <div className="classic-card p-6 md:p-8 text-center">
            <h3 className="text-xl font-bold mb-3">For Wholesale Buyers</h3>
            <p className="text-muted-foreground mb-6">
              Bulk pricing for dealers & businesses.
            </p>
            <Button variant="secondary" asChild>
              <Link to="/dealers">
                Request Wholesale Pricing
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
