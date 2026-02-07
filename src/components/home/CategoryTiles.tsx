import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import tileWinter from "@/assets/tile-winter-tires.jpg";
import tileAllSeason from "@/assets/tile-all-season-tires.jpg";
import tilePerformance from "@/assets/tile-performance-tires.jpg";
import tileTruck from "@/assets/tile-truck-commercial-tires.jpg";

const categories = [
  {
    id: "winter",
    title: "Winter Tires",
    image: tileWinter,
  },
  {
    id: "all-season",
    title: "All-Season Tires",
    image: tileAllSeason,
  },
  {
    id: "performance",
    title: "Performance Tires",
    image: tilePerformance,
  },
  {
    id: "truck",
    title: "Truck & Commercial Tires",
    image: tileTruck,
  },
];

export function CategoryTiles() {
  return (
    <section className="py-14 md:py-16 section-white">
      <div className="container">
        <div className="text-center mb-8">
          <h2 className="text-xl md:text-2xl font-bold">
            Find the Right Tires for Your Vehicle
          </h2>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 max-w-4xl mx-auto">
          {categories.map((category) => (
            <Link
              key={category.id}
              to={`/shop?type=${category.id}`}
              className="group text-center"
            >
              <div className="aspect-square overflow-hidden mb-2">
              <img
                  src={category.image}
                  alt={category.title}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <h3 className="text-sm md:text-base font-medium text-primary hover:text-primary/80 transition-colors">
                {category.title}
              </h3>
            </Link>
          ))}
        </div>

        <div className="text-center mt-8">
          <Button variant="default" size="lg" asChild>
            <Link to="/shop">
              Find Tires That Fit Your Vehicle
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
