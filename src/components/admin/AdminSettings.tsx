import { useState, useEffect } from "react";
import { Loader2, Settings, Building, Clock, MapPin, FileText, DollarSign, Truck, Save, Bot, Megaphone, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CompanyInfo {
  [key: string]: { [field: string]: string };
}

interface SiteSettings {
  gst: { rate: number; display_mode: string; enabled: boolean };
  shipping: { free_delivery_zones: string[]; request_mode: boolean };
  dealer_checkout: { mode: string; direct_order_enabled: boolean };
  services: { booking_mode: string; time_slots_enabled: boolean };
  ai_settings: { enabled: boolean; lead_capture_enabled: boolean; handoff_suggest_call: boolean; handoff_suggest_whatsapp: boolean };
  online_payments: { enabled: boolean; coming_soon: boolean };
  announcement_banner: { active: boolean; title: string; body: string; type: string };
  payment_messaging: { checkout_text: string; online_coming_soon_text: string };
}

const defaultSettings: SiteSettings = {
  gst: { rate: 5, display_mode: "before_tax", enabled: true },
  shipping: { free_delivery_zones: ["Edmonton"], request_mode: true },
  dealer_checkout: { mode: "quote_request", direct_order_enabled: false },
  services: { booking_mode: "date_only", time_slots_enabled: false },
  ai_settings: { enabled: true, lead_capture_enabled: true, handoff_suggest_call: true, handoff_suggest_whatsapp: true },
  online_payments: { enabled: false, coming_soon: true },
  announcement_banner: { active: false, title: "", body: "", type: "info" },
  payment_messaging: { checkout_text: "Pay in-person on delivery or pickup. Cash or card accepted.", online_coming_soon_text: "Online payments: Coming Soon" },
};

export function AdminSettings() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    contact: { phone: "", email: "", whatsapp: "" },
    location: { address: "", city: "", province: "", postal_code: "" },
    hours: {
      hours_monday: "8:00 AM - 6:00 PM",
      hours_tuesday: "8:00 AM - 6:00 PM",
      hours_wednesday: "8:00 AM - 6:00 PM",
      hours_thursday: "8:00 AM - 6:00 PM",
      hours_friday: "8:00 AM - 6:00 PM",
      hours_saturday: "9:00 AM - 4:00 PM",
      hours_sunday: "Closed",
    },
    policies: {
      delivery_policy: "",
      return_policy: "",
      warranty_policy: "",
      payment_policy: "",
      installation_policy: "",
    },
  });
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [companyRes, settingsRes] = await Promise.all([
        supabase.from("company_info").select("*"),
        supabase.from("site_settings").select("*"),
      ]);

      if (companyRes.data) {
        const grouped = companyRes.data.reduce((acc, item) => {
          if (!acc[item.category]) acc[item.category] = {};
          acc[item.category][item.key] = item.value;
          return acc;
        }, {} as CompanyInfo);
        setCompanyInfo((prev) => ({ ...prev, ...grouped }));
      }

      if (settingsRes.data) {
        const settingsMap = settingsRes.data.reduce((acc, item) => {
          acc[item.key] = item.value;
          return acc;
        }, {} as Record<string, any>);
        setSettings((prev) => ({
          gst: settingsMap.gst || prev.gst,
          shipping: settingsMap.shipping || prev.shipping,
          dealer_checkout: settingsMap.dealer_checkout || prev.dealer_checkout,
          services: settingsMap.services || prev.services,
          ai_settings: settingsMap.ai_settings || prev.ai_settings,
          online_payments: settingsMap.online_payments || prev.online_payments,
          announcement_banner: settingsMap.announcement_banner || prev.announcement_banner,
          payment_messaging: settingsMap.payment_messaging || prev.payment_messaging,
        }));
      }
    } catch (err) {
      console.error("Error fetching settings:", err);
      toast.error("Failed to load settings");
    } finally {
      setIsLoading(false);
    }
  };

  const saveCompanyInfo = async () => {
    setIsSaving(true);
    try {
      for (const [category, fields] of Object.entries(companyInfo)) {
        for (const [key, value] of Object.entries(fields)) {
          await supabase
            .from("company_info")
            .upsert({ category, key, value }, { onConflict: "category,key" });
        }
      }
      toast.success("Company information saved");
    } catch (err) {
      console.error("Error saving company info:", err);
      toast.error("Failed to save company information");
    } finally {
      setIsSaving(false);
    }
  };

  const saveSiteSettings = async () => {
    setIsSaving(true);
    try {
      for (const [key, value] of Object.entries(settings)) {
        await supabase
          .from("site_settings")
          .upsert({ key, value }, { onConflict: "key" });
      }
      toast.success("Site settings saved");
    } catch (err) {
      console.error("Error saving site settings:", err);
      toast.error("Failed to save site settings");
    } finally {
      setIsSaving(false);
    }
  };

  const updateCompanyField = (category: string, key: string, value: string) => {
    setCompanyInfo((prev) => ({
      ...prev,
      [category]: { ...prev[category], [key]: value },
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="company" className="space-y-6">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="company" className="gap-2">
            <Building className="h-4 w-4" />
            Company Info
          </TabsTrigger>
          <TabsTrigger value="hours" className="gap-2">
            <Clock className="h-4 w-4" />
            Hours
          </TabsTrigger>
          <TabsTrigger value="policies" className="gap-2">
            <FileText className="h-4 w-4" />
            Policies
          </TabsTrigger>
          <TabsTrigger value="commerce" className="gap-2">
            <DollarSign className="h-4 w-4" />
            Commerce
          </TabsTrigger>
          <TabsTrigger value="ai" className="gap-2">
            <Bot className="h-4 w-4" />
            AI Agent
          </TabsTrigger>
          <TabsTrigger value="announcements" className="gap-2">
            <Megaphone className="h-4 w-4" />
            Announcements
          </TabsTrigger>
        </TabsList>

        {/* Company Info Tab */}
        <TabsContent value="company">
          <Card className="bento-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Company Information
              </CardTitle>
              <CardDescription>Basic business details shown to customers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Contact Details</h4>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input
                        value={companyInfo.contact?.phone || ""}
                        onChange={(e) => updateCompanyField("contact", "phone", e.target.value)}
                        placeholder="780-455-1251"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        value={companyInfo.contact?.email || ""}
                        onChange={(e) => updateCompanyField("contact", "email", e.target.value)}
                        placeholder="info@koretires.ca"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>WhatsApp</Label>
                      <Input
                        value={companyInfo.contact?.whatsapp || ""}
                        onChange={(e) => updateCompanyField("contact", "whatsapp", e.target.value)}
                        placeholder="+1 780 455 1251"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Location
                  </h4>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label>Address</Label>
                      <Input
                        value={companyInfo.location?.address || ""}
                        onChange={(e) => updateCompanyField("location", "address", e.target.value)}
                        placeholder="12345 Yellowhead Trail NW"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>City</Label>
                        <Input
                          value={companyInfo.location?.city || ""}
                          onChange={(e) => updateCompanyField("location", "city", e.target.value)}
                          placeholder="Edmonton"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Province</Label>
                        <Input
                          value={companyInfo.location?.province || ""}
                          onChange={(e) => updateCompanyField("location", "province", e.target.value)}
                          placeholder="Alberta"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Postal Code</Label>
                      <Input
                        value={companyInfo.location?.postal_code || ""}
                        onChange={(e) => updateCompanyField("location", "postal_code", e.target.value)}
                        placeholder="T5L 3C4"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <Button onClick={saveCompanyInfo} disabled={isSaving}>
                {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save Company Info
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Hours Tab */}
        <TabsContent value="hours">
          <Card className="bento-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Business Hours
              </CardTitle>
              <CardDescription>Operating hours displayed on website and used by AI concierge</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map((day) => (
                <div key={day} className="grid grid-cols-3 gap-4 items-center">
                  <Label className="capitalize">{day}</Label>
                  <Input
                    className="col-span-2"
                    value={companyInfo.hours?.[`hours_${day}`] || ""}
                    onChange={(e) => updateCompanyField("hours", `hours_${day}`, e.target.value)}
                    placeholder="8:00 AM - 6:00 PM"
                  />
                </div>
              ))}
              <Button onClick={saveCompanyInfo} disabled={isSaving} className="mt-4">
                {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save Hours
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Policies Tab */}
        <TabsContent value="policies">
          <Card className="bento-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Business Policies
              </CardTitle>
              <CardDescription>Policies used by AI concierge and displayed on website</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: "delivery_policy", label: "Delivery Policy", placeholder: "Free delivery within Edmonton" },
                { key: "return_policy", label: "Return Policy", placeholder: "30-day satisfaction guarantee" },
                { key: "warranty_policy", label: "Warranty Policy", placeholder: "Manufacturer warranty included" },
                { key: "payment_policy", label: "Payment Policy", placeholder: "Pay on delivery, cash or card" },
                { key: "installation_policy", label: "Installation Policy", placeholder: "Professional installation available" },
              ].map((policy) => (
                <div key={policy.key} className="space-y-2">
                  <Label>{policy.label}</Label>
                  <Textarea
                    value={companyInfo.policies?.[policy.key] || ""}
                    onChange={(e) => updateCompanyField("policies", policy.key, e.target.value)}
                    placeholder={policy.placeholder}
                    rows={2}
                  />
                </div>
              ))}
              <Button onClick={saveCompanyInfo} disabled={isSaving} className="mt-4">
                {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save Policies
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Commerce Tab */}
        <TabsContent value="commerce">
          <div className="space-y-6">
            {/* GST Settings */}
            <Card className="bento-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  GST Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Enable GST</Label>
                    <p className="text-sm text-muted-foreground">Apply GST to orders</p>
                  </div>
                  <Switch
                    checked={settings.gst.enabled}
                    onCheckedChange={(checked) =>
                      setSettings((prev) => ({ ...prev, gst: { ...prev.gst, enabled: checked } }))
                    }
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>GST Rate (%)</Label>
                    <Input
                      type="number"
                      value={settings.gst.rate}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          gst: { ...prev.gst, rate: parseFloat(e.target.value) || 0 },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Price Display Mode</Label>
                    <Select
                      value={settings.gst.display_mode}
                      onValueChange={(value) =>
                        setSettings((prev) => ({ ...prev, gst: { ...prev.gst, display_mode: value } }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="before_tax">Show prices before tax</SelectItem>
                        <SelectItem value="inclusive">Show tax-inclusive prices</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Shipping Settings */}
            <Card className="bento-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Shipping Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Shipping Request Mode</Label>
                    <p className="text-sm text-muted-foreground">Staff confirms shipping costs manually</p>
                  </div>
                  <Switch
                    checked={settings.shipping.request_mode}
                    onCheckedChange={(checked) =>
                      setSettings((prev) => ({
                        ...prev,
                        shipping: { ...prev.shipping, request_mode: checked },
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Free Delivery Zones (comma-separated)</Label>
                  <Input
                    value={settings.shipping.free_delivery_zones.join(", ")}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        shipping: {
                          ...prev.shipping,
                          free_delivery_zones: e.target.value.split(",").map((s) => s.trim()),
                        },
                      }))
                    }
                    placeholder="Edmonton, St. Albert, Sherwood Park"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Dealer Checkout Settings */}
            <Card className="bento-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Dealer Checkout Mode
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Default Checkout Mode</Label>
                  <Select
                    value={settings.dealer_checkout.mode}
                    onValueChange={(value) =>
                      setSettings((prev) => ({
                        ...prev,
                        dealer_checkout: { ...prev.dealer_checkout, mode: value },
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="quote_request">Quote/Invoice Request</SelectItem>
                      <SelectItem value="direct_order">Direct Order</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Allow Direct Orders</Label>
                    <p className="text-sm text-muted-foreground">Let dealers place orders without quote approval</p>
                  </div>
                  <Switch
                    checked={settings.dealer_checkout.direct_order_enabled}
                    onCheckedChange={(checked) =>
                      setSettings((prev) => ({
                        ...prev,
                        dealer_checkout: { ...prev.dealer_checkout, direct_order_enabled: checked },
                      }))
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Services Settings */}
            <Card className="bento-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Services Booking
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Booking Mode</Label>
                  <Select
                    value={settings.services.booking_mode}
                    onValueChange={(value) =>
                      setSettings((prev) => ({
                        ...prev,
                        services: { ...prev.services, booking_mode: value },
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date_only">Date only (staff confirms time)</SelectItem>
                      <SelectItem value="date_time">Date and time slots</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Enable Time Slots</Label>
                    <p className="text-sm text-muted-foreground">Show specific time slots for booking</p>
                  </div>
                  <Switch
                    checked={settings.services.time_slots_enabled}
                    onCheckedChange={(checked) =>
                      setSettings((prev) => ({
                        ...prev,
                        services: { ...prev.services, time_slots_enabled: checked },
                      }))
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Button onClick={saveSiteSettings} disabled={isSaving} size="lg">
              {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save All Commerce Settings
            </Button>
          </div>
        </TabsContent>

        {/* AI Agent Tab */}
        <TabsContent value="ai">
          <Card className="bento-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                AI Agent Settings
              </CardTitle>
              <CardDescription>Configure the AI concierge behavior and lead capture</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable AI Agent</Label>
                  <p className="text-sm text-muted-foreground">Show AI chat widget on the website</p>
                </div>
                <Switch
                  checked={settings.ai_settings.enabled}
                  onCheckedChange={(checked) =>
                    setSettings((prev) => ({
                      ...prev,
                      ai_settings: { ...prev.ai_settings, enabled: checked },
                    }))
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Lead Capture</Label>
                  <p className="text-sm text-muted-foreground">Prompt users for contact info during chat</p>
                </div>
                <Switch
                  checked={settings.ai_settings.lead_capture_enabled}
                  onCheckedChange={(checked) =>
                    setSettings((prev) => ({
                      ...prev,
                      ai_settings: { ...prev.ai_settings, lead_capture_enabled: checked },
                    }))
                  }
                />
              </div>
              <Separator />
              <h4 className="font-medium">Handoff Suggestions</h4>
              <p className="text-sm text-muted-foreground">When AI cannot answer, suggest these contact methods</p>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Suggest Phone Call</Label>
                  <Switch
                    checked={settings.ai_settings.handoff_suggest_call}
                    onCheckedChange={(checked) =>
                      setSettings((prev) => ({
                        ...prev,
                        ai_settings: { ...prev.ai_settings, handoff_suggest_call: checked },
                      }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Suggest WhatsApp</Label>
                  <Switch
                    checked={settings.ai_settings.handoff_suggest_whatsapp}
                    onCheckedChange={(checked) =>
                      setSettings((prev) => ({
                        ...prev,
                        ai_settings: { ...prev.ai_settings, handoff_suggest_whatsapp: checked },
                      }))
                    }
                  />
                </div>
              </div>
              <Button onClick={saveSiteSettings} disabled={isSaving}>
                {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save AI Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Announcements Tab */}
        <TabsContent value="announcements">
          <div className="space-y-6">
            <Card className="bento-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Megaphone className="h-5 w-5" />
                  Announcement Banner
                </CardTitle>
                <CardDescription>Display a banner at the top of the website</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Show Banner</Label>
                    <p className="text-sm text-muted-foreground">Display announcement on all pages</p>
                  </div>
                  <Switch
                    checked={settings.announcement_banner.active}
                    onCheckedChange={(checked) =>
                      setSettings((prev) => ({
                        ...prev,
                        announcement_banner: { ...prev.announcement_banner, active: checked },
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Banner Type</Label>
                  <Select
                    value={settings.announcement_banner.type}
                    onValueChange={(value) =>
                      setSettings((prev) => ({
                        ...prev,
                        announcement_banner: { ...prev.announcement_banner, type: value },
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">Info (Blue)</SelectItem>
                      <SelectItem value="success">Success (Green)</SelectItem>
                      <SelectItem value="warning">Warning (Yellow)</SelectItem>
                      <SelectItem value="promo">Promo (Purple)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={settings.announcement_banner.title}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        announcement_banner: { ...prev.announcement_banner, title: e.target.value },
                      }))
                    }
                    placeholder="Winter Tire Sale!"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Body</Label>
                  <Textarea
                    value={settings.announcement_banner.body}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        announcement_banner: { ...prev.announcement_banner, body: e.target.value },
                      }))
                    }
                    placeholder="Get 20% off all winter tires this month!"
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bento-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Messaging
                </CardTitle>
                <CardDescription>Customize payment-related text shown to customers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Checkout Payment Text</Label>
                  <Textarea
                    value={settings.payment_messaging.checkout_text}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        payment_messaging: { ...prev.payment_messaging, checkout_text: e.target.value },
                      }))
                    }
                    placeholder="Pay in-person on delivery or pickup. Cash or card accepted."
                    rows={2}
                  />
                  <p className="text-xs text-muted-foreground">
                    ⚠️ Must clarify that cash/card is accepted IN-PERSON only
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Online Payments Coming Soon Text</Label>
                  <Input
                    value={settings.payment_messaging.online_coming_soon_text}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        payment_messaging: { ...prev.payment_messaging, online_coming_soon_text: e.target.value },
                      }))
                    }
                    placeholder="Online payments: Coming Soon"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Online Payments Coming Soon</Label>
                    <p className="text-sm text-muted-foreground">Show "Coming Soon" badge for online payments</p>
                  </div>
                  <Switch
                    checked={settings.online_payments.coming_soon}
                    onCheckedChange={(checked) =>
                      setSettings((prev) => ({
                        ...prev,
                        online_payments: { ...prev.online_payments, coming_soon: checked },
                      }))
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Button onClick={saveSiteSettings} disabled={isSaving} size="lg">
              {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save Announcements & Messaging
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
