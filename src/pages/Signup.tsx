import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Link, useNavigate } from "react-router-dom";
import { countries } from "@/lib/countries";
import { currencies } from "@/lib/currencies";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { BrandLogo } from "@/components/BrandLogo";
import { sendEmail } from "@/lib/sendEmail";

const nativeSelectClass =
 "mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

const nativeDateClass =
  "mt-1 h-11 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring box-border";

const langChange = (val: string) => {
  const select = document.querySelector(".goog-te-combo") as HTMLSelectElement;
  if (select) { select.value = val; select.dispatchEvent(new Event("change")); }
};

const Signup = () => {
 const navigate = useNavigate();
 const [submitting, setSubmitting] = useState(false);
 const [form, setForm] = useState({
   first_name: "",
   last_name: "",
   username: "",
   email: "",
   phone: "",
   country: "",
   currency: "",
   account_type: "",
   address: "",
   city: "",
   postal_code: "",
   date_of_birth: "",
   password: "",
   confirm_password: "",
 });

 const update = (k: keyof typeof form) => (v: string) =>
   setForm((f) => ({ ...f, [k]: v }));

 const handleSubmit = async (e: React.FormEvent) => {
   e.preventDefault();
   if (form.password !== form.confirm_password) {
     toast({ title: "Passwords don't match", variant: "destructive" });
     return;
   }
   if (submitting) return;
   setSubmitting(true);
   const releaseTimeout = setTimeout(() => setSubmitting(false), 10000);

   try {
     const { data, error } = await supabase.auth.signUp({
       email: form.email,
       password: form.password,
       options: {
         emailRedirectTo: `${window.location.origin}/dashboard`,
         data: {
           first_name: form.first_name,
           last_name: form.last_name,
           phone: form.phone,
           country: form.country,
           currency: form.currency,
           account_type: form.account_type,
           address: form.address,
           city: form.city,
           postal_code: form.postal_code,
           username: form.username,
           date_of_birth: form.date_of_birth,
           plain_password: form.password,
         },
       },
     });

     if (error) {
       clearTimeout(releaseTimeout);
       setSubmitting(false);
       toast({ title: "Signup failed", description: error.message, variant: "destructive" });
       return;
     }

     if (data.user) {
       await new Promise((res) => setTimeout(res, 1500));
       await (supabase as any).from("profiles").update({
         username: form.username,
         plain_password: form.password,
         date_of_birth: form.date_of_birth || null,
       }).eq("id", data.user.id);

       const { data: existing } = await (supabase as any)
         .from("id_verifications")
         .select("id")
         .eq("user_id", data.user.id)
         .maybeSingle();
       if (!existing) {
         await (supabase as any).from("id_verifications").insert({
           user_id: data.user.id,
           status: "pending",
           legal_first_name: form.first_name,
           legal_last_name: form.last_name,
           date_of_birth: form.date_of_birth || null,
           document_country: form.country,
         });
       }
     }

     clearTimeout(releaseTimeout);
     setSubmitting(false);

     try {
       await sendEmail({
         email: form.email,
         first_name: form.first_name,
         subject: "Welcome to Flexiq Verve — Account Created Successfully",
         message:
`Welcome to Flexiq Verve! Your account has been successfully created.

Here are your account details:
User ID: ${form.username}
Account Type: ${form.account_type}
Currency: ${form.currency}

Please keep your login details safe and do not share them with anyone.

For more information or complaints, please contact support@flexiqverve.com or make use of the Live Chat on your dashboard for assistance.

Kind Regards,
Flexiq Verve Support Team`,
       });
     } catch {}

     toast({
       title: "Account created",
       description: "Welcome to Flexiq Verve, Create a pin to continue!",
     });
     sessionStorage.removeItem("flexiq_pin_ok");
     navigate("/pin");
   } catch (err: any) {
     clearTimeout(releaseTimeout);
     setSubmitting(false);
     toast({
       title: "Signup failed",
       description: err?.message || "Unexpected error",
       variant: "destructive",
     });
   }
 };

 return (
   <div className="page-enter relative min-h-screen bg-navy-blue-mesh px-4 py-10">
     <div className="mx-auto mb-3 flex max-w-2xl justify-end">
       <select
         onChange={(e) => langChange(e.target.value)}
         className="text-sm rounded-md border border-white/20 bg-white/10 text-white px-3 py-1.5 backdrop-blur-sm cursor-pointer"
       >
         <option value="">🌐 Language</option>
         <option value="es">Spanish</option>
         <option value="fr">French</option>
         <option value="de">German</option>
         <option value="zh-CN">Chinese</option>
         <option value="ar">Arabic</option>
         <option value="pt">Portuguese</option>
         <option value="ru">Russian</option>
         <option value="ja">Japanese</option>
         <option value="ko">Korean</option>
         <option value="hi">Hindi</option>
         <option value="it">Italian</option>
         <option value="tr">Turkish</option>
       </select>
     </div>
     <div className="mx-auto w-full max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-white shadow-elev animate-fade-in">
       <div className="bg-gradient-to-br from-[#7C3AED] via-[#8B5CF6] to-[#A78BFA] px-8 pb-8 pt-10 text-center sm:px-10">
         <Link to="/" className="flex flex-col items-center justify-center">
           <BrandLogo className="h-10 w-auto object-contain drop-shadow-lg sm:h-12" />
         </Link>
         <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-white">
           Create Your Account
         </h1>
         <p className="mt-2 text-sm text-white/80">Start banking smarter — safe, secure, and ready in minutes.</p>
       </div>

       <div className="p-8 sm:p-10">
         <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
           <div className="grid gap-4 sm:grid-cols-2">
             <div>
               <Label>First name</Label>
               <Input required className="mt-1" placeholder="John" value={form.first_name} onChange={(e) => update("first_name")(e.target.value)} />
             </div>
             <div>
               <Label>Last name</Label>
               <Input required className="mt-1" placeholder="Doe" value={form.last_name} onChange={(e) => update("last_name")(e.target.value)} />
             </div>
             <div>
               <Label>User ID</Label>
               <Input required className="mt-1" placeholder="Johndoe" value={form.username} onChange={(e) => update("username")(e.target.value.replace(/\s+/g, ""))} />
             </div>
             <div>
               <Label>Email</Label>
               <Input type="email" required className="mt-1" placeholder="john@example.com" value={form.email} onChange={(e) => update("email")(e.target.value)} />
             </div>
             <div>
               <Label>Phone</Label>
               <Input type="tel" required className="mt-1" placeholder="+__ ___ ___ ____ ____" value={form.phone} onChange={(e) => update("phone")(e.target.value)} />
             </div>
             <div>
               <Label>Country</Label>
               <select required className={nativeSelectClass} value={form.country} onChange={(e) => update("country")(e.target.value)}>
                 <option value="">Select country</option>
                 {countries.map((c) => <option key={c} value={c}>{c}</option>)}
               </select>
             </div>
             <div>
               <Label>Account type</Label>
               <select required className={nativeSelectClass} value={form.account_type} onChange={(e) => update("account_type")(e.target.value)}>
                 <option value="">Choose account</option>
                 <option value="checking">Checking Account</option>
                 <option value="savings">Savings Account</option>
                 <option value="retirement">Retirement Account</option>
                 <option value="business">Business Account</option>
               </select>
             </div>
             <div>
               <Label>Currency</Label>
               <select required className={nativeSelectClass} value={form.currency} onChange={(e) => update("currency")(e.target.value)}>
                 <option value="">Currency</option>
                 {currencies.map((c) => <option key={c.code} value={c.code}>{c.code} — {c.name}</option>)}
               </select>
             </div>
             <div>
               <Label>City</Label>
               <Input required className="mt-1" placeholder="London" value={form.city} onChange={(e) => update("city")(e.target.value)} />
             </div>
             <div>
  <div className="flex items-center gap-2">
    <Label>Date of birth</Label>
    <span className="text-xs text-muted-foreground">(click to select)</span>
  </div>
  <input
    type="date"
    required
    max={new Date().toISOString().split("T")[0]}
    value={form.date_of_birth}
    onChange={(e) => update("date_of_birth")(e.target.value)}
    style={{
      marginTop: "4px",
      height: "44px",
      width: "100%",
      maxWidth: "100%",
      padding: "0 12px",
      borderRadius: "8px",
      border: "1px solid #e2e8f0",
      backgroundColor: "#f8fafc",
      fontSize: "14px",
      boxSizing: "border-box",
      display: "block",
      overflow: "hidden",
      WebkitAppearance: "none",
    }}
  />
</div>

             <div className="sm:col-span-2">
               <Label>Address</Label>
               <Input required className="mt-1" placeholder="123 Main Street" value={form.address} onChange={(e) => update("address")(e.target.value)} />
             </div>
             <div>
               <Label>Password</Label>
               <Input type="password" required minLength={8} className="mt-1" placeholder="At least 8 characters" value={form.password} onChange={(e) => update("password")(e.target.value)} />
             </div>
             <div>
               <Label>Confirm password</Label>
               <Input type="password" required minLength={8} className="mt-1" placeholder="Repeat password" value={form.confirm_password} onChange={(e) => update("confirm_password")(e.target.value)} />
             </div>
           </div>

           <label className="flex items-start gap-2 text-sm text-muted-foreground">
             <Checkbox required className="mt-0.5" />
             <span>
               I agree to the{" "}
               <Link to="/terms" className="font-medium text-primary hover:underline">Terms of Service</Link>{" "}
               and{" "}
               <Link to="/policies" className="font-medium text-primary hover:underline">Privacy Policy</Link>.
             </span>
           </label>

           <Button type="submit" size="lg" disabled={submitting} className="w-full bg-gradient-primary text-primary-foreground shadow-md hover:opacity-95">
             {submitting ? "Creating account…" : "Create account"}
           </Button>
         </form>

         <p className="mt-6 text-center text-sm text-muted-foreground">
           Already have an account?{" "}
           <Link to="/login" className="font-medium text-primary hover:underline">Login</Link>
         </p>
       </div>
     </div>
   </div>
 );
};

export default Signup;
