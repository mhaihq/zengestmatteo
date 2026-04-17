import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Chrome as Home, FileText, Users, Sun, Moon, CircleHelp as HelpCircle, Clock, Bot } from 'lucide-react';
import { Button } from './ui/button';
import { useState } from 'react';
import { LanguageSwitcher } from './LanguageSwitcher';
import { UserMenu } from './UserMenu';
import { FAQDialog } from './FAQDialog';
import { useTranslation } from 'react-i18next';

export function Header() {
  const location = useLocation();
  const { t } = useTranslation();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isFAQOpen, setIsFAQOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark');
  };

  const navItems = [
    { path: '/', label: t('nav.home'), icon: Home },
    { path: '/sessions', label: t('nav.sessions'), icon: Clock },
    { path: '/templates', label: t('nav.templates'), icon: FileText },
    { path: '/clients', label: t('nav.clients'), icon: Users },
    { path: '/assistant', label: t('nav.assistant'), icon: Bot },
  ];

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:block hidden"
      >
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-6 md:gap-8">
            <Link to="/" className="flex items-center">
              <img
                src="https://cdn.prod.website-files.com/6985ec3788addb8b6efcb94f/6985ec3788addb8b6efcba5a_3-p-500.png"
                alt="Logo"
                className="h-8 w-auto object-contain"
              />
            </Link>

            <nav className="flex items-center gap-1 md:gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link key={item.path} to={item.path}>
                    <Button
                      variant={active ? 'secondary' : 'ghost'}
                      size="sm"
                      className="gap-2 relative rounded-full"
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                      {active && (
                        <motion.div
                          layoutId="activeTab"
                          className="absolute inset-0 bg-secondary rounded-full -z-10"
                          transition={{ type: 'spring', duration: 0.5 }}
                        />
                      )}
                    </Button>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="rounded-full"
            >
              {theme === 'light' ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>

            <LanguageSwitcher />

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsFAQOpen(true)}
              className="rounded-full"
            >
              <HelpCircle className="h-5 w-5" />
            </Button>

            <UserMenu userName="User" userInitials="U" showGreeting />
          </div>
        </div>
      </motion.header>

      <motion.header
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 26 }}
        className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden"
      >
        <div className="flex h-14 items-center justify-between px-4">
          <Link to="/" className="flex items-center">
            <img
              src="https://cdn.prod.website-files.com/6985ec3788addb8b6efcb94f/6985ec3788addb8b6efcba5a_3-p-500.png"
              alt="Logo"
              className="h-7 w-auto object-contain"
            />
          </Link>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="rounded-full h-9 w-9"
            >
              {theme === 'light' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>

            <LanguageSwitcher />

            <UserMenu userName="User" userInitials="U" />
          </div>
        </div>
      </motion.header>

      <FAQDialog open={isFAQOpen} onOpenChange={setIsFAQOpen} />
    </>
  );
}
