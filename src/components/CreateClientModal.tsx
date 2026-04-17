import { useState } from 'react';
import { X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';

export interface NewClientData {
  name: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  tariffa_default?: number;
}

interface CreateClientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateClient: (client: NewClientData) => void;
}

export function CreateClientModal({
  open,
  onOpenChange,
  onCreateClient,
}: CreateClientModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState<Date | undefined>(undefined);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [gender, setGender] = useState('');
  const [tariffa, setTariffa] = useState('');

  const reset = () => {
    setName('');
    setEmail('');
    setPhone('');
    setDateOfBirth(undefined);
    setGender('');
    setTariffa('');
  };

  const handleSubmit = () => {
    if (!name.trim()) return;

    onCreateClient({
      name: name.trim(),
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      dateOfBirth: dateOfBirth ? dateOfBirth.toISOString() : undefined,
      gender: gender || undefined,
      tariffa_default: tariffa !== '' ? parseFloat(tariffa) : undefined,
    });

    reset();
    onOpenChange(false);
  };

  const handleCancel = () => {
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] rounded-3xl p-0 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <DialogHeader className="mb-6">
            <div className="flex items-start justify-between">
              <div>
                <DialogTitle className="text-2xl">Nuovo paziente</DialogTitle>
                <DialogDescription className="mt-2">
                  Solo il nome è obbligatorio.
                </DialogDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCancel}
                className="rounded-full h-8 w-8 -mr-2 -mt-2"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Nome <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Nome e cognome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-11 rounded-xl"
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                autoFocus
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="paziente@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium">Telefono</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+39 333 1234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-11 rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth" className="text-sm font-medium">Data di nascita</Label>
                <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      id="dateOfBirth"
                      className="w-full h-11 rounded-xl justify-between font-normal"
                    >
                      {dateOfBirth ? dateOfBirth.toLocaleDateString('it-IT') : 'Seleziona data'}
                      <ChevronDown className="h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateOfBirth}
                      captionLayout="dropdown"
                      onSelect={(date) => {
                        setDateOfBirth(date);
                        setIsDatePickerOpen(false);
                      }}
                      fromYear={1900}
                      toYear={new Date().getFullYear()}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender" className="text-sm font-medium">Genere</Label>
                <Select value={gender} onValueChange={setGender}>
                  <SelectTrigger id="gender" className="h-11 rounded-xl">
                    <SelectValue placeholder="Non specificato" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Uomo</SelectItem>
                    <SelectItem value="female">Donna</SelectItem>
                    <SelectItem value="non-binary">Non-binary</SelectItem>
                    <SelectItem value="other">Altro</SelectItem>
                    <SelectItem value="prefer-not-to-say">Preferisco non specificare</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2 pt-1 border-t">
              <div className="pt-3">
                <Label htmlFor="tariffa" className="text-sm font-medium">Tariffa per seduta</Label>
                <p className="text-xs text-muted-foreground mt-0.5 mb-2">
                  Viene usata automaticamente quando si genera una fattura
                </p>
                <div className="relative max-w-[200px]">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">€</span>
                  <Input
                    id="tariffa"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={tariffa}
                    onChange={(e) => setTariffa(e.target.value)}
                    className="h-11 rounded-xl pl-8"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-8">
            <Button variant="outline" onClick={handleCancel} className="rounded-full px-6">
              Annulla
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!name.trim()}
              className="rounded-full px-6"
            >
              Crea paziente
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
