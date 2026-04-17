import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Copy, FileText, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

interface TemplateSection {
  id: string;
  name: string;
  order: number;
}

interface Template {
  id: string;
  name: string;
  description: string | null;
  is_zen_template: boolean;
  sections: TemplateSection[];
}

export function TemplatesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [zenTemplates, setZenTemplates] = useState<Template[]>([]);
  const [userTemplates, setUserTemplates] = useState<Template[]>([]);
  const [userLibrary, setUserLibrary] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    const { data: zenData } = await supabase
      .from('templates')
      .select(`
        id,
        name,
        description,
        is_zen_template,
        template_sections (
          id,
          name,
          order
        )
      `)
      .eq('is_zen_template', true)
      .order('name');

    const { data: userData } = await supabase
      .from('templates')
      .select(`
        id,
        name,
        description,
        is_zen_template,
        template_sections (
          id,
          name,
          order
        )
      `)
      .eq('is_zen_template', false)
      .order('name');

    if (zenData) {
      setZenTemplates(zenData.map(t => ({
        ...t,
        sections: (t.template_sections || []).sort((a: TemplateSection, b: TemplateSection) => a.order - b.order)
      })));
    }

    if (userData) {
      setUserTemplates(userData.map(t => ({
        ...t,
        sections: (t.template_sections || []).sort((a: TemplateSection, b: TemplateSection) => a.order - b.order)
      })));
    }
  };

  const handleAddToLibrary = async (templateId: string) => {
    setUserLibrary(prev => new Set(prev).add(templateId));
    toast({
      title: t('templatesPage.templateAdded'),
      description: t('templatesPage.templateAddedDesc'),
    });
  };

  const handleRemoveFromLibrary = async (templateId: string) => {
    setUserLibrary(prev => {
      const newSet = new Set(prev);
      newSet.delete(templateId);
      return newSet;
    });
    toast({
      title: t('templatesPage.templateRemoved'),
      description: t('templatesPage.templateRemovedDesc'),
    });
  };

  const handleCustomize = (template: Template) => {
    navigate(`/templates/${template.id}/edit`);
  };

  const handleEdit = (template: Template) => {
    navigate(`/templates/${template.id}/edit`);
  };

  const filteredZenTemplates = zenTemplates.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.sections.some(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const libraryTemplates = [
    ...zenTemplates.filter(t => userLibrary.has(t.id)),
    ...userTemplates
  ].filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.sections.some(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="container max-w-7xl mx-auto p-4 md:p-6 pb-20 md:pb-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="text-center space-y-2 max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold">{t('templatesPage.subtitle')}</h1>
          <p className="text-muted-foreground">
            {t('templatesPage.description')}
          </p>
          <p className="text-sm text-muted-foreground">
            {t('templatesPage.libraryNote')}
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder={t('templatesPage.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 rounded-full"
            />
          </div>

          <Button
            onClick={() => navigate('/templates/new')}
            className="gap-2 rounded-full h-12 px-6 whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            {t('templatesPage.newTemplate')}
          </Button>
        </div>

        <Tabs defaultValue="zen" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 rounded-full h-12">
            <TabsTrigger value="zen" className="rounded-full">
              <FileText className="h-4 w-4 mr-2" />
              {t('templatesPage.zenTemplates')}
            </TabsTrigger>
            <TabsTrigger value="library" className="rounded-full">
              <Copy className="h-4 w-4 mr-2" />
              {t('templatesPage.myLibrary')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="zen" className="mt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredZenTemplates.map((template, index) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  index={index}
                  inLibrary={userLibrary.has(template.id)}
                  onAddToLibrary={() => handleAddToLibrary(template.id)}
                  onRemoveFromLibrary={() => handleRemoveFromLibrary(template.id)}
                  onCustomize={() => handleCustomize(template)}
                  onEdit={() => handleEdit(template)}
                  t={t}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="library" className="mt-6">
            {libraryTemplates.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">{t('templatesPage.noTemplates')}</h3>
                <p className="text-muted-foreground">
                  {t('templatesPage.addFirstTemplate')}
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {libraryTemplates.map((template, index) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    index={index}
                    inLibrary={true}
                    isUserTemplate={!template.is_zen_template}
                    onAddToLibrary={() => handleAddToLibrary(template.id)}
                    onRemoveFromLibrary={() => handleRemoveFromLibrary(template.id)}
                    onCustomize={() => handleCustomize(template)}
                    onEdit={() => handleEdit(template)}
                    t={t}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}

interface TemplateCardProps {
  template: Template;
  index: number;
  inLibrary: boolean;
  isUserTemplate?: boolean;
  onAddToLibrary: () => void;
  onRemoveFromLibrary: () => void;
  onCustomize: () => void;
  onEdit: () => void;
  t: (key: string) => string;
}

function TemplateCard({
  template,
  index,
  inLibrary,
  isUserTemplate,
  onAddToLibrary,
  onRemoveFromLibrary,
  onCustomize,
  onEdit,
  t
}: TemplateCardProps) {
  const visibleSections = template.sections.slice(0, 3);
  const remainingSections = template.sections.length - 3;
  const totalSections = template.sections.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="hover:shadow-lg transition-all rounded-2xl h-full flex flex-col">
        <CardHeader className="flex-1">
          <CardTitle className="text-lg mb-4">{template.name}</CardTitle>
          <div className="space-y-1">
            {visibleSections.map((section) => (
              <div key={section.id} className="text-sm text-muted-foreground flex items-start">
                <span className="mr-2">•</span>
                <span>{section.name}</span>
              </div>
            ))}
            {remainingSections > 0 && (
              <div className="text-sm text-muted-foreground flex items-start font-medium">
                <span className="mr-2">+</span>
                <span>
                  {remainingSections} {remainingSections === 1 ? t('templatesPage.section') : t('templatesPage.sections')}
                </span>
              </div>
            )}
            {totalSections === 0 && (
              <div className="text-sm text-muted-foreground italic">
                No sections defined
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between border-t pt-4">
            {isUserTemplate ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onEdit}
                  className="rounded-full text-primary hover:text-primary"
                >
                  <Copy className="h-4 w-4 mr-1" />
                  {t('templatesPage.customize')}
                </Button>
              </>
            ) : inLibrary ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRemoveFromLibrary}
                  className="rounded-full text-destructive hover:text-destructive"
                >
                  {t('templatesPage.remove')}
                </Button>
                <Separator orientation="vertical" className="h-6" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onCustomize}
                  className="rounded-full"
                >
                  <Copy className="h-4 w-4 mr-1" />
                  {t('templatesPage.customize')}
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onAddToLibrary}
                  className="rounded-full text-primary hover:text-primary"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  {t('templatesPage.addToLibrary')}
                </Button>
                <Separator orientation="vertical" className="h-6" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onCustomize}
                  className="rounded-full"
                >
                  <Copy className="h-4 w-4 mr-1" />
                  {t('templatesPage.customize')}
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
