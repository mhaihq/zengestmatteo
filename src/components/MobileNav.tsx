import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { Home, FileText, Users, Clock, Bot } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

const MOBILE_LABEL_WIDTH = 72;

export function MobileNav() {
  const location = useLocation();
  const { t } = useTranslation();
  const [activeIndex, setActiveIndex] = useState(0);

  const navItems = useMemo(() => [
    { path: '/', label: t('nav.home'), icon: Home },
    { path: '/sessions', label: t('nav.sessions'), icon: Clock },
    { path: '/templates', label: t('nav.templates'), icon: FileText },
    { path: '/clients', label: t('nav.clients'), icon: Users },
    { path: '/assistant', label: t('nav.assistant'), icon: Bot },
  ], [t]);

  useEffect(() => {
    const index = navItems.findIndex(item => item.path === location.pathname);
    if (index !== -1) {
      setActiveIndex(index);
    }
  }, [location.pathname, navItems]);

  return (
    <motion.nav
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 26 }}
      role="navigation"
      aria-label="Bottom Navigation"
      className={cn(
        "md:hidden fixed inset-x-0 bottom-4 mx-auto z-50 w-fit",
        "bg-card dark:bg-card border border-border dark:border-sidebar-border rounded-full flex items-center p-2 shadow-xl space-x-1 min-w-[320px] max-w-[95vw] h-[52px]"
      )}
    >
      {navItems.map((item, idx) => {
        const Icon = item.icon;
        const isActive = activeIndex === idx;

        return (
          <motion.div
            key={item.path}
            whileTap={{ scale: 0.97 }}
            className="flex-1 flex justify-center"
          >
            <Link
              to={item.path}
              className={cn(
                "flex items-center gap-0 px-3 py-2 rounded-full transition-colors duration-200 relative h-10 min-w-[44px] min-h-[40px] max-h-[44px]",
                isActive
                  ? "bg-primary/10 dark:bg-primary/15 text-primary dark:text-primary gap-2"
                  : "bg-transparent text-muted-foreground dark:text-muted-foreground hover:bg-muted dark:hover:bg-muted",
                "focus:outline-none focus-visible:ring-0"
              )}
              aria-label={item.label}
            >
              <Icon
                size={22}
                strokeWidth={2}
                aria-hidden
                className="transition-colors duration-200"
              />

              <motion.div
                initial={false}
                animate={{
                  width: isActive ? `${MOBILE_LABEL_WIDTH}px` : "0px",
                  opacity: isActive ? 1 : 0,
                  marginLeft: isActive ? "8px" : "0px",
                }}
                transition={{
                  width: { type: "spring", stiffness: 350, damping: 32 },
                  opacity: { duration: 0.19 },
                  marginLeft: { duration: 0.19 },
                }}
                className={cn("overflow-hidden flex items-center max-w-[72px]")}
              >
                <span
                  className={cn(
                    "font-medium text-xs whitespace-nowrap select-none transition-opacity duration-200 overflow-hidden text-ellipsis text-[clamp(0.625rem,0.5263rem+0.5263vw,1rem)] leading-[1.9]",
                    isActive ? "text-primary dark:text-primary" : "opacity-0"
                  )}
                  title={item.label}
                >
                  {item.label}
                </span>
              </motion.div>
            </Link>
          </motion.div>
        );
      })}
    </motion.nav>
  );
}
