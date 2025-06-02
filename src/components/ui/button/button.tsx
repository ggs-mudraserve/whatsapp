import { forwardRef } from 'react'
import { Button as MuiButton, ButtonProps as MuiButtonProps } from '@mui/material'

export interface ButtonProps extends Omit<MuiButtonProps, 'variant'> {
  variant?: 'primary' | 'secondary' | 'outlined' | 'text'
  isLoading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', isLoading, children, disabled, ...props }, ref) => {
    const muiVariant = variant === 'primary' ? 'contained' 
                     : variant === 'secondary' ? 'contained'
                     : variant === 'outlined' ? 'outlined' 
                     : 'text'

    const color = variant === 'secondary' ? 'secondary' : 'primary'

    return (
      <MuiButton
        ref={ref}
        variant={muiVariant}
        color={color}
        disabled={disabled || isLoading}
        {...props}
      >
        {children}
      </MuiButton>
    )
  }
)

Button.displayName = 'Button' 