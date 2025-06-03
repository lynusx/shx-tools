import * as RadixToast from '@radix-ui/react-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';

export function Toast({ open, setOpen, title, description, type = 'info' }) {
  return (
    <RadixToast.Provider swipeDirection="right">
      <AnimatePresence>
        {open && (
          <RadixToast.Root
            className={clsx(
              'fixed bottom-4 right-4 z-50 rounded-lg shadow-lg p-4 min-w-[300px]',
              {
                'bg-green-50 text-green-900': type === 'success',
                'bg-red-50 text-red-900': type === 'error',
                'bg-blue-50 text-blue-900': type === 'info',
              }
            )}
            open={open}
            onOpenChange={setOpen}
            asChild
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
            >
              <div className="flex gap-3">
                <div className="flex-1">
                  <RadixToast.Title className="font-semibold mb-1">
                    {title}
                  </RadixToast.Title>
                  <RadixToast.Description className="text-sm opacity-90">
                    {description}
                  </RadixToast.Description>
                </div>
                <RadixToast.Close className="text-sm opacity-70 hover:opacity-100">
                  ✕
                </RadixToast.Close>
              </div>
            </motion.div>
          </RadixToast.Root>
        )}
      </AnimatePresence>
      <RadixToast.Viewport />
    </RadixToast.Provider>
  );
}