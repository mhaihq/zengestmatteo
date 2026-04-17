import { useState, useEffect, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  User,
  CreditCard,
  Database,
  Shield,
  FileCheck,
  MessageSquare,
  ChevronRight,
  ChevronLeft,
  Search,
  Receipt,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface SettingsNavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path: string;
}

interface SettingsSection {
  title: string;
  items: SettingsNavItem[];
}

const settingsSections: SettingsSection[] = [
  {
    title: 'Personal',
    items: [
      { id: 'profile', label: 'Account', icon: User, path: '/settings/profile' },
      { id: 'billing', label: 'Billing', icon: CreditCard, path: '/settings/billing' },
      { id: 'data-management', label: 'Data management', icon: Database, path: '/settings/data-management' },
      { id: 'security', label: 'Security', icon: Shield, path: '/settings/security' },
      { id: 'consent-form', label: 'Client Consent Form', icon: FileCheck, path: '/settings/consent-form' },
      { id: 'contact', label: 'Contact Us', icon: MessageSquare, path: '/settings/contact' },
    ],
  },
  {
    title: 'Fatturazione',
    items: [
      { id: 'fatturazione', label: 'Profilo Fiscale', icon: Receipt, path: '/settings/fatturazione' },
    ],
  },
];

interface SettingsLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
}

export function SettingsLayout({ children, title, description }: SettingsLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const isActive = (path: string) => location.pathname === path;

  const filteredSections = settingsSections.map(section => ({
    ...section,
    items: section.items.filter(item =>
      item.label.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter(section => section.items.length > 0);

  const isSettingsIndex = location.pathname === '/settings';

  if (isMobile && isSettingsIndex) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="p-4">
          <h1 className="text-2xl font-bold mb-6">Settings</h1>

          {settingsSections.map((section) => (
            <div key={section.title} className="mb-6">
              <h2 className="text-sm font-semibold text-muted-foreground mb-3">
                {section.title}
              </h2>
              <Card className="overflow-hidden">
                {section.items.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => navigate(item.path)}
                      className={`flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                        index !== section.items.length - 1 ? 'border-b' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium">{item.label}</span>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </motion.div>
                  );
                })}
              </Card>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="sticky top-0 z-10 bg-background border-b">
          <div className="flex items-center gap-2 p-4">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 -ml-2"
              onClick={() => navigate('/settings')}
            >
              <ChevronLeft className="h-4 w-4" />
              Settings
            </Button>
          </div>
        </div>

        <div className="p-4">
          <h1 className="text-2xl font-bold mb-2">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground mb-6">{description}</p>
          )}
          <div className="border-b mb-6" />
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      <motion.aside
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="w-64 border-r bg-muted/30 flex flex-col overflow-hidden"
      >
        <div className="p-4 border-b">
          <h1 className="text-lg font-semibold mb-4">Settings</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 rounded-lg"
            />
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-2">
          {filteredSections.map((section) => (
            <div key={section.title} className="mb-4">
              <h2 className="text-xs font-semibold text-muted-foreground px-3 py-2">
                {section.title}
              </h2>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  return (
                    <button
                      key={item.id}
                      onClick={() => navigate(item.path)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                        active
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'hover:bg-muted text-foreground'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </motion.aside>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl p-6 lg:p-8">
          <div className="mb-2">
            <p className="text-sm text-muted-foreground">Personal</p>
            <h1 className="text-2xl font-bold">{title}</h1>
          </div>
          {description && (
            <p className="text-sm text-muted-foreground mb-6">{description}</p>
          )}
          <div className="border-b mb-6" />
          {children}
        </div>
      </main>
    </div>
  );
}
