import { useState } from 'react';
import { Upload, ExternalLink, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SettingsLayout } from '@/components/settings/SettingsLayout';
import { SettingsCard } from '@/components/settings/SettingsCard';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const TITLES = ['Dr.', 'Mr.', 'Ms.', 'Mrs.', 'Prof.'];
const SPECIALTIES = [
  'Psychiatrist',
  'Psychologist',
  'Therapist',
  'Counselor',
  'Social Worker',
  'Nurse Practitioner',
  'Other',
];
const COMPANY_SIZES = ['Just me', '2-10', '11-50', '51-200', '200+'];
const ROLES = [
  'Clinical lead, department lead, head of...',
  'Practice owner',
  'Employed clinician',
  'Independent contractor',
  'Administrator',
  'Other',
];
const STATES = [
  'Select state/region',
  'Lombardy',
  'Lazio',
  'Campania',
  'Sicily',
  'Veneto',
  'Emilia-Romagna',
  'Piedmont',
  'Tuscany',
];

export function ProfileSettingsPage() {
  const { t } = useTranslation();
  const [profile, setProfile] = useState({
    title: '',
    firstName: 'Sthita',
    lastName: 'Pujari',
    specialty: 'Psychiatrist',
    organization: 'Animeshp',
    companySize: 'Just me',
    role: 'Clinical lead, department lead, head of...',
    country: 'Italy',
    state: '',
  });

  const updateProfile = (field: string, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const getInitials = () => {
    const first = profile.firstName?.[0] || '';
    const last = profile.lastName?.[0] || '';
    return `${first}${last}`.toUpperCase() || 'U';
  };

  return (
    <SettingsLayout title="Account">
      <p className="text-sm text-muted-foreground mb-6">
        By using Heidi you acknowledge and agree to abide by the{' '}
        <a href="#" className="text-primary hover:underline inline-flex items-center gap-1">
          Usage Policy <ExternalLink className="h-3 w-3" />
        </a>
        {' '}and{' '}
        <a href="#" className="text-primary hover:underline inline-flex items-center gap-1">
          Terms of Use <ExternalLink className="h-3 w-3" />
        </a>
      </p>

      <SettingsCard title="About you">
        <div className="space-y-6">
          <div>
            <Label className="text-sm font-medium">Profile image</Label>
            <div className="flex items-center gap-4 mt-2">
              <Avatar className="h-16 w-16 border-2 border-dashed border-muted-foreground/30">
                <AvatarFallback className="text-lg bg-muted">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Upload a JPG or PNG image up to 5MB. Shows in the template community.
                </p>
                <Button variant="outline" size="sm" className="gap-2">
                  <Upload className="h-4 w-4" />
                  Upload image
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Select value={profile.title} onValueChange={(v) => updateProfile('title', v)}>
                <SelectTrigger id="title" className="mt-1.5">
                  <SelectValue placeholder={t('profile.selectTitle')} />
                </SelectTrigger>
                <SelectContent>
                  {TITLES.map((title) => (
                    <SelectItem key={title} value={title}>
                      {title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="firstName">First name</Label>
              <Input
                id="firstName"
                value={profile.firstName}
                onChange={(e) => updateProfile('firstName', e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last name</Label>
              <Input
                id="lastName"
                value={profile.lastName}
                onChange={(e) => updateProfile('lastName', e.target.value)}
                className="mt-1.5"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="specialty">Specialty</Label>
            <Select value={profile.specialty} onValueChange={(v) => updateProfile('specialty', v)}>
              <SelectTrigger id="specialty" className="mt-1.5">
                <SelectValue placeholder={t('profile.selectSpecialty')} />
              </SelectTrigger>
              <SelectContent>
                {SPECIALTIES.map((specialty) => (
                  <SelectItem key={specialty} value={specialty}>
                    {specialty}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="organization">Organisation name</Label>
              <Input
                id="organization"
                value={profile.organization}
                onChange={(e) => updateProfile('organization', e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="companySize">Company size</Label>
              <Select value={profile.companySize} onValueChange={(v) => updateProfile('companySize', v)}>
                <SelectTrigger id="companySize" className="mt-1.5">
                  <SelectValue placeholder={t('profile.selectSize')} />
                </SelectTrigger>
                <SelectContent>
                  {COMPANY_SIZES.map((size) => (
                    <SelectItem key={size} value={size}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="role">Your role</Label>
              <Select value={profile.role} onValueChange={(v) => updateProfile('role', v)}>
                <SelectTrigger id="role" className="mt-1.5">
                  <SelectValue placeholder={t('profile.selectRole')} />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="country">Country</Label>
              <a href="#" className="text-sm text-primary hover:underline">
                Why can't I change this?
              </a>
            </div>
            <div className="mt-1.5 bg-muted/50 rounded-lg px-4 py-3 text-muted-foreground">
              {profile.country}
            </div>
            <a href="#" className="text-sm text-primary hover:underline inline-flex items-center gap-1 mt-2">
              Privacy Policy for my country <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          <div>
            <Label htmlFor="state">State/Region</Label>
            <Select value={profile.state} onValueChange={(v) => updateProfile('state', v)}>
              <SelectTrigger id="state" className="mt-1.5">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder={t('profile.selectState')} />
                </div>
              </SelectTrigger>
              <SelectContent>
                {STATES.map((state) => (
                  <SelectItem key={state} value={state}>
                    {state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </SettingsCard>
    </SettingsLayout>
  );
}
