import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, FileText, Paperclip, X, Save, Loader as Loader2, PenLine, Mic, Square, Play, Pause, RotateCcw, CircleAlert as AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { getAvatarColor, getInitials } from '@/lib/avatar-utils';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { fetchProfessionistaProfile, fetchAnyProfessionistaProfile, createAutoInvoice } from '@/lib/invoice-service';

interface LocationState {
  clientId: string;
  clientName: string;
  templateId?: string;
}

interface TemplateOption {
  id: string;
  name: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export function ManualSessionPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const state = location.state as LocationState | null;

  const [notes, setNotes] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(state?.templateId ?? '');
  const [templates, setTemplates] = useState<TemplateOption[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  const recorder = useAudioRecorder();

  useEffect(() => {
    if (!state?.clientId) {
      navigate('/');
      return;
    }
    supabase
      .from('templates')
      .select('id, name')
      .order('name')
      .then(({ data }) => {
        if (data) setTemplates(data);
      });
  }, [state, navigate]);

  useEffect(() => {
    return () => {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
    };
  }, []);

  if (!state?.clientId) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
      e.target.value = '';
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const togglePlayback = () => {
    if (!recorder.audioUrl) return;

    if (!audioPlayerRef.current) {
      const audio = new Audio(recorder.audioUrl);
      audioPlayerRef.current = audio;
      audio.onended = () => setIsPlayingAudio(false);
    }

    if (isPlayingAudio) {
      audioPlayerRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioPlayerRef.current.play();
      setIsPlayingAudio(true);
    }
  };

  const handleResetRecording = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current = null;
    }
    setIsPlayingAudio(false);
    recorder.reset();
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .insert({
          client_id: state.clientId,
          template_id: selectedTemplate || null,
          notes,
          session_type: 'manual',
          session_date: new Date().toISOString(),
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      const allFiles: File[] = [...files];
      const audioFile = recorder.getAudioFile();
      if (audioFile) allFiles.push(audioFile);

      if (allFiles.length > 0) {
        await supabase.storage
          .createBucket('session-attachments', { public: false })
          .catch(() => {});

        for (const file of allFiles) {
          const filePath = `${session.id}/${Date.now()}_${file.name}`;
          const { error: uploadError } = await supabase.storage
            .from('session-attachments')
            .upload(filePath, file);

          if (!uploadError) {
            await supabase.from('session_attachments').insert({
              session_id: session.id,
              file_name: file.name,
              file_path: filePath,
              file_type: file.type,
              file_size: file.size,
            });
          }
        }
      }

      toast({
        title: t('manualSession.sessionSaved'),
        description: t('manualSession.sessionSavedDesc'),
      });
      navigate(`/sessions/${session.id}`);

      supabase.auth.getUser().then(({ data: { user } }) => {
        const getProfile = user
          ? fetchProfessionistaProfile(user.id)
          : fetchAnyProfessionistaProfile();
        getProfile.then((prof) => {
          if (!prof) return;
          createAutoInvoice(session.id, state.clientId, prof.id).then((inv) => {
            if (inv) {
              toast({
                title: inv.status === 'draft'
                  ? t('fatturazione.autoInvoiceDraft')
                  : t('fatturazione.autoInvoiceCreated'),
                description: inv.numero ?? undefined,
              });
            }
          }).catch(() => {});
        }).catch(() => {});
      });
    } catch {
      toast({
        title: t('manualSession.errorSavingSession'),
        description: t('manualSession.errorSavingDesc'),
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const hasContent =
    notes.trim().length > 0 ||
    files.length > 0 ||
    recorder.recordingState === 'stopped';

  return (
    <div className="container max-w-2xl mx-auto p-4 md:p-6 pb-28 md:pb-10">
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
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Avatar className={`h-10 w-10 flex-shrink-0 ${getAvatarColor(state.clientName)}`}>
              <AvatarFallback className="text-white font-semibold text-sm">
                {getInitials(state.clientName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h1 className="text-xl font-bold truncate">{state.clientName}</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant="secondary" className="text-xs font-normal gap-1">
                  <PenLine className="h-3 w-3" />
                  Session without recording
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">{t('manualSession.template')}</label>
          <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
            <SelectTrigger className="w-full h-11 rounded-xl">
              <SelectValue placeholder={t('manualSession.noTemplateSelected')} />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              {templates.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <PenLine className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold">{t('manualSession.notes')}</span>
            <span className="text-xs text-muted-foreground ml-auto">{t('manualSession.optional')}</span>
          </div>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t('manualSession.notesPlaceholder')}
            className="min-h-[220px] rounded-2xl resize-none text-sm leading-relaxed border-dashed focus:border-solid transition-all"
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Paperclip className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold">Attachments</span>
            <span className="text-xs text-muted-foreground ml-auto">optional</span>
          </div>

          <AnimatePresence>
            {files.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-2"
              >
                {files.map((file, index) => (
                  <motion.div
                    key={`${file.name}-${index}`}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                  >
                    <Card className="flex items-center gap-3 p-3 rounded-xl border">
                      <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-full flex-shrink-0 text-muted-foreground hover:text-foreground"
                        onClick={() => handleRemoveFile(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.heic"
          />
          <Button
            variant="outline"
            className="w-full h-12 rounded-xl gap-2 border-dashed"
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className="h-4 w-4" />
            {files.length > 0 ? 'Add another file' : 'Attach file or document'}
          </Button>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Mic className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold">Voice Memo</span>
            <span className="text-xs text-muted-foreground ml-auto">optional</span>
          </div>

          <Card className="rounded-2xl border overflow-hidden">
            {recorder.recordingState === 'idle' && (
              <div className="flex flex-col items-center justify-center gap-4 p-8">
                <button
                  onClick={recorder.start}
                  className="h-16 w-16 rounded-full bg-red-500 hover:bg-red-600 active:scale-95 transition-all flex items-center justify-center shadow-lg shadow-red-200"
                >
                  <Mic className="h-7 w-7 text-white" />
                </button>
                <p className="text-sm text-muted-foreground">Tap to start recording</p>
                {recorder.error && (
                  <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
                    <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                    {recorder.error}
                  </div>
                )}
              </div>
            )}

            {recorder.recordingState === 'recording' && (
              <div className="flex flex-col items-center justify-center gap-4 p-8">
                <div className="relative">
                  <motion.div
                    className="absolute inset-0 rounded-full bg-red-400 opacity-30"
                    animate={{ scale: [1, 1.5, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                  />
                  <motion.div
                    className="absolute inset-0 rounded-full bg-red-400 opacity-20"
                    animate={{ scale: [1, 1.9, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
                  />
                  <button
                    onClick={recorder.stop}
                    className="relative h-16 w-16 rounded-full bg-red-500 hover:bg-red-600 active:scale-95 transition-all flex items-center justify-center shadow-lg shadow-red-200 z-10"
                  >
                    <Square className="h-6 w-6 text-white fill-white" />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <motion.div
                    className="h-2 w-2 rounded-full bg-red-500"
                    animate={{ opacity: [1, 0, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                  <span className="text-sm font-mono font-semibold tabular-nums text-red-600">
                    {formatDuration(recorder.duration)}
                  </span>
                  <span className="text-xs text-muted-foreground">recording — tap to stop</span>
                </div>
              </div>
            )}

            {recorder.recordingState === 'stopped' && (
              <div className="flex items-center gap-3 p-4">
                <button
                  onClick={togglePlayback}
                  className="h-10 w-10 rounded-full bg-foreground hover:opacity-80 active:scale-95 transition-all flex items-center justify-center flex-shrink-0"
                >
                  {isPlayingAudio ? (
                    <Pause className="h-4 w-4 text-background" />
                  ) : (
                    <Play className="h-4 w-4 text-background ml-0.5" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">Voice memo</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDuration(recorder.duration)} · saved on submit
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleResetRecording}
                  className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground flex-shrink-0"
                  title="Re-record"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </Card>
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            onClick={() => navigate('/')}
            className="flex-1 h-12 rounded-full"
            disabled={isSaving}
          >
            Discard
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-[2] h-12 rounded-full gap-2 bg-gradient-to-r from-gray-700 to-black hover:from-gray-800 hover:to-black"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                {hasContent ? 'Save Session' : 'Create Empty Session'}
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
