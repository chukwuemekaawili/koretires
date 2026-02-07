import { Link } from "react-router-dom";
import { 
  Shield, Users, Truck, Award, MapPin, Phone, 
  Mail, Clock, ArrowRight, Star, Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Layout } from "@/components/layout/Layout";
import { useCompanyInfo } from "@/hooks/useCompanyInfo";
import { usePageContent } from "@/hooks/usePageContent";
import koreLogo from "@/assets/kore-logo.png";

const stats = [
  { value: "10+", label: "Years in Business" },
  { value: "50,000+", label: "Tires Sold" },
  { value: "5,000+", label: "Happy Customers" },
  { value: "4.9", label: "Google Rating", icon: Star },
];

const values = [
  {
    icon: Shield,
    title: "Quality First",
    description: "We only stock tires from trusted manufacturers with proven track records.",
  },
  {
    icon: Users,
    title: "Customer Focused",
    description: "Our team takes time to understand your needs and recommend the best solution.",
  },
  {
    icon: Truck,
    title: "Fast Delivery",
    description: "Free local delivery and quick shipping across Alberta.",
  },
  {
    icon: Award,
    title: "Expert Service",
    description: "Professional installation, rotation, and repair by skilled technicians.",
  },
];

const trustPoints = [
  "Pay In-Person on Delivery",
  "Free Local Delivery",
  "Warranty Coverage",
  "Expert Advice",
];

interface HeroContent {
  headline: string;
  body: string;
}

interface StoryContent {
  title: string;
  body: string;
}

export default function AboutPage() {
  const { companyInfo, formatPhone, getFormattedHours } = useCompanyInfo();
  const { page, isLoading, getSectionAs } = usePageContent("about");

  const hero = getSectionAs<HeroContent>("hero", {
    headline: "About Kore Tires",
    body: "Your trusted Edmonton tire specialists, providing quality products and professional service."
  });

  const story = getSectionAs<StoryContent>("story", {
    title: "Our Story",
    body: "Kore Tires Sales and Services is dedicated to providing Edmonton and area with quality tires and professional tire services."
  });

  const city = companyInfo.location.city || "Edmonton";

  if (isLoading) {
    return (
      <Layout>
        <section className="py-16 md:py-20">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center space-y-4">
              <Skeleton className="h-24 w-24 mx-auto rounded-md" />
              <Skeleton className="h-12 w-3/4 mx-auto" />
              <Skeleton className="h-6 w-full" />
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Hero */}
      <section className="py-16 md:py-20 section-white border-b border-border">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <img src={koreLogo} alt="Kore Tires" className="h-20 mx-auto mb-6" />
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              {city}'s Trusted Tire Experts
            </h1>
            <p className="text-lg text-muted-foreground">
              {hero.body}
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-10 section-gray border-b border-border">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <span className="text-3xl md:text-4xl font-bold text-primary">{stat.value}</span>
                  {stat.icon && <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />}
                </div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-16 md:py-20 section-white">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-6">{story.title}</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>{story.body}</p>
                <p>
                  What began as a small operation has grown into one of {city}'s most trusted 
                  tire suppliers. We've built our reputation on putting customers first, offering 
                  transparent pricing, and standing behind every tire we sell.
                </p>
                <p>
                  Today, we serve thousands of customers across {city} and Alberta, from 
                  individual drivers to large fleets.
                </p>
              </div>
            </div>

            <div className="classic-card p-6">
              <h3 className="font-bold text-lg mb-6">Why Choose Kore Tires</h3>
              <ul className="space-y-4">
                {trustPoints.map((point) => (
                  <li key={point} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-success flex items-center justify-center shrink-0">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-medium">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 md:py-20 section-gray">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">Our Values</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              The principles that guide everything we do at Kore Tires.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value) => (
              <div key={value.title} className="classic-card p-6 text-center">
                <div className="w-12 h-12 mx-auto mb-4 rounded-md bg-primary/10 flex items-center justify-center">
                  <value.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{value.title}</h3>
                <p className="text-sm text-muted-foreground">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Location */}
      <section className="py-16 md:py-20 section-white">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-6">Visit Us</h2>
              <div className="space-y-4">
                {companyInfo.location.address && (
                  <div className="flex items-start gap-4 p-4 classic-card">
                    <MapPin className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <h3 className="font-medium">Address</h3>
                      <p className="text-muted-foreground">{companyInfo.location.address}</p>
                      <p className="text-muted-foreground">{companyInfo.location.city}, {companyInfo.location.province} {companyInfo.location.postal_code}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-4 p-4 classic-card">
                  <Clock className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-medium">Hours</h3>
                    <p className="text-muted-foreground whitespace-pre-line">{getFormattedHours()}</p>
                  </div>
                </div>

                {companyInfo.contact.phone && (
                  <div className="flex items-start gap-4 p-4 classic-card">
                    <Phone className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <h3 className="font-medium">Phone</h3>
                      <a href={`tel:${formatPhone(companyInfo.contact.phone)}`} className="text-primary hover:underline">
                        {companyInfo.contact.phone}
                      </a>
                    </div>
                  </div>
                )}

                {companyInfo.contact.email && (
                  <div className="flex items-start gap-4 p-4 classic-card">
                    <Mail className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <h3 className="font-medium">Email</h3>
                      <a href={`mailto:${companyInfo.contact.email}`} className="text-primary hover:underline">
                        {companyInfo.contact.email}
                      </a>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <Button variant="default" asChild>
                  <Link to="/contact">
                    Contact Us
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                {companyInfo.contact.phone && (
                  <Button variant="outline" asChild>
                    <a href={`tel:${formatPhone(companyInfo.contact.phone)}`}>
                      <Phone className="h-4 w-4" />
                      Call Now
                    </a>
                  </Button>
                )}
              </div>
            </div>

            <div className="aspect-square lg:aspect-auto rounded-md overflow-hidden border border-border bg-muted">
              <iframe
                src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(companyInfo.location.address + ', ' + companyInfo.location.city + ', ' + companyInfo.location.province)}`}
                width="100%"
                height="100%"
                style={{ border: 0, minHeight: "400px" }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Kore Tires Location"
              />
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
