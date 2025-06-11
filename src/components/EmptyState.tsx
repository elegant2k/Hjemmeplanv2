import React from 'react'
import { cn } from '@/lib/utils'
import IconMap from '@/components/IconMap'

interface EmptyStateProps {
  type: 'family' | 'tasks' | 'completions' | 'onboarding'
  title?: string
  description?: string
  icon?: string
  action?: {
    label: string
    onClick: () => void
    variant?: 'primary' | 'secondary'
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
  className?: string
}

const EmptyState: React.FC<EmptyStateProps> = ({
  type,
  title,
  description,
  icon,
  action,
  secondaryAction,
  className
}) => {
  const getDefaultContent = () => {
    switch (type) {
      case 'family':
        return {
          icon: 'family',
          title: 'Ingen familiemedlemmer ennå',
          description: 'Legg til familiemedlemmer for å komme i gang med oppgaver og belønninger.',
          actionLabel: 'Legg til familiemedlem'
        }
      case 'tasks':
        return {
          icon: 'tasks',
          title: 'Ingen oppgaver ennå',
          description: 'Opprett din første oppgave for å komme i gang med familiens oppgaveliste.',
          actionLabel: 'Opprett oppgave'
        }
      case 'completions':
        return {
          icon: 'target',
          title: 'Ingen fullførte oppgaver',
          description: 'Når familiemedlemmer fullfører oppgaver, vil de vises her.',
          actionLabel: 'Se alle oppgaver'
        }
      case 'onboarding':
        return {
          icon: 'rocket',
          title: 'Velkommen til Familie Todo!',
          description: 'La oss sette opp din familie og komme i gang med oppgaver og belønninger.',
          actionLabel: 'Kom i gang'
        }
      default:
        return {
          icon: 'info',
          title: 'Ingen data',
          description: 'Det er ingen informasjon å vise akkurat nå.',
          actionLabel: 'Last inn på nytt'
        }
    }
  }

  const defaultContent = getDefaultContent()
  const displayTitle = title || defaultContent.title
  const displayDescription = description || defaultContent.description
  const displayIcon = icon || defaultContent.icon

  return (
    <div className={cn('text-center py-12', className)}>
      {/* Icon */}
      <div className="w-20 h-20 mx-auto mb-4 text-6xl flex items-center justify-center">
        <IconMap type={displayIcon as any} size={80} className="text-gray-400" />
      </div>

      {/* Content */}
      <div className="max-w-md mx-auto">
        <h3 className="text-xl font-semibold text-gray-900 mb-3">
          {displayTitle}
        </h3>
        <p className="text-gray-600 mb-6 leading-relaxed">
          {displayDescription}
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {action && (
            <button
              onClick={action.onClick}
              className={cn(
                'px-6 py-3 rounded-lg font-medium transition-all duration-200',
                action.variant === 'secondary'
                  ? 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg'
              )}
            >
              {action.label}
            </button>
          )}
          
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className="px-6 py-3 rounded-lg font-medium text-gray-600 hover:text-gray-800 transition-colors"
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      </div>

      {/* Onboarding specific content */}
      {type === 'onboarding' && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-sm font-medium text-blue-900 mb-3">Kom i gang på 3 enkle steg:</h3>
          <ol className="text-sm text-blue-800 space-y-2 text-left">
            <li className="flex items-center space-x-2">
              <IconMap type="family" size={16} />
              <span>Legg til familiemedlemmer</span>
            </li>
            <li className="flex items-center space-x-2">
              <IconMap type="tasks" size={16} />
              <span>Opprett oppgaver med poeng</span>
            </li>
            <li className="flex items-center space-x-2">
              <IconMap type="gift" size={16} />
              <span>Sett opp belønninger</span>
            </li>
          </ol>
        </div>
      )}

      {/* Help text for families with tasks but no completions */}
      {type === 'completions' && (
        <div className="mt-6 max-w-sm mx-auto">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-xs text-gray-600">
              💡 Tips: Barn kan merke oppgaver som fullført, og foreldre kan godkjenne dem for å tildele poeng.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default EmptyState