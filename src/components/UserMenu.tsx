import { useNavigate } from 'react-router-dom';
import { User, Download, Settings } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface UserMenuProps {
  userName?: string;
  userInitials?: string;
  showGreeting?: boolean;
}

export function UserMenu({ userName = 'User', userInitials = 'U', showGreeting = false }: UserMenuProps) {
  const navigate = useNavigate();

  const handleDownloadConsentForm = () => {
    const link = document.createElement('a');
    link.href = '/consent-form-template.pdf';
    link.download = 'client-consent-form.pdf';
    link.click();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 outline-none">
          {showGreeting && (
            <span className="text-sm hidden lg:inline-block">Hi {userName}!</span>
          )}
          <Avatar className="h-8 w-8 cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all">
            <AvatarFallback className="bg-blue-500 text-white">
              {userInitials}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 rounded-xl">
        <DropdownMenuItem
          className="gap-3 cursor-pointer py-2.5"
          onClick={() => navigate('/settings/profile')}
        >
          <User className="h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="gap-3 cursor-pointer py-2.5"
          onClick={handleDownloadConsentForm}
        >
          <Download className="h-4 w-4" />
          <span>Client Consent Form</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="gap-3 cursor-pointer py-2.5"
          onClick={() => navigate('/settings/profile')}
        >
          <Settings className="h-4 w-4" />
          <span>Account Settings</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
