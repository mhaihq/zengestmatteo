import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mic, ChevronUp, Clock, ArrowUpDown, PenLine } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/lib/supabase';

interface Client {
  id: string;
  name: string;
  email: string | null;
}

interface Session {
  id: string;
  client_id: string | null;
  template_id: string | null;
  session_date: string;
  notes: string;
  session_type: string;
  client: { name: string } | null;
  template: { name: string } | null;
}

const getInitials = (name: string) =>
  name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

const getAvatarColor = (name: string) => {
  const colors = [
    'bg-blue-500', 'bg-green-500', 'bg-amber-500', 'bg-red-500',
    'bg-cyan-500', 'bg-pink-500', 'bg-orange-500', 'bg-teal-500',
  ];
  return colors[name.charCodeAt(0) % colors.length];
};

export function SessionsPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [filterClient, setFilterClient] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [isMobile, setIsMobile] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [clients, setClients] = useState<Client[]>([]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    fetchSessions();
    fetchClients();
  }, []);

  const fetchSessions = async () => {
    const { data } = await supabase
      .from('sessions')
      .select('id, client_id, template_id, session_date, notes, session_type, client:clients(name), template:templates(name)')
      .order('session_date', { ascending: false });
    if (data) setSessions(data as unknown as Session[]);
  };

  const fetchClients = async () => {
    const { data } = await supabase
      .from('clients')
      .select('id, name, email')
      .order('name');
    if (data) setClients(data);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const getMonthYear = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const filteredAndSortedSessions = useMemo(() => {
    let filtered = sessions;
    if (filterClient !== 'all') {
      filtered = filtered.filter((s) => s.client_id === filterClient);
    }
    return [...filtered].sort((a, b) => {
      const diff = new Date(a.session_date).getTime() - new Date(b.session_date).getTime();
      return sortOrder === 'newest' ? -diff : diff;
    });
  }, [sessions, filterClient, sortOrder]);

  const groupedSessions = useMemo(() => {
    const groups: Record<string, Session[]> = {};
    filteredAndSortedSessions.forEach((session) => {
      const key = getMonthYear(session.session_date);
      if (!groups[key]) groups[key] = [];
      groups[key].push(session);
    });
    return groups;
  }, [filteredAndSortedSessions]);

  const SessionCard = ({ session, onClick }: { session: Session; onClick?: () => void }) => (
    <Card
      className="p-4 cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
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
                {t('common.manual')}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{formatDate(session.session_date)} at {formatTime(session.session_date)}</span>
          </div>
          {session.notes && (
            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{session.notes}</p>
          )}
        </div>
        <ChevronUp className="h-5 w-5 text-muted-foreground rotate-90 flex-shrink-0 ml-2" />
      </div>
    </Card>
  );

  const SessionsList = ({ onItemClick }: { onItemClick?: () => void }) => (
    <div className="space-y-6">
      {Object.entries(groupedSessions).map(([monthYear, groupSessions]) => (
        <div key={monthYear}>
          <h3 className="text-sm font-medium text-muted-foreground mb-3 sticky top-0 bg-background py-2">
            {monthYear}
          </h3>
          <div className="grid gap-3">
            {groupSessions.map((session, index) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <SessionCard
                  session={session}
                  onClick={() => {
                    navigate(`/sessions/${session.id}`);
                    onItemClick?.();
                  }}
                />
              </motion.div>
            ))}
          </div>
        </div>
      ))}
      {Object.keys(groupedSessions).length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No sessions found{filterClient !== 'all' ? ' for the selected client' : ''}.
        </div>
      )}
    </div>
  );

  return (
    <div className="container max-w-6xl mx-auto p-4 md:p-6 pb-20 md:pb-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">{t('sessions.title')}</h1>
              <p className="text-muted-foreground mt-1 text-sm md:text-base">
                {t('sessions.allSessions')}
              </p>
            </div>
            <div className="flex flex-col md:flex-row gap-3 md:items-center">
              <Select value={filterClient} onValueChange={setFilterClient}>
                <SelectTrigger className="w-full md:w-[240px] h-12 rounded-full">
                  <SelectValue placeholder={t('sessions.allClients')}>
                    {filterClient !== 'all' && (
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                          <AvatarFallback
                            className={`${getAvatarColor(clients.find((c) => c.id === filterClient)?.name || '')} text-white text-xs font-semibold`}
                          >
                            {getInitials(clients.find((c) => c.id === filterClient)?.name || '')}
                          </AvatarFallback>
                        </Avatar>
                        <span>{clients.find((c) => c.id === filterClient)?.name}</span>
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="all" className="h-12">{t('sessions.allClients')}</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id} className="h-14 cursor-pointer">
                      <div className="flex items-center gap-3 py-1">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className={`${getAvatarColor(client.name)} text-white text-xs font-semibold`}>
                            {getInitials(client.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">{client.name}</span>
                          {client.email && (
                            <span className="text-xs text-muted-foreground">{client.email}</span>
                          )}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={sortOrder}
                onValueChange={(v) => setSortOrder(v as 'newest' | 'oldest')}
              >
                <SelectTrigger className="w-full md:w-[160px] h-12 rounded-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="newest">
                    <div className="flex items-center gap-2">
                      <ArrowUpDown className="h-4 w-4" />
                      {t('sessions.newestFirst')}
                    </div>
                  </SelectItem>
                  <SelectItem value="oldest">
                    <div className="flex items-center gap-2">
                      <ArrowUpDown className="h-4 w-4" />
                      {t('sessions.oldestFirst')}
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              <Button
                onClick={() =>
                  navigate('/', {
                    state: {
                      preSelectedClient: filterClient !== 'all' ? filterClient : undefined,
                    },
                  })
                }
                className="gap-2 rounded-full w-full md:w-auto"
              >
                <Mic className="h-4 w-4" />
                {t('home.startSession')}
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {!isMobile ? (
            <SessionsList />
          ) : (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                {t('sessions.recentSessions')}
              </h3>
              <div className="grid gap-3">
                {filteredAndSortedSessions.slice(0, 3).map((session, index) => (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <SessionCard
                      session={session}
                      onClick={() => navigate(`/sessions/${session.id}`)}
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
