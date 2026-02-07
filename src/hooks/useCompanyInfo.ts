import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface CompanyInfo {
  contact: {
    phone: string;
    email: string;
    whatsapp: string;
  };
  location: {
    address: string;
    city: string;
    province: string;
    postal_code: string;
    latitude?: string;
    longitude?: string;
  };
  hours: {
    monday: string;
    tuesday: string;
    wednesday: string;
    thursday: string;
    friday: string;
    saturday: string;
    sunday: string;
  };
  policies: {
    delivery: string;
    return: string;
    warranty: string;
    payment: string;
    installation: string;
  };
}

const defaultCompanyInfo: CompanyInfo = {
  contact: {
    phone: "",
    email: "",
    whatsapp: "",
  },
  location: {
    address: "",
    city: "",
    province: "",
    postal_code: "",
  },
  hours: {
    monday: "",
    tuesday: "",
    wednesday: "",
    thursday: "",
    friday: "",
    saturday: "",
    sunday: "",
  },
  policies: {
    delivery: "",
    return: "",
    warranty: "",
    payment: "",
    installation: "",
  },
};

export function useCompanyInfo() {
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>(defaultCompanyInfo);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCompanyInfo = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("company_info")
        .select("key, value, category");

      if (error) throw error;

      const newInfo = { ...defaultCompanyInfo };
      
      data?.forEach((item) => {
        const category = item.category as keyof CompanyInfo;
        let key = item.key;
        
        // Map DB keys to our interface keys
        if (key.startsWith("hours_")) {
          key = key.replace("hours_", "");
        }
        if (key.endsWith("_policy")) {
          key = key.replace("_policy", "");
        }
        
        if (category in newInfo && typeof newInfo[category] === "object") {
          (newInfo[category] as Record<string, string>)[key] = item.value;
        }
      });

      setCompanyInfo(newInfo);
    } catch (err) {
      console.error("Error fetching company info:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompanyInfo();
  }, [fetchCompanyInfo]);

  // Helper formatters
  const formatPhone = (phone: string) => phone.replace(/-/g, "");
  const formatWhatsApp = (wa: string) => wa.replace(/\s|\+/g, "");
  
  const getGoogleMapsUrl = () => {
    const { address, city, postal_code } = companyInfo.location;
    if (!address || !city) return "#";
    return `https://maps.google.com/?q=${encodeURIComponent(`${address}, ${city}, ${postal_code}`)}`;
  };

  const getWhatsAppUrl = (message?: string) => {
    if (!companyInfo.contact.whatsapp) return "#";
    const base = `https://wa.me/${formatWhatsApp(companyInfo.contact.whatsapp)}`;
    return message ? `${base}?text=${encodeURIComponent(message)}` : base;
  };

  const hasCompleteHours = () => {
    const { hours } = companyInfo;
    return hours.monday && hours.tuesday && hours.wednesday && 
           hours.thursday && hours.friday && hours.saturday;
  };

  const hasGeoCoordinates = () => {
    const { latitude, longitude } = companyInfo.location;
    return latitude && longitude && !isNaN(parseFloat(latitude)) && !isNaN(parseFloat(longitude));
  };

  const getLocalBusinessSchema = () => {
    const schema: Record<string, any> = {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "name": "Kore Tires Edmonton",
      "image": "https://koretires.lovable.app/kore-logo.png",
      "@id": "https://koretires.lovable.app",
      "url": "https://koretires.lovable.app",
      "sameAs": [],
    };

    // Only add phone if available
    if (companyInfo.contact.phone) {
      schema.telephone = companyInfo.contact.phone;
    }

    // Only add address if we have location data
    if (companyInfo.location.address && companyInfo.location.city) {
      schema.address = {
        "@type": "PostalAddress",
        "streetAddress": companyInfo.location.address,
        "addressLocality": companyInfo.location.city,
        "addressRegion": companyInfo.location.province || "AB",
        "postalCode": companyInfo.location.postal_code,
        "addressCountry": "CA",
      };
    }

    // Only add geo if we have coordinates from DB
    if (hasGeoCoordinates()) {
      schema.geo = {
        "@type": "GeoCoordinates",
        "latitude": parseFloat(companyInfo.location.latitude!),
        "longitude": parseFloat(companyInfo.location.longitude!),
      };
    }

    // Only add hours if complete
    if (hasCompleteHours()) {
      const { hours } = companyInfo;
      const parseHours = (timeStr: string) => {
        // Try to extract open/close times from formats like "9:00 AM - 5:00 PM"
        const match = timeStr.match(/(\d{1,2}):?(\d{2})?\s*(AM|PM)?\s*-\s*(\d{1,2}):?(\d{2})?\s*(AM|PM)?/i);
        if (!match) return null;
        
        const formatTime = (h: string, m: string | undefined, ampm: string | undefined) => {
          let hour = parseInt(h);
          if (ampm?.toUpperCase() === "PM" && hour !== 12) hour += 12;
          if (ampm?.toUpperCase() === "AM" && hour === 12) hour = 0;
          return `${hour.toString().padStart(2, "0")}:${m || "00"}`;
        };
        
        return {
          opens: formatTime(match[1], match[2], match[3]),
          closes: formatTime(match[4], match[5], match[6]),
        };
      };

      const daysMap: Record<string, string> = {
        monday: "Monday",
        tuesday: "Tuesday", 
        wednesday: "Wednesday",
        thursday: "Thursday",
        friday: "Friday",
        saturday: "Saturday",
        sunday: "Sunday",
      };

      const openingHours: any[] = [];
      Object.entries(hours).forEach(([day, timeStr]) => {
        if (timeStr && timeStr.toLowerCase() !== "closed") {
          const parsed = parseHours(timeStr);
          if (parsed) {
            openingHours.push({
              "@type": "OpeningHoursSpecification",
              "dayOfWeek": daysMap[day],
              "opens": parsed.opens,
              "closes": parsed.closes,
            });
          }
        }
      });

      if (openingHours.length > 0) {
        schema.openingHoursSpecification = openingHours;
      }
    }

    return schema;
  };

  const getFormattedHours = () => {
    const { hours } = companyInfo;
    if (!hours.monday) return "";
    
    // Check if weekday hours are same
    const weekdayHours = hours.monday;
    const allWeekdaysSame = 
      hours.tuesday === weekdayHours &&
      hours.wednesday === weekdayHours &&
      hours.thursday === weekdayHours &&
      hours.friday === weekdayHours;
    
    if (allWeekdaysSame && hours.saturday === weekdayHours) {
      return `Mon-Sat: ${weekdayHours}`;
    }
    if (allWeekdaysSame) {
      return `Mon-Fri: ${weekdayHours}, Sat: ${hours.saturday}`;
    }
    return `Mon-Sat: ${hours.monday}`; // Fallback
  };

  const getFullAddress = () => {
    const { address, city, province, postal_code } = companyInfo.location;
    if (!address) return "";
    return `${address}, ${city}, ${province} ${postal_code}`;
  };

  return {
    companyInfo,
    isLoading,
    formatPhone,
    formatWhatsApp,
    getGoogleMapsUrl,
    getWhatsAppUrl,
    getLocalBusinessSchema,
    getFormattedHours,
    getFullAddress,
    hasCompleteHours,
    hasGeoCoordinates,
    refetch: fetchCompanyInfo,
  };
}

// Static export for edge functions and server-side use
export const COMPANY_DEFAULTS = defaultCompanyInfo;
