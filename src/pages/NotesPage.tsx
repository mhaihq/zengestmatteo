import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, FileStack } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase, Session } from '@/lib/supabase';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';

export function NotesPage() {
  const { t } = useTranslation();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    const { data, error } = await supabase
      .from('sessions')
      .select(`
        *,
        client:clients(*),
        template:templates(*)
      `)
      .order('session_date', { ascending: false });

    if (error) {
      console.error('Error fetching sessions:', error);
    } else {
      setSessions(data || []);
    }
  };

  const filteredSessions = sessions.filter((session) =>
    session.client?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedSessions = filteredSessions.reduce((acc, session) => {
    const date = format(new Date(session.session_date), 'yyyy-MM-dd');
    const today = format(new Date(), 'yyyy-MM-dd');
    const group = date === today ? 'Today' : 'Earlier';
    if (!acc[group]) acc[group] = [];
    acc[group].push(session);
    return acc;
  }, {} as Record<string, Session[]>);

  return (
    <div className="container max-w-4xl mx-auto p-4 md:p-6 pb-20 md:pb-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-2xl">
              <FileStack className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">{t('notes.title')}</h1>
              <p className="text-muted-foreground text-sm md:text-base">{t('notes.allNotes')}</p>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('notes.searchPlaceholder')}
              className="pl-9 rounded-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <ScrollArea className="h-[calc(100vh-16rem)]">
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

              <div className="space-y-3">
                {groupSessions.map((session, index) => (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="rounded-2xl hover:shadow-lg transition-shadow">
                      <CardContent className="p-4">
                        <h4 className="font-medium text-base truncate">
                          {session.client?.name || 'Unknown Client'}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(
                            new Date(session.session_date),
                            'MMM dd, yyyy | h:mm a'
                          )}
                        </p>
                        {session.template && (
                          <p className="text-xs text-muted-foreground mt-2 bg-muted px-2 py-1 rounded-full inline-block">
                            {session.template.name}
                          </p>
                        )}
                        {session.notes && (
                          <p className="text-sm mt-3 text-foreground/80 line-clamp-2">
                            {session.notes}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}

          {filteredSessions.length === 0 && (
            <div className="text-center py-12">
              <FileStack className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">{t('notes.noNotes')}</h3>
              <p className="text-muted-foreground">
                {searchQuery
                  ? t('notes.searchPlaceholder')
                  : t('notes.noNotes')}
              </p>
            </div>
          )}
        </ScrollArea>
      </motion.div>
    </div>
  );
}
