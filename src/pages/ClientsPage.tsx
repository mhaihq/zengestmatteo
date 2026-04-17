import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Trash2, User, Mail, Euro } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Card } from '@/components/ui/card';
import { CreateClientModal, type NewClientData } from '@/components/CreateClientModal';
import { supabase } from '@/lib/supabase';

interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  tariffa_default: number | null;
  created_at: string;
}

export function ClientsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('clients')
      .select('id, name, email, phone, tariffa_default, created_at')
      .order('name');
    if (!error && data) setClients(data);
    setIsLoading(false);
  };

  const handleCreateClient = async (newClient: NewClientData) => {
    const { data, error } = await supabase
      .from('clients')
      .insert({
        name: newClient.name,
        email: newClient.email ?? null,
        phone: newClient.phone ?? null,
        date_of_birth: newClient.dateOfBirth ?? null,
        gender: newClient.gender ?? null,
        tariffa_default: newClient.tariffa_default ?? null,
      })
      .select('id, name, email, phone, tariffa_default, created_at')
      .single();

    if (error) {
      toast({ title: 'Errore', description: error.message, variant: 'destructive' });
      return;
    }
    if (data) {
      setClients((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      toast({ title: 'Paziente aggiunto', description: `${data.name} è stato aggiunto.` });
    }
  };

  const handleDelete = async (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const { error } = await supabase.from('clients').delete().eq('id', id);
    if (error) {
      toast({ title: 'Errore', description: error.message, variant: 'destructive' });
      return;
    }
    setClients((prev) => prev.filter((c) => c.id !== id));
    toast({ title: 'Paziente eliminato', description: `${name} è stato rimosso.` });
  };

  return (
    <div className="container max-w-6xl mx-auto p-4 md:p-6 pb-20 md:pb-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">{t('clients.title')}</h1>
            <p className="text-muted-foreground mt-1 text-sm md:text-base">
              {t('clients.allClients')}
            </p>
          </div>

          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            className="gap-2 rounded-full w-full md:w-auto"
          >
            <Plus className="h-4 w-4" />
            {t('clients.addClient')}
          </Button>
        </div>

        {isLoading ? (
          <Card className="rounded-2xl p-12">
            <div className="text-center text-muted-foreground">Caricamento...</div>
          </Card>
        ) : clients.length === 0 ? (
          <Card className="rounded-2xl p-12">
            <div className="text-center">
              <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">{t('clients.noClients')}</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Aggiungi il tuo primo paziente per iniziare.
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2 rounded-full">
                <Plus className="h-4 w-4" />
                {t('clients.addClient')}
              </Button>
            </div>
          </Card>
        ) : (
          <Card className="rounded-2xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('clients.name')}</TableHead>
                  <TableHead className="hidden md:table-cell">{t('clients.email')}</TableHead>
                  <TableHead className="hidden lg:table-cell">Tariffa</TableHead>
                  <TableHead className="hidden xl:table-cell">Aggiunto</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client, index) => (
                  <motion.tr
                    key={client.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="group cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/clients/${client.id}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-full shrink-0">
                          <User className="h-4 w-4 text-blue-500" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium">{client.name}</div>
                          {client.email && (
                            <div className="text-sm text-muted-foreground md:hidden flex items-center gap-1 mt-0.5">
                              <Mail className="h-3 w-3" />
                              <span className="truncate">{client.email}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {client.email ?? '—'}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground">
                      {client.tariffa_default != null ? (
                        <span className="flex items-center gap-0.5">
                          <Euro className="h-3 w-3" />
                          {client.tariffa_default.toFixed(2)}
                        </span>
                      ) : '—'}
                    </TableCell>
                    <TableCell className="hidden xl:table-cell text-muted-foreground text-sm">
                      {format(new Date(client.created_at), 'dd MMM yyyy')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => handleDelete(client.id, client.name, e)}
                        className="rounded-full h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </motion.div>

      <CreateClientModal
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onCreateClient={handleCreateClient}
      />
    </div>
  );
}
