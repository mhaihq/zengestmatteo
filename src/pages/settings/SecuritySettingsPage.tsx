import { useState } from 'react';
import { Shield, Download, Globe, Trash2, Lock, TriangleAlert as AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SettingsLayout } from '@/components/settings/SettingsLayout';
import { SettingsCard } from '@/components/settings/SettingsCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

export function SecuritySettingsPage() {
  const { t } = useTranslation();
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const handleExportData = async () => {
    setIsExporting(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsExporting(false);
  };

  return (
    <SettingsLayout title="Security">
      <SettingsCard title="GDPR Compliance">
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Download className="h-5 w-5 text-muted-foreground" />
                <h4 className="font-medium">Export Your Data</h4>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Download a copy of all your personal data in a machine-readable format. This includes your profile information, session notes, templates, and client data.
              </p>
            </div>
            <Button
              variant="outline"
              className="gap-2 shrink-0"
              onClick={handleExportData}
              disabled={isExporting}
            >
              <Download className="h-4 w-4" />
              {isExporting ? 'Preparing...' : 'Request Data Export'}
            </Button>
          </div>

          <div className="border-t pt-6">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <h4 className="font-medium">Right to Erasure</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Under GDPR, you have the right to request the deletion of your personal data. Use the "Delete Account" option below to permanently remove all your data from our systems.
                </p>
              </div>
            </div>
          </div>
        </div>
      </SettingsCard>

      <SettingsCard title="Data Residency">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex items-start gap-3">
            <Globe className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-medium">Data Storage Location</h4>
                <Badge variant="secondary">EU</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Your data is stored in secure data centers located in the European Union (Frankfurt, Germany). This ensures compliance with EU data protection regulations including GDPR.
              </p>
              <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <Lock className="h-4 w-4 text-green-600" />
                  <span className="text-green-700 dark:text-green-400">
                    All data encrypted at rest and in transit
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SettingsCard>

      <SettingsCard title="Delete Account" variant="danger">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-destructive">Danger zone</p>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              Permanently delete your account and all associated data. This action is irreversible and will remove all your sessions, notes, templates, client information, and subscription data.
            </p>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="gap-2">
                  <Trash2 className="h-4 w-4" />
                  Delete Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-2xl">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-destructive flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Delete Your Account?
                  </AlertDialogTitle>
                  <AlertDialogDescription className="space-y-3">
                    <p>
                      This action is permanent and cannot be undone. All your data will be permanently deleted, including:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>All session recordings and transcripts</li>
                      <li>All notes and templates</li>
                      <li>All client information</li>
                      <li>Your subscription and billing history</li>
                    </ul>
                    <div className="pt-3">
                      <Label htmlFor="confirm-delete" className="text-foreground">
                        Type <strong>DELETE</strong> to confirm:
                      </Label>
                      <Input
                        id="confirm-delete"
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        placeholder={t('security.deleteConfirmation')}
                        className="mt-2"
                      />
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-full" onClick={() => setDeleteConfirmText('')}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    disabled={deleteConfirmText !== 'DELETE'}
                  >
                    Permanently Delete Account
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </SettingsCard>
    </SettingsLayout>
  );
}
