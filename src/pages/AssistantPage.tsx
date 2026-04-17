import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ClientSelector } from '@/components/ClientSelector';
import { CreateClientModal } from '@/components/CreateClientModal';
import { AssistantChat } from '@/components/AssistantChat';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { getAvatarColor, getInitials } from '@/lib/avatar-utils';

interface Client {
  id: string;
  name: string;
  email: string;
  age?: number;
}

const DUMMY_CLIENTS: Client[] = [
  { id: '1', name: 'Sarah Johnson', email: 'sarah.j@email.com', age: 32 },
  { id: '2', name: 'Michael Chen', email: 'michael.c@email.com', age: 28 },
  { id: '3', name: 'Emily Rodriguez', email: 'emily.r@email.com', age: 45 },
  { id: '4', name: 'David Williams', email: 'david.w@email.com', age: 38 },
  { id: '5', name: 'Jessica Martinez', email: 'jessica.m@email.com', age: 26 },
];

export function AssistantPage() {
  const { t } = useTranslation();
  const [selectedClient, setSelectedClient] = useState('');
  const [chatStarted, setChatStarted] = useState(false);
  const [isCreateClientOpen, setIsCreateClientOpen] = useState(false);
  const [clients, setClients] = useState<Client[]>(DUMMY_CLIENTS);
  const { toast } = useToast();

  const selectedClientData = clients.find((c) => c.id === selectedClient);

  const handleCreateClient = (newClient: {
    name: string;
    email?: string;
    phone?: string;
    dateOfBirth?: string;
    gender?: string;
  }) => {
    const client: Client = {
      id: String(Date.now()),
      name: newClient.name,
      email: newClient.email || '',
    };
    setClients([...clients, client]);
    setSelectedClient(client.id);
    toast({
      title: t('assistantPage.clientAdded'),
      description: t('assistantPage.clientAddedMessage', { name: newClient.name }),
    });
  };

  const handleStartChat = () => {
    if (!selectedClient) return;
    setChatStarted(true);
  };

  const handleBack = () => {
    setChatStarted(false);
    setSelectedClient('');
  };

  if (chatStarted && selectedClientData) {
    return (
      <div className="flex flex-col h-[calc(100vh-4rem)] md:h-[calc(100vh-4rem)] pb-16 md:pb-0">
        <div className="border-b px-4 md:px-6 py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="rounded-full h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Avatar className={`h-8 w-8 ${getAvatarColor(selectedClientData.name)}`}>
            <AvatarFallback className="text-white text-xs font-semibold">
              {getInitials(selectedClientData.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-sm truncate">{selectedClientData.name}</h2>
            <p className="text-xs text-muted-foreground">
              {selectedClientData.age && `Age ${selectedClientData.age}`}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-xs text-muted-foreground">Online</span>
          </div>
        </div>
        <AssistantChat clientName={selectedClientData.name} />
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto p-4 md:p-6 pb-20 md:pb-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-center min-h-[calc(100vh-12rem)]"
      >
        <div className="w-full max-w-lg space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.05, type: 'spring', stiffness: 200 }}
              className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-foreground text-background mb-6"
            >
              <Bot className="h-8 w-8" />
            </motion.div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              Select a client to get started with the{' '}
              <span className="text-blue-600">Assistant</span>
            </h1>
            <p className="text-muted-foreground mt-3">
              Choose a client to begin a clinical assistant session
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-6 rounded-2xl border-border/60 shadow-sm">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">My clients</h3>
              <ClientSelector
                clients={clients}
                value={selectedClient}
                onValueChange={setSelectedClient}
                onCreateNew={() => setIsCreateClientOpen(true)}
                placeholder={t('assistantPage.searchClients')}
              />

              <AnimatePresence>
                {selectedClient && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-5 flex justify-center">
                      <Button
                        onClick={handleStartChat}
                        className="rounded-full px-8 h-11 shadow-md hover:shadow-lg transition-all"
                      >
                        Start Chat
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </motion.div>
        </div>
      </motion.div>

      <CreateClientModal
        open={isCreateClientOpen}
        onOpenChange={setIsCreateClientOpen}
        onCreateClient={handleCreateClient}
      />
    </div>
  );
}
