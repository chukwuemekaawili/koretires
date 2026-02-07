import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Snowflake, Sun, CloudRain, Mountain } from "lucide-react";
import { Button } from "@/components/ui/button";

const categories = [
  {
    id: "winter",
    icon: Snowflake,
    title: "Winter Tires",
    description: "Superior traction in snow and ice",
    priceFrom: "$70",
    color: "from-blue-500/20 to-cyan-500/20",
    borderColor: "border-blue-500/30",
  },
  {
    id: "all-season",
    icon: Sun,
    title: "All Season",
    description: "Year-round performance & value",
    priceFrom: "$65",
    color: "from-orange-500/20 to-yellow-500/20",
    borderColor: "border-orange-500/30",
  },
  {
    id: "all-weather",
    icon: CloudRain,
    title: "All Weather",
    description: "Versatile for any condition",
    priceFrom: "$120",
    color: "from-purple-500/20 to-pink-500/20",
    borderColor: "border-purple-500/30",
  },
  {
    id: "terrain",
    icon: Mountain,
    title: "Terrain",
    description: "Off-road ready performance",
    priceFrom: "$120",
    color: "from-green-500/20 to-emerald-500/20",
    borderColor: "border-green-500/30",
  },
];

export function FeaturedCategories() {
  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-background to-card/50">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            Find Your Perfect Tires
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Quality tires for every season and driving style, competitively priced.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category, index) => {
            const Icon = category.icon;
            return (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Link
                  to={`/shop?type=${category.id}`}
                  className={`block h-full bento-card group border ${category.borderColor} hover:border-primary/50 transition-all duration-300`}
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${category.color} flex items-center justify-center mb-4`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-display font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                    {category.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {category.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-primary font-semibold">
                      From {category.priceFrom}
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-10"
        >
          <Button variant="outline" size="lg" asChild>
            <Link to="/shop">
              Browse All Tires
              <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
