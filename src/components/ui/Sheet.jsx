import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

// side="right" en pantallas grandes, hoja inferior en celular.
export function Sheet({ open, onOpenChange, title, children, footer }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-40 bg-lince-950/60 backdrop-blur-[2px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild forceMount aria-describedby={undefined}>
              <motion.div
                className="fixed z-50 flex max-h-[92dvh] flex-col bg-crema shadow-2xl inset-x-0 bottom-0 rounded-t-3xl md:inset-y-0 md:right-0 md:left-auto md:max-h-none md:w-[26rem] md:rounded-none md:rounded-l-3xl"
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 32, stiffness: 320 }}
              >
                <div className="flex items-center justify-between px-5 pt-5 pb-3">
                  <Dialog.Title className="font-display text-3xl font-bold uppercase tracking-wide text-lince-950">
                    {title}
                  </Dialog.Title>
                  <Dialog.Close className="grid h-10 w-10 place-items-center rounded-full hover:bg-lince-900/5" aria-label="Cerrar">
                    <X size={20} />
                  </Dialog.Close>
                </div>
                <div className="flex-1 overflow-y-auto px-5 pb-4">{children}</div>
                {footer && <div className="border-t border-lince-900/10 bg-white px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">{footer}</div>}
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
