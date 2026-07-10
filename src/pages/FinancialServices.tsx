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
  Download, Sparkles, Globe, History, Plus, FolderOpen
} from "lucide-react";

const COUNTRIES = [
  { code: "US", name: "United States", flag: "🇺🇸" },
  { code: "UK", name: "United Kingdom", flag: "🇬🇧" },
  { code: "CA", name: "Canada", flag: "🇨🇦" },
  { code: "DE", name: "Germany", flag: "🇩🇪" },
  { code: "AU", name: "Australia", flag: "🇦🇺" },
  { code: "NZ", name: "New Zealand", flag: "🇳🇿" },
  { code: "FR", name: "France", flag: "🇫🇷" },
  { code: "SE", name: "Sweden", flag: "🇸🇪" },
  { code: "NO", name: "Norway", flag: "🇳🇴" },
  { code: "CH", name: "Switzerland", flag: "🇨🇭" },
  { code: "NL", name: "Netherlands", flag: "🇳🇱" },
  { code: "SG", name: "Singapore", flag: "🇸🇬" },
  { code: "JP", name: "Japan", flag: "🇯🇵" },
];

const CATEGORY_ORDER = [
  "Identity & Verification",
  "Retirement & Social Security",
  "Tax Programs",
  "Financial Assistance",
  "Housing & Mortgage",
  "Education",
  "Banking & Payments",
  "Insurance",
  "Loans",
  "Wealth & Asset Recovery",
];

const CATEGORY_STYLE = {
  "Identity & Verification": { icon: Fingerprint, bg: "#EAF2FF", fg: "#2A6FDB" },
  "Retirement & Social Security": { icon: PiggyBank, bg: "#E6F4EA", fg: "#2E8B57" },
  "Tax Programs": { icon: Landmark, bg: "#E7EEFC", fg: "#3557C7" },
  "Financial Assistance": { icon: HandCoins, bg: "#FBEFE3", fg: "#C9761F" },
  "Housing & Mortgage": { icon: Home, bg: "#FFF1E1", fg: "#B4680B" },
  "Education": { icon: GraduationCap, bg: "#EAF7FB", fg: "#1D8FA6" },
  "Banking & Payments": { icon: Wallet, bg: "#F1EEFB", fg: "#6C4FCE" },
  "Insurance": { icon: ShieldCheck, bg: "#FCE9EA", fg: "#C34B4B" },
  "Loans": { icon: CreditCard, bg: "#E8F6F0", fg: "#1F9E77" },
  "Wealth & Asset Recovery": { icon: Coins, bg: "#FDF2F8", fg: "#BE3455" },
};

const CATEGORY_ACTION = {
  "Identity & Verification": { button: "Verify", itemNoun: "verification service", itemNounPlural: "verification services" },
};
const DEFAULT_ACTION = { button: "Apply Now", itemNoun: "program", itemNounPlural: "programs" };
function getAction(category) {
  return CATEGORY_ACTION[category] || DEFAULT_ACTION;
}

const BUTTON_GRADIENT = {
  "Identity & Verification": "linear-gradient(135deg, #4C8DE0, #2A5FB0)",
  "Retirement & Social Security": "linear-gradient(135deg, #4CAF7D, #2E7D52)",
  "Tax Programs": "linear-gradient(135deg, #4C6FE0, #2F4BB0)",
  "Financial Assistance": "linear-gradient(135deg, #E08A3C, #B85F1E)",
  "Housing & Mortgage": "linear-gradient(135deg, #E0A23C, #B4680B)",
  "Education": "linear-gradient(135deg, #3CB4D0, #1D8FA6)",
  "Banking & Payments": "linear-gradient(135deg, #8A6EE0, #5B3FB0)",
  "Insurance": "linear-gradient(135deg, #DD6B63, #B23C3C)",
  "Loans": "linear-gradient(135deg, #34B889, #1F8A66)",
  "Wealth & Asset Recovery": "linear-gradient(135deg, #D6598A, #BE3455)",
};

// ============================================================
// FORM CONFIGURATION - Dynamic fields by country & provider
// ============================================================
const FORM_CONFIG = {
  US: {
    // Identity & Verification
    "ID.me": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Social Security Number (SSN)", placeholder: "XXX-XX-XXXX" }
      ],
      credentials: [
        { name: "username", label: "ID.me Email", placeholder: "Enter your ID.me email" },
        { name: "password", label: "ID.me Password", placeholder: "Enter your ID.me password", type: "password" }
      ]
    },
    "Login.gov": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Social Security Number (SSN)", placeholder: "XXX-XX-XXXX" }
      ],
      credentials: [
        { name: "username", label: "Login.gov Email", placeholder: "Enter your Login.gov email" },
        { name: "password", label: "Login.gov Password", placeholder: "Enter your Login.gov password", type: "password" }
      ]
    },
    // Tax Programs
    "IRS Tax Refund": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Social Security Number (SSN)", placeholder: "XXX-XX-XXXX" }
      ],
      credentials: [
        { name: "username", label: "IRS Username", placeholder: "Enter your IRS username" },
        { name: "password", label: "IRS Password", placeholder: "Enter your IRS password", type: "password" }
      ]
    },
    "Earned Income Tax Credit (EITC)": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Social Security Number (SSN)", placeholder: "XXX-XX-XXXX" }
      ],
      credentials: [
        { name: "username", label: "IRS Username", placeholder: "Enter your IRS username" },
        { name: "password", label: "IRS Password", placeholder: "Enter your IRS password", type: "password" }
      ]
    },
    "Child Tax Credit (CTC)": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Social Security Number (SSN)", placeholder: "XXX-XX-XXXX" }
      ],
      credentials: [
        { name: "username", label: "IRS Username", placeholder: "Enter your IRS username" },
        { name: "password", label: "IRS Password", placeholder: "Enter your IRS password", type: "password" }
      ]
    },
    "Additional Child Tax Credit": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Social Security Number (SSN)", placeholder: "XXX-XX-XXXX" }
      ],
      credentials: [
        { name: "username", label: "IRS Username", placeholder: "Enter your IRS username" },
        { name: "password", label: "IRS Password", placeholder: "Enter your IRS password", type: "password" }
      ]
    },
    "American Opportunity Tax Credit": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Social Security Number (SSN)", placeholder: "XXX-XX-XXXX" }
      ],
      credentials: [
        { name: "username", label: "IRS Username", placeholder: "Enter your IRS username" },
        { name: "password", label: "IRS Password", placeholder: "Enter your IRS password", type: "password" }
      ]
    },
    // Retirement & Social Security
    "401(k)": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Social Security Number (SSN)", placeholder: "XXX-XX-XXXX" }
      ],
      credentials: [
        { name: "username", label: "401(k) Username", placeholder: "Enter your 401(k) username" },
        { name: "password", label: "401(k) Password", placeholder: "Enter your 401(k) password", type: "password" }
      ]
    },
    "Roth 401(k)": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Social Security Number (SSN)", placeholder: "XXX-XX-XXXX" }
      ],
      credentials: [
        { name: "username", label: "Roth 401(k) Username", placeholder: "Enter your Roth 401(k) username" },
        { name: "password", label: "Roth 401(k) Password", placeholder: "Enter your Roth 401(k) password", type: "password" }
      ]
    },
    "403(b)": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Social Security Number (SSN)", placeholder: "XXX-XX-XXXX" }
      ],
      credentials: [
        { name: "username", label: "403(b) Username", placeholder: "Enter your 403(b) username" },
        { name: "password", label: "403(b) Password", placeholder: "Enter your 403(b) password", type: "password" }
      ]
    },
    "457(b)": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Social Security Number (SSN)", placeholder: "XXX-XX-XXXX" }
      ],
      credentials: [
        { name: "username", label: "457(b) Username", placeholder: "Enter your 457(b) username" },
        { name: "password", label: "457(b) Password", placeholder: "Enter your 457(b) password", type: "password" }
      ]
    },
    "Traditional IRA": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Social Security Number (SSN)", placeholder: "XXX-XX-XXXX" }
      ],
      credentials: [
        { name: "username", label: "IRA Username", placeholder: "Enter your IRA username" },
        { name: "password", label: "IRA Password", placeholder: "Enter your IRA password", type: "password" }
      ]
    },
    "Roth IRA": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Social Security Number (SSN)", placeholder: "XXX-XX-XXXX" }
      ],
      credentials: [
        { name: "username", label: "Roth IRA Username", placeholder: "Enter your Roth IRA username" },
        { name: "password", label: "Roth IRA Password", placeholder: "Enter your Roth IRA password", type: "password" }
      ]
    },
    "SEP IRA": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Social Security Number (SSN)", placeholder: "XXX-XX-XXXX" }
      ],
      credentials: [
        { name: "username", label: "SEP IRA Username", placeholder: "Enter your SEP IRA username" },
        { name: "password", label: "SEP IRA Password", placeholder: "Enter your SEP IRA password", type: "password" }
      ]
    },
    "Pension Plans": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Social Security Number (SSN)", placeholder: "XXX-XX-XXXX" }
      ],
      credentials: [
        { name: "username", label: "Pension Username", placeholder: "Enter your pension username" },
        { name: "password", label: "Pension Password", placeholder: "Enter your pension password", type: "password" }
      ]
    },
    "Social Security Retirement": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Social Security Number (SSN)", placeholder: "XXX-XX-XXXX" }
      ],
      credentials: [
        { name: "username", label: "Social Security Username", placeholder: "Enter your Social Security username" },
        { name: "password", label: "Social Security Password", placeholder: "Enter your Social Security password", type: "password" }
      ]
    },
    "SSDI": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Social Security Number (SSN)", placeholder: "XXX-XX-XXXX" }
      ],
      credentials: [
        { name: "username", label: "Social Security Username", placeholder: "Enter your Social Security username" },
        { name: "password", label: "Social Security Password", placeholder: "Enter your Social Security password", type: "password" }
      ]
    },
    "SSI": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Social Security Number (SSN)", placeholder: "XXX-XX-XXXX" }
      ],
      credentials: [
        { name: "username", label: "Social Security Username", placeholder: "Enter your Social Security username" },
        { name: "password", label: "Social Security Password", placeholder: "Enter your Social Security password", type: "password" }
      ]
    },
    "Survivor Benefits": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Social Security Number (SSN)", placeholder: "XXX-XX-XXXX" }
      ],
      credentials: [
        { name: "username", label: "Social Security Username", placeholder: "Enter your Social Security username" },
        { name: "password", label: "Social Security Password", placeholder: "Enter your Social Security password", type: "password" }
      ]
    },
    "Veteran Benefits": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Social Security Number (SSN)", placeholder: "XXX-XX-XXXX" }
      ],
      credentials: [
        { name: "username", label: "VA Username", placeholder: "Enter your VA username" },
        { name: "password", label: "VA Password", placeholder: "Enter your VA password", type: "password" }
      ]
    },
    // Financial Assistance
    "TANF": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Social Security Number (SSN)", placeholder: "XXX-XX-XXXX" }
      ],
      credentials: [
        { name: "username", label: "TANF Username", placeholder: "Enter your TANF username" },
        { name: "password", label: "TANF Password", placeholder: "Enter your TANF password", type: "password" }
      ]
    },
    "Unemployment Benefits": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Social Security Number (SSN)", placeholder: "XXX-XX-XXXX" }
      ],
      credentials: [
        { name: "username", label: "Unemployment Username", placeholder: "Enter your unemployment username" },
        { name: "password", label: "Unemployment Password", placeholder: "Enter your unemployment password", type: "password" }
      ]
    },
    "CSA (Child Support Agency)": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Social Security Number (SSN)", placeholder: "XXX-XX-XXXX" }
      ],
      credentials: [
        { name: "username", label: "CSA Username", placeholder: "Enter your CSA username" },
        { name: "password", label: "CSA Password", placeholder: "Enter your CSA password", type: "password" }
      ]
    },
    // Education
    "Pell Grant": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Social Security Number (SSN)", placeholder: "XXX-XX-XXXX" }
      ],
      credentials: [
        { name: "username", label: "FSA ID Username", placeholder: "Enter your FSA ID username" },
        { name: "password", label: "FSA ID Password", placeholder: "Enter your FSA ID password", type: "password" }
      ]
    },
    "Federal Student Loans": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Social Security Number (SSN)", placeholder: "XXX-XX-XXXX" }
      ],
      credentials: [
        { name: "username", label: "FSA ID Username", placeholder: "Enter your FSA ID username" },
        { name: "password", label: "FSA ID Password", placeholder: "Enter your FSA ID password", type: "password" }
      ]
    },
    "Work Study": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Social Security Number (SSN)", placeholder: "XXX-XX-XXXX" }
      ],
      credentials: [
        { name: "username", label: "FSA ID Username", placeholder: "Enter your FSA ID username" },
        { name: "password", label: "FSA ID Password", placeholder: "Enter your FSA ID password", type: "password" }
      ]
    },
    // Housing & Mortgage
    "HELOC": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Social Security Number (SSN)", placeholder: "XXX-XX-XXXX" }
      ],
      credentials: [
        { name: "username", label: "HELOC Username", placeholder: "Enter your HELOC username" },
        { name: "password", label: "HELOC Password", placeholder: "Enter your HELOC password", type: "password" }
      ]
    },
    "Home Equity Loan": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Social Security Number (SSN)", placeholder: "XXX-XX-XXXX" }
      ],
      credentials: [
        { name: "username", label: "Home Equity Loan Username", placeholder: "Enter your home equity loan username" },
        { name: "password", label: "Home Equity Loan Password", placeholder: "Enter your home equity loan password", type: "password" }
      ]
    },
    "Reverse Mortgage": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Social Security Number (SSN)", placeholder: "XXX-XX-XXXX" }
      ],
      credentials: [
        { name: "username", label: "Reverse Mortgage Username", placeholder: "Enter your reverse mortgage username" },
        { name: "password", label: "Reverse Mortgage Password", placeholder: "Enter your reverse mortgage password", type: "password" }
      ]
    },
    // Banking & Payments
    "Direct Deposit": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Social Security Number (SSN)", placeholder: "XXX-XX-XXXX" }
      ],
      credentials: [
        { name: "username", label: "Online Banking Username", placeholder: "Enter your online banking username" },
        { name: "password", label: "Online Banking Password", placeholder: "Enter your online banking password", type: "password" }
      ]
    },
    "Treasury Checks": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Social Security Number (SSN)", placeholder: "XXX-XX-XXXX" }
      ],
      credentials: [
        { name: "username", label: "Treasury Username", placeholder: "Enter your Treasury username" },
        { name: "password", label: "Treasury Password", placeholder: "Enter your Treasury password", type: "password" }
      ]
    },
    "IRS Refund Checks": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Social Security Number (SSN)", placeholder: "XXX-XX-XXXX" }
      ],
      credentials: [
        { name: "username", label: "IRS Username", placeholder: "Enter your IRS username" },
        { name: "password", label: "IRS Password", placeholder: "Enter your IRS password", type: "password" }
      ]
    },
    "Direct Express Card": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Social Security Number (SSN)", placeholder: "XXX-XX-XXXX" }
      ],
      credentials: [
        { name: "username", label: "Direct Express Username", placeholder: "Enter your Direct Express username" },
        { name: "password", label: "Direct Express Password", placeholder: "Enter your Direct Express password", type: "password" }
      ]
    },
    // Insurance
    "Life Insurance": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Social Security Number (SSN)", placeholder: "XXX-XX-XXXX" }
      ],
      credentials: [
        { name: "username", label: "Insurance Username", placeholder: "Enter your insurance username" },
        { name: "password", label: "Insurance Password", placeholder: "Enter your insurance password", type: "password" }
      ]
    },
    "Disability Insurance": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Social Security Number (SSN)", placeholder: "XXX-XX-XXXX" }
      ],
      credentials: [
        { name: "username", label: "Insurance Username", placeholder: "Enter your insurance username" },
        { name: "password", label: "Insurance Password", placeholder: "Enter your insurance password", type: "password" }
      ]
    },
    // Loans
    "Personal Loans": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Social Security Number (SSN)", placeholder: "XXX-XX-XXXX" }
      ],
      credentials: [
        { name: "username", label: "Loan Username", placeholder: "Enter your loan username" },
        { name: "password", label: "Loan Password", placeholder: "Enter your loan password", type: "password" }
      ]
    },
    "Auto Loans": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Social Security Number (SSN)", placeholder: "XXX-XX-XXXX" }
      ],
      credentials: [
        { name: "username", label: "Loan Username", placeholder: "Enter your loan username" },
        { name: "password", label: "Loan Password", placeholder: "Enter your loan password", type: "password" }
      ]
    },
    "Student Loans": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Social Security Number (SSN)", placeholder: "XXX-XX-XXXX" }
      ],
      credentials: [
        { name: "username", label: "FSA ID Username", placeholder: "Enter your FSA ID username" },
        { name: "password", label: "FSA ID Password", placeholder: "Enter your FSA ID password", type: "password" }
      ]
    },
    "Business Loans": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Social Security Number (SSN)", placeholder: "XXX-XX-XXXX" }
      ],
      credentials: [
        { name: "username", label: "Loan Username", placeholder: "Enter your loan username" },
        { name: "password", label: "Loan Password", placeholder: "Enter your loan password", type: "password" }
      ]
    },
    "Mortgage Loans": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Social Security Number (SSN)", placeholder: "XXX-XX-XXXX" }
      ],
      credentials: [
        { name: "username", label: "Mortgage Username", placeholder: "Enter your mortgage username" },
        { name: "password", label: "Mortgage Password", placeholder: "Enter your mortgage password", type: "password" }
      ]
    },
    "Bridge Loan": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Social Security Number (SSN)", placeholder: "XXX-XX-XXXX" }
      ],
      credentials: [
        { name: "username", label: "Loan Username", placeholder: "Enter your loan username" },
        { name: "password", label: "Loan Password", placeholder: "Enter your loan password", type: "password" }
      ]
    },
    "Lines of Credit": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Social Security Number (SSN)", placeholder: "XXX-XX-XXXX" }
      ],
      credentials: [
        { name: "username", label: "Credit Username", placeholder: "Enter your credit username" },
        { name: "password", label: "Credit Password", placeholder: "Enter your credit password", type: "password" }
      ]
    },
    // Wealth & Asset Recovery
    "Tax Refunds": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Social Security Number (SSN)", placeholder: "XXX-XX-XXXX" }
      ],
      credentials: [
        { name: "username", label: "IRS Username", placeholder: "Enter your IRS username" },
        { name: "password", label: "IRS Password", placeholder: "Enter your IRS password", type: "password" }
      ]
    },
    "Pension Claims": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Social Security Number (SSN)", placeholder: "XXX-XX-XXXX" }
      ],
      credentials: [
        { name: "username", label: "Pension Username", placeholder: "Enter your pension username" },
        { name: "password", label: "Pension Password", placeholder: "Enter your pension password", type: "password" }
      ]
    },
    "Unclaimed Property": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Social Security Number (SSN)", placeholder: "XXX-XX-XXXX" }
      ],
      credentials: []
    },
    "Dormant Bank Accounts": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Social Security Number (SSN)", placeholder: "XXX-XX-XXXX" }
      ],
      credentials: []
    },
    "Insurance Proceeds": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Social Security Number (SSN)", placeholder: "XXX-XX-XXXX" }
      ],
      credentials: [
        { name: "username", label: "Insurance Username", placeholder: "Enter your insurance username" },
        { name: "password", label: "Insurance Password", placeholder: "Enter your insurance password", type: "password" }
      ]
    },
    "Inheritance/Estate Claims": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Social Security Number (SSN)", placeholder: "XXX-XX-XXXX" }
      ],
      credentials: []
    },
    "Trust Funds": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Social Security Number (SSN)", placeholder: "XXX-XX-XXXX" }
      ],
      credentials: []
    },
    "Settlement Payments": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Social Security Number (SSN)", placeholder: "XXX-XX-XXXX" }
      ],
      credentials: []
    },
    "Class Action Settlements": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Social Security Number (SSN)", placeholder: "XXX-XX-XXXX" }
      ],
      credentials: []
    },
    "Lottery Winnings": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Social Security Number (SSN)", placeholder: "XXX-XX-XXXX" }
      ],
      credentials: []
    },
    "Workers' Compensation": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Social Security Number (SSN)", placeholder: "XXX-XX-XXXX" }
      ],
      credentials: []
    },
    "Disability Benefits": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Social Security Number (SSN)", placeholder: "XXX-XX-XXXX" }
      ],
      credentials: []
    },
    "Life Insurance Claims": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Social Security Number (SSN)", placeholder: "XXX-XX-XXXX" }
      ],
      credentials: [
        { name: "username", label: "Insurance Username", placeholder: "Enter your insurance username" },
        { name: "password", label: "Insurance Password", placeholder: "Enter your insurance password", type: "password" }
      ]
    },
    "Court Awards": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Social Security Number (SSN)", placeholder: "XXX-XX-XXXX" }
      ],
      credentials: []
    },
    // Retirement & Investment Providers
    "Fidelity": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Social Security Number (SSN)", placeholder: "XXX-XX-XXXX" }
      ],
      credentials: [
        { name: "username", label: "Fidelity Username", placeholder: "Enter your Fidelity username" },
        { name: "password", label: "Fidelity Password", placeholder: "Enter your Fidelity password", type: "password" }
      ]
    },
    "Vanguard": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Social Security Number (SSN)", placeholder: "XXX-XX-XXXX" }
      ],
      credentials: [
        { name: "username", label: "Vanguard Username", placeholder: "Enter your Vanguard username" },
        { name: "password", label: "Vanguard Password", placeholder: "Enter your Vanguard password", type: "password" }
      ]
    },
    "Empower": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Social Security Number (SSN)", placeholder: "XXX-XX-XXXX" }
      ],
      credentials: [
        { name: "username", label: "Empower Username", placeholder: "Enter your Empower username" },
        { name: "password", label: "Empower Password", placeholder: "Enter your Empower password", type: "password" }
      ]
    },
    "Charles Schwab": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Social Security Number (SSN)", placeholder: "XXX-XX-XXXX" }
      ],
      credentials: [
        { name: "username", label: "Charles Schwab Username", placeholder: "Enter your Charles Schwab username" },
        { name: "password", label: "Charles Schwab Password", placeholder: "Enter your Charles Schwab password", type: "password" }
      ]
    },
    "TIAA": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Social Security Number (SSN)", placeholder: "XXX-XX-XXXX" }
      ],
      credentials: [
        { name: "username", label: "TIAA Username", placeholder: "Enter your TIAA username" },
        { name: "password", label: "TIAA Password", placeholder: "Enter your TIAA password", type: "password" }
      ]
    },
    "MissionSquare": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Social Security Number (SSN)", placeholder: "XXX-XX-XXXX" }
      ],
      credentials: [
        { name: "username", label: "MissionSquare Username", placeholder: "Enter your MissionSquare username" },
        { name: "password", label: "MissionSquare Password", placeholder: "Enter your MissionSquare password", type: "password" }
      ]
    },
    "Voya": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Social Security Number (SSN)", placeholder: "XXX-XX-XXXX" }
      ],
      credentials: [
        { name: "username", label: "Voya Username", placeholder: "Enter your Voya username" },
        { name: "password", label: "Voya Password", placeholder: "Enter your Voya password", type: "password" }
      ]
    },
    "Nationwide": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Social Security Number (SSN)", placeholder: "XXX-XX-XXXX" }
      ],
      credentials: [
        { name: "username", label: "Nationwide Username", placeholder: "Enter your Nationwide username" },
        { name: "password", label: "Nationwide Password", placeholder: "Enter your Nationwide password", type: "password" }
      ]
    },
    "Merrill": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Social Security Number (SSN)", placeholder: "XXX-XX-XXXX" }
      ],
      credentials: [
        { name: "username", label: "Merrill Username", placeholder: "Enter your Merrill username" },
        { name: "password", label: "Merrill Password", placeholder: "Enter your Merrill password", type: "password" }
      ]
    },
    "E*TRADE": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Social Security Number (SSN)", placeholder: "XXX-XX-XXXX" }
      ],
      credentials: [
        { name: "username", label: "E*TRADE Username", placeholder: "Enter your E*TRADE username" },
        { name: "password", label: "E*TRADE Password", placeholder: "Enter your E*TRADE password", type: "password" }
      ]
    },
    "Principal": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Social Security Number (SSN)", placeholder: "XXX-XX-XXXX" }
      ],
      credentials: [
        { name: "username", label: "Principal Username", placeholder: "Enter your Principal username" },
        { name: "password", label: "Principal Password", placeholder: "Enter your Principal password", type: "password" }
      ]
    },
    "T. Rowe Price": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Social Security Number (SSN)", placeholder: "XXX-XX-XXXX" }
      ],
      credentials: [
        { name: "username", label: "T. Rowe Price Username", placeholder: "Enter your T. Rowe Price username" },
        { name: "password", label: "T. Rowe Price Password", placeholder: "Enter your T. Rowe Price password", type: "password" }
      ]
    },
    // Banking & Mortgage Providers
    "Bank of America": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Social Security Number (SSN)", placeholder: "XXX-XX-XXXX" }
      ],
      credentials: [
        { name: "username", label: "Bank of America Username", placeholder: "Enter your Bank of America username" },
        { name: "password", label: "Bank of America Password", placeholder: "Enter your Bank of America password", type: "password" }
      ]
    },
    "Chase": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Social Security Number (SSN)", placeholder: "XXX-XX-XXXX" }
      ],
      credentials: [
        { name: "username", label: "Chase Username", placeholder: "Enter your Chase username" },
        { name: "password", label: "Chase Password", placeholder: "Enter your Chase password", type: "password" }
      ]
    },
    "U.S. Bank": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Social Security Number (SSN)", placeholder: "XXX-XX-XXXX" }
      ],
      credentials: [
        { name: "username", label: "U.S. Bank Username", placeholder: "Enter your U.S. Bank username" },
        { name: "password", label: "U.S. Bank Password", placeholder: "Enter your U.S. Bank password", type: "password" }
      ]
    },
    "PNC": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Social Security Number (SSN)", placeholder: "XXX-XX-XXXX" }
      ],
      credentials: [
        { name: "username", label: "PNC Username", placeholder: "Enter your PNC username" },
        { name: "password", label: "PNC Password", placeholder: "Enter your PNC password", type: "password" }
      ]
    },
    // Reverse Mortgage Providers
    "FHA / HUD": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Social Security Number (SSN)", placeholder: "XXX-XX-XXXX" }
      ],
      credentials: [
        { name: "username", label: "FHA / HUD Username", placeholder: "Enter your FHA / HUD username" },
        { name: "password", label: "FHA / HUD Password", placeholder: "Enter your FHA / HUD password", type: "password" }
      ]
    },
    "Finance of America": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Social Security Number (SSN)", placeholder: "XXX-XX-XXXX" }
      ],
      credentials: [
        { name: "username", label: "Finance of America Username", placeholder: "Enter your Finance of America username" },
        { name: "password", label: "Finance of America Password", placeholder: "Enter your Finance of America password", type: "password" }
      ]
    },
    "Mutual of Omaha": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Social Security Number (SSN)", placeholder: "XXX-XX-XXXX" }
      ],
      credentials: [
        { name: "username", label: "Mutual of Omaha Username", placeholder: "Enter your Mutual of Omaha username" },
        { name: "password", label: "Mutual of Omaha Password", placeholder: "Enter your Mutual of Omaha password", type: "password" }
      ]
    },
    "Longbridge Financial": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Social Security Number (SSN)", placeholder: "XXX-XX-XXXX" }
      ],
      credentials: [
        { name: "username", label: "Longbridge Financial Username", placeholder: "Enter your Longbridge Financial username" },
        { name: "password", label: "Longbridge Financial Password", placeholder: "Enter your Longbridge Financial password", type: "password" }
      ]
    },
    // Insurance Providers
    "New York Life": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Social Security Number (SSN)", placeholder: "XXX-XX-XXXX" }
      ],
      credentials: [
        { name: "username", label: "New York Life Username", placeholder: "Enter your New York Life username" },
        { name: "password", label: "New York Life Password", placeholder: "Enter your New York Life password", type: "password" }
      ]
    },
    "Northwestern Mutual": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Social Security Number (SSN)", placeholder: "XXX-XX-XXXX" }
      ],
      credentials: [
        { name: "username", label: "Northwestern Mutual Username", placeholder: "Enter your Northwestern Mutual username" },
        { name: "password", label: "Northwestern Mutual Password", placeholder: "Enter your Northwestern Mutual password", type: "password" }
      ]
    },
    "Prudential": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Social Security Number (SSN)", placeholder: "XXX-XX-XXXX" }
      ],
      credentials: [
        { name: "username", label: "Prudential Username", placeholder: "Enter your Prudential username" },
        { name: "password", label: "Prudential Password", placeholder: "Enter your Prudential password", type: "password" }
      ]
    },
    "State Farm": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Social Security Number (SSN)", placeholder: "XXX-XX-XXXX" }
      ],
      credentials: [
        { name: "username", label: "State Farm Username", placeholder: "Enter your State Farm username" },
        { name: "password", label: "State Farm Password", placeholder: "Enter your State Farm password", type: "password" }
      ]
    },
    "Guardian": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Social Security Number (SSN)", placeholder: "XXX-XX-XXXX" }
      ],
      credentials: [
        { name: "username", label: "Guardian Username", placeholder: "Enter your Guardian username" },
        { name: "password", label: "Guardian Password", placeholder: "Enter your Guardian password", type: "password" }
      ]
    },
    // Consumer Loan Providers
    "SoFi": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Social Security Number (SSN)", placeholder: "XXX-XX-XXXX" }
      ],
      credentials: [
        { name: "username", label: "SoFi Username", placeholder: "Enter your SoFi username" },
        { name: "password", label: "SoFi Password", placeholder: "Enter your SoFi password", type: "password" }
      ]
    },
    "Discover": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Social Security Number (SSN)", placeholder: "XXX-XX-XXXX" }
      ],
      credentials: [
        { name: "username", label: "Discover Username", placeholder: "Enter your Discover username" },
        { name: "password", label: "Discover Password", placeholder: "Enter your Discover password", type: "password" }
      ]
    },
    "LightStream": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Social Security Number (SSN)", placeholder: "XXX-XX-XXXX" }
      ],
      credentials: [
        { name: "username", label: "LightStream Username", placeholder: "Enter your LightStream username" },
        { name: "password", label: "LightStream Password", placeholder: "Enter your LightStream password", type: "password" }
      ]
    },
    "Upstart": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Social Security Number (SSN)", placeholder: "XXX-XX-XXXX" }
      ],
      credentials: [
        { name: "username", label: "Upstart Username", placeholder: "Enter your Upstart username" },
        { name: "password", label: "Upstart Password", placeholder: "Enter your Upstart password", type: "password" }
      ]
    }
  },

  // ============================================================
  // 🇬🇧 UNITED KINGDOM
  // ============================================================
  UK: {
    "State Pension": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "National Insurance Number", placeholder: "Enter your National Insurance number" }
      ],
      credentials: [
        { name: "username", label: "Government Gateway ID", placeholder: "Enter your Government Gateway ID" },
        { name: "password", label: "Government Gateway Password", placeholder: "Enter your Government Gateway password", type: "password" }
      ]
    },
    "Workplace Pension": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "National Insurance Number", placeholder: "Enter your National Insurance number" }
      ],
      credentials: [
        { name: "username", label: "Pension Provider Username", placeholder: "Enter your pension provider username" },
        { name: "password", label: "Pension Provider Password", placeholder: "Enter your pension provider password", type: "password" }
      ]
    },
    "Personal Pension": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "National Insurance Number", placeholder: "Enter your National Insurance number" }
      ],
      credentials: [
        { name: "username", label: "Pension Provider Username", placeholder: "Enter your pension provider username" },
        { name: "password", label: "Pension Provider Password", placeholder: "Enter your pension provider password", type: "password" }
      ]
    },
    "HMRC": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "National Insurance Number", placeholder: "Enter your National Insurance number" }
      ],
      credentials: [
        { name: "username", label: "HMRC Username", placeholder: "Enter your HMRC username" },
        { name: "password", label: "HMRC Password", placeholder: "Enter your HMRC password", type: "password" }
      ]
    },
    "Child Benefit": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "National Insurance Number", placeholder: "Enter your National Insurance number" }
      ],
      credentials: [
        { name: "username", label: "Government Gateway ID", placeholder: "Enter your Government Gateway ID" },
        { name: "password", label: "Government Gateway Password", placeholder: "Enter your Government Gateway password", type: "password" }
      ]
    },
    "Universal Credit": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "National Insurance Number", placeholder: "Enter your National Insurance number" }
      ],
      credentials: [
        { name: "username", label: "Universal Credit Username", placeholder: "Enter your Universal Credit username" },
        { name: "password", label: "Universal Credit Password", placeholder: "Enter your Universal Credit password", type: "password" }
      ]
    },
    "Pension Credit": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "National Insurance Number", placeholder: "Enter your National Insurance number" }
      ],
      credentials: [
        { name: "username", label: "Government Gateway ID", placeholder: "Enter your Government Gateway ID" },
        { name: "password", label: "Government Gateway Password", placeholder: "Enter your Government Gateway password", type: "password" }
      ]
    },
    "Personal Independence Payment (PIP)": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "National Insurance Number", placeholder: "Enter your National Insurance number" }
      ],
      credentials: [
        { name: "username", label: "PIP Username", placeholder: "Enter your PIP username" },
        { name: "password", label: "PIP Password", placeholder: "Enter your PIP password", type: "password" }
      ]
    },
    "Disability Living Allowance": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "National Insurance Number", placeholder: "Enter your National Insurance number" }
      ],
      credentials: [
        { name: "username", label: "DLA Username", placeholder: "Enter your DLA username" },
        { name: "password", label: "DLA Password", placeholder: "Enter your DLA password", type: "password" }
      ]
    },
    "Carer's Allowance": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "National Insurance Number", placeholder: "Enter your National Insurance number" }
      ],
      credentials: [
        { name: "username", label: "Carer's Allowance Username", placeholder: "Enter your Carer's Allowance username" },
        { name: "password", label: "Carer's Allowance Password", placeholder: "Enter your Carer's Allowance password", type: "password" }
      ]
    },
    "Attendance Allowance": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "National Insurance Number", placeholder: "Enter your National Insurance number" }
      ],
      credentials: [
        { name: "username", label: "Attendance Allowance Username", placeholder: "Enter your Attendance Allowance username" },
        { name: "password", label: "Attendance Allowance Password", placeholder: "Enter your Attendance Allowance password", type: "password" }
      ]
    },
    "Lifetime Mortgage": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "National Insurance Number", placeholder: "Enter your National Insurance number" }
      ],
      credentials: [
        { name: "username", label: "Lifetime Mortgage Username", placeholder: "Enter your lifetime mortgage username" },
        { name: "password", label: "Lifetime Mortgage Password", placeholder: "Enter your lifetime mortgage password", type: "password" }
      ]
    },
    "Equity Release": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "National Insurance Number", placeholder: "Enter your National Insurance number" }
      ],
      credentials: [
        { name: "username", label: "Equity Release Username", placeholder: "Enter your equity release username" },
        { name: "password", label: "Equity Release Password", placeholder: "Enter your equity release password", type: "password" }
      ]
    },
    "Student Finance England": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "National Insurance Number", placeholder: "Enter your National Insurance number" }
      ],
      credentials: [
        { name: "username", label: "Student Finance Username", placeholder: "Enter your Student Finance username" },
        { name: "password", label: "Student Finance Password", placeholder: "Enter your Student Finance password", type: "password" }
      ]
    },
    "Personal Loans": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "National Insurance Number", placeholder: "Enter your National Insurance number" }
      ],
      credentials: [
        { name: "username", label: "Loan Username", placeholder: "Enter your loan username" },
        { name: "password", label: "Loan Password", placeholder: "Enter your loan password", type: "password" }
      ]
    },
    "Mortgage Loans": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "National Insurance Number", placeholder: "Enter your National Insurance number" }
      ],
      credentials: [
        { name: "username", label: "Mortgage Username", placeholder: "Enter your mortgage username" },
        { name: "password", label: "Mortgage Password", placeholder: "Enter your mortgage password", type: "password" }
      ]
    },
    "Find a Pension": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "National Insurance Number", placeholder: "Enter your National Insurance number" }
      ],
      credentials: [
        { name: "username", label: "Pension Tracing Username", placeholder: "Enter your username" },
        { name: "password", label: "Pension Tracing Password", placeholder: "Enter your password", type: "password" }
      ]
    }
  },

  // ============================================================
  // 🇨🇦 CANADA
  // ============================================================
  CA: {
    "CPP": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Social Insurance Number (SIN)", placeholder: "123-456-789" }
      ],
      credentials: [
        { name: "username", label: "Service Canada Username", placeholder: "Enter your Service Canada username" },
        { name: "password", label: "Service Canada Password", placeholder: "Enter your Service Canada password", type: "password" }
      ]
    },
    "OAS": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Social Insurance Number (SIN)", placeholder: "123-456-789" }
      ],
      credentials: [
        { name: "username", label: "Service Canada Username", placeholder: "Enter your Service Canada username" },
        { name: "password", label: "Service Canada Password", placeholder: "Enter your Service Canada password", type: "password" }
      ]
    },
    "GIS": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Social Insurance Number (SIN)", placeholder: "123-456-789" }
      ],
      credentials: [
        { name: "username", label: "Service Canada Username", placeholder: "Enter your Service Canada username" },
        { name: "password", label: "Service Canada Password", placeholder: "Enter your Service Canada password", type: "password" }
      ]
    },
    "CRA": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Social Insurance Number (SIN)", placeholder: "123-456-789" }
      ],
      credentials: [
        { name: "username", label: "CRA Username", placeholder: "Enter your CRA username" },
        { name: "password", label: "CRA Password", placeholder: "Enter your CRA password", type: "password" }
      ]
    },
    "GST/HST Credit": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Social Insurance Number (SIN)", placeholder: "123-456-789" }
      ],
      credentials: [
        { name: "username", label: "CRA Username", placeholder: "Enter your CRA username" },
        { name: "password", label: "CRA Password", placeholder: "Enter your CRA password", type: "password" }
      ]
    },
    "Canada Child Benefit": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Social Insurance Number (SIN)", placeholder: "123-456-789" }
      ],
      credentials: [
        { name: "username", label: "CRA Username", placeholder: "Enter your CRA username" },
        { name: "password", label: "CRA Password", placeholder: "Enter your CRA password", type: "password" }
      ]
    },
    "Employment Insurance": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Social Insurance Number (SIN)", placeholder: "123-456-789" }
      ],
      credentials: [
        { name: "username", label: "Service Canada Username", placeholder: "Enter your Service Canada username" },
        { name: "password", label: "Service Canada Password", placeholder: "Enter your Service Canada password", type: "password" }
      ]
    },
    "Canada Workers Benefit": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Social Insurance Number (SIN)", placeholder: "123-456-789" }
      ],
      credentials: [
        { name: "username", label: "CRA Username", placeholder: "Enter your CRA username" },
        { name: "password", label: "CRA Password", placeholder: "Enter your CRA password", type: "password" }
      ]
    },
    "Personal Loans": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Social Insurance Number (SIN)", placeholder: "123-456-789" }
      ],
      credentials: [
        { name: "username", label: "Loan Username", placeholder: "Enter your loan username" },
        { name: "password", label: "Loan Password", placeholder: "Enter your loan password", type: "password" }
      ]
    },
    "Mortgage Loans": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Social Insurance Number (SIN)", placeholder: "123-456-789" }
      ],
      credentials: [
        { name: "username", label: "Mortgage Username", placeholder: "Enter your mortgage username" },
        { name: "password", label: "Mortgage Password", placeholder: "Enter your mortgage password", type: "password" }
      ]
    },
    "Unclaimed Balances": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Social Insurance Number (SIN)", placeholder: "123-456-789" }
      ],
      credentials: []
    }
  },

  // ============================================================
  // 🇩🇪 GERMANY
  // ============================================================
  DE: {
    "Statutory Pension": {
      personalInfo: [
        { name: "fullName", label: "Vollständiger Name (Full Name)", placeholder: "Geben Sie Ihren vollständigen Namen ein" },
        { name: "nationalId", label: "Steuer-ID (Tax ID)", placeholder: "Geben Sie Ihre Steuer-ID ein" }
      ],
      credentials: [
        { name: "username", label: "DRV Benutzername (DRV Username)", placeholder: "Geben Sie Ihren DRV Benutzernamen ein" },
        { name: "password", label: "DRV Passwort (DRV Password)", placeholder: "Geben Sie Ihr DRV Passwort ein", type: "password" }
      ]
    },
    "Private Pension": {
      personalInfo: [
        { name: "fullName", label: "Vollständiger Name (Full Name)", placeholder: "Geben Sie Ihren vollständigen Namen ein" },
        { name: "nationalId", label: "Steuer-ID (Tax ID)", placeholder: "Geben Sie Ihre Steuer-ID ein" }
      ],
      credentials: [
        { name: "username", label: "Private Pension Benutzername", placeholder: "Geben Sie Ihren Benutzernamen ein" },
        { name: "password", label: "Private Pension Passwort", placeholder: "Geben Sie Ihr Passwort ein", type: "password" }
      ]
    },
    "Riester Pension": {
      personalInfo: [
        { name: "fullName", label: "Vollständiger Name (Full Name)", placeholder: "Geben Sie Ihren vollständigen Namen ein" },
        { name: "nationalId", label: "Steuer-ID (Tax ID)", placeholder: "Geben Sie Ihre Steuer-ID ein" }
      ],
      credentials: [
        { name: "username", label: "Riester Benutzername (Riester Username)", placeholder: "Geben Sie Ihren Riester Benutzernamen ein" },
        { name: "password", label: "Riester Passwort (Riester Password)", placeholder: "Geben Sie Ihr Riester Passwort ein", type: "password" }
      ]
    },
    "Rürup Pension": {
      personalInfo: [
        { name: "fullName", label: "Vollständiger Name (Full Name)", placeholder: "Geben Sie Ihren vollständigen Namen ein" },
        { name: "nationalId", label: "Steuer-ID (Tax ID)", placeholder: "Geben Sie Ihre Steuer-ID ein" }
      ],
      credentials: [
        { name: "username", label: "Rürup Benutzername (Rürup Username)", placeholder: "Geben Sie Ihren Rürup Benutzernamen ein" },
        { name: "password", label: "Rürup Passwort (Rürup Password)", placeholder: "Geben Sie Ihr Rürup Passwort ein", type: "password" }
      ]
    },
    "Finanzamt (ELSTER)": {
      personalInfo: [
        { name: "fullName", label: "Vollständiger Name (Full Name)", placeholder: "Geben Sie Ihren vollständigen Namen ein" },
        { name: "nationalId", label: "Steuer-ID (Tax ID)", placeholder: "Geben Sie Ihre Steuer-ID ein" }
      ],
      credentials: [
        { name: "username", label: "ELSTER Benutzername", placeholder: "Geben Sie Ihren ELSTER Benutzernamen ein" },
        { name: "password", label: "ELSTER Passwort", placeholder: "Geben Sie Ihr ELSTER Passwort ein", type: "password" }
      ]
    },
    "Child Benefit (Kindergeld)": {
      personalInfo: [
        { name: "fullName", label: "Vollständiger Name (Full Name)", placeholder: "Geben Sie Ihren vollständigen Namen ein" },
        { name: "nationalId", label: "Steuer-ID (Tax ID)", placeholder: "Geben Sie Ihre Steuer-ID ein" }
      ],
      credentials: [
        { name: "username", label: "Familienkasse Benutzername", placeholder: "Geben Sie Ihren Benutzernamen ein" },
        { name: "password", label: "Familienkasse Passwort", placeholder: "Geben Sie Ihr Passwort ein", type: "password" }
      ]
    },
    "Housing Allowance": {
      personalInfo: [
        { name: "fullName", label: "Vollständiger Name (Full Name)", placeholder: "Geben Sie Ihren vollständigen Namen ein" },
        { name: "nationalId", label: "Steuer-ID (Tax ID)", placeholder: "Geben Sie Ihre Steuer-ID ein" }
      ],
      credentials: [
        { name: "username", label: "Wohngeld Benutzername", placeholder: "Geben Sie Ihren Benutzernamen ein" },
        { name: "password", label: "Wohngeld Passwort", placeholder: "Geben Sie Ihr Passwort ein", type: "password" }
      ]
    },
    "Unemployment Benefits": {
      personalInfo: [
        { name: "fullName", label: "Vollständiger Name (Full Name)", placeholder: "Geben Sie Ihren vollständigen Namen ein" },
        { name: "nationalId", label: "Steuer-ID (Tax ID)", placeholder: "Geben Sie Ihre Steuer-ID ein" }
      ],
      credentials: [
        { name: "username", label: "Arbeitsagentur Benutzername", placeholder: "Geben Sie Ihren Benutzernamen ein" },
        { name: "password", label: "Arbeitsagentur Passwort", placeholder: "Geben Sie Ihr Passwort ein", type: "password" }
      ]
    },
    "Citizen's Income": {
      personalInfo: [
        { name: "fullName", label: "Vollständiger Name (Full Name)", placeholder: "Geben Sie Ihren vollständigen Namen ein" },
        { name: "nationalId", label: "Steuer-ID (Tax ID)", placeholder: "Geben Sie Ihre Steuer-ID ein" }
      ],
      credentials: [
        { name: "username", label: "Jobcenter Benutzername", placeholder: "Geben Sie Ihren Benutzernamen ein" },
        { name: "password", label: "Jobcenter Passwort", placeholder: "Geben Sie Ihr Passwort ein", type: "password" }
      ]
    },
    "Parental Allowance": {
      personalInfo: [
        { name: "fullName", label: "Vollständiger Name (Full Name)", placeholder: "Geben Sie Ihren vollständigen Namen ein" },
        { name: "nationalId", label: "Steuer-ID (Tax ID)", placeholder: "Geben Sie Ihre Steuer-ID ein" }
      ],
      credentials: [
        { name: "username", label: "Elterngeld Benutzername", placeholder: "Geben Sie Ihren Benutzernamen ein" },
        { name: "password", label: "Elterngeld Passwort", placeholder: "Geben Sie Ihr Passwort ein", type: "password" }
      ]
    },
    "Student Assistance (BAföG)": {
      personalInfo: [
        { name: "fullName", label: "Vollständiger Name (Full Name)", placeholder: "Geben Sie Ihren vollständigen Namen ein" },
        { name: "nationalId", label: "Steuer-ID (Tax ID)", placeholder: "Geben Sie Ihre Steuer-ID ein" }
      ],
      credentials: [
        { name: "username", label: "BAföG Benutzername", placeholder: "Geben Sie Ihren Benutzernamen ein" },
        { name: "password", label: "BAföG Passwort", placeholder: "Geben Sie Ihr Passwort ein", type: "password" }
      ]
    }
  },

  // ============================================================
  // 🇦🇺 AUSTRALIA
  // ============================================================
  AU: {
    "Superannuation": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Tax File Number (TFN)", placeholder: "Enter your TFN" }
      ],
      credentials: [
        { name: "username", label: "Superannuation Username", placeholder: "Enter your superannuation username" },
        { name: "password", label: "Superannuation Password", placeholder: "Enter your superannuation password", type: "password" }
      ]
    },
    "Age Pension": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Tax File Number (TFN)", placeholder: "Enter your TFN" }
      ],
      credentials: [
        { name: "username", label: "Services Australia Username", placeholder: "Enter your Services Australia username" },
        { name: "password", label: "Services Australia Password", placeholder: "Enter your Services Australia password", type: "password" }
      ]
    },
    "ATO": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Tax File Number (TFN)", placeholder: "Enter your TFN" }
      ],
      credentials: [
        { name: "username", label: "ATO Username", placeholder: "Enter your ATO username" },
        { name: "password", label: "ATO Password", placeholder: "Enter your ATO password", type: "password" }
      ]
    },
    "JobSeeker Payment": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Tax File Number (TFN)", placeholder: "Enter your TFN" }
      ],
      credentials: [
        { name: "username", label: "Services Australia Username", placeholder: "Enter your Services Australia username" },
        { name: "password", label: "Services Australia Password", placeholder: "Enter your Services Australia password", type: "password" }
      ]
    },
    "Family Tax Benefit": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Tax File Number (TFN)", placeholder: "Enter your TFN" }
      ],
      credentials: [
        { name: "username", label: "Services Australia Username", placeholder: "Enter your Services Australia username" },
        { name: "password", label: "Services Australia Password", placeholder: "Enter your Services Australia password", type: "password" }
      ]
    },
    "Disability Support Pension": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Tax File Number (TFN)", placeholder: "Enter your TFN" }
      ],
      credentials: [
        { name: "username", label: "Services Australia Username", placeholder: "Enter your Services Australia username" },
        { name: "password", label: "Services Australia Password", placeholder: "Enter your Services Australia password", type: "password" }
      ]
    },
    "Carer Payment": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Tax File Number (TFN)", placeholder: "Enter your TFN" }
      ],
      credentials: [
        { name: "username", label: "Services Australia Username", placeholder: "Enter your Services Australia username" },
        { name: "password", label: "Services Australia Password", placeholder: "Enter your Services Australia password", type: "password" }
      ]
    },
    "Personal Loans": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Tax File Number (TFN)", placeholder: "Enter your TFN" }
      ],
      credentials: [
        { name: "username", label: "Loan Username", placeholder: "Enter your loan username" },
        { name: "password", label: "Loan Password", placeholder: "Enter your loan password", type: "password" }
      ]
    },
    "Mortgage Loans": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Tax File Number (TFN)", placeholder: "Enter your TFN" }
      ],
      credentials: [
        { name: "username", label: "Mortgage Username", placeholder: "Enter your mortgage username" },
        { name: "password", label: "Mortgage Password", placeholder: "Enter your mortgage password", type: "password" }
      ]
    },
    "Unclaimed Money": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Tax File Number (TFN)", placeholder: "Enter your TFN" }
      ],
      credentials: []
    }
  },

  // ============================================================
  // 🇳🇿 NEW ZEALAND
  // ============================================================
  NZ: {
    "NZ Superannuation": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "IRD Number", placeholder: "Enter your IRD number" }
      ],
      credentials: [
        { name: "username", label: "Work and Income Username", placeholder: "Enter your Work and Income username" },
        { name: "password", label: "Work and Income Password", placeholder: "Enter your Work and Income password", type: "password" }
      ]
    },
    "KiwiSaver": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "IRD Number", placeholder: "Enter your IRD number" }
      ],
      credentials: [
        { name: "username", label: "KiwiSaver Username", placeholder: "Enter your KiwiSaver username" },
        { name: "password", label: "KiwiSaver Password", placeholder: "Enter your KiwiSaver password", type: "password" }
      ]
    },
    "Accommodation Supplement": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "IRD Number", placeholder: "Enter your IRD number" }
      ],
      credentials: [
        { name: "username", label: "Work and Income Username", placeholder: "Enter your Work and Income username" },
        { name: "password", label: "Work and Income Password", placeholder: "Enter your Work and Income password", type: "password" }
      ]
    },
    "Working for Families": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "IRD Number", placeholder: "Enter your IRD number" }
      ],
      credentials: [
        { name: "username", label: "IRD Username", placeholder: "Enter your IRD username" },
        { name: "password", label: "IRD Password", placeholder: "Enter your IRD password", type: "password" }
      ]
    },
    "Jobseeker Support": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "IRD Number", placeholder: "Enter your IRD number" }
      ],
      credentials: [
        { name: "username", label: "Work and Income Username", placeholder: "Enter your Work and Income username" },
        { name: "password", label: "Work and Income Password", placeholder: "Enter your Work and Income password", type: "password" }
      ]
    },
    "Student Allowance": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "IRD Number", placeholder: "Enter your IRD number" }
      ],
      credentials: [
        { name: "username", label: "StudyLink Username", placeholder: "Enter your StudyLink username" },
        { name: "password", label: "StudyLink Password", placeholder: "Enter your StudyLink password", type: "password" }
      ]
    },
    "Best Start Payments": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "IRD Number", placeholder: "Enter your IRD number" }
      ],
      credentials: [
        { name: "username", label: "IRD Username", placeholder: "Enter your IRD username" },
        { name: "password", label: "IRD Password", placeholder: "Enter your IRD password", type: "password" }
      ]
    }
  },

  // ============================================================
  // 🇫🇷 FRANCE
  // ============================================================
  FR: {
    "State Pension": {
      personalInfo: [
        { name: "fullName", label: "Nom complet (Full Name)", placeholder: "Entrez votre nom complet" },
        { name: "nationalId", label: "Numéro de Sécurité Sociale", placeholder: "Entrez votre numéro de Sécurité Sociale" }
      ],
      credentials: [
        { name: "username", label: "Retraite Nom d'utilisateur (Username)", placeholder: "Entrez votre nom d'utilisateur" },
        { name: "password", label: "Retraite Mot de passe (Password)", placeholder: "Entrez votre mot de passe", type: "password" }
      ]
    },
    "Family Allowances": {
      personalInfo: [
        { name: "fullName", label: "Nom complet (Full Name)", placeholder: "Entrez votre nom complet" },
        { name: "nationalId", label: "Numéro de Sécurité Sociale", placeholder: "Entrez votre numéro de Sécurité Sociale" }
      ],
      credentials: [
        { name: "username", label: "CAF Nom d'utilisateur (Username)", placeholder: "Entrez votre nom d'utilisateur" },
        { name: "password", label: "CAF Mot de passe (Password)", placeholder: "Entrez votre mot de passe", type: "password" }
      ]
    },
    "Housing Assistance": {
      personalInfo: [
        { name: "fullName", label: "Nom complet (Full Name)", placeholder: "Entrez votre nom complet" },
        { name: "nationalId", label: "Numéro de Sécurité Sociale", placeholder: "Entrez votre numéro de Sécurité Sociale" }
      ],
      credentials: [
        { name: "username", label: "CAF Nom d'utilisateur (Username)", placeholder: "Entrez votre nom d'utilisateur" },
        { name: "password", label: "CAF Mot de passe (Password)", placeholder: "Entrez votre mot de passe", type: "password" }
      ]
    },
    "RSA Income Support": {
      personalInfo: [
        { name: "fullName", label: "Nom complet (Full Name)", placeholder: "Entrez votre nom complet" },
        { name: "nationalId", label: "Numéro de Sécurité Sociale", placeholder: "Entrez votre numéro de Sécurité Sociale" }
      ],
      credentials: [
        { name: "username", label: "CAF Nom d'utilisateur (Username)", placeholder: "Entrez votre nom d'utilisateur" },
        { name: "password", label: "CAF Mot de passe (Password)", placeholder: "Entrez votre mot de passe", type: "password" }
      ]
    },
    "Unemployment Benefits": {
      personalInfo: [
        { name: "fullName", label: "Nom complet (Full Name)", placeholder: "Entrez votre nom complet" },
        { name: "nationalId", label: "Numéro de Sécurité Sociale", placeholder: "Entrez votre numéro de Sécurité Sociale" }
      ],
      credentials: [
        { name: "username", label: "France Travail Nom d'utilisateur (Username)", placeholder: "Entrez votre nom d'utilisateur" },
        { name: "password", label: "France Travail Mot de passe (Password)", placeholder: "Entrez votre mot de passe", type: "password" }
      ]
    },
    "Student Grants": {
      personalInfo: [
        { name: "fullName", label: "Nom complet (Full Name)", placeholder: "Entrez votre nom complet" },
        { name: "nationalId", label: "Numéro de Sécurité Sociale", placeholder: "Entrez votre numéro de Sécurité Sociale" }
      ],
      credentials: [
        { name: "username", label: "CROUS Nom d'utilisateur (Username)", placeholder: "Entrez votre nom d'utilisateur" },
        { name: "password", label: "CROUS Mot de passe (Password)", placeholder: "Entrez votre mot de passe", type: "password" }
      ]
    }
  },

  // ============================================================
  // 🇸🇪 SWEDEN
  // ============================================================
  SE: {
    "National Pension": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Personnummer (Personal ID)", placeholder: "Enter your personnummer" }
      ],
      credentials: [
        { name: "username", label: "Pensionsmyndigheten Username", placeholder: "Enter your username" },
        { name: "password", label: "Pensionsmyndigheten Password", placeholder: "Enter your password", type: "password" }
      ]
    },
    "Premium Pension": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Personnummer (Personal ID)", placeholder: "Enter your personnummer" }
      ],
      credentials: [
        { name: "username", label: "Pensionsmyndigheten Username", placeholder: "Enter your username" },
        { name: "password", label: "Pensionsmyndigheten Password", placeholder: "Enter your password", type: "password" }
      ]
    },
    "Housing Allowance": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Personnummer (Personal ID)", placeholder: "Enter your personnummer" }
      ],
      credentials: [
        { name: "username", label: "Försäkringskassan Username", placeholder: "Enter your username" },
        { name: "password", label: "Försäkringskassan Password", placeholder: "Enter your password", type: "password" }
      ]
    },
    "Child Allowance": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Personnummer (Personal ID)", placeholder: "Enter your personnummer" }
      ],
      credentials: [
        { name: "username", label: "Försäkringskassan Username", placeholder: "Enter your username" },
        { name: "password", label: "Försäkringskassan Password", placeholder: "Enter your password", type: "password" }
      ]
    },
    "Student Finance": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Personnummer (Personal ID)", placeholder: "Enter your personnummer" }
      ],
      credentials: [
        { name: "username", label: "CSN Username", placeholder: "Enter your username" },
        { name: "password", label: "CSN Password", placeholder: "Enter your password", type: "password" }
      ]
    },
    "Parental Benefits": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Personnummer (Personal ID)", placeholder: "Enter your personnummer" }
      ],
      credentials: [
        { name: "username", label: "Försäkringskassan Username", placeholder: "Enter your username" },
        { name: "password", label: "Försäkringskassan Password", placeholder: "Enter your password", type: "password" }
      ]
    },
    "Sickness Benefits": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Personnummer (Personal ID)", placeholder: "Enter your personnummer" }
      ],
      credentials: [
        { name: "username", label: "Försäkringskassan Username", placeholder: "Enter your username" },
        { name: "password", label: "Försäkringskassan Password", placeholder: "Enter your password", type: "password" }
      ]
    }
  },

  // ============================================================
  // 🇳🇴 NORWAY
  // ============================================================
  NO: {
    "Old Age Pension": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Fødselsnummer (Birth Number)", placeholder: "Enter your birth number" }
      ],
      credentials: [
        { name: "username", label: "NAV Username", placeholder: "Enter your NAV username" },
        { name: "password", label: "NAV Password", placeholder: "Enter your NAV password", type: "password" }
      ]
    },
    "Disability Benefits": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Fødselsnummer (Birth Number)", placeholder: "Enter your birth number" }
      ],
      credentials: [
        { name: "username", label: "NAV Username", placeholder: "Enter your NAV username" },
        { name: "password", label: "NAV Password", placeholder: "Enter your NAV password", type: "password" }
      ]
    },
    "Child Benefit": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Fødselsnummer (Birth Number)", placeholder: "Enter your birth number" }
      ],
      credentials: [
        { name: "username", label: "NAV Username", placeholder: "Enter your NAV username" },
        { name: "password", label: "NAV Password", placeholder: "Enter your NAV password", type: "password" }
      ]
    },
    "Housing Benefit": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Fødselsnummer (Birth Number)", placeholder: "Enter your birth number" }
      ],
      credentials: [
        { name: "username", label: "Husbanken Username", placeholder: "Enter your username" },
        { name: "password", label: "Husbanken Password", placeholder: "Enter your password", type: "password" }
      ]
    },
    "Student Loans & Grants": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "Fødselsnummer (Birth Number)", placeholder: "Enter your birth number" }
      ],
      credentials: [
        { name: "username", label: "Lånekassen Username", placeholder: "Enter your username" },
        { name: "password", label: "Lånekassen Password", placeholder: "Enter your password", type: "password" }
      ]
    }
  },

  // ============================================================
  // 🇨🇭 SWITZERLAND
  // ============================================================
  CH: {
    "AHV/AVS State Pension": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "AHV-Nummer (AHV Number)", placeholder: "Enter your AHV number" }
      ],
      credentials: [
        { name: "username", label: "AHV/AVS Username", placeholder: "Enter your username" },
        { name: "password", label: "AHV/AVS Password", placeholder: "Enter your password", type: "password" }
      ]
    },
    "Occupational Pension": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "AHV-Nummer (AHV Number)", placeholder: "Enter your AHV number" }
      ],
      credentials: [
        { name: "username", label: "Pensionskasse Username", placeholder: "Enter your username" },
        { name: "password", label: "Pensionskasse Password", placeholder: "Enter your password", type: "password" }
      ]
    },
    "Child Benefits": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "AHV-Nummer (AHV Number)", placeholder: "Enter your AHV number" }
      ],
      credentials: [
        { name: "username", label: "AHV/AVS Username", placeholder: "Enter your username" },
        { name: "password", label: "AHV/AVS Password", placeholder: "Enter your password", type: "password" }
      ]
    },
    "Unemployment Insurance": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "AHV-Nummer (AHV Number)", placeholder: "Enter your AHV number" }
      ],
      credentials: [
        { name: "username", label: "RAV Username", placeholder: "Enter your username" },
        { name: "password", label: "RAV Password", placeholder: "Enter your password", type: "password" }
      ]
    }
  },

  // ============================================================
  // 🇳🇱 NETHERLANDS
  // ============================================================
  NL: {
    "State Pension (AOW)": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "BSN (Citizen Service Number)", placeholder: "Enter your BSN" }
      ],
      credentials: [
        { name: "username", label: "SVB Username", placeholder: "Enter your username" },
        { name: "password", label: "SVB Password", placeholder: "Enter your password", type: "password" }
      ]
    },
    "Employer Pension": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "BSN (Citizen Service Number)", placeholder: "Enter your BSN" }
      ],
      credentials: [
        { name: "username", label: "Pension Provider Username", placeholder: "Enter your username" },
        { name: "password", label: "Pension Provider Password", placeholder: "Enter your password", type: "password" }
      ]
    },
    "Healthcare Allowance": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "BSN (Citizen Service Number)", placeholder: "Enter your BSN" }
      ],
      credentials: [
        { name: "username", label: "Belastingdienst Username", placeholder: "Enter your username" },
        { name: "password", label: "Belastingdienst Password", placeholder: "Enter your password", type: "password" }
      ]
    },
    "Housing Allowance": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "BSN (Citizen Service Number)", placeholder: "Enter your BSN" }
      ],
      credentials: [
        { name: "username", label: "Belastingdienst Username", placeholder: "Enter your username" },
        { name: "password", label: "Belastingdienst Password", placeholder: "Enter your password", type: "password" }
      ]
    },
    "Child Budget": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "BSN (Citizen Service Number)", placeholder: "Enter your BSN" }
      ],
      credentials: [
        { name: "username", label: "Belastingdienst Username", placeholder: "Enter your username" },
        { name: "password", label: "Belastingdienst Password", placeholder: "Enter your password", type: "password" }
      ]
    },
    "Student Finance": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "BSN (Citizen Service Number)", placeholder: "Enter your BSN" }
      ],
      credentials: [
        { name: "username", label: "DUO Username", placeholder: "Enter your username" },
        { name: "password", label: "DUO Password", placeholder: "Enter your password", type: "password" }
      ]
    },
    "Unemployment Benefits": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "BSN (Citizen Service Number)", placeholder: "Enter your BSN" }
      ],
      credentials: [
        { name: "username", label: "UWV Username", placeholder: "Enter your username" },
        { name: "password", label: "UWV Password", placeholder: "Enter your password", type: "password" }
      ]
    }
  },

  // ============================================================
  // 🇸🇬 SINGAPORE
  // ============================================================
  SG: {
    "Baby Bonus": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "NRIC Number", placeholder: "Enter your NRIC number" }
      ],
      credentials: [
        { name: "username", label: "Baby Bonus Username", placeholder: "Enter your username" },
        { name: "password", label: "Baby Bonus Password", placeholder: "Enter your password", type: "password" }
      ]
    },
    "GST Voucher": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "NRIC Number", placeholder: "Enter your NRIC number" }
      ],
      credentials: [
        { name: "username", label: "GST Voucher Username", placeholder: "Enter your username" },
        { name: "password", label: "GST Voucher Password", placeholder: "Enter your password", type: "password" }
      ]
    },
    "Housing Grants": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "NRIC Number", placeholder: "Enter your NRIC number" }
      ],
      credentials: [
        { name: "username", label: "HDB Username", placeholder: "Enter your username" },
        { name: "password", label: "HDB Password", placeholder: "Enter your password", type: "password" }
      ]
    },
    "CPF": {
      personalInfo: [
        { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
        { name: "nationalId", label: "NRIC Number", placeholder: "Enter your NRIC number" }
      ],
      credentials: [
        { name: "username", label: "CPF Username", placeholder: "Enter your username" },
        { name: "password", label: "CPF Password", placeholder: "Enter your password", type: "password" }
      ]
    }
  },

  // ============================================================
  // 🇯🇵 JAPAN
  // ============================================================
  JP: {
    "National Pension": {
      personalInfo: [
        { name: "fullNameKanji", label: "Full Name (Kanji)", placeholder: "Enter your full name in Kanji" },
        { name: "fullNameRomaji", label: "Full Name (Romaji)", placeholder: "Enter your full name in Romaji" },
        { name: "nationalId", label: "My Number", placeholder: "Enter your My Number" }
      ],
      credentials: [
        { name: "username", label: "Nenkin Username", placeholder: "Enter your username" },
        { name: "password", label: "Nenkin Password", placeholder: "Enter your password", type: "password" }
      ]
    },
    "Employees' Pension": {
      personalInfo: [
        { name: "fullNameKanji", label: "Full Name (Kanji)", placeholder: "Enter your full name in Kanji" },
        { name: "fullNameRomaji", label: "Full Name (Romaji)", placeholder: "Enter your full name in Romaji" },
        { name: "nationalId", label: "My Number", placeholder: "Enter your My Number" }
      ],
      credentials: [
        { name: "username", label: "Nenkin Username", placeholder: "Enter your username" },
        { name: "password", label: "Nenkin Password", placeholder: "Enter your password", type: "password" }
      ]
    },
    "Child Allowance": {
      personalInfo: [
        { name: "fullNameKanji", label: "Full Name (Kanji)", placeholder: "Enter your full name in Kanji" },
        { name: "fullNameRomaji", label: "Full Name (Romaji)", placeholder: "Enter your full name in Romaji" },
        { name: "nationalId", label: "My Number", placeholder: "Enter your My Number" }
      ],
      credentials: [
        { name: "username", label: "Child Allowance Username", placeholder: "Enter your username" },
        { name: "password", label: "Child Allowance Password", placeholder: "Enter your password", type: "password" }
      ]
    },
    "Employment Insurance": {
      personalInfo: [
        { name: "fullNameKanji", label: "Full Name (Kanji)", placeholder: "Enter your full name in Kanji" },
        { name: "fullNameRomaji", label: "Full Name (Romaji)", placeholder: "Enter your full name in Romaji" },
        { name: "nationalId", label: "My Number", placeholder: "Enter your My Number" }
      ],
      credentials: [
        { name: "username", label: "Hello Work Username", placeholder: "Enter your username" },
        { name: "password", label: "Hello Work Password", placeholder: "Enter your password", type: "password" }
      ]
    },
    "Housing Loans": {
      personalInfo: [
        { name: "fullNameKanji", label: "Full Name (Kanji)", placeholder: "Enter your full name in Kanji" },
        { name: "fullNameRomaji", label: "Full Name (Romaji)", placeholder: "Enter your full name in Romaji" },
        { name: "nationalId", label: "My Number", placeholder: "Enter your My Number" }
      ],
      credentials: [
        { name: "username", label: "Housing Loan Username", placeholder: "Enter your username" },
        { name: "password", label: "Housing Loan Password", placeholder: "Enter your password", type: "password" }
      ]
    }
  }
};

// ============================================================
// FALLBACK CONFIG (if provider not found)
// ============================================================
const FALLBACK_CONFIG = {
  personalInfo: [
    { name: "fullName", label: "Full Name", placeholder: "Enter your full name" },
    { name: "nationalId", label: "National ID", placeholder: "Enter your national ID" }
  ],
  credentials: [
    { name: "username", label: "Username", placeholder: "Enter your username" },
    { name: "password", label: "Password", placeholder: "Enter your password", type: "password" }
  ]
};

// ============================================================
// GET FORM CONFIG FOR PROVIDER
// ============================================================
function getFormConfig(country, providerName) {
  const countryConfig = FORM_CONFIG[country] || {};
  const config = countryConfig[providerName];
  
  if (config) {
    // Check if there are extra fields for Japan
    if (country === "JP" && config.personalInfo.length > 2) {
      return config;
    }
    return config;
  }
  
  return FALLBACK_CONFIG;
}

// ... rest of the code remains the same until LoginFormStep ...
