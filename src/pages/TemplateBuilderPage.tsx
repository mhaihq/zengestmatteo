import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  LayoutGrid,
  Sparkles,
  ChevronRight,
  Save,
  Layers,
  FileText,
  ClipboardList,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  GripVertical,
  List,
  Type,
  FileCheck,
  AlignLeft,
  Minimize2,
  PenLine,
  Mic,
  Upload,
  Square,
  Play,
  Pause,
  RotateCcw,
  X,
  CircleAlert as AlertCircle,
} from 'lucide-react';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/mock-data';
import { generateTemplateFromNote } from '@/lib/ai-template';
import { cn } from '@/lib/utils';

interface TemplateSection {
  id: string;
  name: string;
  style: 'bullet' | 'paragraph';
  verbosity: 'detailed' | 'standard' | 'concise';
  content: string;
  order: number;
}

interface Template {
  id: string;
  name: string;
  description: string | null;
  is_zen_template: boolean;
  sections: TemplateSection[];
}

type BuilderStep = 'select' | 'from-note' | 'edit';

export function TemplateBuilderPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { templateId } = useParams();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const [step, setStep] = useState<BuilderStep>(templateId ? 'edit' : 'select');
  const [templateName, setTemplateName] = useState('');
  const [sampleNote, setSampleNote] = useState('');
  const [inputMode, setInputMode] = useState<'write' | 'voice' | 'upload'>('write');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [sections, setSections] = useState<TemplateSection[]>([]);
  const [originalTemplate, setOriginalTemplate] = useState<Template | null>(null);
  const [isZenTemplate, setIsZenTemplate] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const recorder = useAudioRecorder();
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (templateId) {
      loadTemplate(templateId);
    } else if (searchParams.get('mode') === 'blank') {
      setStep('edit');
      setTemplateName('');
      setSections([createEmptySection(0)]);
    }
  }, [templateId, searchParams]);

  const loadTemplate = (id: string) => {
    const data = db.templates.get(id);
    if (data) {
      const template: Template = { ...data, sections: [] };
      setOriginalTemplate(template);
      setTemplateName(data.name);
      setIsZenTemplate(data.is_zen_template);
      setSections([createEmptySection(0)]);
      setStep('edit');
    }
  };

  const createEmptySection = (order: number): TemplateSection => ({
    id: `temp-${Date.now()}-${order}`,
    name: '',
    style: 'bullet',
    verbosity: 'standard',
    content: '',
    order
  });

  const formatDuration = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

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
    if (audioPlayerRef.current) { audioPlayerRef.current.pause(); audioPlayerRef.current = null; }
    setIsPlayingAudio(false);
    recorder.reset();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFile(file);
    if (file.type.startsWith('text/') || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
      const reader = new FileReader();
      reader.onload = (ev) => setSampleNote(ev.target?.result as string ?? '');
      reader.readAsText(file);
    }
    e.target.value = '';
  };

  const hasNoteContent = inputMode === 'write'
    ? sampleNote.trim().length > 0
    : inputMode === 'voice'
    ? recorder.recordingState === 'stopped'
    : uploadedFile !== null;

  const handleGenerateFromNote = async () => {
    if (!templateName.trim() || !hasNoteContent) {
      toast({ title: t('common.error'), description: t('templateBuilder.provideNote'), variant: 'destructive' });
      return;
    }

    let noteText = sampleNote;

    if (inputMode === 'voice') {
      const audioFile = recorder.getAudioFile();
      if (!audioFile) return;
      // For demo: use a placeholder since we don't have a transcription API wired
      // In production this would call Whisper or similar
      noteText = '[Voice recording — transcription not available in demo mode. Using recording metadata to generate a generic template.]';
    } else if (inputMode === 'upload' && uploadedFile) {
      if (!noteText.trim()) {
        noteText = `[Uploaded file: ${uploadedFile.name}. Text extraction not available for this format. Using filename to generate a generic template.]`;
      }
    }

    setIsGenerating(true);
    try {
      const result = await generateTemplateFromNote(noteText, templateName);
      const builtSections: TemplateSection[] = result.sections.map((s, i) => ({
        id: `ai-${Date.now()}-${i}`,
        name: s.name,
        content: s.content,
        style: s.style,
        verbosity: s.verbosity,
        order: i,
      }));
      setSections(builtSections.length > 0 ? builtSections : [createEmptySection(0)]);
      setStep('edit');
      toast({ title: t('templateBuilder.templateGenerated'), description: t('templateBuilder.templateGeneratedDesc').replace('{{count}}', String(builtSections.length)) });
    } catch (err) {
      toast({ title: t('templateBuilder.generationFailed'), description: t('templateBuilder.generationFailedDesc'), variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    if (!templateName.trim()) {
      toast({ title: t('common.error'), description: t('templateBuilder.templateNameRequired'), variant: 'destructive' });
      return;
    }
    setIsSaving(true);
    if (isZenTemplate || !templateId) {
      db.templates.create({ name: templateName, description: originalTemplate?.description || '' });
    } else {
      db.templates.update(templateId, { name: templateName });
    }
    toast({ title: t('templateBuilder.templateSaved'), description: t('templateBuilder.templateSavedDesc') });
    setIsSaving(false);
    navigate('/templates');
  };

  const updateSection = (index: number, updates: Partial<TemplateSection>) => {
    setSections(prev => prev.map((s, i) => i === index ? { ...s, ...updates } : s));
  };

  const addSection = (afterIndex: number) => {
    const newSection = createEmptySection(afterIndex + 1);
    setSections(prev => {
      const newSections = [...prev];
      newSections.splice(afterIndex + 1, 0, newSection);
      return newSections.map((s, i) => ({ ...s, order: i }));
    });
  };

  const removeSection = (index: number) => {
    if (sections.length <= 1) return;
    setSections(prev => prev.filter((_, i) => i !== index).map((s, i) => ({ ...s, order: i })));
  };

  const moveSection = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= sections.length) return;
    setSections(prev => {
      const newSections = [...prev];
      const [moved] = newSections.splice(fromIndex, 1);
      newSections.splice(toIndex, 0, moved);
      return newSections.map((s, i) => ({ ...s, order: i }));
    });
  };

  const handleDragStart = useCallback((index: number) => {
    setDraggedIndex(index);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      moveSection(draggedIndex, index);
      setDraggedIndex(index);
    }
  }, [draggedIndex]);

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
  }, []);

  if (step === 'select') {
    return (
      <div className="container max-w-4xl mx-auto p-4 md:p-6 pb-20 md:pb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/templates" className="hover:text-foreground transition-colors">
              {t('templateBuilder.breadcrumb')}
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground">{t('templateBuilder.newNoteTemplate')}</span>
          </div>

          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold">{t('templateBuilder.createNewNote')}</h1>
            <p className="text-muted-foreground">{t('templateBuilder.useReadyMade')}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card
              className="cursor-pointer hover:shadow-lg transition-all rounded-2xl border-2 hover:border-primary/50"
              onClick={() => {
                setStep('edit');
                setSections([createEmptySection(0)]);
              }}
            >
              <CardContent className="p-8 text-center space-y-4">
                <div className="w-12 h-12 mx-auto rounded-xl bg-primary/10 flex items-center justify-center">
                  <LayoutGrid className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">{t('templateBuilder.startFromBlank')}</h3>
                <p className="text-muted-foreground text-sm">
                  {t('templateBuilder.startFromBlankDesc')}
                </p>
                <Button className="rounded-full">{t('templateBuilder.buildFromScratch')}</Button>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer hover:shadow-lg transition-all rounded-2xl border-2 hover:border-primary/50"
              onClick={() => setStep('from-note')}
            >
              <CardContent className="p-8 text-center space-y-4">
                <div className="w-12 h-12 mx-auto rounded-xl bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">{t('templateBuilder.startFromSample')}</h3>
                <p className="text-muted-foreground text-sm">
                  {t('templateBuilder.startFromSampleDesc')}
                </p>
                <Button className="rounded-full">
                  {t('templateBuilder.createFromNote')}
                </Button>
              </CardContent>
            </Card>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            {t('templateBuilder.canAlwaysChange')}
          </p>
        </motion.div>
      </div>
    );
  }

  if (step === 'from-note') {
    return (
      <div className="container max-w-3xl mx-auto p-4 md:p-6 pb-20 md:pb-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/templates" className="hover:text-foreground transition-colors">
              {t('templateBuilder.breadcrumb')}
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground">{t('templateBuilder.newNoteTemplate')}</span>
          </div>

          <div>
            <h1 className="text-2xl font-bold">{t('templateBuilder.newNoteTemplate')}</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {t('templateBuilder.fromNoteSubtitle')}
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{t('templateBuilder.templateNameLabel')}</label>
            <Input
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder={t('templateBuilder.templateNamePlaceholderSoap')}
              className="rounded-xl h-12"
            />
          </div>

          <Separator />

          <div className="rounded-xl border bg-primary/5 p-4 flex gap-3">
            <Sparkles className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold">{t('templateBuilder.howItWorksTitle')}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {t('templateBuilder.howItWorksDesc')}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {/* Mode tabs */}
            <div className="flex gap-1 p-1 rounded-xl bg-muted w-fit">
              {([
                { mode: 'write', icon: PenLine, label: t('templateBuilder.modeWrite') },
                { mode: 'voice', icon: Mic, label: t('templateBuilder.modeVoice') },
                { mode: 'upload', icon: Upload, label: t('templateBuilder.modeUpload') },
              ] as const).map(({ mode, icon: Icon, label }) => (
                <button
                  key={mode}
                  onClick={() => setInputMode(mode)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    inputMode === mode
                      ? 'bg-background shadow-sm text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </div>

            {/* Write */}
            {inputMode === 'write' && (
              <div className="space-y-1.5">
                <Textarea
                  value={sampleNote}
                  onChange={(e) => setSampleNote(e.target.value)}
                  placeholder={t('templateBuilder.pasteNotePlaceholder')}
                  className="min-h-[220px] rounded-xl resize-none text-sm leading-relaxed"
                />
                <p className="text-xs text-muted-foreground">
                  {t('templateBuilder.wordsChars', { words: sampleNote.trim() ? sampleNote.trim().split(/\s+/).length : 0, chars: sampleNote.length })}
                </p>
              </div>
            )}

            {/* Voice */}
            {inputMode === 'voice' && (
              <div className="rounded-xl border overflow-hidden">
                {recorder.recordingState === 'idle' && (
                  <div className="flex flex-col items-center gap-4 p-10">
                    <button
                      onClick={recorder.start}
                      className="h-16 w-16 rounded-full bg-red-500 hover:bg-red-600 active:scale-95 transition-all flex items-center justify-center shadow-lg shadow-red-200"
                    >
                      <Mic className="h-7 w-7 text-white" />
                    </button>
                    <p className="text-sm text-muted-foreground">{t('templateBuilder.tapToRecord')}</p>
                    {recorder.error && (
                      <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        {recorder.error}
                      </div>
                    )}
                  </div>
                )}
                {recorder.recordingState === 'recording' && (
                  <div className="flex flex-col items-center gap-4 p-10">
                    <div className="relative">
                      <motion.div className="absolute inset-0 rounded-full bg-red-400 opacity-30" animate={{ scale: [1, 1.5, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />
                      <motion.div className="absolute inset-0 rounded-full bg-red-400 opacity-20" animate={{ scale: [1, 1.9, 1] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }} />
                      <button onClick={recorder.stop} className="relative h-16 w-16 rounded-full bg-red-500 hover:bg-red-600 active:scale-95 transition-all flex items-center justify-center shadow-lg shadow-red-200 z-10">
                        <Square className="h-6 w-6 text-white fill-white" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <motion.div className="h-2 w-2 rounded-full bg-red-500" animate={{ opacity: [1, 0, 1] }} transition={{ duration: 1, repeat: Infinity }} />
                      <span className="text-sm font-mono font-semibold text-red-600">{formatDuration(recorder.duration)}</span>
                      <span className="text-xs text-muted-foreground">{t('templateBuilder.recordingTapToStop')}</span>
                    </div>
                  </div>
                )}
                {recorder.recordingState === 'stopped' && (
                  <div className="flex items-center gap-3 p-4">
                    <button onClick={togglePlayback} className="h-10 w-10 rounded-full bg-foreground hover:opacity-80 active:scale-95 transition-all flex items-center justify-center shrink-0">
                      {isPlayingAudio ? <Pause className="h-4 w-4 text-background" /> : <Play className="h-4 w-4 text-background ml-0.5" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{t('templateBuilder.voiceRecording')}</p>
                      <p className="text-xs text-muted-foreground">{formatDuration(recorder.duration)} · {t('templateBuilder.readyToGenerate')}</p>
                    </div>
                    <button onClick={handleResetRecording} className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                      <RotateCcw className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Upload */}
            {inputMode === 'upload' && (
              <div className="space-y-3">
                <input ref={fileInputRef} type="file" className="hidden" accept=".txt,.md,.pdf,.doc,.docx" onChange={handleFileUpload} />
                {!uploadedFile ? (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-40 rounded-xl border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-3 text-muted-foreground hover:text-foreground"
                  >
                    <Upload className="h-8 w-8" />
                    <div className="text-center">
                      <p className="text-sm font-medium">{t('templateBuilder.clickToUpload')}</p>
                      <p className="text-xs mt-0.5">{t('templateBuilder.uploadFormats')}</p>
                    </div>
                  </button>
                ) : (
                  <div className="flex items-center gap-3 p-4 rounded-xl border bg-muted/40">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{uploadedFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {uploadedFile.size < 1024 ? `${uploadedFile.size} B` : `${(uploadedFile.size / 1024).toFixed(1)} KB`}
                        {sampleNote && ` · ${sampleNote.trim().split(/\s+/).length} ${t('templateBuilder.wordsExtracted')}`}
                      </p>
                    </div>
                    <button onClick={() => { setUploadedFile(null); setSampleNote(''); }} className="h-7 w-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {isGenerating && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              >
                <Sparkles className="h-5 w-5 text-primary" />
              </motion.div>
              <div>
                <p className="text-sm font-medium">{t('templateBuilder.analysingNote')}</p>
                <p className="text-xs text-muted-foreground">{t('templateBuilder.analysingNoteDesc')}</p>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" className="rounded-full px-6" onClick={() => setStep('select')} disabled={isGenerating}>
              {t('common.cancel')}
            </Button>
            <Button
              className="rounded-full px-6 gap-2"
              onClick={handleGenerateFromNote}
              disabled={isGenerating || !templateName.trim() || !hasNoteContent}
            >
              <Sparkles className="h-4 w-4" />
              {isGenerating ? t('templateBuilder.generating') : t('templateBuilder.generateTemplate')}
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto p-4 md:p-6 pb-20 md:pb-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link to="/templates" className="hover:text-foreground transition-colors">
            {t('templateBuilder.breadcrumb')}
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">{t('templateBuilder.newNoteTemplate')}</span>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:hidden space-y-6 order-1">
            <SidebarContent
              t={t}
              sections={sections}
              draggedIndex={draggedIndex}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
              onSectionClick={(index) => {
                document.getElementById(`section-${index}`)?.scrollIntoView({ behavior: 'smooth' });
              }}
            />
          </div>

          <div className="flex-1 space-y-6 order-2 lg:order-1">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold">{t('templateBuilder.newNoteTemplate')}</h1>
                {isZenTemplate && originalTemplate && (
                  <p className="text-muted-foreground text-sm mt-1">
                    {t('templateBuilder.newVersionNote').replace('"BIRP"', `"${originalTemplate.name}"`)}
                  </p>
                )}
              </div>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="rounded-full gap-2 w-full md:w-auto"
              >
                <Save className="h-4 w-4" />
                {isZenTemplate ? t('templateBuilder.saveAsNew') : t('templateBuilder.save')}
              </Button>
            </div>

            <Card className="rounded-2xl">
              <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('templatesPage.templateName')}</label>
                  <Input
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder={t('templatesPage.templateNamePlaceholder')}
                    className="rounded-full"
                  />
                </div>

                <Separator />

                <div className="space-y-6">
                  {sections.map((section, index) => (
                    <div key={section.id} id={`section-${index}`}>
                      <SectionEditor
                        section={section}
                        index={index}
                        totalSections={sections.length}
                        t={t}
                        onUpdate={(updates) => updateSection(index, updates)}
                        onMoveUp={() => moveSection(index, index - 1)}
                        onMoveDown={() => moveSection(index, index + 1)}
                        onDelete={() => removeSection(index)}
                      />

                      <div className="flex items-center gap-4 mt-6">
                        <Separator className="flex-1" />
                        <Button
                          variant="outline"
                          size="icon"
                          className="rounded-full shrink-0"
                          onClick={() => addSection(index)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Separator className="flex-1" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="hidden lg:block w-80 space-y-6 order-2">
            <SidebarContent
              t={t}
              sections={sections}
              draggedIndex={draggedIndex}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
              onSectionClick={(index) => {
                document.getElementById(`section-${index}`)?.scrollIntoView({ behavior: 'smooth' });
              }}
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

interface SidebarContentProps {
  t: (key: string) => string;
  sections: TemplateSection[];
  draggedIndex: number | null;
  onDragStart: (index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDragEnd: () => void;
  onSectionClick: (index: number) => void;
}

function SidebarContent({
  t,
  sections,
  draggedIndex,
  onDragStart,
  onDragOver,
  onDragEnd,
  onSectionClick
}: SidebarContentProps) {
  return (
    <>
      <Card className="rounded-2xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">{t('templateBuilder.guideTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <div className="shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Layers className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">1. {t('templateBuilder.guideStep1Title')}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t('templateBuilder.guideStep1Desc')}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">2. {t('templateBuilder.guideStep2Title')}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t('templateBuilder.guideStep2Desc')}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <ClipboardList className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">3. {t('templateBuilder.guideStep3Title')}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t('templateBuilder.guideStep3Desc')}
              </p>
            </div>
          </div>

          <Separator />

          <p className="text-xs text-muted-foreground">
            {t('templateBuilder.forMoreHelp')}{' '}
            <a href="#" className="text-primary hover:underline">
              {t('templateBuilder.helpCenter')}
            </a>
          </p>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">{t('templateBuilder.tableOfContents')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {sections.map((section, index) => (
            <div
              key={section.id}
              draggable
              onDragStart={() => onDragStart(index)}
              onDragOver={(e) => onDragOver(e, index)}
              onDragEnd={onDragEnd}
              onClick={() => onSectionClick(index)}
              className={cn(
                "flex items-center gap-2 p-3 rounded-xl border cursor-move transition-all hover:bg-accent",
                draggedIndex === index && "opacity-50 border-primary"
              )}
            >
              <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm font-medium">
                {index + 1}. {section.name || t('templateBuilder.untitledSection')}
              </span>
            </div>
          ))}

          <p className="text-xs text-muted-foreground text-center pt-2">
            {t('templateBuilder.dragToReorder')}
          </p>
        </CardContent>
      </Card>
    </>
  );
}

interface SectionEditorProps {
  section: TemplateSection;
  index: number;
  totalSections: number;
  t: (key: string) => string;
  onUpdate: (updates: Partial<TemplateSection>) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
}

function SectionEditor({
  section,
  index,
  totalSections,
  t,
  onUpdate,
  onMoveUp,
  onMoveDown,
  onDelete
}: SectionEditorProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const currentValue = section.content;

      const newValue = currentValue.substring(0, start) + '\n- ' + currentValue.substring(end);

      onUpdate({ content: newValue });

      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 3;
      }, 0);
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    if (!section.content || section.content.trim() === '') {
      onUpdate({ content: '- ' });
      setTimeout(() => {
        e.currentTarget.selectionStart = e.currentTarget.selectionEnd = 2;
      }, 0);
    }
  };

  return (
    <Card className="rounded-2xl">
      <CardContent className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">
            {t('templateBuilder.sectionLabel').replace('{{n}}', String(index + 1))}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={onMoveUp}
              disabled={index === 0}
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={onMoveDown}
              disabled={index === totalSections - 1}
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full text-destructive hover:text-destructive"
              onClick={onDelete}
              disabled={totalSections <= 1}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">{t('templateBuilder.sectionTitle')}</label>
          <Input
            value={section.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            placeholder={t('templateBuilder.untitledSection')}
            className="rounded-full"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">{t('templateBuilder.style')}</label>
          <div className="flex rounded-full border p-1 w-fit">
            <Button
              variant={section.style === 'bullet' ? 'default' : 'ghost'}
              size="sm"
              className="rounded-full gap-2"
              onClick={() => onUpdate({ style: 'bullet' })}
            >
              <List className="h-4 w-4" />
              {t('templateBuilder.bulletPoints')}
            </Button>
            <Button
              variant={section.style === 'paragraph' ? 'default' : 'ghost'}
              size="sm"
              className="rounded-full gap-2"
              onClick={() => onUpdate({ style: 'paragraph' })}
            >
              <Type className="h-4 w-4" />
              {t('templateBuilder.paragraph')}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">{t('templateBuilder.length')}</label>
          <div className="flex rounded-full border p-1 w-fit">
            <Button
              variant={section.verbosity === 'detailed' ? 'default' : 'ghost'}
              size="sm"
              className="rounded-full gap-2"
              onClick={() => onUpdate({ verbosity: 'detailed' })}
            >
              <FileCheck className="h-4 w-4" />
              {t('templateBuilder.detailed')}
            </Button>
            <Button
              variant={section.verbosity === 'standard' ? 'default' : 'ghost'}
              size="sm"
              className="rounded-full gap-2"
              onClick={() => onUpdate({ verbosity: 'standard' })}
            >
              <AlignLeft className="h-4 w-4" />
              {t('templateBuilder.standard')}
            </Button>
            <Button
              variant={section.verbosity === 'concise' ? 'default' : 'ghost'}
              size="sm"
              className="rounded-full gap-2"
              onClick={() => onUpdate({ verbosity: 'concise' })}
            >
              <Minimize2 className="h-4 w-4" />
              {t('templateBuilder.concise')}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">{t('templateBuilder.sectionContent')}</label>
          <Textarea
            value={section.content}
            onChange={(e) => onUpdate({ content: e.target.value })}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            placeholder={t('templateBuilder.sectionContentPlaceholder')}
            rows={5}
            className="rounded-2xl"
          />
        </div>
      </CardContent>
    </Card>
  );
}
