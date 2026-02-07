import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/layout/Layout";
import { OptionCards } from "@/components/home/OptionCards";
import { CategoryTiles } from "@/components/home/CategoryTiles";
import { ServicesSection } from "@/components/home/ServicesSection";
import { WhyChooseUs } from "@/components/home/WhyChooseUs";
import { TestimonialBand } from "@/components/home/TestimonialBand";
import { FinalCTABar } from "@/components/home/FinalCTABar";
import { FadeInSection } from "@/components/ui/fade-in-section";
import heroImage from "@/assets/hero-stacked-tires.jpg";

export default function HomePage() {
  return (
    <Layout>
      {/* Hero Section */}
      <section id="hero" className="relative min-h-[420px] md:min-h-[480px] flex items-center">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src={heroImage}
            alt="Stacked tires"
            className="w-full h-full object-cover"
            loading="eager"
          />
          <div className="hero-overlay absolute inset-0" />
        </div>

        {/* Hero Content */}
        <div className="container relative z-10 py-12 md:py-16">
          <div className="max-w-xl animate-fade-up">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-[2.75rem] font-bold mb-3 leading-tight text-white">
              Your Trusted Source<br />
              for Tires & Tire Services
            </h1>
            <p className="text-sm md:text-base mb-6 text-white/90">
              Retail & Wholesale Tire Solutions With Professional Installation
            </p>

            <div className="flex flex-wrap gap-2.5">
              <Button variant="default" size="default" asChild>
                <Link to="/shop">
                  Shop Tires
                </Link>
              </Button>
              <Button variant="secondary" size="default" asChild>
                <Link to="/dealers">
                  Wholesale Inquiries
                </Link>
              </Button>
              <Button variant="heroOutline" size="sm" asChild>
                <Link to="/services">
                  Book a Tire Service
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Option Cards - Retail vs Wholesale */}
      <FadeInSection>
        <section id="options">
          <OptionCards />
        </section>
      </FadeInSection>

      {/* Category Tiles */}
      <FadeInSection delay={50}>
        <section id="categories">
          <CategoryTiles />
        </section>
      </FadeInSection>

      {/* Services Section */}
      <FadeInSection delay={50}>
        <section id="services">
          <ServicesSection />
        </section>
      </FadeInSection>

      {/* Why Choose Us */}
      <FadeInSection delay={50}>
        <section id="why-us">
          <WhyChooseUs />
        </section>
      </FadeInSection>

      {/* Testimonial Band */}
      <section id="testimonials">
        <TestimonialBand />
      </section>

      {/* Final CTA Bar */}
      <section id="cta">
        <FinalCTABar />
      </section>
    </Layout>
  );
}
