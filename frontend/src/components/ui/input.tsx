import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-[10px] border border-apple-border bg-apple-card px-4 py-2 text-body text-apple-black',
          'placeholder:text-apple-secondary',
          'focus-visible:outline-none focus-visible:border-apple-blue focus-visible:ring-0',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'transition-all duration-300',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
