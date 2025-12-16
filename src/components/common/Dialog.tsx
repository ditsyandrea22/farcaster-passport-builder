import * as React from 'react'
import * as DialogPrimitive from "@radix-ui/react-dialog";

export const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="..." />
    <DialogPrimitive.Content ref={ref} className={className} {...props}>
      {children}
      <DialogPrimitive.Close className="..." />
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));

// Add DialogTitle and DialogDescription
export const DialogTitle = DialogPrimitive.Title;
export const DialogDescription = DialogPrimitive.Description;
