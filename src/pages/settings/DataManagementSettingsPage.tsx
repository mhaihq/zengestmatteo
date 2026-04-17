import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { SettingsLayout } from '@/components/settings/SettingsLayout';
import { SettingsCard } from '@/components/settings/SettingsCard';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
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

export function DataManagementSettingsPage() {
  const [autoDeleteEnabled, setAutoDeleteEnabled] = useState(false);
  const [deleteAfterDays, setDeleteAfterDays] = useState('90');
  const [dictationPlaybackEnabled, setDictationPlaybackEnabled] = useState(false);

  return (
    <SettingsLayout title="Data management">
      <SettingsCard>
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1">
              <h4 className="font-medium">Automatically delete sessions</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Schedule sessions to delete on a recurring basis (between 1 to 90 days).
              </p>
              <div className="flex items-center gap-2 mt-3">
                <span className="text-sm text-muted-foreground">Delete after</span>
                <Input
                  type="number"
                  min="1"
                  max="90"
                  value={deleteAfterDays}
                  onChange={(e) => setDeleteAfterDays(e.target.value)}
                  disabled={!autoDeleteEnabled}
                  className="w-20 h-8"
                />
                <span className="text-sm text-muted-foreground">days</span>
              </div>
            </div>
            <Switch
              checked={autoDeleteEnabled}
              onCheckedChange={setAutoDeleteEnabled}
            />
          </div>

          <div className="border-t pt-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="flex-1">
                <h4 className="font-medium">Enable dictation playback</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Opting in will store recordings of your dictations. This allows you or your staff to play back and verify the accuracy of dictations. You must get consent to record patients speaking.
                </p>
              </div>
              <Switch
                checked={dictationPlaybackEnabled}
                onCheckedChange={setDictationPlaybackEnabled}
              />
            </div>
          </div>
        </div>
      </SettingsCard>

      <SettingsCard title="Delete all sessions" variant="danger">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-destructive">Danger zone</p>
            <p className="text-sm text-muted-foreground mt-1">
              Permanently delete all sessions on your account, and all transcripts, notes and documents associated with these sessions.
            </p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive shrink-0">
                <Trash2 className="h-4 w-4" />
                Delete all sessions
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete all your sessions, transcripts, notes, and associated documents from our servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
                <AlertDialogAction className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Delete All Sessions
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </SettingsCard>
    </SettingsLayout>
  );
}
