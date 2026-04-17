import { useState } from 'react';
import { Check, ChevronsUpDown, Plus, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface Client {
  id: string;
  name: string;
  email: string;
}

interface ClientSelectorProps {
  clients: Client[];
  value: string;
  onValueChange: (value: string) => void;
  onCreateNew: () => void;
  placeholder?: string;
}

const getAvatarColor = (name: string) => {
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-orange-500',
    'bg-cyan-500',
  ];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
};

const getInitials = (name: string) => {
  const parts = name.split(' ');
  return parts.map((part) => part[0]).join('').toUpperCase().slice(0, 2);
};

export function ClientSelector({
  clients,
  value,
  onValueChange,
  onCreateNew,
  placeholder,
}: ClientSelectorProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const selectedClient = clients.find((client) => client.id === value);
  const defaultPlaceholder = placeholder || t('clientSelector.enterClientName');

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full h-12 justify-between rounded-full bg-muted/50 hover:bg-muted/70"
        >
          <span className="truncate">
            {selectedClient ? selectedClient.name : defaultPlaceholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0 rounded-2xl" align="start">
        <Command className="rounded-2xl">
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <CommandInput
              placeholder={t('clientSelector.searchClients')}
              className="h-12 border-0 focus:ring-0"
            />
          </div>
          <CommandList>
            <CommandEmpty>{t('clientSelector.noClientFound')}</CommandEmpty>
            <CommandGroup>
              {clients.map((client) => (
                <CommandItem
                  key={client.id}
                  value={client.name}
                  onSelect={() => {
                    onValueChange(client.id);
                    setOpen(false);
                  }}
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer"
                >
                  <Avatar className={`h-10 w-10 ${getAvatarColor(client.name)}`}>
                    <AvatarFallback className="text-white font-semibold text-sm">
                      {getInitials(client.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{client.name}</div>
                  </div>
                  <Check
                    className={cn(
                      'h-4 w-4',
                      value === client.id ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup>
              <CommandItem
                onSelect={() => {
                  setOpen(false);
                  onCreateNew();
                }}
                className="flex items-center gap-3 px-4 py-3 cursor-pointer"
              >
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                  <Plus className="h-5 w-5" />
                </div>
                <span className="font-medium">{t('clientSelector.createNewClient')}</span>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
