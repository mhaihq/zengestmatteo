import { motion } from 'framer-motion';
import { Mic, Search } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Session } from '@/lib/supabase';
import { format } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { useTranslation } from 'react-i18next';

interface SidebarProps {
  sessions: Session[];
  onNewSession: () => void;
}

export function Sidebar({ sessions, onNewSession }: SidebarProps) {
  const { t } = useTranslation();
  const groupedSessions = sessions.reduce((acc, session) => {
    const date = format(new Date(session.session_date), 'yyyy-MM-dd');
    const today = format(new Date(), 'yyyy-MM-dd');
    const group = date === today ? 'Today' : 'Earlier';
    if (!acc[group]) acc[group] = [];
    acc[group].push(session);
    return acc;
  }, {} as Record<string, Session[]>);

  return (
    <motion.aside
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      className="w-full md:w-80 border-r bg-muted/30 flex flex-col h-[calc(100vh-4rem)]"
    >
      <div className="p-4 space-y-4">
        <Button
          onClick={onNewSession}
          className="w-full gap-2 bg-background hover:bg-muted border shadow-sm rounded-full"
          variant="outline"
        >
          <Mic className="h-4 w-4" />
          {t('home.startSession')}
        </Button>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('sessions.searchPlaceholder')}
            className="pl-9 bg-background rounded-full"
          />
        </div>
      </div>

      <ScrollArea className="flex-1 px-4">
        {Object.entries(groupedSessions).map(([group, groupSessions]) => (
          <div key={group} className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium">{group}</h3>
              <Select defaultValue="newest">
                <SelectTrigger className="w-[100px] h-7 text-xs rounded-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="oldest">Oldest</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              {groupSessions.map((session) => (
                <SessionCard key={session.id} session={session} />
              ))}
            </div>
          </div>
        ))}

        {sessions.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            <p>{t('sessions.noSessions')}</p>
            <p className="text-sm">{t('home.startSession')}</p>
          </div>
        )}
      </ScrollArea>
    </motion.aside>
  );
}

function SessionCard({ session }: { session: Session }) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="p-3 rounded-2xl bg-background hover:bg-accent cursor-pointer transition-colors border"
    >
      <h4 className="font-medium text-sm truncate">
        {session.client?.name || 'Unknown Client'}
      </h4>
      <p className="text-xs text-muted-foreground mt-1">
        {format(new Date(session.session_date), 'MMM dd, yyyy | h:mm a')}
      </p>
    </motion.div>
  );
}
