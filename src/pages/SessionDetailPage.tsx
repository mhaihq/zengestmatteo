import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { FileText, AudioLines, Mail, ChevronDown, ChevronUp, Copy, Wand as Wand2, Play, Pause, MoveVertical as MoreVertical, List, ArrowUpDown, RefreshCw, Plus, Check, PenLine, Paperclip, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Session, SessionAttachment } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger, DrawerFooter, DrawerClose } from '@/components/ui/drawer';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

// Replace with your actual API URL when ready
// @ts-expect-error - Reserved for future API integration
const API_URL = 'YOUR_API_URL_HERE';

interface SOAPSection {
  title: string;
  content: string;
  expanded: boolean;
}

const DUMMY_CLIENTS = [
  { id: '1', name: 'Sarah Johnson', email: 'sarah.j@email.com' },
  { id: '2', name: 'Michael Chen', email: 'michael.c@email.com' },
  { id: '3', name: 'Emily Rodriguez', email: 'emily.r@email.com' },
];

const getDummyTemplates = (t: any) => [
  { id: '1', name: 'Individual Therapy', description: t('sessionDetail.individualTherapyDesc') },
  { id: '2', name: 'Couples Therapy', description: t('sessionDetail.couplesTherapyDesc') },
  { id: '3', name: 'Group Therapy', description: t('sessionDetail.groupTherapyDesc') },
  { id: '4', name: 'CBT Session', description: t('sessionDetail.cbtSessionDesc') },
  { id: '5', name: 'Initial Assessment', description: t('sessionDetail.initialAssessmentDesc') },
];

const DUMMY_SESSIONS = [
  {
    id: '1',
    client_id: '1',
    client_name: 'Sarah Johnson',
    template_id: '1',
    template_name: 'Individual Therapy',
    session_date: '2024-01-15T10:00:00Z',
    soap_note: {
      subjective: 'Client reported feeling anxious about upcoming work deadlines. Mentioned difficulty sleeping and racing thoughts at night. Expressed concern about maintaining work-life balance.',
      objective: 'Client appeared tense, fidgeting during session. Speech was rapid at times. Maintained good eye contact. Demonstrated insight into patterns.',
      assessment: 'Client showing signs of work-related anxiety. Sleep disturbance noted. Good engagement with therapeutic process. Progressing toward treatment goals.',
      plan: 'Continue weekly sessions. Introduce sleep hygiene techniques. Assign mindfulness exercises for daily practice. Monitor anxiety levels. Follow up on coping strategy implementation.',
    },
    transcript: [
      { timestamp: '00:00', speaker: 'Therapist', text: 'Good morning, Sarah. How have you been since our last session?' },
      { timestamp: '00:05', speaker: 'Client', text: 'Hi! I\'ve been okay, but honestly pretty stressed with work lately.' },
      { timestamp: '00:12', speaker: 'Therapist', text: 'I\'m sorry to hear that. Can you tell me more about what\'s been causing the stress?' },
      { timestamp: '00:18', speaker: 'Client', text: 'Well, we have this big project deadline coming up, and I feel like there\'s so much to do and not enough time.' },
      { timestamp: '00:27', speaker: 'Therapist', text: 'That sounds overwhelming. How has this been affecting your daily life?' },
      { timestamp: '00:33', speaker: 'Client', text: 'I\'m having trouble sleeping. My mind just keeps racing at night thinking about everything I need to do.' },
    ],
    audio_url: null,
  },
  {
    id: '2',
    client_id: '1',
    client_name: 'Sarah Johnson',
    template_id: '1',
    template_name: 'Individual Therapy',
    session_date: '2024-01-08T10:00:00Z',
    soap_note: {
      subjective: 'Client discussed work-life balance challenges and recent sleep improvements.',
      objective: 'Client appeared more relaxed than previous session. Good engagement.',
      assessment: 'Showing progress with anxiety management techniques.',
      plan: 'Continue current treatment plan. Review progress next session.',
    },
    transcript: [],
    audio_url: null,
  },
  {
    id: '3',
    client_id: '1',
    client_name: 'Sarah Johnson',
    template_id: '1',
    template_name: 'Individual Therapy',
    session_date: '2024-01-01T10:00:00Z',
    soap_note: {
      subjective: 'Initial assessment. Client expressing stress about work deadlines.',
      objective: 'Client appeared nervous but engaged well in conversation.',
      assessment: 'Mild anxiety symptoms noted. Good candidate for CBT techniques.',
      plan: 'Begin weekly therapy sessions. Introduce relaxation techniques.',
    },
    transcript: [],
    audio_url: null,
  },
  {
    id: '4',
    client_id: '2',
    client_name: 'Michael Chen',
    template_id: '2',
    template_name: 'Couples Therapy',
    session_date: '2024-01-14T14:00:00Z',
    soap_note: {
      subjective: 'Couple discussed communication patterns and recent conflicts.',
      objective: 'Both partners engaged well. Good progress noted.',
      assessment: 'Showing improvement in communication skills.',
      plan: 'Continue couples therapy. Practice active listening exercises.',
    },
    transcript: [],
    audio_url: null,
  },
  {
    id: '5',
    client_id: '2',
    client_name: 'Michael Chen',
    template_id: '2',
    template_name: 'Couples Therapy',
    session_date: '2024-01-07T14:00:00Z',
    soap_note: {
      subjective: 'Initial couples assessment completed.',
      objective: 'Both partners present and engaged.',
      assessment: 'Communication challenges identified.',
      plan: 'Begin weekly couples therapy sessions.',
    },
    transcript: [],
    audio_url: null,
  },
];

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const getAvatarColor = (name: string) => {
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-amber-500',
    'bg-red-500',
    'bg-cyan-500',
    'bg-pink-500',
    'bg-orange-500',
    'bg-teal-500',
  ];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
};

export function SessionDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { sessionId } = useParams();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('note');
  const [isPlaying, setIsPlaying] = useState(false);
  const [showMobileList, setShowMobileList] = useState(false);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [showRegenerateModal, setShowRegenerateModal] = useState(false);
  const [selectedRegenerateTemplate, setSelectedRegenerateTemplate] = useState<string | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [realSession, setRealSession] = useState<Session | null>(null);
  const [attachments, setAttachments] = useState<SessionAttachment[]>([]);
  const [realSessionLoading, setRealSessionLoading] = useState(true);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!sessionId) return;
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sessionId);
    if (!isUUID) {
      setRealSessionLoading(false);
      return;
    }
    const load = async () => {
      const { data: sessionData } = await supabase
        .from('sessions')
        .select('*, client:clients(id, name, email), template:templates(id, name)')
        .eq('id', sessionId)
        .maybeSingle();
      if (sessionData) {
        setRealSession(sessionData as unknown as Session);
        const { data: attachData } = await supabase
          .from('session_attachments')
          .select('*')
          .eq('session_id', sessionId)
          .order('created_at');
        if (attachData) setAttachments(attachData);
      }
      setRealSessionLoading(false);
    };
    load();
  }, [sessionId]);

  const currentSession = DUMMY_SESSIONS.find(s => s.id === sessionId) || DUMMY_SESSIONS[0];
  const [selectedClientId, setSelectedClientId] = useState(currentSession.client_id);

  const clientSessions = DUMMY_SESSIONS
    .filter(s => s.client_id === selectedClientId)
    .sort((a, b) => {
      const dateA = new Date(a.session_date).getTime();
      const dateB = new Date(b.session_date).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

  useEffect(() => {
    if (selectedClientId !== currentSession.client_id) {
      const latestSession = clientSessions[0];
      if (latestSession) {
        navigate(`/sessions/${latestSession.id}`);
      }
    }
  }, [selectedClientId]);

  const [sections, setSections] = useState<SOAPSection[]>([
    { title: 'Subjective', content: currentSession.soap_note.subjective, expanded: true },
    { title: 'Objective', content: currentSession.soap_note.objective, expanded: true },
    { title: 'Assessment', content: currentSession.soap_note.assessment, expanded: true },
    { title: 'Plan', content: currentSession.soap_note.plan, expanded: true },
  ]);
  const [emailContent, setEmailContent] = useState(
    `Dear Sarah,\n\nThank you for attending your therapy session on January 15, 2024.\n\nKey points discussed:\n- Work-related stress and anxiety\n- Sleep difficulties\n- Work-life balance concerns\n\nHomework for next session:\n- Practice sleep hygiene techniques\n- Daily mindfulness exercises (10 minutes)\n- Track anxiety levels in provided journal\n\nOur next session is scheduled for January 22, 2024 at 10:00 AM.\n\nPlease don't hesitate to reach out if you have any questions or concerns.\n\nBest regards,\nDr. Therapist`
  );

  const toggleSection = (index: number) => {
    setSections(
      sections.map((section, i) =>
        i === index ? { ...section, expanded: !section.expanded } : section
      )
    );
  };

  const copySection = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({ title: t('common.copied'), description: t('sessionDetail.sectionCopied') });
  };

  const copyNote = () => {
    const fullNote = sections.map((s) => `${s.title}:\n${s.content}`).join('\n\n');
    navigator.clipboard.writeText(fullNote);
    toast({ title: t('common.copied'), description: t('sessionDetail.noteCopied') });
  };

  const updateSection = (index: number, content: string) => {
    setSections(
      sections.map((section, i) => (i === index ? { ...section, content } : section))
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const dummyTemplates = getDummyTemplates(t);
  const currentTemplate = dummyTemplates.find(tmp => tmp.id === currentSession.template_id);

  const templatesWithNotes = dummyTemplates.filter(template =>
    clientSessions.some(session => session.template_id === template.id)
  );

  const handleRegenerateNote = async () => {
    if (!selectedRegenerateTemplate) return;

    setIsRegenerating(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsRegenerating(false);
    setShowRegenerateModal(false);
    setSelectedRegenerateTemplate(null);
    toast({ title: t('sessionDetail.noteRegenerated'), description: t('sessionDetail.noteRegeneratedDesc') });
  };

  const handleOpenRegenerateModal = () => {
    setSelectedRegenerateTemplate(null);
    setShowRegenerateModal(true);
  };

  const RegenerateContent = () => (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {t('sessionDetail.selectTemplateToRegenerate')}
      </p>
      <Select value={selectedRegenerateTemplate || ''} onValueChange={setSelectedRegenerateTemplate}>
        <SelectTrigger className="w-full rounded-xl">
          <SelectValue placeholder={t('sessionDetail.selectTemplate')} />
        </SelectTrigger>
        <SelectContent className="rounded-xl">
          {dummyTemplates.map((template) => (
            <SelectItem key={template.id} value={template.id}>
              {template.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  if (realSessionLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-pulse text-muted-foreground text-sm">Loading session…</div>
      </div>
    );
  }

  if (realSession && realSession.session_type === 'manual') {
    const formatDateFull = (d: string) =>
      new Date(d).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    const formatTimeFull = (d: string) =>
      new Date(d).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

    return (
      <div className="container max-w-2xl mx-auto p-4 md:p-6 pb-24 md:pb-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="rounded-full flex-shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-0">
              <h1 className="text-xl font-bold truncate">
                {realSession.client?.name ?? 'Unknown Client'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {formatDateFull(realSession.session_date)} at {formatTimeFull(realSession.session_date)}
              </p>
            </div>
            <div className="ml-auto flex items-center gap-1 text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full flex-shrink-0">
              <PenLine className="h-3 w-3" />
              {t('common.manual')}
            </div>
          </div>

          {realSession.template?.name && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span>{realSession.template.name}</span>
            </div>
          )}

          <div className="space-y-2">
            <h2 className="text-sm font-medium">{t('sessionDetail.sessionNotes')}</h2>
            <Card className="p-4 rounded-2xl min-h-[160px]">
              {realSession.notes ? (
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{realSession.notes}</p>
              ) : (
                <p className="text-sm text-muted-foreground italic">{t('sessionDetail.noNotesRecorded')}</p>
              )}
            </Card>
          </div>

          {attachments.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-medium flex items-center gap-2">
                <Paperclip className="h-4 w-4" />
                {t('sessionDetail.attachments')} ({attachments.length})
              </h2>
              <div className="space-y-2">
                {attachments.map((att) => (
                  <Card key={att.id} className="flex items-center gap-3 p-3 rounded-xl">
                    <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm flex-1 truncate">{att.file_name}</span>
                    {att.file_size && (
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {att.file_size < 1024 * 1024
                          ? `${(att.file_size / 1024).toFixed(1)} KB`
                          : `${(att.file_size / (1024 * 1024)).toFixed(1)} MB`}
                      </span>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1 h-12 rounded-full gap-2"
              onClick={() => {
                if (realSession.notes) {
                  navigator.clipboard.writeText(realSession.notes);
                  toast({ title: t('common.copied'), description: t('sessionDetail.notesCopied') });
                }
              }}
              disabled={!realSession.notes}
            >
              <Copy className="h-4 w-4" />
              {t('sessionDetail.copyNotes')}
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex h-screen md:h-[calc(100vh-4rem)]">
      <motion.div
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="hidden md:flex flex-col w-80 border-r bg-muted/30 overflow-hidden"
      >
        <div className="p-4 border-b flex-shrink-0">
          <Button
            onClick={() => navigate('/')}
            className="w-full gap-2 rounded-full mb-4"
          >
            <AudioLines className="h-4 w-4" />
            New Session
          </Button>

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Client</label>
            <Select value={selectedClientId} onValueChange={setSelectedClientId}>
              <SelectTrigger className="w-full h-12 rounded-full">
                <SelectValue>
                  {selectedClientId && (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7">
                        <AvatarFallback className={`${getAvatarColor(DUMMY_CLIENTS.find(c => c.id === selectedClientId)?.name || '')} text-white text-xs font-semibold`}>
                          {getInitials(DUMMY_CLIENTS.find(c => c.id === selectedClientId)?.name || '')}
                        </AvatarFallback>
                      </Avatar>
                      <span>{DUMMY_CLIENTS.find(c => c.id === selectedClientId)?.name}</span>
                    </div>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                {DUMMY_CLIENTS.map((client) => (
                  <SelectItem key={client.id} value={client.id} className="h-14 cursor-pointer">
                    <div className="flex items-center gap-3 py-1">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className={`${getAvatarColor(client.name)} text-white text-xs font-semibold`}>
                          {getInitials(client.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">{client.name}</span>
                        <span className="text-xs text-muted-foreground">{client.email}</span>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-3">
            <div className="text-xs font-medium text-muted-foreground px-2">
              {clientSessions.length} {clientSessions.length === 1 ? 'Session' : 'Sessions'}
            </div>
            {clientSessions.map((session) => (
              <Card
                key={session.id}
                className={`p-3 cursor-pointer transition-colors ${
                  session.id === sessionId
                    ? 'bg-primary/10 border-primary/30'
                    : 'hover:bg-muted/50'
                }`}
                onClick={() => navigate(`/sessions/${session.id}`)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{session.template_name}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {formatDate(session.session_date)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatTime(session.session_date)}
                    </div>
                  </div>
                  {session.id === sessionId && (
                    <div className="h-2 w-2 rounded-full bg-primary mt-1 flex-shrink-0" />
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </motion.div>

      <div className="flex-1 flex flex-col overflow-hidden pb-16 md:pb-0">
        <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 flex-shrink-0 border-b md:border-0">
          <div className="flex flex-col gap-3">
            <div>
              <h1 className="text-xl md:text-2xl font-bold">{currentSession.client_name}</h1>
              <p className="text-xs md:text-sm text-muted-foreground">
                {formatDate(currentSession.session_date)} | {formatTime(currentSession.session_date)}
              </p>
            </div>
            <Drawer open={showMobileList} onOpenChange={setShowMobileList}>
              <DrawerTrigger asChild>
                <Button variant="outline" className="md:hidden rounded-full gap-2 w-fit">
                  <List className="h-4 w-4" />
                  View All Sessions
                </Button>
              </DrawerTrigger>
              <DrawerContent className="max-h-[85vh]">
                <DrawerHeader className="border-b">
                  <DrawerTitle>All Sessions</DrawerTitle>
                </DrawerHeader>
                <div className="p-4 border-b space-y-3">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Client</label>
                    <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                      <SelectTrigger className="w-full h-12 rounded-full">
                        <SelectValue>
                          {selectedClientId && (
                            <div className="flex items-center gap-2">
                              <Avatar className="h-7 w-7">
                                <AvatarFallback className={`${getAvatarColor(DUMMY_CLIENTS.find(c => c.id === selectedClientId)?.name || '')} text-white text-xs font-semibold`}>
                                  {getInitials(DUMMY_CLIENTS.find(c => c.id === selectedClientId)?.name || '')}
                                </AvatarFallback>
                              </Avatar>
                              <span>{DUMMY_CLIENTS.find(c => c.id === selectedClientId)?.name}</span>
                            </div>
                          )}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl">
                        {DUMMY_CLIENTS.map((client) => (
                          <SelectItem key={client.id} value={client.id} className="h-14 cursor-pointer">
                            <div className="flex items-center gap-3 py-1">
                              <Avatar className="h-9 w-9">
                                <AvatarFallback className={`${getAvatarColor(client.name)} text-white text-xs font-semibold`}>
                                  {getInitials(client.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col">
                                <span className="font-medium text-sm">{client.name}</span>
                                <span className="text-xs text-muted-foreground">{client.email}</span>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Sort By</label>
                    <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as 'newest' | 'oldest')}>
                      <SelectTrigger className="w-full h-12 rounded-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl">
                        <SelectItem value="newest">
                          <div className="flex items-center gap-2">
                            <ArrowUpDown className="h-4 w-4" />
                            Newest First
                          </div>
                        </SelectItem>
                        <SelectItem value="oldest">
                          <div className="flex items-center gap-2">
                            <ArrowUpDown className="h-4 w-4" />
                            Oldest First
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto px-4 pb-8">
                  <div className="space-y-3">
                    <div className="text-xs font-medium text-muted-foreground px-2 pt-2">
                      {clientSessions.length} {clientSessions.length === 1 ? 'Session' : 'Sessions'}
                    </div>
                    {clientSessions.map((session) => (
                      <Card
                        key={session.id}
                        className={`p-3 cursor-pointer transition-colors ${
                          session.id === sessionId
                            ? 'bg-primary/10 border-primary/30'
                            : 'hover:bg-muted/50'
                        }`}
                        onClick={() => {
                          navigate(`/sessions/${session.id}`);
                          setShowMobileList(false);
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-sm">{session.template_name}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {formatDate(session.session_date)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {formatTime(session.session_date)}
                            </div>
                          </div>
                          {session.id === sessionId && (
                            <div className="h-2 w-2 rounded-full bg-primary mt-1 flex-shrink-0" />
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              </DrawerContent>
            </Drawer>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <Select defaultValue={currentSession.template_id}>
              <SelectTrigger className="w-[160px] md:w-[200px] rounded-full text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Individual Therapy</SelectItem>
                <SelectItem value="2">Couples Therapy</SelectItem>
                <SelectItem value="3">Group Therapy</SelectItem>
              </SelectContent>
            </Select>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="rounded-full gap-2 text-sm">
                  <MoreVertical className="h-4 w-4" />
                  <span className="hidden md:inline">Actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-2xl">
                <DropdownMenuItem>Export as PDF</DropdownMenuItem>
                <DropdownMenuItem>Share</DropdownMenuItem>
                <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} variant="underline" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="w-full justify-start h-auto px-4 flex-shrink-0 overflow-x-auto">
            <TabsTrigger
              value="note"
              className="gap-2 px-4 py-3"
            >
              <FileText className="h-4 w-4" />
              Note
            </TabsTrigger>
            <TabsTrigger
              value="transcript"
              className="gap-2 px-4 py-3"
            >
              <AudioLines className="h-4 w-4" />
              Transcript
            </TabsTrigger>
            <TabsTrigger
              value="email"
              className="gap-2 px-4 py-3"
            >
              <Mail className="h-4 w-4" />
              Client Email
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto min-h-0">
            <TabsContent value="note" className="m-0 p-4 md:p-6 space-y-4 h-full">
              <div className="flex items-center justify-between mb-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2 rounded-full">
                      <FileText className="h-4 w-4" />
                      {currentTemplate?.name || 'Select Template'}
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-64 rounded-2xl">
                    {templatesWithNotes.length > 0 && (
                      <>
                        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                          Previously Used Templates
                        </div>
                        {templatesWithNotes.map((template) => (
                          <DropdownMenuItem
                            key={template.id}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <FileText className="h-4 w-4" />
                            <span>{template.name}</span>
                            {template.id === currentSession.template_id && (
                              <Check className="h-3 w-3 ml-auto text-primary" />
                            )}
                          </DropdownMenuItem>
                        ))}
                        <div className="my-1 h-px bg-border" />
                      </>
                    )}
                    <DropdownMenuItem
                      className="flex items-center gap-2 cursor-pointer text-primary"
                      onClick={handleOpenRegenerateModal}
                    >
                      <Plus className="h-4 w-4" />
                      <span>Regenerate Note</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {sections.map((section, index) => (
                <Card key={index} className="overflow-hidden">
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50"
                    onClick={() => toggleSection(index)}
                  >
                    <h3 className="font-semibold flex items-center gap-2">
                      {section.title}
                      {section.expanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </h3>
                  </div>
                  {section.expanded && (
                    <div className="p-4 pt-0 space-y-3">
                      <Textarea
                        value={section.content}
                        onChange={(e) => updateSection(index, e.target.value)}
                        className="min-h-[120px] rounded-xl resize-none"
                      />
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2 rounded-full"
                          onClick={() => copySection(section.content)}
                        >
                          <Copy className="h-3 w-3" />
                          Copy section
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2 rounded-full"
                        >
                          <Wand2 className="h-3 w-3" />
                          Magic Edit
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              ))}

              <div className="flex justify-end pt-4">
                <Button onClick={copyNote} className="gap-2 rounded-full">
                  <Copy className="h-4 w-4" />
                  Copy note
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="transcript" className="m-0 p-4 md:p-6 space-y-4 h-full">
              <Card className="p-4">
                <div className="flex items-center gap-4">
                  <Button
                    size="icon"
                    variant="outline"
                    className="rounded-full"
                    onClick={() => setIsPlaying(!isPlaying)}
                  >
                    {isPlaying ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                  <div className="flex-1">
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full w-1/3 bg-primary rounded-full" />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>00:33</span>
                      <span>45:00</span>
                    </div>
                  </div>
                </div>
              </Card>

              <div className="space-y-3">
                {currentSession.transcript.map((item, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex gap-3">
                      <div className="text-xs text-muted-foreground w-16 flex-shrink-0">
                        {item.timestamp}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-sm mb-1">
                          {item.speaker}
                        </div>
                        <p className="text-sm">{item.text}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="email" className="m-0 p-4 md:p-6 h-full">
              <Card className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">To</label>
                    <div className="text-sm text-muted-foreground mt-1">
                      sarah.j@email.com
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Subject</label>
                    <div className="text-sm text-muted-foreground mt-1">
                      Session Summary - January 15, 2024
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Message</label>
                    <Textarea
                      value={emailContent}
                      onChange={(e) => setEmailContent(e.target.value)}
                      className="min-h-[400px] rounded-xl"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button className="rounded-full gap-2">
                      <Mail className="h-4 w-4" />
                      Send Email
                    </Button>
                    <Button variant="outline" className="rounded-full gap-2">
                      <Copy className="h-4 w-4" />
                      Copy to Clipboard
                    </Button>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {isMobile ? (
        <Drawer open={showRegenerateModal} onOpenChange={setShowRegenerateModal}>
          <DrawerContent className="max-h-[85vh]">
            <DrawerHeader className="border-b">
              <DrawerTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                Regenerate Note
              </DrawerTitle>
            </DrawerHeader>
            <div className="p-4">
              <RegenerateContent />
            </div>
            <DrawerFooter className="border-t">
              <Button
                onClick={handleRegenerateNote}
                disabled={!selectedRegenerateTemplate || isRegenerating}
                className="w-full rounded-full gap-2"
              >
                {isRegenerating ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Regenerating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Regenerate
                  </>
                )}
              </Button>
              <DrawerClose asChild>
                <Button variant="outline" className="w-full rounded-full">
                  Cancel
                </Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={showRegenerateModal} onOpenChange={setShowRegenerateModal}>
          <DialogContent className="sm:max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                Regenerate Note
              </DialogTitle>
            </DialogHeader>
            <RegenerateContent />
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setShowRegenerateModal(false)}
                className="rounded-full"
              >
                Cancel
              </Button>
              <Button
                onClick={handleRegenerateNote}
                disabled={!selectedRegenerateTemplate || isRegenerating}
                className="rounded-full gap-2"
              >
                {isRegenerating ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Regenerating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Regenerate
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
