import { useState } from 'react';
import { Download, Eye, FileText, Copy, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SettingsLayout } from '@/components/settings/SettingsLayout';
import { SettingsCard } from '@/components/settings/SettingsCard';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

const DEFAULT_CONSENT_TEXT = `CLIENT CONSENT FORM

I, [Client Name], hereby consent to the use of AI-assisted documentation during my therapy sessions with [Therapist Name].

I understand that:
1. Audio from our sessions may be processed by AI technology to generate clinical notes.
2. All recordings are encrypted and processed securely.
3. No audio recordings are stored permanently unless I specifically opt-in.
4. I can revoke this consent at any time by notifying my therapist.
5. The generated notes will be reviewed by my therapist for accuracy.
6. My personal health information remains protected under applicable privacy laws.

By signing below, I acknowledge that I have read, understood, and agree to the above terms.

Client Signature: _____________________
Date: _____________________

Therapist Signature: _____________________
Date: _____________________`;

export function ConsentFormSettingsPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [consentText, setConsentText] = useState(DEFAULT_CONSENT_TEXT);
  const [practiceNameVar, setPracticeNameVar] = useState('');
  const [therapistNameVar, setTherapistNameVar] = useState('');
  const [copied, setCopied] = useState(false);

  const handleDownload = () => {
    let finalText = consentText;
    if (practiceNameVar) {
      finalText = finalText.replace('[Practice Name]', practiceNameVar);
    }
    if (therapistNameVar) {
      finalText = finalText.replace('[Therapist Name]', therapistNameVar);
    }

    const blob = new Blob([finalText], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'client-consent-form.txt';
    link.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: t('consentForm.formDownloaded'),
      description: t('consentForm.formDownloadedDesc'),
    });
  };

  const handleCopy = async () => {
    let finalText = consentText;
    if (practiceNameVar) {
      finalText = finalText.replace('[Practice Name]', practiceNameVar);
    }
    if (therapistNameVar) {
      finalText = finalText.replace('[Therapist Name]', therapistNameVar);
    }

    await navigator.clipboard.writeText(finalText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);

    toast({
      title: t('consentForm.formCopied'),
      description: t('consentForm.formCopiedDesc'),
    });
  };

  const handleReset = () => {
    setConsentText(DEFAULT_CONSENT_TEXT);
    toast({
      title: t('consentForm.formReset'),
      description: t('consentForm.formResetDesc'),
    });
  };

  return (
    <SettingsLayout title={t('consentForm.title')}>
      <SettingsCard>
        <div className="flex items-start gap-3 mb-6">
          <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div>
            <h4 className="font-medium">About the Consent Form</h4>
            <p className="text-sm text-muted-foreground mt-1">
              Use this consent form to obtain client permission for AI-assisted documentation during therapy sessions. Customize the template below to match your practice requirements.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="therapistName">Therapist Name (optional)</Label>
              <Input
                id="therapistName"
                value={therapistNameVar}
                onChange={(e) => setTherapistNameVar(e.target.value)}
                placeholder={t('consentForm.enterName')}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="practiceName">Practice Name (optional)</Label>
              <Input
                id="practiceName"
                value={practiceNameVar}
                onChange={(e) => setPracticeNameVar(e.target.value)}
                placeholder={t('consentForm.enterPracticeName')}
                className="mt-1.5"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="consentText">Consent Form Template</Label>
            <Textarea
              id="consentText"
              value={consentText}
              onChange={(e) => setConsentText(e.target.value)}
              className="mt-1.5 min-h-[300px] font-mono text-sm"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Eye className="h-4 w-4" />
                  Preview
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto rounded-2xl">
                <DialogHeader>
                  <DialogTitle>Consent Form Preview</DialogTitle>
                </DialogHeader>
                <div className="mt-4 p-6 bg-white dark:bg-slate-900 border rounded-lg">
                  <pre className="whitespace-pre-wrap font-sans text-sm">
                    {consentText
                      .replace('[Therapist Name]', therapistNameVar || '[Therapist Name]')
                      .replace('[Practice Name]', practiceNameVar || '[Practice Name]')}
                  </pre>
                </div>
              </DialogContent>
            </Dialog>

            <Button variant="outline" className="gap-2" onClick={handleCopy}>
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy to Clipboard
                </>
              )}
            </Button>

            <Button className="gap-2" onClick={handleDownload}>
              <Download className="h-4 w-4" />
              Download
            </Button>

            <Button variant="ghost" onClick={handleReset}>
              Reset to Default
            </Button>
          </div>
        </div>
      </SettingsCard>

      <SettingsCard title="Usage Instructions">
        <div className="space-y-4 text-sm">
          <div className="flex items-start gap-3">
            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-xs shrink-0">
              1
            </div>
            <div>
              <p className="font-medium">Customize the Template</p>
              <p className="text-muted-foreground mt-1">
                Edit the consent form text above to match your practice's specific requirements and local regulations.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-xs shrink-0">
              2
            </div>
            <div>
              <p className="font-medium">Download or Print</p>
              <p className="text-muted-foreground mt-1">
                Download the form and print copies to have ready for new clients, or copy the text to your practice's document system.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-xs shrink-0">
              3
            </div>
            <div>
              <p className="font-medium">Obtain Client Consent</p>
              <p className="text-muted-foreground mt-1">
                Review the form with your client before the first session, answer any questions, and have them sign before beginning AI-assisted documentation.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-xs shrink-0">
              4
            </div>
            <div>
              <p className="font-medium">Store Securely</p>
              <p className="text-muted-foreground mt-1">
                Keep signed consent forms in your client's file according to your record retention policies and regulatory requirements.
              </p>
            </div>
          </div>
        </div>
      </SettingsCard>
    </SettingsLayout>
  );
}
