import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { AlertTriangle, Trash2, Info, ShieldAlert } from 'lucide-react';

export interface ConfirmOptions {
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'destructive' | 'warning' | 'default';
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

export function useConfirm(): ConfirmFn {
  const fn = useContext(ConfirmContext);
  if (!fn) throw new Error('useConfirm must be used within ConfirmDialogProvider');
  return fn;
}

export function ConfirmDialogProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({
    title: '',
    description: '',
    confirmText: 'Continue',
    cancelText: 'Cancel',
    variant: 'default',
  });
  const resolveRef = useRef<(value: boolean) => void>();

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    setOptions({
      confirmText: 'Continue',
      cancelText: 'Cancel',
      variant: 'default',
      ...opts,
    });
    setOpen(true);
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  const handleConfirm = () => {
    setOpen(false);
    resolveRef.current?.(true);
  };

  const handleCancel = () => {
    setOpen(false);
    resolveRef.current?.(false);
  };

  const iconMap = {
    destructive: <Trash2 className="h-5 w-5 text-destructive" />,
    warning: <ShieldAlert className="h-5 w-5 text-amber-500" />,
    default: <Info className="h-5 w-5 text-primary" />,
  };

  const iconBgMap = {
    destructive: 'bg-destructive/10',
    warning: 'bg-amber-500/10',
    default: 'bg-primary/10',
  };

  const actionClassMap = {
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 focus:ring-destructive',
    warning: 'bg-amber-500 text-white hover:bg-amber-600 focus:ring-amber-500',
    default: 'bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-primary',
  };

  const variant = options.variant || 'default';

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <AlertDialog open={open} onOpenChange={(v) => { if (!v) handleCancel(); }}>
        <AlertDialogContent className="sm:max-w-[440px] p-0 overflow-hidden">
          {/* Colored top accent bar */}
          <div className={`h-1 w-full ${
            variant === 'destructive' ? 'bg-destructive' :
            variant === 'warning' ? 'bg-amber-500' : 'bg-primary'
          }`} />

          <div className="p-6">
            <AlertDialogHeader>
              <div className="flex items-start gap-4">
                <div className={`p-2.5 rounded-xl ${iconBgMap[variant]} flex-shrink-0 mt-0.5`}>
                  {iconMap[variant]}
                </div>
                <div className="flex-1 min-w-0">
                  <AlertDialogTitle className="text-lg font-semibold leading-tight">
                    {options.title}
                  </AlertDialogTitle>
                  <AlertDialogDescription className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {options.description}
                  </AlertDialogDescription>
                </div>
              </div>
            </AlertDialogHeader>

            <AlertDialogFooter className="mt-6 gap-2 sm:gap-3">
              <AlertDialogCancel
                onClick={handleCancel}
                className="mt-0 font-medium"
              >
                {options.cancelText}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirm}
                className={`font-medium btn-press ${actionClassMap[variant]}`}
              >
                {options.confirmText}
              </AlertDialogAction>
            </AlertDialogFooter>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </ConfirmContext.Provider>
  );
}
