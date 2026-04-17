import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useMediaQuery } from '@/hooks/use-media-query';

interface FAQDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FAQDialog({ open, onOpenChange }: FAQDialogProps) {
  const { t } = useTranslation();
  const isDesktop = useMediaQuery('(min-width: 768px)');

  const faqs = [
    {
      id: 'what-is-zen-assistant',
      question: t('faq.whatIsZenAssistant.question'),
      answer: t('faq.whatIsZenAssistant.answer'),
    },
    {
      id: 'how-to-start-session',
      question: t('faq.howToStartSession.question'),
      answer: t('faq.howToStartSession.answer'),
    },
    {
      id: 'what-are-templates',
      question: t('faq.whatAreTemplates.question'),
      answer: t('faq.whatAreTemplates.answer'),
    },
    {
      id: 'how-to-use-assistant',
      question: t('faq.howToUseAssistant.question'),
      answer: t('faq.howToUseAssistant.answer'),
    },
    {
      id: 'is-data-secure',
      question: t('faq.isDataSecure.question'),
      answer: t('faq.isDataSecure.answer'),
    },
    {
      id: 'can-i-export-notes',
      question: t('faq.canIExportNotes.question'),
      answer: t('faq.canIExportNotes.answer'),
    },
    {
      id: 'how-voice-input-works',
      question: t('faq.howVoiceInputWorks.question'),
      answer: t('faq.howVoiceInputWorks.answer'),
    },
    {
      id: 'what-is-pricing',
      question: t('faq.whatIsPricing.question'),
      answer: t('faq.whatIsPricing.answer'),
    },
  ];

  const content = (
    <ScrollArea className="h-full max-h-[70vh]">
      <Accordion type="single" collapsible className="w-full">
        {faqs.map((faq) => (
          <AccordionItem key={faq.id} value={faq.id}>
            <AccordionTrigger className="text-left">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </ScrollArea>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">{t('faq.title')}</DialogTitle>
            <DialogDescription>
              {t('faq.description')}
            </DialogDescription>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle className="text-2xl">{t('faq.title')}</DrawerTitle>
          <DrawerDescription>
            {t('faq.description')}
          </DrawerDescription>
        </DrawerHeader>
        <div className="px-4 pb-8">
          {content}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
