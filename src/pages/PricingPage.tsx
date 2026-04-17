import { useState } from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";

type BillingPlan = "monthly" | "annually";

interface Feature {
  text: string;
  isBold?: boolean;
}

interface PricingPlan {
  id: string;
  title: string;
  idealFor: string;
  monthlyPrice: number;
  yearlyPrice: number;
  yearlySavings: number;
  buttonText: string;
  buttonVariant: "outline" | "default";
  sessionsLabel: string;
  includesFrom?: string;
  features: Feature[];
  highlighted?: boolean;
  badge?: string;
  isFree?: boolean;
  noCardRequired?: boolean;
}

const PRICING_PLANS: PricingPlan[] = [
  {
    id: "trial",
    title: "Trial",
    idealFor: "Discovering Zengest",
    monthlyPrice: 0,
    yearlyPrice: 0,
    yearlySavings: 0,
    buttonText: "Start Free",
    buttonVariant: "outline",
    sessionsLabel: "10 sessions per month",
    isFree: true,
    noCardRequired: true,
    features: [
      { text: "Session recording (in-person, online, audio upload)" },
      { text: "Transcription with speaker recognition" },
      { text: "Clinical notes for individual therapy" },
      { text: "Patient consent form compliant with Code of Ethics" },
      { text: "Session summary for patients" },
      { text: "Customizable templates" },
    ],
  },
  {
    id: "base",
    title: "Base",
    idealFor: "AI-assisted clinical documentation",
    monthlyPrice: 14.99,
    yearlyPrice: 9.99,
    yearlySavings: 60,
    buttonText: "Try Free",
    buttonVariant: "outline",
    sessionsLabel: "40 sessions per month",
    includesFrom: "Trial",
    features: [
      { text: "AI clinical documentation creation", isBold: true },
      { text: "Basic AI Assistant (limited access)", isBold: true },
      { text: "Structured clinical notes for individual therapy" },
      { text: "Customizable templates for individual therapy" },
    ],
  },
  {
    id: "clinical",
    title: "Clinical",
    idealFor: "Complete AI supervision and progress analysis",
    monthlyPrice: 29.99,
    yearlyPrice: 19.99,
    yearlySavings: 120,
    buttonText: "Try Free",
    buttonVariant: "outline",
    sessionsLabel: "100 sessions per month",
    includesFrom: "Base",
    features: [
      { text: "AI Assistant - unlimited full access", isBold: true },
      { text: "AI Treatment Plans", isBold: true },
      { text: "Therapeutic alliance analysis" },
      { text: "Longitudinal progress analysis" },
      { text: "Clinical pattern recognition" },
      { text: "Unlimited chat with AI supervision" },
    ],
  },
  {
    id: "professional",
    title: "Professional",
    idealFor: "High volume and complex cases",
    monthlyPrice: 54.99,
    yearlyPrice: 39.99,
    yearlySavings: 180,
    buttonText: "Try Free",
    buttonVariant: "default",
    sessionsLabel: "Unlimited sessions",
    includesFrom: "Clinical",
    highlighted: true,
    badge: "MOST POPULAR",
    features: [
      { text: "Supervision notes", isBold: true },
      { text: "Notes for therapy with children, couples, and families", isBold: true },
      { text: "Specialist modalities: EMDR, Play Therapy, Psychiatry" },
      { text: "100+ custom templates for every orientation (CBT, psychodynamic, systemic, schema therapy)" },
      { text: "Priority support", isBold: true },
      { text: "Personalized training" },
    ],
  },
];

export default function PricingPage() {
  const [billingPlan, setBillingPlan] = useState<BillingPlan>("annually");

  const handleSwitch = () => {
    setBillingPlan((prev) => (prev === "monthly" ? "annually" : "monthly"));
  };

  return (
    <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Simple and Transparent Pricing
          </h1>

          <div className="flex items-center justify-center gap-4">
            <span
              className={cn(
                "text-base font-medium transition-colors",
                billingPlan === "monthly" ? "text-gray-900" : "text-gray-500"
              )}
            >
              Monthly
            </span>
            <button
              onClick={handleSwitch}
              className="relative rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900"
              aria-label="Toggle billing plan"
            >
              <div className="w-14 h-7 bg-gray-900 rounded-full transition-colors" />
              <div
                className={cn(
                  "absolute top-1 w-5 h-5 bg-white rounded-full transition-all duration-300 ease-in-out",
                  billingPlan === "annually" ? "left-8" : "left-1"
                )}
              />
            </button>
            <span
              className={cn(
                "text-base font-medium transition-colors",
                billingPlan === "annually" ? "text-gray-900" : "text-gray-500"
              )}
            >
              Annual
            </span>
            <span className="text-sm font-semibold text-gray-600">
              (Save up to EUR 180)
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {PRICING_PLANS.map((plan) => (
            <PricingCard key={plan.id} plan={plan} billingPlan={billingPlan} />
          ))}
        </div>
      </div>
    </div>
  );
}

function PricingCard({
  plan,
  billingPlan,
}: {
  plan: PricingPlan;
  billingPlan: BillingPlan;
}) {
  const displayPrice =
    billingPlan === "monthly" ? plan.monthlyPrice : plan.yearlyPrice;

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-2xl border bg-white transition-all",
        plan.highlighted
          ? "border-gray-900 shadow-xl ring-1 ring-gray-900"
          : "border-gray-200 hover:border-gray-300 hover:shadow-md"
      )}
    >
      {plan.badge && (
        <div className="absolute -top-3 right-4">
          <span className="inline-block bg-gray-900 text-white text-xs font-bold px-3 py-1.5 rounded-full">
            {plan.badge}
          </span>
        </div>
      )}

      <div className="p-6 flex flex-col h-full">
        <div className="h-[72px]">
          <h3 className="text-xl font-semibold text-gray-900 mb-1">
            {plan.title}
          </h3>
          <p className="text-sm text-gray-500">
            <span className="font-medium">Ideal for:</span> {plan.idealFor}
          </p>
        </div>

        <div className="h-[100px]">
          {plan.isFree ? (
            <div className="text-3xl font-bold text-gray-900">Free</div>
          ) : (
            <>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-gray-900">
                  EUR {displayPrice.toFixed(2)}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-1">*/month</p>
              <AnimatePresence mode="wait">
                {billingPlan === "annually" && plan.yearlySavings > 0 && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-sm font-medium text-emerald-600 mt-1"
                  >
                    Save EUR {plan.yearlySavings}/year
                  </motion.p>
                )}
              </AnimatePresence>
            </>
          )}
        </div>

        <div className="h-[60px]">
          <Button
            variant={plan.buttonVariant}
            className={cn(
              "w-full",
              plan.highlighted &&
                "bg-gray-900 hover:bg-gray-800 text-white border-gray-900"
            )}
          >
            {plan.buttonText}
          </Button>
          {plan.noCardRequired ? (
            <p className="text-xs text-gray-400 text-center mt-2">
              No credit card required
            </p>
          ) : (
            <p className="text-xs text-transparent text-center mt-2 select-none">
              Placeholder
            </p>
          )}
        </div>

        <div className="border-t border-gray-100 pt-4 mt-4 flex-1">
          <p className="font-semibold text-gray-900 mb-3">{plan.sessionsLabel}</p>

          {plan.includesFrom && (
            <p className="text-sm text-emerald-600 font-medium mb-3 italic">
              Everything in {plan.includesFrom}, plus:
            </p>
          )}

          <ul className="space-y-2.5">
            {plan.features.map((feature, index) => (
              <li key={index} className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <span
                  className={cn(
                    "text-sm",
                    feature.isBold
                      ? "font-semibold text-gray-900"
                      : "text-gray-600"
                  )}
                >
                  {feature.text}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
