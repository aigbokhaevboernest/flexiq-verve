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
  Download, Sparkles, Globe
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

const STEPS = {
  "Identity & Verification": [
    "Have a government photo ID and, if asked, your SSN or national ID number ready.",
    "Go to the official site and start verification there — this app never collects your ID.",
    "Follow their process directly on the official site (photo upload, video check, or code).",
    "Once verified there, you'll use that same login across the government sites that accept it.",
  ],
  "Retirement & Social Security": [
    "Check your eligibility and current balance — most providers show this once you sign in.",
    "Go to the official site and sign in, or start enrollment if you're new.",
    "Choose your contribution, withdrawal, or rollover option directly on their site.",
    "Confirm the request there — you'll get confirmation from the provider, not this app.",
  ],
  "Tax Programs": [
    "Gather what you'll need: ID, income statements, and last year's return if you have one.",
    "Go to the official site and sign in — or create an account there if you're new.",
    "Complete the refund, credit, or filing form directly on their site, using your real details.",
    "Submit it there, then use their portal to track your refund or filing status.",
  ],
  "Financial Assistance": [
    "Have your ID and any supporting documents ready (income proof, household details).",
    "Go to the official site and sign in, or start a new application if you don't have an account.",
    "Fill in the application directly on their site with your real information.",
    "Submit it there and use their portal to track your claim status.",
  ],
  "Housing & Mortgage": [
    "Gather your property, income, and existing mortgage details.",
    "Go to the official site or your lender's portal and sign in, or start a new request.",
    "Complete the application directly there, using your real financial details.",
    "Submit it there — offers and terms come directly from the provider, not this app.",
  ],
  "Education": [
    "Have your ID, school details, and household income information ready.",
    "Go to the official site and sign in, or create an account if you're new.",
    "Complete the application or enrollment directly on their site.",
    "Submit it there and use their portal to track your award or repayment status.",
  ],
  "Banking & Payments": [
    "Have your bank account and routing details, or card information, on hand.",
    "Go to the official site and sign in, or register if you don't have an account.",
    "Set up or manage the service directly on their site.",
    "Confirm there — statements and confirmations come from the provider, not this app.",
  ],
  "Insurance": [
    "Have your ID and any existing policy details ready.",
    "Go to the official site and sign in, or start a quote or claim if you're new.",
    "Complete the enrollment or claim directly on their site.",
    "Submit it there — policy documents and confirmations come from the provider.",
  ],
  "Loans": [
    "Gather income proof, ID, and details of what you're financing.",
    "Go to the official or regulator-backed site and compare terms there.",
    "Complete the application directly with the lender, using your real details.",
    "Review the offer and sign there — never through this app.",
  ],
  "Wealth & Asset Recovery": [
    "Have your ID and any details that could match a record: old addresses, past employers, account numbers.",
    "Go to the official search tool and enter your name and details there.",
    "Review any matches shown directly on their site.",
    "File the claim there — the agency or holder verifies and pays you directly.",
  ],
};

const DATA = {
  US: {
    "Identity & Verification": [
      { name: "ID.me", detail: "Identity verification for federal & state services", domain: "id.me", url: "https://www.id.me" },
      { name: "Login.gov", detail: "Single sign-on for U.S. government sites", domain: "login.gov", url: "https://www.login.gov" },
    ],
    "Retirement & Social Security": [
      { name: "401(k)", detail: "Employer-sponsored retirement plan", providers: [
        { name: "Fidelity", domain: "fidelity.com", url: "https://www.fidelity.com" },
        { name: "Vanguard", domain: "investor.vanguard.com", url: "https://investor.vanguard.com" },
        { name: "Empower", domain: "empower.com", url: "https://www.empower.com" },
        { name: "Charles Schwab", domain: "schwab.com", url: "https://www.schwab.com" },
      ] },
      { name: "Roth 401(k)", detail: "After-tax employer-sponsored retirement plan", providers: [
        { name: "Fidelity", domain: "fidelity.com", url: "https://www.fidelity.com" },
        { name: "Vanguard", domain: "investor.vanguard.com", url: "https://investor.vanguard.com" },
        { name: "Empower", domain: "empower.com", url: "https://www.empower.com" },
        { name: "Charles Schwab", domain: "schwab.com", url: "https://www.schwab.com" },
      ] },
      { name: "403(b)", detail: "Tax-sheltered annuity plan for nonprofit/school employees", providers: [
        { name: "Fidelity", domain: "fidelity.com", url: "https://www.fidelity.com" },
        { name: "TIAA", domain: "tiaa.org", url: "https://www.tiaa.org" },
        { name: "Vanguard", domain: "investor.vanguard.com", url: "https://investor.vanguard.com" },
        { name: "Empower", domain: "empower.com", url: "https://www.empower.com" },
      ] },
      { name: "457(b)", detail: "Deferred compensation plan for gov't/nonprofit employees", providers: [
        { name: "Empower", domain: "empower.com", url: "https://www.empower.com" },
        { name: "MissionSquare", domain: "missionsq.org", url: "https://www.missionsq.org" },
        { name: "Voya", domain: "voya.com", url: "https://www.voya.com" },
        { name: "Nationwide", domain: "nationwide.com", url: "https://www.nationwide.com" },
      ] },
      { name: "Traditional IRA", detail: "Individual retirement account, tax-deferred", providers: [
        { name: "Fidelity", domain: "fidelity.com", url: "https://www.fidelity.com" },
        { name: "Vanguard", domain: "investor.vanguard.com", url: "https://investor.vanguard.com" },
        { name: "Charles Schwab", domain: "schwab.com", url: "https://www.schwab.com" },
        { name: "Merrill", domain: "ml.com", url: "https://www.ml.com" },
      ] },
      { name: "Roth IRA", detail: "Individual retirement account, tax-free withdrawals", providers: [
        { name: "Fidelity", domain: "fidelity.com", url: "https://www.fidelity.com" },
        { name: "Vanguard", domain: "investor.vanguard.com", url: "https://investor.vanguard.com" },
        { name: "Charles Schwab", domain: "schwab.com", url: "https://www.schwab.com" },
        { name: "E*TRADE", domain: "us.etrade.com", url: "https://us.etrade.com" },
      ] },
      { name: "SEP IRA", detail: "Simplified employee pension for self-employed & small business", providers: [
        { name: "Fidelity", domain: "fidelity.com", url: "https://www.fidelity.com" },
        { name: "Vanguard", domain: "investor.vanguard.com", url: "https://investor.vanguard.com" },
        { name: "Charles Schwab", domain: "schwab.com", url: "https://www.schwab.com" },
        { name: "Merrill", domain: "ml.com", url: "https://www.ml.com" },
      ] },
      { name: "Pension Plans", detail: "Search & insurance for private-sector pensions", providers: [
        { name: "Fidelity", domain: "fidelity.com", url: "https://www.fidelity.com" },
        { name: "Empower", domain: "empower.com", url: "https://www.empower.com" },
        { name: "Principal", domain: "principal.com", url: "https://www.principal.com" },
        { name: "T. Rowe Price", domain: "troweprice.com", url: "https://www.troweprice.com" },
      ] },
      { name: "Social Security Retirement", detail: "Federal retirement benefit", domain: "ssa.gov", url: "https://www.ssa.gov/benefits/retirement/" },
      { name: "SSDI", detail: "Social Security disability insurance", domain: "ssa.gov", url: "https://www.ssa.gov/benefits/disability/" },
      { name: "SSI", detail: "Supplemental Security Income", domain: "ssa.gov", url: "https://www.ssa.gov/ssi/" },
      { name: "Survivor Benefits", detail: "Benefits for family of a deceased worker", domain: "ssa.gov", url: "https://www.ssa.gov/benefits/survivors/" },
    ],
    "Tax Programs": [
      { name: "IRS Tax Refund", detail: "Federal refund status & filing", domain: "irs.gov", url: "https://www.irs.gov/refunds" },
      { name: "Earned Income Tax Credit (EITC)", detail: "Credit for low-to-moderate income workers", domain: "irs.gov", url: "https://www.irs.gov/credits-deductions/individuals/earned-income-tax-credit-eitc" },
      { name: "Child Tax Credit (CTC)", detail: "Tax credit for qualifying children", domain: "irs.gov", url: "https://www.irs.gov/credits-deductions/individuals/child-tax-credit" },
      { name: "Additional Child Tax Credit", detail: "Refundable portion of the CTC", domain: "irs.gov", url: "https://www.irs.gov/credits-deductions/individuals/additional-child-tax-credit" },
      { name: "American Opportunity Tax Credit", detail: "Partially refundable education credit", domain: "irs.gov", url: "https://www.irs.gov/credits-deductions/individuals/aotc" },
    ],
    "Financial Assistance": [
      { name: "TANF", detail: "Temporary Assistance for Needy Families (cash aid)", domain: "acf.hhs.gov", url: "https://www.acf.hhs.gov/ofa/programs/tanf" },
      { name: "Unemployment Benefits", detail: "State-run temporary income support", domain: "careeronestop.org", url: "https://www.careeronestop.org/LocalHelp/UnemploymentBenefits/find-unemployment-benefits.aspx" },
      { name: "CSA (Child Support Agency)", detail: "Child support enforcement, state-run", domain: "acf.hhs.gov", url: "https://www.acf.hhs.gov/css" },
    ],
    "Housing & Mortgage": [
      { name: "HELOC", detail: "Home equity line of credit", providers: [
        { name: "Bank of America", domain: "bankofamerica.com", url: "https://www.bankofamerica.com" },
        { name: "Chase", domain: "chase.com", url: "https://www.chase.com" },
        { name: "U.S. Bank", domain: "usbank.com", url: "https://www.usbank.com" },
        { name: "PNC", domain: "pnc.com", url: "https://www.pnc.com" },
      ] },
      { name: "Home Equity Loan", detail: "Lump-sum loan against your home's equity", providers: [
        { name: "Chase", domain: "chase.com", url: "https://www.chase.com" },
        { name: "Bank of America", domain: "bankofamerica.com", url: "https://www.bankofamerica.com" },
        { name: "U.S. Bank", domain: "usbank.com", url: "https://www.usbank.com" },
        { name: "PNC", domain: "pnc.com", url: "https://www.pnc.com" },
      ] },
      { name: "Reverse Mortgage", detail: "HECM program for homeowners 62+", providers: [
        { name: "FHA / HUD", domain: "hud.gov", url: "https://www.hud.gov/program_offices/housing/sfh/hecm/hecmhome" },
        { name: "Finance of America", domain: "financeofamerica.com", url: "https://www.financeofamerica.com" },
        { name: "Mutual of Omaha", domain: "mutualofomaha.com", url: "https://www.mutualofomaha.com" },
        { name: "Longbridge Financial", domain: "longbridge-financial.com", url: "https://longbridge-financial.com" },
      ] },
    ],
    "Education": [
      { name: "Pell Grant", detail: "Federal need-based grant, no repayment", domain: "studentaid.gov", url: "https://studentaid.gov/understand-aid/types/grants/pell" },
      { name: "Federal Student Loans", detail: "Direct subsidized & unsubsidized loans", domain: "studentaid.gov", url: "https://studentaid.gov/understand-aid/types/loans" },
      { name: "Work Study", detail: "Federal work-study earned wages", domain: "studentaid.gov", url: "https://studentaid.gov/understand-aid/types/work-study" },
    ],
    "Banking & Payments": [
      { name: "Direct Deposit", detail: "Set up electronic payments for federal benefits", domain: "godirect.gov", url: "https://www.godirect.gov" },
      { name: "Treasury Checks", detail: "Federal payment issuance & tracing", domain: "fiscal.treasury.gov", url: "https://www.fiscal.treasury.gov" },
      { name: "IRS Refund Checks", detail: "Track a mailed federal refund check", domain: "irs.gov", url: "https://www.irs.gov/refunds" },
      { name: "Direct Express Card", detail: "Prepaid debit card for federal benefits", domain: "usdirectexpress.com", url: "https://www.usdirectexpress.com" },
    ],
    "Insurance": [
      { name: "Life Insurance", detail: "Compare policies before buying", providers: [
        { name: "New York Life", domain: "newyorklife.com", url: "https://www.newyorklife.com" },
        { name: "Northwestern Mutual", domain: "northwesternmutual.com", url: "https://www.northwesternmutual.com" },
        { name: "Prudential", domain: "prudential.com", url: "https://www.prudential.com" },
        { name: "State Farm", domain: "statefarm.com", url: "https://www.statefarm.com" },
      ] },
      { name: "Disability Insurance", detail: "Private income-protection coverage", providers: [
        { name: "Guardian", domain: "guardianlife.com", url: "https://www.guardianlife.com" },
        { name: "Principal", domain: "principal.com", url: "https://www.principal.com" },
        { name: "Mutual of Omaha", domain: "mutualofomaha.com", url: "https://www.mutualofomaha.com" },
        { name: "Northwestern Mutual", domain: "northwesternmutual.com", url: "https://www.northwesternmutual.com" },
      ] },
    ],
    "Loans": [
      { name: "Personal Loans", detail: "Unsecured consumer loans", providers: [
        { name: "SoFi", domain: "sofi.com", url: "https://www.sofi.com" },
        { name: "Discover", domain: "discover.com", url: "https://www.discover.com" },
        { name: "LightStream", domain: "lightstream.com", url: "https://www.lightstream.com" },
        { name: "Upstart", domain: "upstart.com", url: "https://www.upstart.com" },
      ] },
      { name: "Auto Loans", detail: "Consumer guide to vehicle financing", domain: "consumerfinance.gov", url: "https://www.consumerfinance.gov/consumer-tools/auto-loans/" },
      { name: "Student Loans", detail: "Federal student loan options", domain: "studentaid.gov", url: "https://studentaid.gov/understand-aid/types/loans" },
      { name: "Business Loans", detail: "SBA-backed small business financing", domain: "sba.gov", url: "https://www.sba.gov/funding-programs/loans" },
      { name: "Mortgage Loans", detail: "Consumer guide to home loans", domain: "consumerfinance.gov", url: "https://www.consumerfinance.gov/owning-a-home/" },
      { name: "HELOC", detail: "Home equity line of credit — consumer guide", domain: "consumerfinance.gov", url: "https://www.consumerfinance.gov/consumer-tools/mortgages/heloc/" },
      { name: "Home Equity Loan", detail: "Lump-sum loan against your home's equity", domain: "consumerfinance.gov", url: "https://www.consumerfinance.gov/owning-a-home/loan-options/" },
      { name: "Bridge Loan", detail: "Short-term financing between transactions", domain: "consumerfinance.gov", url: "https://www.consumerfinance.gov/owning-a-home/loan-options/" },
      { name: "Reverse Mortgage", detail: "HECM program for homeowners 62+", domain: "hud.gov", url: "https://www.hud.gov/program_offices/housing/sfh/hecm/hecmhome" },
      { name: "Lines of Credit", detail: "Consumer guide to revolving credit", domain: "consumerfinance.gov", url: "https://www.consumerfinance.gov/consumer-tools/loans/" },
    ],
    "Wealth & Asset Recovery": [
      { name: "Tax Refunds", detail: "Check an unclaimed or pending federal refund", domain: "irs.gov", url: "https://www.irs.gov/refunds" },
      { name: "Pension Claims", detail: "Search for an unclaimed private pension", domain: "pbgc.gov", url: "https://www.pbgc.gov/search-unclaimed-pensions" },
      { name: "Unclaimed Property", detail: "State unclaimed property search (NAUPA)", domain: "unclaimed.org", url: "https://www.unclaimed.org" },
      { name: "Dormant Bank Accounts", detail: "State unclaimed property search (NAUPA)", domain: "unclaimed.org", url: "https://www.unclaimed.org" },
      { name: "Insurance Proceeds", detail: "Unclaimed life insurance search", domain: "naic.org", url: "https://naic.org/consumer/unclaimed-life-insurance" },
      { name: "Inheritance/Estate Claims", detail: "Government unclaimed money directory", domain: "usa.gov", url: "https://www.usa.gov/unclaimed-money" },
      { name: "Trust Funds", detail: "Government unclaimed money directory", domain: "usa.gov", url: "https://www.usa.gov/unclaimed-money" },
      { name: "Settlement Payments", detail: "Government unclaimed money directory", domain: "usa.gov", url: "https://www.usa.gov/unclaimed-money" },
      { name: "Class Action Settlements", detail: "Search & claim FTC-related refunds", domain: "ftc.gov", url: "https://www.ftc.gov/enforcement/refunds" },
      { name: "Lottery Winnings", detail: "Government unclaimed money directory", domain: "usa.gov", url: "https://www.usa.gov/unclaimed-money" },
      { name: "Veteran Benefits", detail: "Search for unclaimed VA insurance funds", domain: "va.gov", url: "https://www.va.gov" },
      { name: "Survivor Benefits", detail: "Benefits for family of a deceased worker", domain: "ssa.gov", url: "https://www.ssa.gov/benefits/survivors/" },
      { name: "Workers' Compensation", detail: "Federal workers' comp programs", domain: "dol.gov", url: "https://www.dol.gov/agencies/owcp" },
      { name: "Disability Benefits", detail: "Federal disability benefit programs", domain: "ssa.gov", url: "https://www.ssa.gov/benefits/disability/" },
      { name: "Life Insurance Claims", detail: "Unclaimed life insurance search", domain: "naic.org", url: "https://naic.org/consumer/unclaimed-life-insurance" },
      { name: "Court Awards", detail: "Government unclaimed money directory", domain: "usa.gov", url: "https://www.usa.gov/unclaimed-money" },
      { name: "Treasury Checks", detail: "Federal payment issuance & tracing", domain: "fiscal.treasury.gov", url: "https://www.fiscal.treasury.gov" },
    ],
  },
  UK: {
    "Retirement & Social Security": [
      { name: "State Pension", detail: "UK government retirement pension", domain: "gov.uk", url: "https://www.gov.uk/state-pension" },
      { name: "Workplace Pension", detail: "Auto-enrollment employer pension", domain: "gov.uk", url: "https://www.gov.uk/workplace-pensions" },
      { name: "Personal Pension", detail: "Your rights & options for private pensions", domain: "gov.uk", url: "https://www.gov.uk/personal-pensions-your-rights" },
    ],
    "Tax Programs": [
      { name: "HMRC", detail: "Tax & self-assessment refunds", domain: "gov.uk", url: "https://www.gov.uk/government/organisations/hm-revenue-customs" },
    ],
    "Financial Assistance": [
      { name: "Child Benefit", detail: "Payment for people raising children", domain: "gov.uk", url: "https://www.gov.uk/child-benefit" },
      { name: "Universal Credit", detail: "Means-tested welfare payment", domain: "gov.uk", url: "https://www.gov.uk/universal-credit" },
      { name: "Pension Credit", detail: "Top-up for low-income pensioners", domain: "gov.uk", url: "https://www.gov.uk/pension-credit" },
      { name: "Personal Independence Payment (PIP)", detail: "Support for long-term ill health or disability", domain: "gov.uk", url: "https://www.gov.uk/pip" },
      { name: "Disability Living Allowance", detail: "Disability support (children / legacy claims)", domain: "gov.uk", url: "https://www.gov.uk/disability-living-allowance-children" },
      { name: "Carer's Allowance", detail: "Payment for people who care for someone", domain: "gov.uk", url: "https://www.gov.uk/carers-allowance" },
      { name: "Attendance Allowance", detail: "Support for pensioners needing care", domain: "gov.uk", url: "https://www.gov.uk/attendance-allowance" },
    ],
    "Housing & Mortgage": [
      { name: "Lifetime Mortgage", detail: "Independent equity release guidance", domain: "moneyhelper.org.uk", url: "https://www.moneyhelper.org.uk/en/homes/buying-a-home/equity-release" },
      { name: "Equity Release", detail: "Independent equity release guidance", domain: "moneyhelper.org.uk", url: "https://www.moneyhelper.org.uk/en/homes/buying-a-home/equity-release" },
    ],
    "Education": [
      { name: "Student Finance England", detail: "Tuition & maintenance loans", domain: "gov.uk", url: "https://www.gov.uk/student-finance" },
    ],
    "Loans": [
      { name: "Personal Loans", detail: "Independent guidance on borrowing", domain: "moneyhelper.org.uk", url: "https://www.moneyhelper.org.uk/en/everyday-money/credit-and-purchases" },
      { name: "Mortgage Loans", detail: "Independent mortgage guidance", domain: "moneyhelper.org.uk", url: "https://www.moneyhelper.org.uk/en/homes/buying-a-home" },
    ],
    "Wealth & Asset Recovery": [
      { name: "Find a Pension", detail: "Pension Tracing Service — find lost pensions", domain: "gov.uk", url: "https://www.gov.uk/find-pension-contact-details" },
    ],
  },
  CA: {
    "Retirement & Social Security": [
      { name: "CPP", detail: "Canada Pension Plan", domain: "canada.ca", url: "https://www.canada.ca/en/services/benefits/publicpensions/cpp.html" },
      { name: "OAS", detail: "Old Age Security", domain: "canada.ca", url: "https://www.canada.ca/en/services/benefits/publicpensions/cpp/old-age-security.html" },
      { name: "GIS", detail: "Guaranteed Income Supplement", domain: "canada.ca", url: "https://www.canada.ca/en/services/benefits/publicpensions/cpp/old-age-security/guaranteed-income-supplement.html" },
    ],
    "Tax Programs": [
      { name: "CRA", detail: "Canada Revenue Agency, tax & refunds", domain: "canada.ca", url: "https://www.canada.ca/en/revenue-agency.html" },
      { name: "GST/HST Credit", detail: "Quarterly tax-free payment", domain: "canada.ca", url: "https://www.canada.ca/en/revenue-agency/services/child-family-benefits/goods-services-tax-harmonized-sales-tax-gst-hst-credit.html" },
    ],
    "Financial Assistance": [
      { name: "Canada Child Benefit", detail: "Tax-free monthly payment for children", domain: "canada.ca", url: "https://www.canada.ca/en/revenue-agency/services/child-family-benefits/canada-child-benefit-overview.html" },
      { name: "Employment Insurance", detail: "Temporary income support", domain: "canada.ca", url: "https://www.canada.ca/en/services/benefits/ei.html" },
      { name: "Canada Workers Benefit", detail: "Refundable tax credit for low-income workers", domain: "canada.ca", url: "https://www.canada.ca/en/revenue-agency/services/child-family-benefits/canada-workers-benefit.html" },
    ],
    "Loans": [
      { name: "Personal Loans", detail: "Federal consumer guidance on borrowing", domain: "canada.ca", url: "https://www.canada.ca/en/financial-consumer-agency/services/loans.html" },
      { name: "Mortgage Loans", detail: "Federal consumer guidance on mortgages", domain: "canada.ca", url: "https://www.canada.ca/en/financial-consumer-agency/services/mortgages.html" },
    ],
    "Wealth & Asset Recovery": [
      { name: "Unclaimed Balances", detail: "Bank of Canada unclaimed balances search", domain: "bankofcanada.ca", url: "https://www.bankofcanada.ca/unclaimed-balances/" },
    ],
  },
  DE: {
    "Retirement & Social Security": [
      { name: "Statutory Pension", detail: "State pension insurance", domain: "deutsche-rentenversicherung.de", url: "https://www.deutsche-rentenversicherung.de" },
      { name: "Private Pension", detail: "Private retirement provision info", domain: "deutsche-rentenversicherung.de", url: "https://www.deutsche-rentenversicherung.de" },
      { name: "Riester Pension", detail: "State-subsidized private pension", domain: "deutsche-rentenversicherung.de", url: "https://www.deutsche-rentenversicherung.de" },
      { name: "Rürup Pension", detail: "Basic pension for self-employed", domain: "deutsche-rentenversicherung.de", url: "https://www.deutsche-rentenversicherung.de" },
    ],
    "Tax Programs": [
      { name: "Finanzamt (ELSTER)", detail: "Tax office & online filing", domain: "elster.de", url: "https://www.elster.de" },
    ],
    "Financial Assistance": [
      { name: "Child Benefit (Kindergeld)", detail: "Monthly payment per child", domain: "arbeitsagentur.de", url: "https://www.arbeitsagentur.de/familie-und-kinder/kindergeld" },
      { name: "Housing Allowance", detail: "Wohngeld — rent/housing subsidy", domain: "bmwsb.bund.de", url: "https://www.bmwsb.bund.de" },
      { name: "Unemployment Benefits", detail: "Arbeitslosengeld", domain: "arbeitsagentur.de", url: "https://www.arbeitsagentur.de" },
      { name: "Citizen's Income", detail: "Bürgergeld basic income support", domain: "arbeitsagentur.de", url: "https://www.arbeitsagentur.de/arbeitslos-arbeit-finden/buergergeld" },
      { name: "Parental Allowance", detail: "Elterngeld", domain: "familienportal.de", url: "https://www.familienportal.de/familienportal/familienleistungen/elterngeld" },
    ],
    "Education": [
      { name: "Student Assistance (BAföG)", detail: "State education financing", domain: "bafög.de", url: "https://www.bafög.de" },
    ],
  },
  AU: {
    "Retirement & Social Security": [
      { name: "Superannuation", detail: "Mandatory retirement savings", domain: "moneysmart.gov.au", url: "https://moneysmart.gov.au/how-super-works" },
      { name: "Age Pension", detail: "Government retirement income support", domain: "servicesaustralia.gov.au", url: "https://www.servicesaustralia.gov.au/age-pension" },
    ],
    "Tax Programs": [
      { name: "ATO", detail: "Australian Taxation Office", domain: "ato.gov.au", url: "https://www.ato.gov.au" },
    ],
    "Financial Assistance": [
      { name: "JobSeeker Payment", detail: "Support while looking for work", domain: "servicesaustralia.gov.au", url: "https://www.servicesaustralia.gov.au/jobseeker-payment" },
      { name: "Family Tax Benefit", detail: "Payment to help with the cost of raising kids", domain: "servicesaustralia.gov.au", url: "https://www.servicesaustralia.gov.au/family-tax-benefit" },
      { name: "Disability Support Pension", detail: "Income support for people with disability", domain: "servicesaustralia.gov.au", url: "https://www.servicesaustralia.gov.au/disability-support-pension" },
      { name: "Carer Payment", detail: "Income support for full-time carers", domain: "servicesaustralia.gov.au", url: "https://www.servicesaustralia.gov.au/carer-payment" },
    ],
    "Loans": [
      { name: "Personal Loans", detail: "ASIC MoneySmart borrowing guide", domain: "moneysmart.gov.au", url: "https://moneysmart.gov.au/loans" },
      { name: "Mortgage Loans", detail: "ASIC MoneySmart home loan guide", domain: "moneysmart.gov.au", url: "https://moneysmart.gov.au/home-loans" },
    ],
    "Wealth & Asset Recovery": [
      { name: "Unclaimed Money", detail: "ASIC MoneySmart unclaimed money search", domain: "moneysmart.gov.au", url: "https://moneysmart.gov.au/how-to-invest/unclaimed-money" },
    ],
  },
  NZ: {
    "Retirement & Social Security": [
      { name: "NZ Superannuation", detail: "Government retirement pension", domain: "workandincome.govt.nz", url: "https://www.workandincome.govt.nz/eligibility/seniors/superannuation/index.html" },
      { name: "KiwiSaver", detail: "Voluntary retirement savings scheme", domain: "ird.govt.nz", url: "https://www.ird.govt.nz/kiwisaver" },
    ],
    "Financial Assistance": [
      { name: "Accommodation Supplement", detail: "Help with rent, board, or mortgage costs", domain: "workandincome.govt.nz", url: "https://www.workandincome.govt.nz/housing/get-help-with-housing-costs/accommodation-supplement.html" },
      { name: "Working for Families", detail: "Payments for families with children", domain: "ird.govt.nz", url: "https://www.ird.govt.nz/working-for-families" },
      { name: "Jobseeker Support", detail: "Weekly payment while looking for work", domain: "workandincome.govt.nz", url: "https://www.workandincome.govt.nz/products/a-z-benefits/jobseeker-support.html" },
      { name: "Best Start Payments", detail: "Payment for families with young children", domain: "ird.govt.nz", url: "https://www.ird.govt.nz/working-for-families/types-of-payments/best-start" },
    ],
    "Education": [
      { name: "Student Allowance", detail: "Weekly non-repayable study support", domain: "studylink.govt.nz", url: "https://www.studylink.govt.nz/products/a-z-products/student-allowance.html" },
    ],
  },
  FR: {
    "Retirement & Social Security": [
      { name: "State Pension", detail: "Assurance retraite (CNAV)", domain: "lassuranceretraite.fr", url: "https://www.lassuranceretraite.fr" },
    ],
    "Financial Assistance": [
      { name: "Family Allowances", detail: "Allocations familiales", domain: "caf.fr", url: "https://www.caf.fr" },
      { name: "Housing Assistance", detail: "Aide personnalisée au logement (APL)", domain: "caf.fr", url: "https://www.caf.fr/allocataires/aides-et-demarches/droits-et-prestations/logement-et-cadre-de-vie/les-aides-au-logement" },
      { name: "RSA Income Support", detail: "Revenu de solidarité active", domain: "caf.fr", url: "https://www.caf.fr/allocataires/aides-et-demarches/droits-et-prestations/social-et-insertion/le-rsa" },
      { name: "Unemployment Benefits", detail: "France Travail (formerly Pôle emploi)", domain: "francetravail.fr", url: "https://www.francetravail.fr" },
    ],
    "Education": [
      { name: "Student Grants", detail: "CROUS grants on social criteria", domain: "etudiant.gouv.fr", url: "https://www.etudiant.gouv.fr" },
    ],
  },
  SE: {
    "Retirement & Social Security": [
      { name: "National Pension", detail: "Inkomstpension & garantipension", domain: "pensionsmyndigheten.se", url: "https://www.pensionsmyndigheten.se" },
      { name: "Premium Pension", detail: "Investment-based part of the state pension", domain: "pensionsmyndigheten.se", url: "https://www.pensionsmyndigheten.se" },
    ],
    "Financial Assistance": [
      { name: "Housing Allowance", detail: "Bostadsbidrag", domain: "forsakringskassan.se", url: "https://www.forsakringskassan.se/privatperson/bostad--barn--familj/bostadsbidrag" },
      { name: "Child Allowance", detail: "Barnbidrag", domain: "forsakringskassan.se", url: "https://www.forsakringskassan.se/privatperson/bostad--barn--familj/barnbidrag" },
      { name: "Parental Benefits", detail: "Föräldrapenning", domain: "forsakringskassan.se", url: "https://www.forsakringskassan.se/privatperson/foralder" },
      { name: "Sickness Benefits", detail: "Sjukpenning", domain: "forsakringskassan.se", url: "https://www.forsakringskassan.se/privatperson/sjuk" },
    ],
    "Education": [
      { name: "Student Finance", detail: "CSN loans & grants", domain: "csn.se", url: "https://www.csn.se" },
    ],
  },
  NO: {
    "Retirement & Social Security": [
      { name: "Old Age Pension", detail: "Alderspensjon from NAV", domain: "nav.no", url: "https://www.nav.no/alderspensjon" },
      { name: "Disability Benefits", detail: "Uføretrygd", domain: "nav.no", url: "https://www.nav.no/ufor" },
    ],
    "Financial Assistance": [
      { name: "Child Benefit", detail: "Barnetrygd", domain: "nav.no", url: "https://www.nav.no/barnetrygd" },
      { name: "Housing Benefit", detail: "Bostøtte from Husbanken", domain: "husbanken.no", url: "https://www.husbanken.no/bostotte" },
    ],
    "Education": [
      { name: "Student Loans & Grants", detail: "Lånekassen study financing", domain: "lanekassen.no", url: "https://www.lanekassen.no" },
    ],
  },
  CH: {
    "Retirement & Social Security": [
      { name: "AHV/AVS State Pension", detail: "First-pillar state pension", domain: "ahv-iv.ch", url: "https://www.ahv-iv.ch" },
      { name: "Occupational Pension", detail: "Second-pillar (BVG/LPP) pension", domain: "bsv.admin.ch", url: "https://www.bsv.admin.ch" },
    ],
    "Financial Assistance": [
      { name: "Child Benefits", detail: "Familienzulagen", domain: "ahv-iv.ch", url: "https://www.ahv-iv.ch/en/Social-insurances/Family-allowances" },
    ],
    "Insurance": [
      { name: "Unemployment Insurance", detail: "Official unemployment insurance portal", domain: "arbeit.swiss", url: "https://www.arbeit.swiss" },
    ],
  },
  NL: {
    "Retirement & Social Security": [
      { name: "State Pension (AOW)", detail: "Sociale Verzekeringsbank state pension", domain: "svb.nl", url: "https://www.svb.nl/nl/aow" },
      { name: "Employer Pension", detail: "Personal pension overview registry", domain: "mijnpensioenoverzicht.nl", url: "https://www.mijnpensioenoverzicht.nl" },
    ],
    "Financial Assistance": [
      { name: "Healthcare Allowance", detail: "Zorgtoeslag", domain: "belastingdienst.nl", url: "https://www.belastingdienst.nl/wps/wcm/connect/nl/toeslagen/content/zorgtoeslag" },
      { name: "Housing Allowance", detail: "Huurtoeslag", domain: "belastingdienst.nl", url: "https://www.belastingdienst.nl/wps/wcm/connect/nl/toeslagen/content/huurtoeslag" },
      { name: "Child Budget", detail: "Kindgebonden budget", domain: "belastingdienst.nl", url: "https://www.belastingdienst.nl/wps/wcm/connect/nl/toeslagen/content/kindgebonden-budget" },
      { name: "Unemployment Benefits", detail: "WW-uitkering from UWV", domain: "uwv.nl", url: "https://www.uwv.nl/particulieren/werkloos/" },
    ],
    "Education": [
      { name: "Student Finance", detail: "DUO study financing", domain: "duo.nl", url: "https://duo.nl" },
    ],
  },
  SG: {
    "Financial Assistance": [
      { name: "Baby Bonus", detail: "Support for raising children", domain: "msf.gov.sg", url: "https://www.msf.gov.sg" },
      { name: "GST Voucher", detail: "Offset GST for lower-income households", domain: "gstvoucher.gov.sg", url: "https://www.gstvoucher.gov.sg" },
    ],
    "Housing & Mortgage": [
      { name: "Housing Grants", detail: "HDB housing grants", domain: "hdb.gov.sg", url: "https://www.hdb.gov.sg/residential/buying-a-flat/understanding-your-eligibility-and-housing-loan-options/flat-and-grant-eligibility/couples-and-families/cpf-housing-grants" },
    ],
    "Retirement & Social Security": [
      { name: "CPF", detail: "Central Provident Fund savings", domain: "cpf.gov.sg", url: "https://www.cpf.gov.sg" },
    ],
  },
  JP: {
    "Retirement & Social Security": [
      { name: "National Pension", detail: "Kokumin Nenkin", domain: "nenkin.go.jp", url: "https://www.nenkin.go.jp" },
      { name: "Employees' Pension", detail: "Kosei Nenkin", domain: "nenkin.go.jp", url: "https://www.nenkin.go.jp" },
    ],
    "Financial Assistance": [
      { name: "Child Allowance", detail: "Jido Teate", domain: "mhlw.go.jp", url: "https://www.mhlw.go.jp" },
      { name: "Employment Insurance", detail: "Koyō Hoken via Hello Work", domain: "hellowork.mhlw.go.jp", url: "https://www.hellowork.mhlw.go.jp" },
    ],
  },
};

// ============================================================
// WORKFLOW COMPONENTS (Steps 1-7)
// ============================================================

// Step 1: Provider Selected Modal
function ProviderSelectedModal({ provider, program, category, onContinue, onClose }) {
  const displayName = provider?.name || program?.name || category;
  const gradient = BUTTON_GRADIENT[category] || "linear-gradient(135deg, #4C8DE0, #2A5FB0)";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <Card className="w-full max-w-md rounded-3xl border-border/60 p-6 shadow-xl relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 hover:bg-muted transition-smooth"
        >
          <X className="h-5 w-5" />
        </button>
        
        <div className="text-center space-y-4">
          <div 
            className="mx-auto h-20 w-20 rounded-2xl flex items-center justify-center"
            style={{ background: `${gradient}20` }}
          >
            <Building2 className="h-10 w-10" style={{ color: gradient.match(/#[A-Fa-f0-9]{6}/)?.[0] || "#4C8DE0" }} />
          </div>
          
          <h2 className="font-display text-2xl font-bold">{displayName}</h2>
          
          <p className="text-sm text-muted-foreground">
            We'll help you connect your {displayName} account to access your
            {program?.name ? ` ${program.name}` : ''} information securely.
          </p>
          
          <Button
            onClick={onContinue}
            style={{ background: gradient }}
            className="w-full gap-2 rounded-2xl text-white shadow-glow"
          >
            Continue
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}

// Step 2: Existing Account Check
function ExistingAccountStep({ provider, program, onYes, onNo, onBack }) {
  const displayName = provider?.name || program?.name || "Provider";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground transition-smooth hover:bg-muted/70"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h2 className="flex-1 text-center font-display text-xl font-bold">Step 2 of 7</h2>
        <div className="w-9" />
      </div>

      <Card className="rounded-3xl border-border/60 p-6 shadow-card">
        <div className="text-center space-y-6">
          <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          
          <h3 className="font-display text-lg font-bold">
            Do you already have a {displayName} account?
          </h3>
          
          <div className="space-y-3">
            <Button
              onClick={onYes}
              className="w-full rounded-2xl bg-primary text-white hover:bg-primary/90"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Yes, I already have an account
            </Button>
            
            <Button
              onClick={onNo}
              variant="outline"
              className="w-full rounded-2xl border-border/60"
            >
              <X className="h-4 w-4 mr-2" />
              No, I need to create one
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

// Step 3: Login Form (2 Sections Only)
function LoginFormStep({ provider, program, category, formData, setFormData, onContinue, onBack }) {
  const [showPassword, setShowPassword] = useState(false);
  const displayName = provider?.name || program?.name || category;
  const gradient = BUTTON_GRADIENT[category] || "linear-gradient(135deg, #4C8DE0, #2A5FB0)";

  const handleFieldChange = (section, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [section]: { ...prev[section], [field]: value }
    }));
  };

  const getFieldValue = (section, field) => {
    return formData[section]?.[field] || "";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground transition-smooth hover:bg-muted/70"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h2 className="flex-1 text-center font-display text-xl font-bold">Step 3 of 7</h2>
        <div className="w-9" />
      </div>

      <Card className="rounded-3xl border-border/60 p-6 shadow-card">
        <div className="text-center mb-6">
          <div 
            className="mx-auto h-16 w-16 rounded-2xl flex items-center justify-center mb-3"
            style={{ background: `${gradient}20` }}
          >
            <Building2 className="h-8 w-8" style={{ color: gradient.match(/#[A-Fa-f0-9]{6}/)?.[0] || "#4C8DE0" }} />
          </div>
          <h3 className="font-display text-xl font-bold">{displayName} Account Access</h3>
          <p className="text-sm text-muted-foreground">Please fill out the form below to access your account</p>
        </div>

        <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); onContinue(); }}>
          {/* Section 1: Personal Information */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Personal Information</h4>
            <div className="space-y-2">
              <div>
                <label className="text-sm font-medium">Full Name</label>
                <Input
                  value={getFieldValue("personal", "fullName")}
                  onChange={(e) => handleFieldChange("personal", "fullName", e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full rounded-xl border-border/60 bg-muted/40 px-4 py-2.5 text-sm transition-smooth focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Social Security Number / National ID</label>
                <Input
                  value={getFieldValue("personal", "nationalId")}
                  onChange={(e) => handleFieldChange("personal", "nationalId", e.target.value)}
                  placeholder="XXX-XX-XXXX"
                  className="w-full rounded-xl border-border/60 bg-muted/40 px-4 py-2.5 text-sm transition-smooth focus:border-primary focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Provider Login Credentials */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">{displayName} Credentials</h4>
            <div className="space-y-2">
              <div>
                <label className="text-sm font-medium">Username / Email</label>
                <Input
                  value={getFieldValue("credentials", "username")}
                  onChange={(e) => handleFieldChange("credentials", "username", e.target.value)}
                  placeholder={`Enter your ${displayName} username`}
                  className="w-full rounded-xl border-border/60 bg-muted/40 px-4 py-2.5 text-sm transition-smooth focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Password</label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={getFieldValue("credentials", "password")}
                    onChange={(e) => handleFieldChange("credentials", "password", e.target.value)}
                    placeholder={`Enter your ${displayName} password`}
                    className="w-full rounded-xl border-border/60 bg-muted/40 px-4 py-2.5 text-sm transition-smooth focus:border-primary focus:outline-none pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              onClick={onBack}
              variant="outline"
              className="flex-1 rounded-2xl border-border/60"
            >
              Back
            </Button>
            <Button
              type="submit"
              style={{ background: gradient }}
              className="flex-1 rounded-2xl text-white shadow-glow"
            >
              Continue
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

// Step 4: Account Verification
function VerificationStep({ verificationMethod, setVerificationMethod, verificationData, setVerificationData, onContinue, onBack }) {
  const [selectedMethod, setSelectedMethod] = useState(verificationMethod || "security");
  const gradient = BUTTON_GRADIENT["Identity & Verification"] || "linear-gradient(135deg, #4C8DE0, #2A5FB0)";

  const methods = [
    { id: "security", label: "Security Questions", icon: Shield },
    { id: "pin", label: "Verification PIN", icon: Key },
    { id: "sms", label: "SMS Code", icon: MessageSquare },
    { id: "recovery", label: "Recovery Email", icon: Mail },
    { id: "biometric", label: "Biometric Verification", icon: Fingerprint },
  ];

  const handleMethodChange = (methodId) => {
    setSelectedMethod(methodId);
    setVerificationMethod(methodId);
  };

  const handleFieldChange = (field, value) => {
    setVerificationData({ ...verificationData, [field]: value });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground transition-smooth hover:bg-muted/70"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h2 className="flex-1 text-center font-display text-xl font-bold">Step 4 of 7</h2>
        <div className="w-9" />
      </div>

      <Card className="rounded-3xl border-border/60 p-6 shadow-card">
        <h3 className="font-display text-xl font-bold mb-6 text-center">Account Verification</h3>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Verification Method</label>
            <select
              value={selectedMethod}
              onChange={(e) => handleMethodChange(e.target.value)}
              className="w-full rounded-xl border border-border/60 bg-muted/40 px-4 py-2.5 text-sm transition-smooth focus:border-primary focus:outline-none"
            >
              {methods.map((m) => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>
          </div>

          <div className="rounded-xl border border-border/60 p-4 space-y-4">
            {selectedMethod === "security" && (
              <>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Question 1</label>
                  <p className="text-xs text-muted-foreground">What is your mother's maiden name?</p>
                  <Input
                    value={verificationData?.securityQ1 || ""}
                    onChange={(e) => handleFieldChange("securityQ1", e.target.value)}
                    placeholder="Enter your answer"
                    className="rounded-xl border-border/60 bg-muted/40 px-4 py-2.5 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Question 2</label>
                  <p className="text-xs text-muted-foreground">What is the name of your first pet?</p>
                  <Input
                    value={verificationData?.securityQ2 || ""}
                    onChange={(e) => handleFieldChange("securityQ2", e.target.value)}
                    placeholder="Enter your answer"
                    className="rounded-xl border-border/60 bg-muted/40 px-4 py-2.5 text-sm"
                  />
                </div>
              </>
            )}

            {selectedMethod === "pin" && (
              <div className="space-y-1">
                <label className="text-sm font-medium">Verification PIN</label>
                <p className="text-xs text-muted-foreground">Enter the 6-digit PIN sent to your registered email</p>
                <Input
                  value={verificationData?.pin || ""}
                  onChange={(e) => handleFieldChange("pin", e.target.value)}
                  placeholder="123456"
                  maxLength={6}
                  className="rounded-xl border-border/60 bg-muted/40 px-4 py-2.5 text-sm text-center text-2xl tracking-widest"
                />
              </div>
            )}

            {selectedMethod === "sms" && (
              <div className="space-y-1">
                <label className="text-sm font-medium">SMS Verification Code</label>
                <p className="text-xs text-muted-foreground">Enter the 6-digit code sent to your phone</p>
                <div className="flex gap-2">
                  <Input
                    value={verificationData?.smsCode || ""}
                    onChange={(e) => handleFieldChange("smsCode", e.target.value)}
                    placeholder="123456"
                    maxLength={6}
                    className="flex-1 rounded-xl border-border/60 bg-muted/40 px-4 py-2.5 text-sm text-center text-2xl tracking-widest"
                  />
                  <Button variant="outline" className="rounded-xl">Resend</Button>
                </div>
              </div>
            )}

            {selectedMethod === "recovery" && (
              <div className="space-y-1">
                <label className="text-sm font-medium">Recovery Email</label>
                <p className="text-xs text-muted-foreground">Enter your recovery email address</p>
                <Input
                  value={verificationData?.recoveryEmail || ""}
                  onChange={(e) => handleFieldChange("recoveryEmail", e.target.value)}
                  placeholder="recovery@email.com"
                  type="email"
                  className="rounded-xl border-border/60 bg-muted/40 px-4 py-2.5 text-sm"
                />
              </div>
            )}

            {selectedMethod === "biometric" && (
              <div className="text-center py-6">
                <div className="mx-auto h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <Fingerprint className="h-10 w-10 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">Place your finger on the sensor to verify</p>
                <Button className="mt-3 rounded-xl">Scan Fingerprint</Button>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              onClick={onBack}
              variant="outline"
              className="flex-1 rounded-2xl border-border/60"
            >
              Back
            </Button>
            <Button
              type="button"
              onClick={onContinue}
              style={{ background: gradient }}
              className="flex-1 rounded-2xl text-white shadow-glow"
            >
              Submit Verification
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

// Step 5: Processing
function ProcessingStep({ onComplete, onBack }) {
  const [steps, setSteps] = useState([
    { id: "connect", label: "Provider Connected", status: "pending", icon: Building2 },
    { id: "personal", label: "Personal Information Verified", status: "pending", icon: UserCheck },
    { id: "identity", label: "Identity Verification", status: "pending", icon: Shield },
    { id: "employment", label: "Employment Verification", status: "pending", icon: Briefcase },
    { id: "account", label: "Account Validation", status: "pending", icon: FileCheck },
    { id: "balance", label: "Balance Verification", status: "pending", icon: DollarSign },
    { id: "eligibility", label: "Eligibility Review", status: "pending", icon: Award },
    { id: "compliance", label: "Compliance Check", status: "pending", icon: CheckCircle },
    { id: "final", label: "Final Review", status: "pending", icon: Calendar },
  ]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        const next = prev + 1;
        if (next > steps.length) {
          clearInterval(interval);
          setTimeout(onComplete, 500);
          return prev;
        }
        setSteps((s) => s.map((step, i) => 
          i === prev ? { ...step, status: "completed" } : 
          i === next && next < steps.length ? { ...step, status: "in-progress" } : step
        ));
        setProgress((next / steps.length) * 100);
        return next;
      });
    }, 800);

    setSteps((s) => s.map((step, i) => 
      i === 0 ? { ...step, status: "in-progress" } : step
    ));

    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status) => {
    if (status === "completed") return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (status === "in-progress") return <Loader2 className="h-4 w-4 text-primary animate-spin" />;
    return <Clock className="h-4 w-4 text-muted-foreground" />;
  };

  const getStatusColor = (status) => {
    if (status === "completed") return "text-green-500";
    if (status === "in-progress") return "text-primary";
    return "text-muted-foreground";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h2 className="flex-1 text-center font-display text-xl font-bold">Step 5 of 7</h2>
        <div className="w-9" />
      </div>

      <Card className="rounded-3xl border-border/60 p-6 shadow-card">
        <div className="text-center mb-6">
          <h3 className="font-display text-xl font-bold">Processing Your Application</h3>
          <p className="text-sm text-muted-foreground">Please wait while we verify your information</p>
        </div>

        <div className="space-y-4">
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div 
              className="h-full rounded-full transition-all duration-700"
              style={{ 
                width: `${progress}%`,
                background: "linear-gradient(135deg, #4C8DE0, #2A5FB0)"
              }}
            />
          </div>
          <p className="text-xs text-center text-muted-foreground">{Math.round(progress)}% Complete</p>

          <div className="space-y-2">
            {steps.map((step) => (
              <div 
                key={step.id}
                className={`flex items-center gap-3 rounded-xl p-3 transition-smooth ${
                  step.status === "in-progress" ? "bg-primary/5 border border-primary/20" : ""
                }`}
              >
                <step.icon className={`h-5 w-5 ${getStatusColor(step.status)}`} />
                <span className={`flex-1 text-sm ${
                  step.status === "in-progress" ? "font-semibold" : ""
                }`}>
                  {step.label}
                </span>
                {getStatusIcon(step.status)}
                {step.status === "completed" && (
                  <span className="text-xs text-green-500">✓</span>
                )}
                {step.status === "in-progress" && (
                  <span className="text-xs text-primary animate-pulse">Processing...</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}

// Step 6: Approval
function ApprovalStep({ provider, program, category, applicationId, referenceNumber, onComplete, onBack }) {
  const [status] = useState("processing");
  const gradient = BUTTON_GRADIENT[category] || "linear-gradient(135deg, #4C8DE0, #2A5FB0)";
  const displayName = provider?.name || program?.name || category;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground transition-smooth hover:bg-muted/70"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h2 className="flex-1 text-center font-display text-xl font-bold">Step 6 of 7</h2>
        <div className="w-9" />
      </div>

      <Card className="rounded-3xl border-border/60 p-6 shadow-card">
        <div className="text-center space-y-3 mb-6">
          <div className="mx-auto h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
          <h3 className="font-display text-xl font-bold">Application Submitted Successfully!</h3>
          <p className="text-sm text-muted-foreground">Your application has been received and is being processed</p>
        </div>

        <div className="rounded-xl bg-muted/40 p-4 space-y-3 border border-border/30">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Application ID</p>
              <p className="font-semibold">{applicationId}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Reference Number</p>
              <p className="font-semibold">{referenceNumber}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Submission Date</p>
              <p className="font-semibold text-sm">{new Date().toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Provider Name</p>
              <p className="font-semibold">{displayName}</p>
            </div>
          </div>
          <div className="pt-2 border-t border-border/30">
            <p className="text-xs text-muted-foreground">Status</p>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-sm font-semibold text-amber-600">
                <Clock className="h-3 w-3" />
                Processing
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button
            type="button"
            onClick={onBack}
            variant="outline"
            className="flex-1 rounded-2xl border-border/60"
          >
            Back
          </Button>
          <Button
            type="button"
            onClick={onComplete}
            style={{ background: gradient }}
            className="flex-1 rounded-2xl text-white shadow-glow"
          >
            Finish
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </Card>
    </div>
  );
}

// Step 7: Email Notification
function EmailConfirmationStep({ provider, program, applicationId, referenceNumber, onComplete, email }) {
  const displayName = provider?.name || program?.name || "Provider";
  const gradient = "linear-gradient(135deg, #4C8DE0, #2A5FB0)";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h2 className="flex-1 text-center font-display text-xl font-bold">Step 7 of 7</h2>
        <div className="w-9" />
      </div>

      <Card className="rounded-3xl border-border/60 p-6 shadow-card">
        <div className="text-center space-y-4">
          <div className="mx-auto h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center">
            <Send className="h-8 w-8 text-green-500" />
          </div>
          
          <h3 className="font-display text-xl font-bold">Confirmation Sent!</h3>
          
          <div className="rounded-xl bg-muted/40 p-4 text-center border border-border/30">
            <Mail className="h-5 w-5 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              A confirmation email has been sent to:
            </p>
            <p className="font-semibold text-sm">{email || "your registered email"}</p>
          </div>

          <div className="rounded-xl bg-muted/40 p-4 space-y-2 text-sm border border-border/30 text-left">
            <p className="font-semibold text-center">📧 Email Details</p>
            <div className="grid grid-cols-2 gap-1">
              <span className="text-xs text-muted-foreground">Provider:</span>
              <span className="text-xs font-medium">{displayName}</span>
              <span className="text-xs text-muted-foreground">Application ID:</span>
              <span className="text-xs font-medium">{applicationId}</span>
              <span className="text-xs text-muted-foreground">Submission Date:</span>
              <span className="text-xs font-medium">{new Date().toLocaleDateString()}</span>
              <span className="text-xs text-muted-foreground">Status:</span>
              <span className="text-xs font-medium text-amber-600">Processing</span>
              <span className="text-xs text-muted-foreground">Reference:</span>
              <span className="text-xs font-medium">{referenceNumber}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 rounded-2xl border-border/60"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Receipt
            </Button>
            <Button
              onClick={onComplete}
              style={{ background: gradient }}
              className="flex-1 rounded-2xl text-white shadow-glow"
            >
              Go to Dashboard
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ============================================================
// WORKFLOW CONTAINER
// ============================================================
function WorkflowContainer({ provider, program, category, onClose, email }) {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({});
  const [verificationMethod, setVerificationMethod] = useState("security");
  const [verificationData, setVerificationData] = useState({});
  const [applicationId, setApplicationId] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [hasExistingAccount, setHasExistingAccount] = useState(null);

  useEffect(() => {
    const randomId = `APP-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000 + 1000)}-${Math.floor(Math.random() * 9000 + 1000)}`;
    const randomRef = `REF-${(program?.name || category || "PRV").substring(0, 3).toUpperCase()}-${Math.floor(Math.random() * 9000 + 1000)}-${Math.floor(Math.random() * 9000 + 1000)}`;
    setApplicationId(randomId);
    setReferenceNumber(randomRef);
  }, []);

  const handleContinue = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);
  const handleComplete = () => onClose();

  const renderStep = () => {
    switch(step) {
      case 0:
        return (
          <ProviderSelectedModal
            provider={provider}
            program={program}
            category={category}
            onContinue={handleContinue}
            onClose={onClose}
          />
        );
      case 1:
        return (
          <div className="max-w-md mx-auto">
            <ExistingAccountStep
              provider={provider}
              program={program}
              onYes={() => { setHasExistingAccount(true); handleContinue(); }}
              onNo={() => { setHasExistingAccount(false); handleContinue(); }}
              onBack={handleBack}
            />
          </div>
        );
      case 2:
        if (hasExistingAccount === false) {
          return (
            <div className="max-w-md mx-auto">
              <Card className="rounded-3xl border-border/60 p-6 shadow-card">
                <div className="text-center space-y-4">
                  <div className="mx-auto h-16 w-16 rounded-full bg-amber-500/10 flex items-center justify-center">
                    <AlertCircle className="h-8 w-8 text-amber-500" />
                  </div>
                  <h3 className="font-display text-lg font-bold">Create Account Required</h3>
                  <p className="text-sm text-muted-foreground">
                    You'll first need to create an account with {provider?.name || program?.name || category} before you can connect.
                  </p>
                  <Button 
                    className="w-full rounded-2xl"
                    style={{ background: BUTTON_GRADIENT[category] || "linear-gradient(135deg, #4C8DE0, #2A5FB0)" }}
                    onClick={() => {
                      const url = provider?.url || program?.url || "https://www.google.com";
                      window.open(url, "_blank");
                      setTimeout(() => {
                        setHasExistingAccount(true);
                        handleContinue();
                      }, 500);
                    }}
                  >
                    Create Account on {provider?.name || program?.name || category}
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full rounded-2xl border-border/60"
                    onClick={handleBack}
                  >
                    Back
                  </Button>
                </div>
              </Card>
            </div>
          );
        }
        return (
          <div className="max-w-md mx-auto">
            <LoginFormStep
              provider={provider}
              program={program}
              category={category}
              formData={formData}
              setFormData={setFormData}
              onContinue={handleContinue}
              onBack={handleBack}
            />
          </div>
        );
      case 3:
        return (
          <div className="max-w-md mx-auto">
            <VerificationStep
              verificationMethod={verificationMethod}
              setVerificationMethod={setVerificationMethod}
              verificationData={verificationData}
              setVerificationData={setVerificationData}
              onContinue={handleContinue}
              onBack={handleBack}
            />
          </div>
        );
      case 4:
        return (
          <div className="max-w-md mx-auto">
            <ProcessingStep
              onComplete={handleContinue}
              onBack={handleBack}
            />
          </div>
        );
      case 5:
        return (
          <div className="max-w-md mx-auto">
            <ApprovalStep
              provider={provider}
              program={program}
              category={category}
              applicationId={applicationId}
              referenceNumber={referenceNumber}
              onComplete={handleContinue}
              onBack={handleBack}
            />
          </div>
        );
      case 6:
        return (
          <div className="max-w-md mx-auto">
            <EmailConfirmationStep
              provider={provider}
              program={program}
              applicationId={applicationId}
              referenceNumber={referenceNumber}
              onComplete={handleComplete}
              email={email}
            />
          </div>
        );
      default:
        return null;
    }
  };

  if (step === 0) {
    return renderStep();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-2xl">
        {renderStep()}
      </div>
    </div>
  );
}

// ============================================================
// MANUAL LINK ENTRY - LAUNCHES WORKFLOW
// ============================================================
function ManualLinkEntry({ onLaunchWorkflow }) {
  const [manualUrl, setManualUrl] = useState("");
  const [error, setError] = useState("");

  function handleContinue() {
    const raw = manualUrl.trim();
    if (!raw) {
      setError("Enter a web address first.");
      return;
    }
    const url = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    try {
      new URL(url);
    } catch {
      setError("That doesn't look like a valid web address.");
      return;
    }
    setError("");
    
    // Extract domain name for display
    const domain = new URL(url).hostname.replace('www.', '');
    const providerName = domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1);
    
    // Create a provider object and launch workflow
    const manualProvider = {
      name: providerName,
      domain: domain,
      url: url,
      isManual: true
    };
    
    onLaunchWorkflow(manualProvider, null, "Wealth & Asset Recovery");
  }

  return (
    <div className="border-t border-border/60 pt-4">
      <p className="mb-2 text-center text-xs text-muted-foreground">
        Have a different link, or the provider isn't listed? Enter it here.
      </p>
      <div className="flex gap-2">
        <Input
          type="text"
          inputMode="url"
          placeholder="e.g. www.provider.com"
          value={manualUrl}
          onChange={(e) => { setManualUrl(e.target.value); if (error) setError(""); }}
          onKeyDown={(e) => e.key === "Enter" && handleContinue()}
          className="rounded-xl"
        />
        <Button type="button" onClick={handleContinue} className="shrink-0 rounded-xl">
          Continue
        </Button>
      </div>
      {error && <p className="mt-2 text-center text-xs text-destructive">{error}</p>}
    </div>
  );
}

// ============================================================
// STEPS PAGE (Original - with Manual Entry launching workflow)
// ============================================================
function StepsPage({ category, programs, selected, provider, onSelectProgram, onSelectProvider, onBack, onDone, onLaunchWorkflow }) {
  const hasProviders = !!(selected && Array.isArray(selected.providers) && selected.providers.length > 0);
  const effective = provider || (selected && !hasProviders ? selected : null);
  const steps = effective ? STEPS[category] : null;
  const gradient = BUTTON_GRADIENT[category];
  const action = getAction(category);

  const title = provider ? provider.name : selected ? selected.name : category;

  function handleBack() {
    if (provider) {
      onSelectProvider(null);
    } else if (selected && programs.length > 1) {
      onSelectProgram(null);
    } else {
      onBack();
    }
  }

  return (
    <div className="space-y-6 font-sans">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleBack}
          aria-label="Back"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground transition-smooth hover:bg-muted/70"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h1 className="flex-1 truncate text-center font-display text-xl font-bold sm:text-2xl">{title}</h1>
        <button
          type="button"
          onClick={onDone}
          aria-label="Close"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground transition-smooth hover:bg-muted/70"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <Card className="rounded-3xl border-border/60 p-6 shadow-card sm:p-8">
        {!selected && (
          <div className="space-y-4">
            <p className="text-center text-sm text-muted-foreground">
              Choose the specific {action.itemNoun} under {category.toLowerCase()}.
            </p>
            <div className="space-y-2">
              {programs.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => onSelectProgram(p)}
                  className="flex w-full items-center justify-between gap-3 rounded-2xl border border-border/60 bg-muted/40 px-4 py-3 text-left transition-smooth hover:bg-muted"
                >
                  <span>
                    <span className="block text-sm font-bold">{p.name}</span>
                    <span className="block text-xs text-muted-foreground">{p.detail}</span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </button>
              ))}
            </div>
            <ManualLinkEntry onLaunchWorkflow={onLaunchWorkflow} />
          </div>
        )}

        {selected && hasProviders && !provider && (
          <div className="space-y-4">
            <p className="text-center text-sm text-muted-foreground">Choose a provider for {selected.name}.</p>
            <div className="space-y-2">
              {selected.providers.map((pr) => (
                <button
                  key={pr.name}
                  type="button"
                  onClick={() => onSelectProvider(pr)}
                  className="flex w-full items-center justify-between gap-3 rounded-2xl border border-border/60 bg-muted/40 px-4 py-3 text-left transition-smooth hover:bg-muted"
                >
                  <span>
                    <span className="block text-sm font-bold">{pr.name}</span>
                    <span className="block text-xs text-muted-foreground">{pr.domain}</span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </button>
              ))}
            </div>
            <ManualLinkEntry onLaunchWorkflow={onLaunchWorkflow} />
          </div>
        )}

        {effective && (
          <div className="space-y-6">
            <p className="text-center text-sm text-muted-foreground">
              Here's how to complete this — all on {effective.domain}, not in this app.
            </p>
            <ol className="space-y-4">
              {steps.map((step, i) => (
                <li key={i} className="flex items-start gap-3 text-sm leading-relaxed text-foreground/90">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
            <a
              href={effective.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onDone}
              style={{ background: gradient }}
              className="flex items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-sm font-bold text-white shadow-glow"
            >
              <ExternalLink className="h-4 w-4" />
              Continue on {effective.domain}
            </a>
            <ManualLinkEntry onLaunchWorkflow={onLaunchWorkflow} />
          </div>
        )}
      </Card>
    </div>
  );
}

// ============================================================
// IDENTITY STRIP
// ============================================================
function IdentityStrip({ programs, onOpen }) {
  const style = CATEGORY_STYLE["Identity & Verification"];
  const Icon = style.icon;
  const gradient = BUTTON_GRADIENT["Identity & Verification"];
  const action = getAction("Identity & Verification");
  const subtitle = programs.length > 1 ? programs.map((p) => p.name).join(" · ") : programs[0].detail;

  return (
    <Card className="flex items-center gap-3 rounded-2xl border-border/60 p-3 shadow-card">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: style.bg }}>
        <Icon size={18} color={style.fg} strokeWidth={2} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold leading-tight">Identity & Verification</p>
        <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
      </div>
      <Button
        type="button"
        size="sm"
        onClick={() => onOpen("Identity & Verification", programs)}
        style={{ background: gradient }}
        className="shrink-0 rounded-xl text-white"
      >
        {action.button}
      </Button>
    </Card>
  );
}

// ============================================================
// CATEGORY CARD
// ============================================================
function CategoryCard({ category, programs, onOpen }) {
  const style = CATEGORY_STYLE[category];
  const Icon = style.icon;
  const gradient = BUTTON_GRADIENT[category];
  const action = getAction(category);
  const summary =
    programs.length > 1
      ? `${programs.length} ${action.itemNounPlural}, incl. ${programs[0].name}`
      : programs[0].detail;

  return (
    <Card className="flex flex-col rounded-3xl border-border/60 p-5 shadow-card">
      <div className="mb-3 flex items-start gap-3">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
          style={{ background: style.bg }}
        >
          <Icon size={22} color={style.fg} strokeWidth={2} />
        </div>
        <div className="min-w-0">
          <h3 className="font-display text-base font-bold leading-snug">{category}</h3>
          <span className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            Available
          </span>
        </div>
      </div>
      <p className="mb-4 flex-1 text-sm text-muted-foreground">{summary}</p>
      <Button
        type="button"
        onClick={() => onOpen(category, programs)}
        style={{ background: gradient }}
        className="w-full gap-2 rounded-2xl text-white"
      >
        <ExternalLink className="h-4 w-4" />
        {action.button}
      </Button>
    </Card>
  );
}

// ============================================================
// MAIN FINANCIAL SERVICES COMPONENT
// ============================================================
const FinancialServices = () => {
  useFrozenGuard();

  const [country, setCountry] = useState("US");
  const [showAll, setShowAll] = useState(false);
  const [recentlyViewed, setRecentlyViewed] = useState<{ category: string; program: string | null; at: string }[]>([]);
  const [page, setPage] = useState<{ category: string; programs: any[]; selected: any; provider: any } | null>(null);
  const [workflow, setWorkflow] = useState<{ provider: any; program: any; category: string } | null>(null);
  const [userEmail] = useState("user@example.com");

  const { identity, categories } = useMemo(() => {
    const byCountry = DATA[country] || {};
    const rest = CATEGORY_ORDER.filter(
      (cat) => cat !== "Identity & Verification" && byCountry[cat]?.length
    ).map((cat) => ({ category: cat, programs: byCountry[cat] }));
    const idCat = byCountry["Identity & Verification"]?.length
      ? { category: "Identity & Verification", programs: byCountry["Identity & Verification"] }
      : null;
    return { identity: idCat, categories: rest };
  }, [country]);

  const visible = showAll ? categories : categories.slice(0, 4);
  const activeCountry = COUNTRIES.find((c) => c.code === country);

  function autoProvider(program) {
    return program && Array.isArray(program.providers) && program.providers.length === 1
      ? program.providers[0]
      : null;
  }

  function logView(category: string, program: any) {
    setRecentlyViewed((prev) => {
      const entry = {
        category,
        program: program?.name || null,
        at: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      return [entry, ...prev].slice(0, 6);
    });
  }

  function openWorkflow(provider: any, program: any, category: string) {
    setWorkflow({ provider, program, category });
  }

  function openCategory(category: string, programs: any[]) {
    const selected = programs.length === 1 ? programs[0] : null;
    const provider = autoProvider(selected);
    
    if (selected && provider) {
      openWorkflow(provider, selected, category);
    } else if (selected && !provider) {
      openWorkflow(selected, selected, category);
    } else {
      setPage({ category, programs, selected: null, provider: null });
    }
    logView(category, provider || selected);
  }

  function selectProgram(program: any) {
    if (program && Array.isArray(program.providers) && program.providers.length === 1) {
      const singleProvider = program.providers[0];
      openWorkflow(singleProvider, program, page?.category || "");
      setPage(null);
    } else {
      setPage((p) => (p ? { ...p, selected: program, provider: autoProvider(program) } : p));
      if (program && page) logView(page.category, program);
    }
  }

  function selectProvider(provider: any) {
    if (provider && page?.selected) {
      openWorkflow(provider, page.selected, page.category);
      setPage(null);
    } else {
      setPage((p) => (p ? { ...p, provider } : p));
      if (provider && page) logView(page.category, provider);
    }
  }

  // Handle manual URL workflow launch
  function handleManualWorkflow(provider: any, program: any, category: string) {
    openWorkflow(provider, program, category);
    setPage(null);
  }

  if (workflow) {
    return (
      <WorkflowContainer
        provider={workflow.provider}
        program={workflow.program}
        category={workflow.category}
        onClose={() => setWorkflow(null)}
        email={userEmail}
      />
    );
  }

  if (page) {
    return (
      <StepsPage
        category={page.category}
        programs={page.programs}
        selected={page.selected}
        provider={page.provider}
        onSelectProgram={selectProgram}
        onSelectProvider={selectProvider}
        onBack={() => setPage(null)}
        onDone={() => setPage(null)}
        onLaunchWorkflow={handleManualWorkflow}
      />
    );
  }

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Financial Services</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          A directory of official government and provider portals for retirement, tax, housing, and more.
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {COUNTRIES.map((c) => (
          <button
            key={c.code}
            type="button"
            onClick={() => { setCountry(c.code); setShowAll(false); }}
            className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-semibold transition-smooth ${
              country === c.code
                ? "border-foreground bg-foreground text-background"
                : "border-border/60 bg-card text-muted-foreground hover:bg-muted"
            }`}
          >
            <span>{c.flag}</span>{c.code}
          </button>
        ))}
      </div>

      {identity && <IdentityStrip programs={identity.programs} onOpen={openCategory} />}

      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold">Programs & Services</h2>
        {categories.length > 4 && (
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="flex items-center gap-1 text-sm font-bold text-primary"
          >
            {showAll ? "Show less" : "View All"}
            {showAll ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {visible.length === 0 && (
          <Card className="col-span-full rounded-3xl border-border/60 p-8 text-center text-sm text-muted-foreground shadow-card">
            No programs listed yet for {activeCountry?.name}.
          </Card>
        )}
        {visible.map((c) => (
          <CategoryCard key={c.category} category={c.category} programs={c.programs} onOpen={openCategory} />
        ))}
      </div>

      {recentlyViewed.length > 0 && (
        <Card className="rounded-2xl border-border/60 p-4 shadow-card">
          <p className="mb-2.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Recently viewed
          </p>
          <div className="divide-y divide-border/60">
            {recentlyViewed.map((r, i) => (
              <div key={i} className="flex justify-between py-1.5 text-sm">
                <span>{r.program || r.category}</span>
                <span className="font-mono text-xs text-muted-foreground">{r.at}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <p className="text-xs leading-relaxed text-muted-foreground">
        Tapping a category opens a page listing the specific programs or services under it. Picking one launches a guided workflow to connect your account — no login form or personal details are ever collected in this app.
      </p>
    </div>
  );
};

export default FinancialServices;
