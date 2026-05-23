import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-[10px] text-body font-medium transition-all duration-300 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:scale-[1.01]',
  {
    variants: {
      variant: {
        primary: 'bg-apple-blue text-white hover:bg-[#0066CC] active:scale-[0.98] active:opacity-90',
        secondary: 'border border-apple-border dark:border-[#2C2C2E] bg-white dark:bg-[#2C2C2E] text-apple-black dark:text-white hover:bg-[#F5F5F7] dark:hover:bg-[#3A3A3C] active:scale-[0.98]',
        ghost: 'text-apple-secondary hover:text-apple-black dark:hover:text-white hover:bg-[#F5F5F7] dark:hover:bg-[#2C2C2E] active:scale-[0.98]',
        destructive: 'bg-apple-red text-white hover:bg-[#D62D20] active:scale-[0.98]',
        link: 'text-apple-blue underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-5 py-2',
        sm: 'h-8 px-3 py-1 text-caption',
        lg: 'h-12 px-8 py-3 text-body',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
