import React from 'react'
import { cn } from '@/lib/utils'
import { IconMap } from '@/components/IconMap'

export type TimeRange = 'today' | 'week' | 'month' | 'all'

interface TimeRangeFilterProps {
  selectedRange: TimeRange
  onRangeChange: (range: TimeRange) => void
  className?: string
}

const TimeRangeFilter: React.FC<TimeRangeFilterProps> = ({
  selectedRange,
  onRangeChange,
  className
}) => {
  const ranges: { value: TimeRange; label: string; iconType: string }[] = [
    { value: 'today', label: 'I dag', iconType: 'calendar' },
    { value: 'week', label: 'Denne uken', iconType: 'calendar' },
    { value: 'month', label: 'Denne måneden', iconType: 'calendar' },
    { value: 'all', label: 'Alt', iconType: 'chart' }
  ]

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {ranges.map((range) => (
        <button
          key={range.value}
          onClick={() => onRangeChange(range.value)}
          className={cn(
            'flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
            selectedRange === range.value
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300'
          )}
        >
          <IconMap 
            type={range.iconType as any} 
            size={16} 
            className={selectedRange === range.value ? 'text-white' : 'text-gray-500'}
          />
          <span>{range.label}</span>
        </button>
      ))}
    </div>
  )
}

export default TimeRangeFilter