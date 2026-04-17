import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mic, Share2, Trash2, ChevronLeft, Save, Euro, StickyNote, Plus, Paperclip } from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { PatientInvoicesTab } from '@/components/billing/PatientInvoicesTab';
import { supabase } from '@/lib/supabase';
import { getAvatarColor, getInitials } from '@/lib/avatar-utils';

interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  date_of_birth: string | null;
  gender: string | null;
  codice_fiscale: string | null;
  tariffa_default: number | null;
  metodo_pagamento: string | null;
  created_at: string;
}

interface ClientNote {
  id: string;
  client_id: string;
  template_id: string | null;
  notes: string;
  created_at: string;
  template: { id: string; name: string } | null;
  _attachmentCount?: number;
}

function FieldRow({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start">
      <div className="md:pt-2.5">
        <label className="text-sm font-medium">{label}</label>
        {hint && <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>}
      </div>
      <div className="md:col-span-2">{children}</div>
    </div>
  );
}

export function ClientDetailPage() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const initialTab = (location.state as { activeTab?: string } | null)?.activeTab ?? 'overview';

  const [client, setClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [clientNotes, setClientNotes] = useState<ClientNote[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('');
  const [codiceFiscale, setCodiceFiscale] = useState('');
  const [tariffa, setTariffa] = useState('');
  const [metodoPagamento, setMetodoPagamento] = useState('');

  useEffect(() => {
    if (!clientId) return;
    loadClient();
  }, [clientId]);

  useEffect(() => {
    if (activeTab === 'sessions-notes' && clientId) {
      loadClientNotes();
    }
  }, [activeTab, clientId]);

  const loadClientNotes = async () => {
    if (!clientId) return;
    setNotesLoading(true);
    const { data } = await supabase
      .from('client_notes')
      .select(`
        *,
        template:templates(id, name)
      `)
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (data) {
      const notesWithCounts = await Promise.all(
        data.map(async (note) => {
          const { count } = await supabase
            .from('client_note_attachments')
            .select('id', { count: 'exact', head: true })
            .eq('note_id', note.id);
          return { ...note, _attachmentCount: count ?? 0 };
        })
      );
      setClientNotes(notesWithCounts);
    }
    setNotesLoading(false);
  };

  const loadClient = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .maybeSingle();

    if (error || !data) {
      setIsLoading(false);
      return;
    }

    setClient(data);
    setName(data.name ?? '');
    setEmail(data.email ?? '');
    setPhone(data.phone ?? '');
    setGender(data.gender ?? '');
    setCodiceFiscale(data.codice_fiscale ?? '');
    setTariffa(data.tariffa_default != null ? String(data.tariffa_default) : '');
    setMetodoPagamento(data.metodo_pagamento ?? '');
    setIsLoading(false);
  };

  const handleSave = async () => {
    if (!client) return;
    setIsSaving(true);

    const { error } = await supabase
      .from('clients')
      .update({
        name: name.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        gender: gender || null,
        codice_fiscale: codiceFiscale.trim() || null,
        tariffa_default: tariffa !== '' ? parseFloat(tariffa) : null,
        metodo_pagamento: metodoPagamento || null,
      })
      .eq('id', client.id);

    setIsSaving(false);

    if (error) {
      toast({ title: 'Errore', description: error.message, variant: 'destructive' });
      return;
    }

    setClient((prev) =>
      prev
        ? {
            ...prev,
            name: name.trim(),
            email: email.trim() || null,
            phone: phone.trim() || null,
            gender: gender || null,
            codice_fiscale: codiceFiscale.trim() || null,
            tariffa_default: tariffa !== '' ? parseFloat(tariffa) : null,
            metodo_pagamento: metodoPagamento || null,
          }
        : prev
    );

    toast({ title: 'Salvato', description: 'Informazioni aggiornate.' });
  };

  const handleDelete = async () => {
    if (!client) return;
    const { error } = await supabase.from('clients').delete().eq('id', client.id);
    if (error) {
      toast({ title: 'Errore', description: error.message, variant: 'destructive' });
      return;
    }
    navigate('/clients');
  };

  if (isLoading) {
    return (
      <div className="container max-w-6xl mx-auto p-4 md:p-6 pb-20 md:pb-6">
        <div className="text-center py-20 text-muted-foreground">Caricamento...</div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="container max-w-6xl mx-auto p-4 md:p-6 pb-20 md:pb-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Paziente non trovato</p>
          <Button variant="outline" className="mt-4 rounded-full" onClick={() => navigate('/clients')}>
            Torna ai pazienti
          </Button>
        </div>
      </div>
    );
  }

  const avatarColor = getAvatarColor(client.name);

  return (
    <div className="container max-w-6xl mx-auto p-4 md:p-6 pb-20 md:pb-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <Button variant="ghost" className="gap-2 rounded-full -ml-2" onClick={() => navigate('/clients')}>
          <ChevronLeft className="h-4 w-4" />
          Pazienti
        </Button>

        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex items-center gap-4">
            <Avatar className={`h-20 w-20 ${avatarColor}`}>
              <AvatarFallback className="text-white text-2xl font-semibold bg-transparent">
                {getInitials(client.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold">{client.name}</h1>
              {client.tariffa_default != null ? (
                <p className="text-muted-foreground mt-1 flex items-center gap-1">
                  <Euro className="h-3.5 w-3.5" />
                  {client.tariffa_default.toFixed(2)} per seduta
                </p>
              ) : (
                <p className="text-muted-foreground mt-1 text-sm">Tariffa non impostata</p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button className="gap-2 rounded-full">
              <Mic className="h-4 w-4" />
              Nuova sessione
            </Button>
            <Button
              variant="outline"
              className="gap-2 rounded-full"
              onClick={() =>
                navigate(`/clients/${client.id}/notes/new`, {
                  state: { clientId: client.id, clientName: client.name },
                })
              }
            >
              <Plus className="h-4 w-4" />
              Aggiungi nota
            </Button>
            <Button variant="outline" className="gap-2 rounded-full">
              <Share2 className="h-4 w-4" />
              Assistente
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full justify-start overflow-x-auto rounded-full bg-muted/50">
            <TabsTrigger value="overview" className="rounded-full">Panoramica</TabsTrigger>
            <TabsTrigger value="session-prep" className="rounded-full">Prep. sessione</TabsTrigger>
            <TabsTrigger value="summary" className="rounded-full">Riassunto</TabsTrigger>
            <TabsTrigger value="sessions-notes" className="rounded-full">Note sessioni</TabsTrigger>
            <TabsTrigger value="fatture" className="rounded-full">Fatture</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            <Card className="rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold">Informazioni</h2>
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    variant="outline"
                    className="gap-2 rounded-full"
                  >
                    <Save className="h-4 w-4" />
                    {isSaving ? 'Salvataggio...' : 'Salva'}
                  </Button>
                </div>

                <div className="space-y-5">
                  <FieldRow label="Nome">
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="rounded-full"
                    />
                  </FieldRow>

                  <FieldRow label="Email">
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="—"
                      className="rounded-full"
                    />
                  </FieldRow>

                  <FieldRow label="Telefono">
                    <Input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="—"
                      className="rounded-full"
                    />
                  </FieldRow>

                  <FieldRow label="Genere">
                    <Select value={gender} onValueChange={setGender}>
                      <SelectTrigger className="rounded-full">
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
                  </FieldRow>

                  <FieldRow label="Codice fiscale">
                    <Input
                      value={codiceFiscale}
                      onChange={(e) => setCodiceFiscale(e.target.value.toUpperCase())}
                      placeholder="—"
                      className="rounded-full font-mono"
                      maxLength={16}
                    />
                  </FieldRow>

                  <Separator />

                  <FieldRow
                    label="Tariffa per seduta"
                    hint="Usata automaticamente per le fatture"
                  >
                    <div className="relative max-w-[180px]">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">€</span>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={tariffa}
                        onChange={(e) => setTariffa(e.target.value)}
                        placeholder="0.00"
                        className="rounded-full pl-8"
                      />
                    </div>
                  </FieldRow>

                  <FieldRow label="Metodo di pagamento">
                    <Select value={metodoPagamento} onValueChange={setMetodoPagamento}>
                      <SelectTrigger className="rounded-full">
                        <SelectValue placeholder="Non specificato" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="contanti">Contanti</SelectItem>
                        <SelectItem value="bonifico">Bonifico</SelectItem>
                        <SelectItem value="carta">Carta</SelectItem>
                        <SelectItem value="satispay">Satispay</SelectItem>
                      </SelectContent>
                    </Select>
                  </FieldRow>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start">
                    <div className="md:pt-2.5">
                      <label className="text-sm font-medium text-destructive">Elimina</label>
                    </div>
                    <div className="md:col-span-2">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            className="gap-2 rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20"
                          >
                            <Trash2 className="h-4 w-4" />
                            Elimina paziente
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-3xl">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confermi l'eliminazione?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Questa azione eliminerà definitivamente {client.name} e tutti i dati associati. Non può essere annullata.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="rounded-full">Annulla</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleDelete}
                              className="rounded-full bg-destructive hover:bg-destructive/90"
                            >
                              Elimina
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="session-prep" className="mt-6">
            <Card className="rounded-2xl">
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground">Session Prep content coming soon</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="summary" className="mt-6">
            <Card className="rounded-2xl">
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground">Summary content coming soon</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sessions-notes" className="mt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Note paziente</h2>
                <Button
                  className="gap-2 rounded-full"
                  onClick={() =>
                    navigate(`/clients/${client.id}/notes/new`, {
                      state: { clientId: client.id, clientName: client.name },
                    })
                  }
                >
                  <Plus className="h-4 w-4" />
                  Aggiungi nota
                </Button>
              </div>

              {notesLoading ? (
                <div className="text-center py-12 text-muted-foreground text-sm">Caricamento...</div>
              ) : clientNotes.length === 0 ? (
                <Card className="rounded-2xl">
                  <CardContent className="p-12 text-center">
                    <StickyNote className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground font-medium">Nessuna nota</p>
                    <p className="text-muted-foreground text-sm mt-1">
                      Aggiungi la prima nota per questo paziente.
                    </p>
                    <Button
                      className="mt-5 rounded-full gap-2"
                      onClick={() =>
                        navigate(`/clients/${client.id}/notes/new`, {
                          state: { clientId: client.id, clientName: client.name },
                        })
                      }
                    >
                      <Plus className="h-4 w-4" />
                      Aggiungi nota
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {clientNotes.map((note, index) => (
                    <motion.div
                      key={note.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.04 }}
                    >
                      <Card
                        className="rounded-2xl hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => navigate(`/clients/${client.id}/notes/${note.id}`)}
                      >
                        <CardContent className="p-5">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 min-w-0">
                              <div className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                                <StickyNote className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm text-muted-foreground">
                                  {format(new Date(note.created_at), "d MMMM yyyy, HH:mm", { locale: it })}
                                </p>
                                {note.template && (
                                  <Badge variant="outline" className="text-xs mt-1 font-normal">
                                    {note.template.name}
                                  </Badge>
                                )}
                                {note.notes && (
                                  <p className="text-sm mt-2 text-foreground/80 line-clamp-2 leading-relaxed">
                                    {note.notes}
                                  </p>
                                )}
                                {!note.notes && (
                                  <p className="text-sm mt-2 text-muted-foreground italic">Nota vuota</p>
                                )}
                              </div>
                            </div>
                            {(note._attachmentCount ?? 0) > 0 && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                                <Paperclip className="h-3.5 w-3.5" />
                                {note._attachmentCount}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="fatture" className="mt-6">
            <PatientInvoicesTab patientId={client.id} />
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
