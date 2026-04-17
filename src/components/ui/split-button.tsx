import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SplitButtonProps {
  onMainClick: () => void;
  disabled?: boolean;
  className?: string;
  mainClassName?: string;
  dropdownClassName?: string;
  children: React.ReactNode;
  dropdownContent: React.ReactNode;
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function SplitButton({
  onMainClick,
  disabled,
  className,
  mainClassName,
  dropdownClassName,
  children,
  dropdownContent,
  size = 'lg',
}: SplitButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={cn('flex w-full', className)}>
      <Button
        onClick={onMainClick}
        disabled={disabled}
        className={cn(
          'flex-1 rounded-l-full rounded-r-none -mr-px',
          mainClassName
        )}
        size={size}
      >
        {children}
      </Button>
      <DropdownMenu onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            disabled={disabled}
            className={cn(
              'rounded-r-full rounded-l-none px-3',
              dropdownClassName
            )}
            size={size}
          >
            <motion.div
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
            >
              <ChevronDown className="h-4 w-4" />
            </motion.div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="rounded-2xl">
          {dropdownContent}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
