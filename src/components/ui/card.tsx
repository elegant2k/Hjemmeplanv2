import React from 'react'
import { cn } from '@/lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'elevated' | 'outlined'
  interactive?: boolean
  onClick?: () => void
}

const Card: React.FC<CardProps> = ({
  children,
  className,
  variant = 'default',
  interactive = false,
  onClick
}) => {
  const baseStyles = 'rounded-lg p-4 transition-all duration-200'
  
  const variantStyles = {
    default: 'bg-white shadow-sm border border-gray-200',
    elevated: 'bg-white shadow-md border border-gray-100',
    outlined: 'bg-white border-2 border-gray-300'
  }
  
  const interactiveStyles = interactive 
    ? 'cursor-pointer hover:shadow-md hover:scale-[1.02] active:scale-[0.98]' 
    : ''

  return (
    <div
      className={cn(
        baseStyles,
        variantStyles[variant],
        interactiveStyles,
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

interface CardHeaderProps {
  children: React.ReactNode
  className?: string
}

const CardHeader: React.FC<CardHeaderProps> = ({ children, className }) => {
  return (
    <div className={cn('mb-3', className)}>
      {children}
    </div>
  )
}

interface CardTitleProps {
  children: React.ReactNode
  className?: string
}

const CardTitle: React.FC<CardTitleProps> = ({ children, className }) => {
  return (
    <h3 className={cn('text-lg font-semibold text-gray-900', className)}>
      {children}
    </h3>
  )
}

interface CardContentProps {
  children: React.ReactNode
  className?: string
}

const CardContent: React.FC<CardContentProps> = ({ children, className }) => {
  return (
    <div className={cn('text-gray-600', className)}>
      {children}
    </div>
  )
}

interface CardFooterProps {
  children: React.ReactNode
  className?: string
}

const CardFooter: React.FC<CardFooterProps> = ({ children, className }) => {
  return (
    <div className={cn('mt-4 pt-3 border-t border-gray-100', className)}>
      {children}
    </div>
  )
}

export { Card, CardHeader, CardTitle, CardContent, CardFooter }