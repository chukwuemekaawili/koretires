import { Star } from "lucide-react";
import bgTestimonials from "@/assets/bg-testimonials-strip.jpg";

export function TestimonialBand() {
  return (
    <section 
      className="testimonial-band py-10 md:py-12"
      style={{ backgroundImage: `url(${bgTestimonials})` }}
    >
      <div className="container relative z-10">
        <div className="max-w-2xl mx-auto text-center text-white">
          {/* Stars and Quote inline */}
          <div className="flex items-center justify-center gap-3">
            {/* Decorative line */}
            <div className="hidden sm:block h-px w-12 bg-white/40" />
            
            {/* Stars */}
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            
            {/* Quote */}
            <p className="text-base md:text-lg font-medium italic">
              "Excellent service and great prices!"
            </p>
            
            {/* Decorative line */}
            <div className="hidden sm:block h-px w-12 bg-white/40" />
          </div>
          
          {/* Customer Name */}
          <p className="text-white/70 text-sm mt-2">
            — Sarah M.
          </p>
        </div>
      </div>
    </section>
  );
}
