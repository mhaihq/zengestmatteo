import { useState } from 'react';
import { X, ChevronDown, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
import type { TipoCliente, EsigibilitaIva } from '@/lib/supabase';

export interface NewClientData {
  name: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  tariffa_default?: number;
  tipo_cliente?: TipoCliente;
  codice_fiscale?: string;
  ragione_sociale?: string;
  partita_iva_cliente?: string;
  codice_destinatario?: string;
  pec_cliente?: string;
  codice_univoco_pa?: string;
  bonus_psicologo_attivo?: boolean;
  bonus_psicologo_importo?: number;
  esigibilita_iva?: EsigibilitaIva;
  ts_opposizione?: boolean;
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
  const { t } = useTranslation();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState<Date | undefined>(undefined);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [gender, setGender] = useState('');
  const [tariffa, setTariffa] = useState('');

  const [fiscalOpen, setFiscalOpen] = useState(false);
  const [tipoCliente, setTipoCliente] = useState<TipoCliente>('privato');
  const [codiceFiscale, setCodiceFiscale] = useState('');
  const [ragioneSociale, setRagioneSociale] = useState('');
  const [partitaIvaCliente, setPartitaIvaCliente] = useState('');
  const [codiceDestinatario, setCodiceDestinatario] = useState('');
  const [pecCliente, setPecCliente] = useState('');
  const [codiceUnivocoPa, setCodiceUnivocoPa] = useState('');
  const [bonusAttivo, setBonusAttivo] = useState(false);
  const [bonusImporto, setBonusImporto] = useState('');
  const [esigibilita, setEsigibilita] = useState<EsigibilitaIva>(null);
  const [tsOpposizione, setTsOpposizione] = useState(false);

  const reset = () => {
    setName('');
    setEmail('');
    setPhone('');
    setDateOfBirth(undefined);
    setGender('');
    setTariffa('');
    setFiscalOpen(false);
    setTipoCliente('privato');
    setCodiceFiscale('');
    setRagioneSociale('');
    setPartitaIvaCliente('');
    setCodiceDestinatario('');
    setPecCliente('');
    setCodiceUnivocoPa('');
    setBonusAttivo(false);
    setBonusImporto('');
    setEsigibilita(null);
    setTsOpposizione(false);
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
      tipo_cliente: tipoCliente,
      codice_fiscale: codiceFiscale.trim() || undefined,
      ragione_sociale: ragioneSociale.trim() || undefined,
      partita_iva_cliente: partitaIvaCliente.trim() || undefined,
      codice_destinatario: codiceDestinatario.trim() || undefined,
      pec_cliente: pecCliente.trim() || undefined,
      codice_univoco_pa: codiceUnivocoPa.trim() || undefined,
      bonus_psicologo_attivo: bonusAttivo,
      bonus_psicologo_importo:
        bonusAttivo && bonusImporto !== '' ? parseFloat(bonusImporto) : undefined,
      esigibilita_iva: esigibilita,
      ts_opposizione: tsOpposizione,
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
      <DialogContent className="sm:max-w-[640px] rounded-3xl p-0 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <DialogHeader className="mb-6">
            <div className="flex items-start justify-between">
              <div>
                <DialogTitle className="text-2xl">
                  {t('createClient.newPatient')}
                </DialogTitle>
                <DialogDescription className="mt-2">
                  {t('createClient.onlyNameRequired')}
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
                {t('createClient.name')} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder={t('createClient.namePlaceholder')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-11 rounded-xl"
                onKeyDown={(e) => e.key === 'Enter' && !fiscalOpen && handleSubmit()}
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
                <Label htmlFor="phone" className="text-sm font-medium">
                  {t('createClient.phone')}
                </Label>
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
                <Label htmlFor="dateOfBirth" className="text-sm font-medium">
                  {t('createClient.dateOfBirth')}
                </Label>
                <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      id="dateOfBirth"
                      className="w-full h-11 rounded-xl justify-between font-normal"
                    >
                      {dateOfBirth
                        ? dateOfBirth.toLocaleDateString('it-IT')
                        : t('common.selectDate')}
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
                <Label htmlFor="gender" className="text-sm font-medium">
                  {t('createClient.gender')}
                </Label>
                <Select value={gender} onValueChange={setGender}>
                  <SelectTrigger id="gender" className="h-11 rounded-xl">
                    <SelectValue placeholder={t('createClient.unspecified')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">{t('createClient.male')}</SelectItem>
                    <SelectItem value="female">{t('createClient.female')}</SelectItem>
                    <SelectItem value="non-binary">Non-binary</SelectItem>
                    <SelectItem value="other">{t('createClient.other')}</SelectItem>
                    <SelectItem value="prefer-not-to-say">
                      {t('createClient.preferNotToSay')}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="pt-4 border-t">
              <Label htmlFor="tariffa" className="text-sm font-medium">
                {t('createClient.sessionFee')}
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5 mb-2">
                {t('createClient.sessionFeeDesc')}
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

            <FiscalSection
              open={fiscalOpen}
              onToggle={() => setFiscalOpen((v) => !v)}
              tipoCliente={tipoCliente}
              onTipoCliente={setTipoCliente}
              codiceFiscale={codiceFiscale}
              onCodiceFiscale={setCodiceFiscale}
              ragioneSociale={ragioneSociale}
              onRagioneSociale={setRagioneSociale}
              partitaIvaCliente={partitaIvaCliente}
              onPartitaIvaCliente={setPartitaIvaCliente}
              codiceDestinatario={codiceDestinatario}
              onCodiceDestinatario={setCodiceDestinatario}
              pecCliente={pecCliente}
              onPecCliente={setPecCliente}
              codiceUnivocoPa={codiceUnivocoPa}
              onCodiceUnivocoPa={setCodiceUnivocoPa}
              bonusAttivo={bonusAttivo}
              onBonusAttivo={setBonusAttivo}
              bonusImporto={bonusImporto}
              onBonusImporto={setBonusImporto}
              esigibilita={esigibilita}
              onEsigibilita={setEsigibilita}
              tsOpposizione={tsOpposizione}
              onTsOpposizione={setTsOpposizione}
              t={t}
            />
          </div>

          <div className="flex justify-end gap-3 mt-8">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="rounded-full px-6"
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!name.trim()}
              className="rounded-full px-6"
            >
              {t('createClient.createPatient')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Fiscal section (collapsible) ───────────────────────────────────────────

interface FiscalSectionProps {
  open: boolean;
  onToggle: () => void;
  tipoCliente: TipoCliente;
  onTipoCliente: (v: TipoCliente) => void;
  codiceFiscale: string;
  onCodiceFiscale: (v: string) => void;
  ragioneSociale: string;
  onRagioneSociale: (v: string) => void;
  partitaIvaCliente: string;
  onPartitaIvaCliente: (v: string) => void;
  codiceDestinatario: string;
  onCodiceDestinatario: (v: string) => void;
  pecCliente: string;
  onPecCliente: (v: string) => void;
  codiceUnivocoPa: string;
  onCodiceUnivocoPa: (v: string) => void;
  bonusAttivo: boolean;
  onBonusAttivo: (v: boolean) => void;
  bonusImporto: string;
  onBonusImporto: (v: string) => void;
  esigibilita: EsigibilitaIva;
  onEsigibilita: (v: EsigibilitaIva) => void;
  tsOpposizione: boolean;
  onTsOpposizione: (v: boolean) => void;
  t: (k: string) => string;
}

function FiscalSection(props: FiscalSectionProps) {
  const { open, onToggle, tipoCliente, onTipoCliente, t } = props;

  return (
    <div className="pt-4 border-t">
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center gap-2 text-sm font-medium text-cyan-600 hover:text-cyan-700"
      >
        {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        {t('createClient.fiscalSection')}
      </button>
      <p className="text-xs text-muted-foreground mt-1 ml-6">
        {t('createClient.fiscalSectionDesc')}
      </p>

      {open && (
        <div className="mt-4 space-y-5">
          <TipoClientePicker tipo={tipoCliente} onChange={onTipoCliente} t={t} />
          {tipoCliente === 'privato' && <PrivatoFields {...props} />}
          {tipoCliente === 'azienda' && <AziendaFields {...props} />}
          {tipoCliente === 'pa' && <PaFields {...props} />}

          <div className="pt-4 border-t space-y-4">
            <label className="flex items-start justify-between gap-3 cursor-pointer">
              <div>
                <p className="text-sm font-medium">
                  {t('createClient.bonusPsicologo')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t('createClient.bonusPsicologoDesc')}
                </p>
              </div>
              <Switch
                checked={props.bonusAttivo}
                onCheckedChange={props.onBonusAttivo}
              />
            </label>
            {props.bonusAttivo && (
              <div>
                <Label className="text-xs text-muted-foreground">
                  {t('createClient.bonusImporto')}
                </Label>
                <div className="relative mt-1.5 max-w-[200px]">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">€</span>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={props.bonusImporto}
                    onChange={(e) => props.onBonusImporto(e.target.value)}
                    className="h-11 rounded-xl pl-8"
                  />
                </div>
              </div>
            )}

            {tipoCliente !== 'privato' && (
              <div>
                <Label className="text-xs text-muted-foreground">
                  {t('createClient.esigibilitaIva')}
                </Label>
                <Select
                  value={props.esigibilita ?? 'none'}
                  onValueChange={(v) =>
                    props.onEsigibilita(v === 'none' ? null : (v as EsigibilitaIva))
                  }
                >
                  <SelectTrigger className="h-11 rounded-xl mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t('createClient.esigibilitaNone')}</SelectItem>
                    <SelectItem value="immediata">{t('createClient.esigibilitaImmediata')}</SelectItem>
                    <SelectItem value="differita">{t('createClient.esigibilitaDifferita')}</SelectItem>
                    <SelectItem value="split_payment">Split payment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {tipoCliente === 'privato' && (
              <label className="flex items-start justify-between gap-3 cursor-pointer">
                <div>
                  <p className="text-sm font-medium">{t('createClient.tsOpposizione')}</p>
                  <p className="text-xs text-muted-foreground">
                    {t('createClient.tsOpposizioneDesc')}
                  </p>
                </div>
                <Switch
                  checked={props.tsOpposizione}
                  onCheckedChange={props.onTsOpposizione}
                />
              </label>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function TipoClientePicker({
  tipo,
  onChange,
  t,
}: {
  tipo: TipoCliente;
  onChange: (v: TipoCliente) => void;
  t: (k: string) => string;
}) {
  const opts: { value: TipoCliente; label: string; desc: string }[] = [
    { value: 'privato', label: t('createClient.tipoPrivato'), desc: t('createClient.tipoPrivatoDesc') },
    { value: 'azienda', label: t('createClient.tipoAzienda'), desc: t('createClient.tipoAziendaDesc') },
    { value: 'pa', label: t('createClient.tipoPa'), desc: t('createClient.tipoPaDesc') },
  ];
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
      {opts.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`text-left rounded-xl border px-3 py-2.5 transition-all ${
            tipo === o.value
              ? 'border-cyan-500 bg-cyan-50 ring-1 ring-cyan-500/20'
              : 'hover:bg-muted/40'
          }`}
        >
          <p className="text-sm font-medium">{o.label}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{o.desc}</p>
        </button>
      ))}
    </div>
  );
}

function PrivatoFields(props: FiscalSectionProps) {
  const { t } = props;
  return (
    <div>
      <Label htmlFor="cf" className="text-xs text-muted-foreground">
        {t('createClient.codiceFiscale')}
      </Label>
      <Input
        id="cf"
        value={props.codiceFiscale}
        onChange={(e) => props.onCodiceFiscale(e.target.value.toUpperCase())}
        placeholder="RSSMRA80A01H501U"
        className="h-11 rounded-xl font-mono uppercase mt-1.5"
      />
    </div>
  );
}

function AziendaFields(props: FiscalSectionProps) {
  const { t } = props;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div className="md:col-span-2">
        <Label className="text-xs text-muted-foreground">
          {t('createClient.ragioneSociale')}
        </Label>
        <Input
          value={props.ragioneSociale}
          onChange={(e) => props.onRagioneSociale(e.target.value)}
          className="h-11 rounded-xl mt-1.5"
        />
      </div>
      <div>
        <Label className="text-xs text-muted-foreground">
          {t('createClient.partitaIva')}
        </Label>
        <Input
          value={props.partitaIvaCliente}
          onChange={(e) => props.onPartitaIvaCliente(e.target.value)}
          placeholder="12345678901"
          className="h-11 rounded-xl font-mono mt-1.5"
        />
      </div>
      <div>
        <Label className="text-xs text-muted-foreground">
          {t('createClient.codiceFiscale')}
        </Label>
        <Input
          value={props.codiceFiscale}
          onChange={(e) => props.onCodiceFiscale(e.target.value.toUpperCase())}
          className="h-11 rounded-xl font-mono uppercase mt-1.5"
        />
      </div>
      <div>
        <Label className="text-xs text-muted-foreground">
          {t('createClient.codiceDestinatario')}
        </Label>
        <Input
          value={props.codiceDestinatario}
          onChange={(e) => props.onCodiceDestinatario(e.target.value.toUpperCase())}
          placeholder="0000000"
          className="h-11 rounded-xl font-mono uppercase mt-1.5"
        />
      </div>
      <div>
        <Label className="text-xs text-muted-foreground">
          {t('createClient.pecCliente')}
        </Label>
        <Input
          type="email"
          value={props.pecCliente}
          onChange={(e) => props.onPecCliente(e.target.value)}
          placeholder="cliente@pec.it"
          className="h-11 rounded-xl mt-1.5"
        />
      </div>
    </div>
  );
}

function PaFields(props: FiscalSectionProps) {
  const { t } = props;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div className="md:col-span-2">
        <Label className="text-xs text-muted-foreground">
          {t('createClient.ragioneSociale')}
        </Label>
        <Input
          value={props.ragioneSociale}
          onChange={(e) => props.onRagioneSociale(e.target.value)}
          className="h-11 rounded-xl mt-1.5"
        />
      </div>
      <div>
        <Label className="text-xs text-muted-foreground">
          {t('createClient.codiceUnivocoPa')}
        </Label>
        <Input
          value={props.codiceUnivocoPa}
          onChange={(e) => props.onCodiceUnivocoPa(e.target.value.toUpperCase())}
          placeholder="UFXXXX"
          className="h-11 rounded-xl font-mono uppercase mt-1.5"
        />
      </div>
      <div>
        <Label className="text-xs text-muted-foreground">
          {t('createClient.codiceFiscale')}
        </Label>
        <Input
          value={props.codiceFiscale}
          onChange={(e) => props.onCodiceFiscale(e.target.value.toUpperCase())}
          className="h-11 rounded-xl font-mono uppercase mt-1.5"
        />
      </div>
    </div>
  );
}
