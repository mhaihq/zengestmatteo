import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Mic,
  ChevronUp,
  Clock,
  Upload,
  Undo2,
  Sparkles,
  ChevronDown,
  Minimize2,
  PenLine,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { SplitButton } from '@/components/ui/split-button';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ClientSelector } from '@/components/ClientSelector';
import { CreateClientModal } from '@/components/CreateClientModal';
import { AssistantChat } from '@/components/AssistantChat';
import { getAvatarColor, getInitials } from '@/lib/avatar-utils';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

interface Client {
  id: string;
  name: string;
  email: string;
}

interface Template {
  id: string;
  name: string;
  description: string;
}

interface RecentSession {
  id: string;
  client_id: string;
  template_id: string | null;
  session_date: string;
  notes: string;
  session_type: string;
  client: { name: string } | null;
  template: { name: string } | null;
}

export function HomePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isCreateClientOpen, setIsCreateClientOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('preparation');
  const [clients, setClients] = useState<Client[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([]);
  const { toast } = useToast();

  const selectedClientData = clients.find((c) => c.id === selectedClient);

  useEffect(() => {
    fetchClients();
    fetchTemplates();
    fetchRecentSessions();
  }, []);

  const fetchClients = async () => {
    const { data } = await supabase
      .from('clients')
      .select('id, name, email')
      .order('name');
    if (data) setClients(data);
  };

  const fetchTemplates = async () => {
    const { data } = await supabase
      .from('templates')
      .select('id, name, description')
      .order('name');
    if (data) setTemplates(data);
  };

  const fetchRecentSessions = async () => {
    const { data } = await supabase
      .from('sessions')
      .select('id, client_id, template_id, session_date, notes, session_type, client:clients(name), template:templates(name)')
      .order('session_date', { ascending: false })
      .limit(5);
    if (data) setRecentSessions(data as unknown as RecentSession[]);
  };

  const handleCreateClient = async (newClient: {
    name: string;
    email?: string;
    phone?: string;
    dateOfBirth?: string;
    gender?: string;
  }) => {
    const { data, error } = await supabase
      .from('clients')
      .insert({
        name: newClient.name,
        email: newClient.email ?? null,
        phone: newClient.phone ?? null,
        date_of_birth: newClient.dateOfBirth ?? null,
        gender: newClient.gender ?? null,
      })
      .select('id, name, email')
      .single();

    if (error) {
      toast({ title: t('common.error'), description: t('homePage.failedToCreateClient'), variant: 'destructive' });
      return;
    }

    const client: Client = { id: data.id, name: data.name, email: data.email ?? '' };
    setClients((prev) => [...prev, client].sort((a, b) => a.name.localeCompare(b.name)));
    setSelectedClient(client.id);

    toast({
      title: t('homePage.clientCreated'),
      description: t('homePage.clientAddedMessage', { name: newClient.name }),
    });
  };

  useEffect(() => {
    const state = location.state as { preSelectedClient?: string } | null;
    if (state?.preSelectedClient) {
      setSelectedClient(state.preSelectedClient);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, navigate]);

  const handleStartSession = async () => {
    if (!selectedClient || !selectedTemplate) {
      toast({
        title: t('home.missingInfo'),
        description: t('home.missingInfoDesc'),
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    const { data, error } = await supabase
      .from('sessions')
      .insert({
        client_id: selectedClient,
        template_id: selectedTemplate,
        session_type: 'recorded',
        session_date: new Date().toISOString(),
      })
      .select('id')
      .single();

    setIsLoading(false);

    if (error || !data) {
      toast({ title: t('common.error'), description: t('homePage.failedToCreateSession'), variant: 'destructive' });
      return;
    }

    toast({ title: t('home.success'), description: t('home.sessionStarted') });
    navigate(`/sessions/${data.id}`);
  };

  const handleStartManualSession = () => {
    if (!selectedClient) {
      toast({
        title: t('home.missingInfo'),
        description: t('homePage.pleaseSelectClient'),
        variant: 'destructive',
      });
      return;
    }
    navigate('/sessions/new', {
      state: {
        clientId: selectedClient,
        clientName: selectedClientData?.name ?? '',
        templateId: selectedTemplate || undefined,
      },
    });
  };

  const handleUploadAudio = () => {
    toast({ title: t('home.uploadAudioTitle'), description: t('home.uploadAudioDesc') });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  return (
    <div className="container max-w-6xl mx-auto p-4 md:p-6 pb-20 md:pb-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center justify-center min-h-[calc(100vh-12rem)]"
        >
          <div className="w-full max-w-md space-y-6">
            <div className="text-center mb-6">
              <h1 className="text-3xl md:text-4xl font-bold mb-2">{t('home.title')}</h1>
              <p className="text-muted-foreground">{t('home.subtitle')}</p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-2"
            >
              {!selectedClient ? (
                <>
                  <label className="text-sm font-medium">{t('home.selectClient')}</label>
                  <ClientSelector
                    clients={clients}
                    value={selectedClient}
                    onValueChange={setSelectedClient}
                    onCreateNew={() => setIsCreateClientOpen(true)}
                    placeholder={t('home.selectClientPlaceholder')}
                  />
                </>
              ) : (
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    onClick={() => setIsAssistantOpen(true)}
                    className="w-full h-12 rounded-full gap-2"
                  >
                    <Sparkles className="h-4 w-4" />
                    {t('home.zenAssistant')}
                  </Button>
                  <Card className="p-4 rounded-2xl">
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar className={`h-12 w-12 ${getAvatarColor(selectedClientData?.name || '')}`}>
                        <AvatarFallback className="text-white font-semibold">
                          {getInitials(selectedClientData?.name || '')}
                        </AvatarFallback>
                      </Avatar>
                      <h3 className="text-xl font-semibold">{selectedClientData?.name}</h3>
                    </div>
                    <Button
                      variant="ghost"
                      onClick={() => setSelectedClient('')}
                      className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground h-9 px-2"
                    >
                      <Undo2 className="h-4 w-4" />
                      {t('home.changeClient')}
                    </Button>
                  </Card>
                </div>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-2"
            >
              <label className="text-sm font-medium">{t('home.selectTemplate')}</label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger className="w-full h-12 rounded-full">
                  <SelectValue placeholder={t('home.selectTemplatePlaceholder')} />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-3"
            >
              <SplitButton
                onMainClick={handleStartSession}
                disabled={isLoading || !selectedClient || !selectedTemplate}
                mainClassName="h-12 text-base gap-2 bg-gradient-to-r from-gray-700 to-black hover:from-gray-800 hover:to-black transition-all"
                dropdownClassName="bg-gradient-to-r from-gray-700 to-black hover:from-gray-800 hover:to-black"
                size="lg"
                dropdownContent={
                  <DropdownMenuItem onClick={handleUploadAudio} className="gap-2 cursor-pointer">
                    <Upload className="h-4 w-4" />
                    {t('home.uploadAudio')}
                  </DropdownMenuItem>
                }
              >
                <Mic className="h-5 w-5" />
                {t('home.startSession')}
                <motion.div
                  animate={{ y: [0, -2, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  <ChevronUp className="h-4 w-4" />
                </motion.div>
              </SplitButton>

              <Button
                variant="outline"
                onClick={handleStartManualSession}
                className="w-full h-12 rounded-full gap-2 text-base"
              >
                <PenLine className="h-4 w-4" />
                Session without recording
              </Button>
            </motion.div>
          </div>
        </motion.div>

        {recentSessions.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">{t('home.recentSessions')}</h2>
            </div>

            <div className="grid gap-3">
              {recentSessions.map((session, index) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card
                    className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => navigate(`/sessions/${session.id}`)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h3 className="font-semibold text-lg">{session.client?.name}</h3>
                          {session.template?.name && (
                            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                              {session.template.name}
                            </span>
                          )}
                          {session.session_type === 'manual' && (
                            <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full flex items-center gap-1">
                              <PenLine className="h-3 w-3" />
                              Manual
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>
                            {formatDate(session.session_date)} at {formatTime(session.session_date)}
                          </span>
                        </div>
                        {session.notes && (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                            {session.notes}
                          </p>
                        )}
                      </div>
                      <ChevronUp className="h-5 w-5 text-muted-foreground rotate-90 flex-shrink-0 ml-2" />
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      <Sheet open={isAssistantOpen} onOpenChange={setIsAssistantOpen}>
        <SheetContent
          className={cn(
            'w-full sm:max-w-xl flex flex-col',
            activeTab !== 'assistant' && 'overflow-y-auto'
          )}
        >
          <SheetHeader className="mb-4 shrink-0">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-2xl font-bold">{selectedClientData?.name}</SheetTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAssistantOpen(false)}
                className="rounded-full gap-2"
              >
                <Minimize2 className="h-4 w-4" />
                {t('assistant.hide')}
              </Button>
            </div>
          </SheetHeader>

          <div className="hidden md:flex md:flex-col md:flex-1 md:min-h-0">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full flex flex-col flex-1 min-h-0"
            >
              <TabsList className="grid w-full grid-cols-3 mb-4 shrink-0">
                <TabsTrigger value="preparation">{t('assistant.preparation')}</TabsTrigger>
                <TabsTrigger value="summary">{t('assistant.summary')}</TabsTrigger>
                <TabsTrigger value="assistant">{t('assistant.assistant')}</TabsTrigger>
              </TabsList>

              <TabsContent value="preparation" className="space-y-4">
                <Card className="p-4 rounded-2xl">
                  <h3 className="font-semibold text-lg mb-3">{t('assistant.followUps')}</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex gap-2"><span className="text-muted-foreground">•</span><span>{t('assistant.followUp1')}</span></li>
                    <li className="flex gap-2"><span className="text-muted-foreground">•</span><span>{t('assistant.followUp2')}</span></li>
                    <li className="flex gap-2"><span className="text-muted-foreground">•</span><span>{t('assistant.followUp3')}</span></li>
                  </ul>
                </Card>
                <Card className="p-4 rounded-2xl">
                  <h3 className="font-semibold text-lg mb-3">{t('assistant.lastSessionSummary')}</h3>
                  <p className="text-sm text-muted-foreground">{t('assistant.lastSessionText')}</p>
                </Card>
              </TabsContent>

              <TabsContent value="summary" className="space-y-4">
                <Card className="p-4 rounded-2xl">
                  <h3 className="font-semibold text-lg mb-3">{t('assistant.sessionOverview')}</h3>
                  <p className="text-sm text-muted-foreground">{t('assistant.sessionOverviewText')}</p>
                </Card>
              </TabsContent>

              <TabsContent value="assistant" className="flex-1 min-h-0 -mx-6 -mb-6">
                <AssistantChat clientName={selectedClientData?.name || ''} compact />
              </TabsContent>
            </Tabs>
          </div>

          <div className="md:hidden flex flex-col flex-1 min-h-0">
            <Collapsible className="shrink-0">
              <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-muted rounded-2xl">
                <span className="font-medium capitalize">{activeTab}</span>
                <ChevronDown className="h-4 w-4" />
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 p-4 bg-muted/50 rounded-2xl">
                <div className="space-y-2">
                  {['preparation', 'summary', 'assistant'].map((tab) => (
                    <Button
                      key={tab}
                      variant={activeTab === tab ? 'default' : 'ghost'}
                      onClick={() => setActiveTab(tab)}
                      className="w-full justify-start capitalize"
                    >
                      {tab}
                    </Button>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>

            <div
              className={cn(
                'mt-4',
                activeTab === 'assistant' ? 'flex-1 min-h-0 -mx-6 -mb-6' : 'space-y-4'
              )}
            >
              {activeTab === 'preparation' && (
                <>
                  <Card className="p-4 rounded-2xl">
                    <h3 className="font-semibold text-lg mb-3">{t('assistant.followUps')}</h3>
                    <ul className="space-y-2 text-sm">
                      <li className="flex gap-2"><span className="text-muted-foreground">•</span><span>{t('assistant.followUp1')}</span></li>
                      <li className="flex gap-2"><span className="text-muted-foreground">•</span><span>{t('assistant.followUp2')}</span></li>
                      <li className="flex gap-2"><span className="text-muted-foreground">•</span><span>{t('assistant.followUp3')}</span></li>
                    </ul>
                  </Card>
                  <Card className="p-4 rounded-2xl">
                    <h3 className="font-semibold text-lg mb-3">{t('assistant.lastSessionSummary')}</h3>
                    <p className="text-sm text-muted-foreground">{t('assistant.lastSessionText')}</p>
                  </Card>
                </>
              )}
              {activeTab === 'summary' && (
                <Card className="p-4 rounded-2xl">
                  <h3 className="font-semibold text-lg mb-3">{t('assistant.sessionOverview')}</h3>
                  <p className="text-sm text-muted-foreground">{t('assistant.sessionOverviewText')}</p>
                </Card>
              )}
              {activeTab === 'assistant' && (
                <AssistantChat clientName={selectedClientData?.name || ''} compact />
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <CreateClientModal
        open={isCreateClientOpen}
        onOpenChange={setIsCreateClientOpen}
        onCreateClient={handleCreateClient}
      />
    </div>
  );
}
