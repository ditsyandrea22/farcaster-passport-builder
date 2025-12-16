'use client'

import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { cn } from '@/lib/utils'

/**
 * Accessible Dialog Content Component
 * Ensures all dialog content has proper accessibility attributes
 */

interface AccessibleDialogContentProps extends React.ComponentProps<typeof DialogPrimitive.Content> {
  title: string
  description?: string
  showCloseButton?: boolean
}

export const AccessibleDialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  AccessibleDialogContentProps
>(({ className, children, title, description, showCloseButton = true, ...props }, ref) => {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50" />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          'fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border bg-background p-6 shadow-lg duration-200 sm:max-w-lg',
          className
        )}
        aria-describedby={description ? `${props.id || 'dialog-description'}` : undefined}
        {...props}
      >
        {/* Hidden but accessible title for screen readers */}
        <DialogPrimitive.Title className="sr-only">{title}</DialogPrimitive.Title>
        
        {/* Hidden but accessible description for screen readers */}
        {description && (
          <DialogPrimitive.Description className="sr-only" id={`${props.id || 'dialog-description'}`}>
            {description}
          </DialogPrimitive.Description>
        )}
        
        {children}
        
        {showCloseButton && (
          <DialogPrimitive.Close
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
            aria-label="Close dialog"
          >
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
})

AccessibleDialogContent.displayName = 'AccessibleDialogContent'

/**
 * Hook to ensure dialog accessibility
 */
export function useDialogAccessibility() {
  const [isOpen, setIsOpen] = React.useState(false)
  const [titleId] = React.useState(() => `dialog-title-${Math.random().toString(36).substr(2, 9)}`)
  const [descriptionId] = React.useState(() => `dialog-description-${Math.random().toString(36).substr(2, 9)}`)

  const getAccessibilityProps = React.useCallback((customTitle?: string, customDescription?: string) => {
    return {
      'aria-labelledby': titleId,
      'aria-describedby': customDescription ? descriptionId : undefined,
      titleId,
      descriptionId,
      title: customTitle,
      description: customDescription
    }
  }, [titleId, descriptionId])

  return {
    isOpen,
    setIsOpen,
    titleId,
    descriptionId,
    getAccessibilityProps
  }
}

/**
 * Safe Dialog Content wrapper that automatically adds accessibility
 */
interface SafeDialogContentProps extends Omit<AccessibleDialogContentProps, 'title'> {
  title?: string
  titleId?: string
}

export const SafeDialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  SafeDialogContentProps
>(({ className, children, title, titleId, description, showCloseButton = true, ...props }, ref) => {
  const [localTitleId] = React.useState(() => titleId || `dialog-title-${Math.random().toString(36).substr(2, 9)}`)
  const [localDescriptionId] = React.useState(() => `dialog-description-${Math.random().toString(36).substr(2, 9)}`)

  // If no title is provided, create a generic one
  const dialogTitle = title || 'Dialog'
  
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50" />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          'fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border bg-background p-6 shadow-lg duration-200 sm:max-w-lg',
          className
        )}
        aria-labelledby={localTitleId}
        aria-describedby={description ? localDescriptionId : undefined}
        {...props}
      >
        {/* Hidden but accessible title */}
        <DialogPrimitive.Title className="sr-only" id={localTitleId}>
          {dialogTitle}
        </DialogPrimitive.Title>
        
        {/* Hidden but accessible description */}
        {description && (
          <DialogPrimitive.Description className="sr-only" id={localDescriptionId}>
            {description}
          </DialogPrimitive.Description>
        )}
        
        {children}
        
        {showCloseButton && (
          <DialogPrimitive.Close
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
            aria-label="Close dialog"
          >
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
})

SafeDialogContent.displayName = 'SafeDialogContent'