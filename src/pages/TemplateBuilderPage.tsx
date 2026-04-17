import { useState, useEffect, useCallback } from 'react';
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
  Minimize2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
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

type BuilderStep = 'select' | 'edit';

export function TemplateBuilderPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { templateId } = useParams();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const [step, setStep] = useState<BuilderStep>(templateId ? 'edit' : 'select');
  const [templateName, setTemplateName] = useState('');
  const [sections, setSections] = useState<TemplateSection[]>([]);
  const [originalTemplate, setOriginalTemplate] = useState<Template | null>(null);
  const [isZenTemplate, setIsZenTemplate] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (templateId) {
      loadTemplate(templateId);
    } else if (searchParams.get('mode') === 'blank') {
      setStep('edit');
      setTemplateName('');
      setSections([createEmptySection(0)]);
    }
  }, [templateId, searchParams]);

  const loadTemplate = async (id: string) => {
    const { data } = await supabase
      .from('templates')
      .select(`
        id,
        name,
        description,
        is_zen_template,
        template_sections (
          id,
          name,
          style,
          verbosity,
          content,
          order
        )
      `)
      .eq('id', id)
      .maybeSingle();

    if (data) {
      const sortedSections = (data.template_sections || [])
        .sort((a: TemplateSection, b: TemplateSection) => a.order - b.order)
        .map((s: TemplateSection) => ({
          ...s,
          style: (s.style || 'bullet') as 'bullet' | 'paragraph',
          verbosity: (s.verbosity || 'standard') as 'detailed' | 'standard' | 'concise',
          content: s.content || ''
        }));

      const template: Template = {
        id: data.id,
        name: data.name,
        description: data.description,
        is_zen_template: data.is_zen_template,
        sections: sortedSections
      };

      setOriginalTemplate(template);
      setTemplateName(data.name);
      setIsZenTemplate(data.is_zen_template);
      setSections(sortedSections.length > 0 ? sortedSections : [createEmptySection(0)]);
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

  const handleSave = async () => {
    if (!templateName.trim()) {
      toast({
        title: t('common.error'),
        description: t('templateBuilder.templateNameRequired'),
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setIsSaving(false);
      return;
    }

    try {
      if (isZenTemplate || !templateId) {
        const { data: newTemplate, error } = await supabase
          .from('templates')
          .insert({
            name: templateName,
            description: originalTemplate?.description || '',
            user_id: user.id,
            is_zen_template: false
          })
          .select()
          .single();

        if (error) throw error;

        const sectionsToInsert = sections
          .filter(s => s.name.trim())
          .map((s, index) => ({
            template_id: newTemplate.id,
            name: s.name,
            style: s.style,
            verbosity: s.verbosity,
            content: s.content,
            order: index
          }));

        if (sectionsToInsert.length > 0) {
          await supabase.from('template_sections').insert(sectionsToInsert);
        }

        toast({
          title: t('templateBuilder.templateSaved'),
          description: t('templateBuilder.templateSavedDesc'),
        });
        navigate('/templates');
      } else {
        await supabase
          .from('templates')
          .update({ name: templateName })
          .eq('id', templateId);

        await supabase
          .from('template_sections')
          .delete()
          .eq('template_id', templateId);

        const sectionsToInsert = sections
          .filter(s => s.name.trim())
          .map((s, index) => ({
            template_id: templateId,
            name: s.name,
            style: s.style,
            verbosity: s.verbosity,
            content: s.content,
            order: index
          }));

        if (sectionsToInsert.length > 0) {
          await supabase.from('template_sections').insert(sectionsToInsert);
        }

        toast({
          title: t('templateBuilder.templateSaved'),
          description: t('templateBuilder.templateSavedDesc'),
        });
        navigate('/templates');
      }
    } catch {
      toast({
        title: t('common.error'),
        description: t('templateBuilder.failedToSaveTemplate'),
        variant: 'destructive',
      });
    }

    setIsSaving(false);
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

            <Card className="cursor-pointer hover:shadow-lg transition-all rounded-2xl border-2 hover:border-primary/50 opacity-60">
              <CardContent className="p-8 text-center space-y-4">
                <div className="w-12 h-12 mx-auto rounded-xl bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">{t('templateBuilder.startFromSample')}</h3>
                <p className="text-muted-foreground text-sm">
                  {t('templateBuilder.startFromSampleDesc')}
                </p>
                <Button className="rounded-full" variant="outline" disabled>
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
            Section {index + 1}
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
