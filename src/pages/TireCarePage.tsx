import { motion } from "framer-motion";
import { 
  CheckCircle, AlertTriangle, Gauge, RotateCw, 
  Thermometer, Calendar, Shield, ArrowRight 
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/layout/Layout";
import { useCompanyInfo } from "@/hooks/useCompanyInfo";
import { usePageContent } from "@/hooks/usePageContent";
import { Skeleton } from "@/components/ui/skeleton";

interface HeroContent {
  headline: string;
  body: string;
}

interface TipItem {
  title: string;
  body: string;
}

interface TipsContent {
  items: TipItem[];
}

const defaultHero: HeroContent = {
  headline: "Tire Care Tips & Maintenance Guide",
  body: "Keep your tires in top condition with these expert tips. Proper maintenance extends tire life and keeps you safe on the road.",
};

const defaultTips: TipsContent = {
  items: [
    { title: "Rotate Tires Regularly", body: "Rotate your tires every 8,000-10,000 km to ensure even wear." },
    { title: "Check Tire Pressure Regularly", body: "Check tire pressure at least once a month and before long trips." },
  ],
};

// Additional tips not from DB (static supplemental content)
const additionalTips = [
  {
    icon: Gauge,
    title: "Check Tire Pressure Monthly",
    description: "Underinflated tires wear faster and reduce fuel efficiency. Check pressure when tires are cold and match the recommended PSI on your door jamb sticker.",
    importance: "critical",
  },
  {
    icon: AlertTriangle,
    title: "Inspect Tread Depth Regularly",
    description: "Use the penny test: insert a penny with the Queen's head down. If you can see the top of her head, it's time for new tires. Legal minimum is 1.6mm.",
    importance: "critical",
  },
  {
    icon: Calendar,
    title: "Replace Tires Every 6-10 Years",
    description: "Even with good tread, rubber degrades over time. Check the DOT date code on your sidewall to know when your tires were manufactured.",
    importance: "moderate",
  },
  {
    icon: Shield,
    title: "Align Wheels After Pothole Hits",
    description: "Alberta roads can be tough on alignment. Misaligned wheels cause uneven wear and poor handling. Get alignment checked annually.",
    importance: "important",
  },
];

const seasonalGuide = [
  {
    season: "Spring",
    icon: "🌱",
    tips: [
      "Switch from winter to all-season/summer tires when temps consistently above 7°C",
      "Inspect tires for winter damage from potholes and debris",
      "Check alignment after rough winter roads",
      "Clean wheels and inspect for corrosion",
    ],
  },
  {
    season: "Summer",
    icon: "☀️",
    tips: [
      "Check pressure more often - heat increases tire pressure",
      "Inspect for cracks or bulges before long road trips",
      "Consider performance tires for enthusiast driving",
      "Park in shade when possible to reduce UV damage",
    ],
  },
  {
    season: "Fall",
    icon: "🍂",
    tips: [
      "Book winter tire installation early (September-October)",
      "Inspect winter tires stored from last season",
      "Check tread depth before winter arrives",
      "Consider new winters if current set has less than 5mm tread",
    ],
  },
  {
    season: "Winter",
    icon: "❄️",
    tips: [
      "Use dedicated winter tires (not all-seasons) for best safety",
      "Check pressure monthly - cold reduces pressure",
      "Clear snow from wheel wells to prevent damage",
      "Carry emergency kit including tire chains for mountain travel",
    ],
  },
];

export default function TireCarePage() {
  const { companyInfo } = useCompanyInfo();
  const { getSectionAs, isLoading } = usePageContent("tire-care");
  
  const hero = getSectionAs<HeroContent>("hero", defaultHero);
  const tips = getSectionAs<TipsContent>("tips", defaultTips);
  
  const city = companyInfo.location.city;
  const province = companyInfo.location.province;

  return (
    <Layout>
      {/* Hero */}
      <section className="relative py-16 md:py-24 bg-gradient-to-b from-primary/10 to-background">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto text-center"
          >
            {isLoading ? (
              <>
                <Skeleton className="h-12 w-3/4 mx-auto mb-6" />
                <Skeleton className="h-6 w-full mb-8" />
              </>
            ) : (
              <>
                <h1 className="font-display text-4xl md:text-5xl font-bold mb-6">
                  {hero.headline}
                </h1>
                <p className="text-lg text-muted-foreground mb-8">
                  {hero.body}{city ? ` Our ${city}-based technicians are here to help keep you safe on${province ? ` ${province}` : ""} roads.` : ""}
                </p>
              </>
            )}
            <Button variant="hero" size="lg" asChild>
              <Link to="/services">
                Book a Service
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* DB-Driven Tips */}
      <section className="py-16">
        <div className="container">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-center mb-12">
            Essential Tire Maintenance Tips
          </h2>
          
          {isLoading ? (
            <div className="grid md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-48" />
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6 mb-12">
              {tips.items.map((tip, index) => (
                <motion.div
                  key={tip.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bento-card group"
                >
                  <div className="inline-flex p-3 rounded-xl mb-4 bg-primary/10">
                    {index === 0 && <RotateCw className="h-6 w-6 text-primary" />}
                    {index === 1 && <Gauge className="h-6 w-6 text-primary" />}
                    {index === 2 && <AlertTriangle className="h-6 w-6 text-primary" />}
                    {index === 3 && <Thermometer className="h-6 w-6 text-primary" />}
                  </div>
                  <h3 className="font-display font-semibold text-lg mb-2">{tip.title}</h3>
                  <p className="text-muted-foreground text-sm">{tip.body}</p>
                </motion.div>
              ))}
            </div>
          )}

          {/* Additional Static Tips */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {additionalTips.map((tip, index) => {
              const Icon = tip.icon;
              return (
                <motion.div
                  key={tip.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bento-card group"
                >
                  <div className={`inline-flex p-3 rounded-xl mb-4 ${
                    tip.importance === "critical" 
                      ? "bg-destructive/10" 
                      : tip.importance === "important"
                      ? "bg-primary/10"
                      : "bg-muted"
                  }`}>
                    <Icon className={`h-6 w-6 ${
                      tip.importance === "critical" 
                        ? "text-destructive" 
                        : tip.importance === "important"
                        ? "text-primary"
                        : "text-muted-foreground"
                    }`} />
                  </div>
                  <h3 className="font-display font-semibold text-lg mb-2">{tip.title}</h3>
                  <p className="text-muted-foreground text-sm">{tip.description}</p>
                  {tip.importance === "critical" && (
                    <span className="inline-block mt-3 text-xs px-2 py-1 rounded-full bg-destructive/10 text-destructive">
                      Safety Critical
                    </span>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Seasonal Guide */}
      <section className="py-16 bg-secondary/30">
        <div className="container">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-center mb-4">
            Seasonal Tire Care for Alberta
          </h2>
          <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            Alberta's extreme temperature swings require year-round attention to tire maintenance. Here's what to focus on each season.
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {seasonalGuide.map((season, index) => (
              <motion.div
                key={season.season}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bento-card"
              >
                <div className="text-4xl mb-4">{season.icon}</div>
                <h3 className="font-display font-semibold text-lg mb-4">{season.season}</h3>
                <ul className="space-y-3">
                  {season.tips.map((tip, i) => (
                    <li key={i} className="flex gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{tip}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Warning Signs */}
      <section className="py-16">
        <div className="container">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-center mb-4">
              Warning Signs: When to Replace Your Tires
            </h2>
            <p className="text-muted-foreground text-center mb-12">
              Don't wait until it's too late. Watch for these signs that indicate it's time for new tires.
            </p>
            
            <div className="bento-card">
              <div className="space-y-6">
                {[
                  { sign: "Tread depth below 4mm (2mm is legal minimum)", urgent: true },
                  { sign: "Visible tread wear indicators (bars across the tread)", urgent: true },
                  { sign: "Cracks, cuts, or bulges in the sidewall", urgent: true },
                  { sign: "Vibration at highway speeds", urgent: false },
                  { sign: "Uneven or patchy wear patterns", urgent: false },
                  { sign: "Tires older than 6 years (check DOT code)", urgent: false },
                  { sign: "Frequent loss of air pressure", urgent: false },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg ${item.urgent ? "bg-destructive/10" : "bg-amber-500/10"}`}>
                      <AlertTriangle className={`h-5 w-5 ${item.urgent ? "text-destructive" : "text-amber-500"}`} />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{item.sign}</p>
                      {item.urgent && (
                        <span className="text-xs text-destructive">Replace immediately</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-primary/5">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto text-center"
          >
            <h2 className="font-display text-2xl md:text-3xl font-bold mb-4">
              Need New Tires or Service?
            </h2>
            <p className="text-muted-foreground mb-8">
              Our{city ? ` ${city}` : ""} team is ready to help you find the perfect tires for your vehicle and driving needs. Free inspections available.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="hero" size="lg" asChild>
                <Link to="/shop">
                  Shop Tires
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/contact">
                  Contact Us
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}
