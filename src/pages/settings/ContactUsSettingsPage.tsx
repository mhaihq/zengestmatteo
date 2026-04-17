import { useState } from 'react';
import { Mail, Phone, MessageSquare, Calendar, ExternalLink, Send } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SettingsLayout } from '@/components/settings/SettingsLayout';
import { SettingsCard } from '@/components/settings/SettingsCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

const FEEDBACK_TOPICS = [
  'General Inquiry',
  'Technical Support',
  'Billing Question',
  'Feature Request',
  'Bug Report',
  'Partnership Inquiry',
  'Other',
];

export function ContactUsSettingsPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({
    topic: '',
    subject: '',
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setFeedback({ topic: '', subject: '', message: '' });
    toast({
      title: t('contactUs.messageSent'),
      description: t('contactUs.messageSentDesc'),
    });
  };

  return (
    <SettingsLayout title={t('contactUs.title')}>
      <SettingsCard title={t('contactUs.cardTitle')}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h4 className="font-medium">Email Support</h4>
              <p className="text-sm text-muted-foreground mt-1">
                For general inquiries and support
              </p>
              <a
                href="mailto:support@unozen.com"
                className="text-sm text-primary hover:underline mt-2 inline-block"
              >
                support@unozen.com
              </a>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Phone className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h4 className="font-medium">Phone Support</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Mon-Fri, 9am-5pm EST
              </p>
              <a
                href="tel:+1-800-123-4567"
                className="text-sm text-primary hover:underline mt-2 inline-block"
              >
                +1 (800) 123-4567
              </a>
            </div>
          </div>
        </div>
      </SettingsCard>

      <SettingsCard title="Send us Feedback">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-start gap-3 mb-4">
            <MessageSquare className="h-5 w-5 text-muted-foreground mt-0.5" />
            <p className="text-sm text-muted-foreground">
              We value your feedback! Let us know how we can improve or report any issues you've encountered.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="topic">Topic</Label>
              <Select
                value={feedback.topic}
                onValueChange={(value) => setFeedback(prev => ({ ...prev, topic: value }))}
              >
                <SelectTrigger id="topic" className="mt-1.5">
                  <SelectValue placeholder={t('contactUs.selectTopic')} />
                </SelectTrigger>
                <SelectContent>
                  {FEEDBACK_TOPICS.map((topic) => (
                    <SelectItem key={topic} value={topic}>
                      {topic}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={feedback.subject}
                onChange={(e) => setFeedback(prev => ({ ...prev, subject: e.target.value }))}
                placeholder={t('contactUs.briefDescription')}
                className="mt-1.5"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={feedback.message}
              onChange={(e) => setFeedback(prev => ({ ...prev, message: e.target.value }))}
              placeholder={t('contactUs.descriptionPlaceholder')}
              className="mt-1.5 min-h-[150px]"
            />
          </div>

          <Button
            type="submit"
            className="gap-2"
            disabled={!feedback.topic || !feedback.subject || !feedback.message || isSubmitting}
          >
            <Send className="h-4 w-4" />
            {isSubmitting ? 'Sending...' : 'Send Message'}
          </Button>
        </form>
      </SettingsCard>

      <SettingsCard title="Schedule a Call">
        <div className="flex flex-col md:flex-row md:items-start gap-6">
          <div className="flex items-start gap-4 flex-1">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h4 className="font-medium">Book a Demo or Consultation</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Want to learn more about our features or need personalized help? Schedule a 30-minute call with our team.
              </p>
              <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                <li>- Product demonstrations</li>
                <li>- Account setup assistance</li>
                <li>- Technical consultations</li>
                <li>- Enterprise solutions</li>
              </ul>
            </div>
          </div>
          <Button variant="outline" className="gap-2 shrink-0" asChild>
            <a href="https://calendly.com" target="_blank" rel="noopener noreferrer">
              <Calendar className="h-4 w-4" />
              Schedule a Call
              <ExternalLink className="h-3 w-3" />
            </a>
          </Button>
        </div>
      </SettingsCard>

      <SettingsCard title="Help Resources">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="#"
            className="p-4 border rounded-lg hover:border-primary/50 hover:bg-muted/50 transition-colors group"
          >
            <h4 className="font-medium group-hover:text-primary">Documentation</h4>
            <p className="text-sm text-muted-foreground mt-1">
              Browse our comprehensive guides and tutorials
            </p>
          </a>
          <a
            href="#"
            className="p-4 border rounded-lg hover:border-primary/50 hover:bg-muted/50 transition-colors group"
          >
            <h4 className="font-medium group-hover:text-primary">FAQ</h4>
            <p className="text-sm text-muted-foreground mt-1">
              Find answers to commonly asked questions
            </p>
          </a>
          <a
            href="#"
            className="p-4 border rounded-lg hover:border-primary/50 hover:bg-muted/50 transition-colors group"
          >
            <h4 className="font-medium group-hover:text-primary">Community</h4>
            <p className="text-sm text-muted-foreground mt-1">
              Connect with other users and share tips
            </p>
          </a>
        </div>
      </SettingsCard>
    </SettingsLayout>
  );
}
