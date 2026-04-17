import { useState } from 'react';
import { CreditCard, Check, Zap, Calendar, Download, Lock, ChevronDown, Sparkles, Crown, Gift } from 'lucide-react';
import { SettingsLayout } from '@/components/settings/SettingsLayout';
import { SettingsCard } from '@/components/settings/SettingsCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

const DUMMY_INVOICES = [
  { id: 'INV-001', date: 'Jan 1, 2024', amount: '€50.00', status: 'Paid' },
  { id: 'INV-002', date: 'Dec 1, 2023', amount: '€50.00', status: 'Paid' },
  { id: 'INV-003', date: 'Nov 1, 2023', amount: '€50.00', status: 'Paid' },
];

interface PlanFeature {
  text: string;
  isBold?: boolean;
}

interface Plan {
  id: string;
  title: string;
  icon: React.ReactNode;
  monthlyPrice: number;
  yearlyPrice: number;
  sessionsLabel: string;
  includesFrom?: string;
  features: PlanFeature[];
  isFree?: boolean;
  noCardRequired?: boolean;
  highlighted?: boolean;
  badge?: string;
}

const PLANS: Plan[] = [
  {
    id: 'trial',
    title: 'Trial',
    icon: <Gift className="h-4 w-4" />,
    monthlyPrice: 0,
    yearlyPrice: 0,
    sessionsLabel: '10 sessions per month',
    isFree: true,
    noCardRequired: true,
    features: [
      { text: 'Session recording (in-person, online, audio upload)' },
      { text: 'Transcription with speaker recognition' },
      { text: 'Clinical notes for individual therapy' },
      { text: 'Patient consent form compliant with Code of Ethics' },
      { text: 'Session summary for patients' },
      { text: 'Customizable templates' },
    ],
  },
  {
    id: 'base',
    title: 'Base',
    icon: <Sparkles className="h-4 w-4" />,
    monthlyPrice: 14.99,
    yearlyPrice: 9.99,
    sessionsLabel: '40 sessions per month',
    includesFrom: 'Trial',
    features: [
      { text: 'AI clinical documentation creation', isBold: true },
      { text: 'Basic AI Assistant (limited access)', isBold: true },
      { text: 'Structured clinical notes for individual therapy' },
      { text: 'Customizable templates for individual therapy' },
    ],
  },
  {
    id: 'clinical',
    title: 'Clinical',
    icon: <Zap className="h-4 w-4" />,
    monthlyPrice: 29.99,
    yearlyPrice: 19.99,
    sessionsLabel: '100 sessions per month',
    includesFrom: 'Base',
    features: [
      { text: 'AI Assistant - unlimited full access', isBold: true },
      { text: 'AI Treatment Plans', isBold: true },
      { text: 'Therapeutic alliance analysis' },
      { text: 'Longitudinal progress analysis' },
      { text: 'Clinical pattern recognition' },
      { text: 'Unlimited chat with AI supervision' },
    ],
  },
  {
    id: 'professional',
    title: 'Professional',
    icon: <Crown className="h-4 w-4" />,
    monthlyPrice: 54.99,
    yearlyPrice: 39.99,
    sessionsLabel: 'Unlimited sessions',
    includesFrom: 'Clinical',
    highlighted: true,
    badge: 'POPULAR',
    features: [
      { text: 'Supervision notes', isBold: true },
      { text: 'Notes for therapy with children, couples, and families', isBold: true },
      { text: 'Specialist modalities: EMDR, Play Therapy, Psychiatry' },
      { text: '100+ custom templates for every orientation' },
      { text: 'Priority support', isBold: true },
      { text: 'Personalized training' },
    ],
  },
];

export function BillingSettingsPage() {
  const [isPlanActive, setIsPlanActive] = useState(false);
  const [isAnnual, setIsAnnual] = useState(false);
  const [allFeaturesOpen, setAllFeaturesOpen] = useState(false);

  const activePlan = PLANS.find(p => p.id === 'professional')!;
  const price = isAnnual ? activePlan.yearlyPrice : activePlan.monthlyPrice;
  const billingPeriod = isAnnual ? 'year' : 'month';

  return (
    <SettingsLayout title="Billing">
      <div className="mb-6 p-4 rounded-lg bg-muted/50 border">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="plan-toggle" className="text-sm font-medium">
              Developer Mode: Toggle Plan Status
            </Label>
            <p className="text-xs text-muted-foreground mt-1">
              Switch between active and inactive states for testing
            </p>
          </div>
          <Switch
            id="plan-toggle"
            checked={isPlanActive}
            onCheckedChange={setIsPlanActive}
          />
        </div>
      </div>

      {!isPlanActive ? (
        <>
          <SettingsCard title="Current Plan">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                <Gift className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">Free Trial</h3>
                  <Badge variant="secondary">Active</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  10 sessions per month
                </p>
              </div>
            </div>
          </SettingsCard>

          <SettingsCard title="Usage">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Sessions this month</span>
                <span className="text-sm font-medium">3 / 10</span>
              </div>
              <Progress value={30} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Resets on the 1st of each month
              </p>
            </div>
          </SettingsCard>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Upgrade Your Plan</h3>
              <div className="flex items-center gap-2">
                <span className={cn(
                  "text-xs font-medium transition-colors",
                  !isAnnual ? "text-foreground" : "text-muted-foreground"
                )}>
                  Monthly
                </span>
                <Switch
                  checked={isAnnual}
                  onCheckedChange={setIsAnnual}
                />
                <span className={cn(
                  "text-xs font-medium transition-colors",
                  isAnnual ? "text-foreground" : "text-muted-foreground"
                )}>
                  Annual
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {PLANS.filter(plan => plan.id !== 'trial').map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  isAnnual={isAnnual}
                  isOpen={allFeaturesOpen}
                  onToggle={() => setAllFeaturesOpen(!allFeaturesOpen)}
                />
              ))}
            </div>
          </div>
        </>
      ) : (
        <>
          <SettingsCard title="Current Plan">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-lg">Professional Plan</h3>
                    <Badge variant="secondary">Active</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    €{price}/{billingPeriod}, billed {isAnnual ? 'annually' : 'monthly'}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                className="text-destructive hover:text-destructive w-full sm:w-auto"
              >
                Cancel Subscription
              </Button>
            </div>

            <div className="pt-6 border-t">
              <h4 className="font-medium mb-4">Plan Features</h4>
              <p className="font-medium text-sm mb-3">{activePlan.sessionsLabel}</p>
              <ul className="space-y-3">
                {activePlan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-600 mt-0.5" />
                    <span className={cn("text-sm", feature.isBold && "font-semibold")}>{feature.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </SettingsCard>

          <SettingsCard title="Usage">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Sessions this month</span>
                <span className="text-sm font-medium">10 / 40</span>
              </div>
              <Progress value={25} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Resets on the 1st of each month
              </p>
            </div>
          </SettingsCard>

          <SettingsCard title="Payment Method">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-16 rounded-lg bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-medium">Visa ending in 4242</p>
                  <p className="text-sm text-muted-foreground">Expires 02/2025</p>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" className="flex-1 sm:flex-none">
                  Update Card
                </Button>
                <Button
                  variant="ghost"
                  className="text-destructive hover:text-destructive flex-1 sm:flex-none"
                >
                  Remove
                </Button>
              </div>
            </div>
          </SettingsCard>

          <SettingsCard title="Billing History">
            <div className="overflow-x-auto -mx-6 sm:mx-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead className="hidden sm:table-cell">Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead className="hidden sm:table-cell">Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {DUMMY_INVOICES.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.id}</TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {invoice.date}
                        </div>
                      </TableCell>
                      <TableCell>{invoice.amount}</TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="outline" className="text-green-600 border-green-600/30">
                          {invoice.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="gap-2">
                          <Download className="h-4 w-4" />
                          <span className="hidden sm:inline">PDF</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </SettingsCard>
        </>
      )}
    </SettingsLayout>
  );
}

interface PlanCardProps {
  plan: Plan;
  isAnnual: boolean;
  isOpen: boolean;
  onToggle: () => void;
}

function PlanCard({ plan, isAnnual, isOpen, onToggle }: PlanCardProps) {
  const displayPrice = isAnnual ? plan.yearlyPrice : plan.monthlyPrice;
  const savingsPercent = plan.monthlyPrice > 0
    ? Math.round((1 - plan.yearlyPrice / plan.monthlyPrice) * 100)
    : 0;

  return (
    <div className={cn(
      "relative rounded-lg border bg-card p-4 flex flex-col h-full",
      plan.highlighted && "ring-2 ring-primary"
    )}>
      {plan.badge && (
        <Badge className="absolute -top-2 right-3 bg-primary text-primary-foreground text-[10px] px-2 py-0.5">
          {plan.badge}
        </Badge>
      )}

      <div className="flex items-center gap-2 mb-3">
        <div className={cn(
          "h-8 w-8 rounded-lg flex items-center justify-center",
          plan.highlighted ? "bg-primary text-primary-foreground" : "bg-muted"
        )}>
          {plan.icon}
        </div>
        <h3 className="font-semibold">{plan.title}</h3>
      </div>

      <div className="mb-2">
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold">€{displayPrice.toFixed(2)}</span>
          <span className="text-xs text-muted-foreground">/mo</span>
        </div>
        {isAnnual && savingsPercent > 0 && (
          <p className="text-xs text-green-600 font-medium">
            Save {savingsPercent}% yearly
          </p>
        )}
      </div>

      <p className="text-xs text-muted-foreground mb-3">{plan.sessionsLabel}</p>

      <Collapsible open={isOpen} onOpenChange={onToggle}>
        <CollapsibleTrigger asChild>
          <button className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors w-full py-2 border-t">
            <span>Features</span>
            <ChevronDown className={cn(
              "h-3 w-3 transition-transform duration-200",
              isOpen && "rotate-180"
            )} />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2">
          {plan.includesFrom && (
            <p className="text-xs text-green-600 font-medium mb-2 italic">
              All from {plan.includesFrom} +
            </p>
          )}
          <ul className="space-y-1.5">
            {plan.features.slice(0, 4).map((feature, index) => (
              <li key={index} className="flex items-start gap-1.5">
                <Check className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                <span className={cn(
                  "text-xs leading-tight",
                  feature.isBold ? "font-medium" : "text-muted-foreground"
                )}>
                  {feature.text}
                </span>
              </li>
            ))}
            {plan.features.length > 4 && (
              <li className="text-xs text-muted-foreground pl-4">
                +{plan.features.length - 4} more
              </li>
            )}
          </ul>
        </CollapsibleContent>
      </Collapsible>

      <div className="mt-auto pt-3">
        <Button
          size="sm"
          className={cn(
            "w-full text-xs",
            plan.highlighted
              ? "bg-primary hover:bg-primary/90"
              : "bg-gray-900 hover:bg-gray-800 text-white"
          )}
        >
          Subscribe
        </Button>
        <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground mt-2">
          <Lock className="h-2.5 w-2.5" />
          <span>Secure checkout</span>
        </div>
      </div>
    </div>
  );
}
