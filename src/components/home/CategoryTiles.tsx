import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import tileWinter from "@/assets/tile-winter-tires.jpg";
import tileAllSeason from "@/assets/tile-all-season-tires.jpg";
import tilePerformance from "@/assets/tile-performance-tires.jpg";
import tileTruck from "@/assets/tile-truck-commercial-tires.jpg";

export function CategoryTiles() {
  return (
    <section className="py-14 md:py-20 section-white">
      <div className="container px-4">
        <div className="flex flex-col md:flex-row justify-between items-end mb-8 md:mb-10 gap-4">
          <div className="max-w-2xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-3 tracking-tight">
              Find Your Perfect Tires
            </h2>
            <p className="text-muted-foreground text-lg">
              Browse our most popular categories to find the right fit for your vehicle and driving style.
            </p>
          </div>
          <Button variant="outline" className="hidden md:flex group" asChild>
            <Link to="/shop">
              View All Categories
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 min-h-[600px] md:min-h-[500px]">

          {/* Main Featured Tile (Winter Tires - Seasonally Relevant) */}
          <Link
            to="/shop?type=winter"
            className="group relative overflow-hidden rounded-2xl md:col-span-2 md:row-span-2 min-h-[300px]"
          >
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors z-10" />
            <img
              src={tileWinter}
              alt="Winter Tires"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute bottom-0 left-0 p-6 md:p-8 z-20 w-full">
              <span className="inline-block px-3 py-1 mb-3 text-xs font-bold tracking-wider text-white uppercase bg-primary rounded-full">
                Seasonal Priority
              </span>
              <h3 className="text-2xl md:text-4xl font-bold text-white mb-2">Winter Tires</h3>
              <p className="text-white/90 text-sm md:text-base max-w-md hidden md:block">
                Maximum safety and traction for Edmonton's harsh winter conditions. Don't compromise on safety this season.
              </p>
              <div className="mt-4 flex items-center text-white font-medium text-sm">
                Shop Winter Tires <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-2" />
              </div>
            </div>
          </Link>

          {/* Secondary Tile 1 (All-Season) */}
          <Link
            to="/shop?type=all-season"
            className="group relative overflow-hidden rounded-2xl min-h-[200px]"
          >
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors z-10" />
            <img
              src={tileAllSeason}
              alt="All-Season Tires"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute bottom-0 left-0 p-6 z-20">
              <h3 className="text-xl font-bold text-white mb-1">All-Season Tires</h3>
              <p className="text-white/80 text-xs">Versatile performance year-round</p>
            </div>
          </Link>

          {/* Secondary Tile 2 (Performance) */}
          <Link
            to="/shop?type=performance"
            className="group relative overflow-hidden rounded-2xl min-h-[200px]"
          >
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors z-10" />
            <img
              src={tilePerformance}
              alt="Performance Tires"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute bottom-0 left-0 p-6 z-20">
              <h3 className="text-xl font-bold text-white mb-1">Performance Tires</h3>
              <p className="text-white/80 text-xs">Enhanced handling & grip</p>
            </div>
          </Link>

          {/* Secondary Tile 3 (Truck) - Spans full width on mobile, single on desktop */}
          <Link
            to="/shop?type=truck"
            className="group relative overflow-hidden rounded-2xl md:col-start-3 min-h-[200px]"
          >
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors z-10" />
            <img
              src={tileTruck}
              alt="Truck Tires"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute bottom-0 left-0 p-6 z-20">
              <h3 className="text-xl font-bold text-white mb-1">Truck & Commercial</h3>
              <p className="text-white/80 text-xs">Heavy-duty durability</p>
            </div>
          </Link>

        </div>

        <div className="mt-8 text-center md:hidden">
          <Button variant="outline" className="w-full" asChild>
            <Link to="/shop">
              View All Categories
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
