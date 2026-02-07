import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Users, Building, Truck, FileText, Lock, Check, 
  ArrowRight, Phone, Mail, Eye, EyeOff, Loader2, Upload, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Layout } from "@/components/layout/Layout";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { DealerDashboard } from "@/components/dealer/DealerDashboard";
import { useCompanyInfo } from "@/hooks/useCompanyInfo";

const benefits = [
  { icon: Truck, title: "Wholesale Pricing", description: "Access exclusive dealer pricing on all products" },
  { icon: FileText, title: "Easy Ordering", description: "Streamlined order and quote request system" },
  { icon: Users, title: "Dedicated Support", description: "Priority support from our dealer team" },
  { icon: Building, title: "Bulk Orders", description: "Special pricing for volume purchases" },
];

export default function DealersPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isLoading: authLoading, signIn, signUp, signOut, isDealer, isApprovedDealer, dealerInfo } = useAuth();
  const { companyInfo, formatPhone } = useCompanyInfo();
  
  const [activeTab, setActiveTab] = useState("info");
  const [isApplying, setIsApplying] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [isUploadingDocument, setIsUploadingDocument] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    businessName: "", contactName: "", email: "", phone: "",
    address: "", city: "", postalCode: "", notes: "",
  });

  const [loginData, setLoginData] = useState({
    email: "", password: "",
  });

  const phoneDisplay = companyInfo.contact.phone || null;
  const emailDisplay = companyInfo.contact.email || null;

  useEffect(() => {
    if (user && isApprovedDealer) {
      navigate("/shop");
    }
  }, [user, isApprovedDealer, navigate]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "File Too Large", description: "Please upload a file smaller than 5MB.", variant: "destructive" });
        return;
      }
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        toast({ title: "Invalid File Type", description: "Please upload a PDF or image file.", variant: "destructive" });
        return;
      }
      setDocumentFile(file);
    }
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error: signUpError } = await signUp(formData.email, loginData.password);
      
      if (signUpError) {
        if (signUpError.message.includes("already registered")) {
          toast({ title: "Account Exists", description: "Please log in instead.", variant: "destructive" });
        } else {
          throw signUpError;
        }
        setIsSubmitting(false);
        return;
      }

      const { data: { user: newUser } } = await supabase.auth.getUser();

      let documentUrl: string | null = null;
      if (documentFile && newUser) {
        setIsUploadingDocument(true);
        const fileExt = documentFile.name.split('.').pop();
        const filePath = `${newUser.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('dealer-documents')
          .upload(filePath, documentFile);
        
        if (!uploadError) {
          const { data: urlData } = supabase.storage.from('dealer-documents').getPublicUrl(filePath);
          documentUrl = urlData?.publicUrl || filePath;
        }
        setIsUploadingDocument(false);
      }

      const { error: dealerError } = await supabase.from("dealers").insert({
        user_id: newUser?.id,
        business_name: formData.businessName,
        contact_name: formData.contactName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        postal_code: formData.postalCode,
        notes: formData.notes || null,
        document_url: documentUrl,
        status: "pending",
      });

      if (dealerError) throw dealerError;

      toast({ title: "Application Submitted!", description: "We'll contact you within 1-2 business days." });
      setIsApplying(false);
    } catch (error: any) {
      toast({ title: "Application Failed", description: error.message || "Please try again.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await signIn(loginData.email, loginData.password);
      
      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast({ title: "Login Failed", description: "Invalid email or password.", variant: "destructive" });
        } else {
          throw error;
        }
        setIsSubmitting(false);
        return;
      }

      toast({ title: "Welcome Back!", description: "You have successfully logged in." });
    } catch (error: any) {
      toast({ title: "Login Failed", description: error.message || "An error occurred.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast({ title: "Signed Out", description: "You have been signed out successfully." });
  };

  if (user && !authLoading) {
    return (
      <Layout>
        <div className="container py-8 md:py-12">
          <DealerDashboard />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="section-gray min-h-screen">
        <div className="container py-12 md:py-20">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="max-w-4xl mx-auto">
            <TabsList className="grid w-full grid-cols-2 mb-12">
              <TabsTrigger value="info" className="text-base">Dealer Program</TabsTrigger>
              <TabsTrigger value="login" className="text-base">Dealer Login</TabsTrigger>
            </TabsList>

            <TabsContent value="info">
              {/* Hero */}
              <div className="text-center mb-12">
                <div className="inline-flex p-4 rounded-md bg-primary/10 mb-6">
                  <Building className="h-10 w-10 text-primary" />
                </div>
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                  Become a Kore Tires Dealer
                </h1>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Partner with us for wholesale pricing, priority service, and a dedicated dealer portal.
                </p>
              </div>

              {/* Benefits grid */}
              <div className="grid sm:grid-cols-2 gap-6 mb-12">
                {benefits.map((benefit) => {
                  const Icon = benefit.icon;
                  return (
                    <div key={benefit.title} className="classic-card p-6">
                      <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center mb-4">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="font-semibold text-lg mb-2">{benefit.title}</h3>
                      <p className="text-muted-foreground text-sm">{benefit.description}</p>
                    </div>
                  );
                })}
              </div>

              {/* Application form */}
              {!isApplying ? (
                <div className="text-center classic-card p-8">
                  <h2 className="text-2xl font-bold mb-4">Ready to Partner With Us?</h2>
                  <p className="text-muted-foreground mb-6">
                    Apply now and our team will review your application within 1-2 business days.
                  </p>
                  <Button variant="default" size="lg" onClick={() => setIsApplying(true)}>
                    Apply to Become a Dealer
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleApply} className="classic-card p-6 space-y-5">
                  <h2 className="text-2xl font-bold mb-6">Dealer Application</h2>
                  
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="businessName">Business Name *</Label>
                      <Input id="businessName" required value={formData.businessName}
                        onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                        className="bg-muted mt-1.5" />
                    </div>
                    <div>
                      <Label htmlFor="contactName">Contact Name *</Label>
                      <Input id="contactName" required value={formData.contactName}
                        onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                        className="bg-muted mt-1.5" />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input id="email" type="email" required value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="bg-muted mt-1.5" />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone *</Label>
                      <Input id="phone" type="tel" required value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="bg-muted mt-1.5" />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="address">Business Address *</Label>
                    <Input id="address" required value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="bg-muted mt-1.5" />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">City *</Label>
                      <Input id="city" required value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="bg-muted mt-1.5" />
                    </div>
                    <div>
                      <Label htmlFor="postalCode">Postal Code *</Label>
                      <Input id="postalCode" required value={formData.postalCode}
                        onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                        className="bg-muted mt-1.5" />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="password">Create Password *</Label>
                    <div className="relative mt-1.5">
                      <Input id="password" type={showPassword ? "text" : "password"} required minLength={6}
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        className="bg-muted pr-10" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Minimum 6 characters</p>
                  </div>

                  <div>
                    <Label htmlFor="notes">Additional Information</Label>
                    <Textarea id="notes" rows={3} placeholder="Tell us about your business..."
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="bg-muted mt-1.5" />
                  </div>

                  {/* Document Upload */}
                  <div>
                    <Label htmlFor="document">Business License / Documentation (Optional)</Label>
                    <p className="text-xs text-muted-foreground mb-2">
                      Upload your business license or other supporting documents (PDF, JPG, PNG - max 5MB)
                    </p>
                    <input ref={fileInputRef} type="file" id="document" accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileChange} className="hidden" />
                    {!documentFile ? (
                      <Button type="button" variant="outline" className="w-full"
                        onClick={() => fileInputRef.current?.click()}>
                        <Upload className="h-4 w-4 mr-2" />
                        Choose File
                      </Button>
                    ) : (
                      <div className="flex items-center gap-2 p-3 rounded-md bg-muted border">
                        <FileText className="h-5 w-5 text-primary shrink-0" />
                        <span className="text-sm truncate flex-1">{documentFile.name}</span>
                        <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0"
                          onClick={() => { setDocumentFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsApplying(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" variant="default" className="flex-1" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <><Loader2 className="h-4 w-4 animate-spin" />Submitting...</>
                      ) : (
                        <>Submit Application<ArrowRight className="h-4 w-4" /></>
                      )}
                    </Button>
                  </div>
                </form>
              )}

              {/* Contact info */}
              <div className="mt-12 text-center">
                <p className="text-muted-foreground mb-4">Questions about the dealer program?</p>
                <div className="flex flex-wrap justify-center gap-4">
                  {phoneDisplay && (
                    <Button variant="outline" asChild>
                      <a href={`tel:${formatPhone(phoneDisplay)}`}>
                        <Phone className="h-4 w-4" />{phoneDisplay}
                      </a>
                    </Button>
                  )}
                  {emailDisplay && (
                    <Button variant="outline" asChild>
                      <a href={`mailto:${emailDisplay}`}>
                        <Mail className="h-4 w-4" />{emailDisplay}
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="login">
              <div className="max-w-md mx-auto">
                <div className="text-center mb-8">
                  <div className="inline-flex p-4 rounded-md bg-primary/10 mb-6">
                    <Lock className="h-10 w-10 text-primary" />
                  </div>
                  <h1 className="text-3xl font-bold mb-2">Dealer Login</h1>
                  <p className="text-muted-foreground">
                    Access your dealer account and wholesale pricing.
                  </p>
                </div>

                <form onSubmit={handleLogin} className="classic-card p-6 space-y-5">
                  <div>
                    <Label htmlFor="loginEmail">Email</Label>
                    <Input id="loginEmail" type="email" required value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                      className="bg-muted mt-1.5" />
                  </div>

                  <div>
                    <Label htmlFor="loginPassword">Password</Label>
                    <div className="relative mt-1.5">
                      <Input id="loginPassword" type={showPassword ? "text" : "password"} required
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        className="bg-muted pr-10" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <Button type="submit" variant="default" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <><Loader2 className="h-4 w-4 animate-spin" />Signing in...</>
                    ) : (
                      <>Sign In<ArrowRight className="h-4 w-4" /></>
                    )}
                  </Button>
                </form>

                <div className="mt-6 text-center">
                  <p className="text-muted-foreground">
                    Don't have an account?{" "}
                    <button onClick={() => { setActiveTab("info"); setIsApplying(true); }}
                      className="text-primary hover:underline font-medium">
                      Apply to become a dealer
                    </button>
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
}
