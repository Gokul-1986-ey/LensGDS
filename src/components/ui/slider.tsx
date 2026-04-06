import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  showValue?: boolean;
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ className, label, showValue = true, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1">
        {(label || showValue) && (
          <div className="flex items-center justify-between text-sm">
            {label && <span className="font-medium">{label}</span>}
            {showValue && (
              <span className="text-muted-foreground">{props.value ?? props.defaultValue}</span>
            )}
          </div>
        )}
        <input
          type="range"
          className={cn(
            'w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary',
            className
          )}
          ref={ref}
          {...props}
        />
      </div>
    );
  }
);
Slider.displayName = 'Slider';

export { Slider };
