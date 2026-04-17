import { useTranslation } from 'react-i18next';
import { Globe, ChevronUp } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const languages = [
    { code: 'en', name: 'EN', fullName: 'English' },
    { code: 'it', name: 'IT', fullName: 'Italiano' },
  ];

  const handleLanguageChange = (value: string) => {
    i18n.changeLanguage(value);
  };

  const currentLang = languages.find((lang) => lang.code === i18n.language) || languages[0];

  return (
    <Select value={i18n.language} onValueChange={handleLanguageChange}>
      <SelectTrigger className="w-auto rounded-full px-4 gap-2 border-0 md:border">
        <Globe className="h-4 w-4" />
        <span className="hidden md:inline">{currentLang.name}</span>
        <ChevronUp className="h-4 w-4" />
      </SelectTrigger>
      <SelectContent className="rounded-2xl">
        {languages.map((lang) => (
          <SelectItem key={lang.code} value={lang.code}>
            {lang.fullName}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
