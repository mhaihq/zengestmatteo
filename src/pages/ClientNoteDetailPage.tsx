import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  FileText,
  Paperclip,
  Copy,
  Check,
  StickyNote,
  Trash2,
  Save,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { getAvatarColor, getInitials } from '@/lib/avatar-utils';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

interface ClientNote {
  id: string;
  client_id: string;
  template_id: string | null;
  notes: string;
  created_at: string;
  client: { id: string; name: string } | null;
  template: { id: string; name: string } | null;
}

interface NoteAttachment {
  id: string;
  note_id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ClientNoteDetailPage() {
  const { clientId, noteId } = useParams<{ clientId: string; noteId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [note, setNote] = useState<ClientNote | null>(null);
  const [attachments, setAttachments] = useState<NoteAttachment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editedNotes, setEditedNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!noteId) return;
    loadNote();
  }, [noteId]);

  const loadNote = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('client_notes')
      .select(`
        *,
        client:clients(id, name),
        template:templates(id, name)
      `)
      .eq('id', noteId)
      .maybeSingle();

    if (error || !data) {
      setIsLoading(false);
      return;
    }

    setNote(data);
    setEditedNotes(data.notes ?? '');

    const { data: attachData } = await supabase
      .from('client_note_attachments')
      .select('*')
      .eq('note_id', noteId)
      .order('created_at');

    setAttachments(attachData ?? []);
    setIsLoading(false);
  };

  const handleSaveNotes = async () => {
    if (!note) return;
    setIsSaving(true);
    const { error } = await supabase
      .from('client_notes')
      .update({ notes: editedNotes })
      .eq('id', note.id);

    setIsSaving(false);
    if (error) {
      toast({ title: 'Errore', description: error.message, variant: 'destructive' });
      return;
    }
    setNote((prev) => (prev ? { ...prev, notes: editedNotes } : prev));
    toast({ title: 'Salvato', description: 'Nota aggiornata.' });
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(editedNotes);
    setCopied(true);
    toast({ title: 'Copiato', description: 'Note copiate negli appunti.' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async () => {
    if (!note) return;
    const { error } = await supabase.from('client_notes').delete().eq('id', note.id);
    if (error) {
      toast({ title: 'Errore', description: error.message, variant: 'destructive' });
      return;
    }
    navigate(`/clients/${clientId}`, { state: { activeTab: 'sessions-notes' } });
  };

  const getAttachmentUrl = async (path: string) => {
    const { data } = await supabase.storage
      .from('session-attachments')
      .createSignedUrl(path, 60);
    return data?.signedUrl ?? null;
  };

  const handleDownloadAttachment = async (attachment: NoteAttachment) => {
    const url = await getAttachmentUrl(attachment.file_path);
    if (!url) {
      toast({ title: 'Errore', description: 'Impossibile scaricare il file.', variant: 'destructive' });
      return;
    }
    const a = document.createElement('a');
    a.href = url;
    a.download = attachment.file_name;
    a.click();
  };

  if (isLoading) {
    return (
      <div className="container max-w-3xl mx-auto p-4 md:p-6 pb-20">
        <div className="text-center py-20 text-muted-foreground">Caricamento...</div>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="container max-w-3xl mx-auto p-4 md:p-6 pb-20">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Nota non trovata</p>
          <Button variant="outline" className="mt-4 rounded-full" onClick={() => navigate(`/clients/${clientId}`)}>
            Torna al paziente
          </Button>
        </div>
      </div>
    );
  }

  const clientName = note.client?.name ?? 'Paziente';

  return (
    <div className="container max-w-3xl mx-auto p-4 md:p-6 pb-20 md:pb-10">
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
            onClick={() => navigate(`/clients/${clientId}`, { state: { activeTab: 'sessions-notes' } })}
            className="rounded-full flex-shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Avatar className={`h-10 w-10 flex-shrink-0 ${getAvatarColor(clientName)}`}>
              <AvatarFallback className="text-white font-semibold text-sm">
                {getInitials(clientName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h1 className="text-xl font-bold truncate">{clientName}</h1>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <Badge variant="secondary" className="text-xs font-normal gap-1">
                  <StickyNote className="h-3 w-3" />
                  Nota paziente
                </Badge>
                {note.template && (
                  <Badge variant="outline" className="text-xs font-normal">
                    {note.template.name}
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground">
                  {format(new Date(note.created_at), "d MMM yyyy, HH:mm", { locale: it })}
                </span>
              </div>
            </div>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full flex-shrink-0 text-muted-foreground hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-3xl">
              <AlertDialogHeader>
                <AlertDialogTitle>Eliminare questa nota?</AlertDialogTitle>
                <AlertDialogDescription>
                  Questa azione è irreversibile. La nota e tutti i file allegati verranno eliminati.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-full">Annulla</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="rounded-full bg-destructive hover:bg-destructive/90">
                  Elimina
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <Card className="rounded-2xl">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <StickyNote className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold">Note</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 rounded-full h-8 text-xs"
                  onClick={handleCopy}
                >
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? 'Copiato' : 'Copia'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 rounded-full h-8 text-xs"
                  onClick={handleSaveNotes}
                  disabled={isSaving || editedNotes === note.notes}
                >
                  <Save className="h-3.5 w-3.5" />
                  {isSaving ? 'Salvataggio…' : 'Salva'}
                </Button>
              </div>
            </div>

            <Textarea
              value={editedNotes}
              onChange={(e) => setEditedNotes(e.target.value)}
              placeholder="Nessuna nota registrata per questa nota."
              className="min-h-[200px] rounded-xl resize-none text-sm leading-relaxed"
            />
          </CardContent>
        </Card>

        {attachments.length > 0 && (
          <Card className="rounded-2xl">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Paperclip className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold">Allegati</span>
                <Badge variant="secondary" className="text-xs ml-auto">{attachments.length}</Badge>
              </div>
              <Separator />
              <div className="space-y-2">
                {attachments.map((attachment) => (
                  <button
                    key={attachment.id}
                    onClick={() => handleDownloadAttachment(attachment)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/60 transition-colors text-left group"
                  >
                    <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 group-hover:bg-background transition-colors">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{attachment.file_name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(attachment.file_size)}</p>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </div>
  );
}
