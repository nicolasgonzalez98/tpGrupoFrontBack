import { createContext, useContext, useRef, useMemo } from 'react';
import type { ReactNode } from 'react';
import { Toast } from 'primereact/toast';
import type { ToastMessage } from 'primereact/toast';

/**
 * Reemplaza el MessageService de PrimeNG (que en Angular se inyectaba y se llamaba
 * con .add()). En PrimeReact el Toast funciona por ref, así que se expone vía contexto
 * un `show()` global. Equivalente: this.messageService.add({...}) -> useToast().show({...}).
 */
interface ToastContextValue {
  show: (message: ToastMessage | ToastMessage[]) => void;
  clear: () => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const toastRef = useRef<Toast>(null);

  const value = useMemo<ToastContextValue>(
    () => ({
      show: (message) => toastRef.current?.show(message),
      clear: () => toastRef.current?.clear(),
    }),
    []
  );

  return (
    <ToastContext.Provider value={value}>
      <Toast ref={toastRef} />
      {children}
    </ToastContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast debe usarse dentro de <ToastProvider>');
  }
  return ctx;
}
