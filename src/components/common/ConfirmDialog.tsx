import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useConfirmStore } from '@/stores/confirmStore';

export function ConfirmDialog() {
  const { t } = useTranslation();
  const {
    open,
    title,
    description,
    confirmLabel,
    cancelLabel,
    destructive,
    handleConfirm,
    handleCancel,
  } = useConfirmStore();

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleCancel()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {destructive !== false && (
              <AlertTriangle className="h-5 w-5 text-destructive" />
            )}
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription>{description}</DialogDescription>
          )}
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            {cancelLabel || t('cancel') || 'Cancel'}
          </Button>
          <Button
            variant={destructive !== false ? 'destructive' : 'default'}
            onClick={handleConfirm}
          >
            {confirmLabel || t('confirm') || 'Confirm'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
