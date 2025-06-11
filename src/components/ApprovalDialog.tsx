import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import { IconMap } from '@/components/IconMap'
import { completionService } from '@/services/completionService'
import { useUser } from '@/contexts/UserContext'
import PinDialog from '@/components/PinDialog'
import type { TaskCompletion, Task, User } from '@/models'

interface ApprovalDialogProps {
  completion: TaskCompletion
  task: Task
  assignedUser: User
  onApprove?: (completion: TaskCompletion) => void
  onReject?: (completion: TaskCompletion) => void
  onClose: () => void
  isOpen: boolean
}

const ApprovalDialog: React.FC<ApprovalDialogProps> = ({
  completion,
  task,
  assignedUser,
  onApprove,
  onReject,
  onClose,
  isOpen
}) => {
  const { currentUser, isParentAuthenticated, authenticateParent } = useUser()
  const [isProcessing, setIsProcessing] = useState(false)
  const [notes, setNotes] = useState('')
  const [showPinDialog, setShowPinDialog] = useState(false)
  const [pendingAction, setPendingAction] = useState<'approve' | 'reject' | null>(null)

  if (!isOpen) return null

  const handlePinSuccess = async () => {
    setShowPinDialog(false)
    
    if (pendingAction && currentUser) {
      setIsProcessing(true)
      
      try {
        let updatedCompletion: TaskCompletion | null = null
        
        if (pendingAction === 'approve') {
          updatedCompletion = await completionService.approveCompletion(
            completion.id,
            currentUser.id,
            notes || undefined
          )
          if (updatedCompletion) {
            onApprove?.(updatedCompletion)
          }
        } else if (pendingAction === 'reject') {
          updatedCompletion = await completionService.rejectCompletion(
            completion.id,
            currentUser.id,
            notes || 'Avvist uten spesifikk grunn'
          )
          if (updatedCompletion) {
            onReject?.(updatedCompletion)
          }
        }
        
        onClose()
      } catch (error) {
        console.error(`Failed to ${pendingAction} completion:`, error)
      } finally {
        setIsProcessing(false)
        setPendingAction(null)
      }
    }
  }

  const handleApprove = () => {
    if (!isParentAuthenticated) {
      setPendingAction('approve')
      setShowPinDialog(true)
    } else {
      setPendingAction('approve')
      handlePinSuccess()
    }
  }

  const handleReject = () => {
    if (!isParentAuthenticated) {
      setPendingAction('reject')
      setShowPinDialog(true)
    } else {
      setPendingAction('reject')
      handlePinSuccess()
    }
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('no-NO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <>
      {/* Background overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Godkjenn oppgave
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 text-xl"
                disabled={isProcessing}
              >
                ×
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Task info */}
            <div className="mb-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  {assignedUser.avatar ? (
                    <span className="text-lg">{assignedUser.avatar}</span>
                  ) : (
                    <IconMap type="user" size={20} className="text-gray-600" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900 mb-1">
                    {task.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    Utført av {assignedUser.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    Fullført: {formatDate(completion.completedAt)}
                  </p>
                </div>
              </div>
              
              {task.description && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700">{task.description}</p>
                </div>
              )}
            </div>

            {/* Reward info */}
            <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-medium text-green-900 mb-2">Belønning</h4>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-green-700 flex items-center space-x-1">
                    <IconMap type="target" size={14} />
                    <span>Poeng:</span>
                  </span>
                  <span className="font-medium text-green-900">{completion.pointsAwarded}</span>
                </div>
                {completion.allowanceAwarded && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-green-700 flex items-center space-x-1">
                      <IconMap type="money" size={14} />
                      <span>Lommepenger:</span>
                    </span>
                    <span className="font-medium text-green-900">{completion.allowanceAwarded} kr</span>
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            <div className="mb-6">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                Kommentar (valgfritt)
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Legg til en kommentar..."
                disabled={isProcessing}
              />
            </div>

            {/* Action buttons */}
            <div className="flex space-x-3">
              <button
                onClick={handleApprove}
                disabled={isProcessing}
                className={cn(
                  'flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors',
                  isProcessing && 'opacity-50 cursor-not-allowed'
                )}
              >
                {isProcessing && pendingAction === 'approve' ? (
                  <span className="flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Godkjenner...
                  </span>
                ) : (
                  <span className="flex items-center justify-center space-x-2">
                    <IconMap type="complete" size={16} />
                    <span>Godkjenn</span>
                  </span>
                )}
              </button>
              
              <button
                onClick={handleReject}
                disabled={isProcessing}
                className={cn(
                  'flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-lg transition-colors',
                  isProcessing && 'opacity-50 cursor-not-allowed'
                )}
              >
                {isProcessing && pendingAction === 'reject' ? (
                  <span className="flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Avviser...
                  </span>
                ) : (
                  <span className="flex items-center justify-center space-x-2">
                    <IconMap type="rejected" size={16} />
                    <span>Avvis</span>
                  </span>
                )}
              </button>
            </div>

            <button
              onClick={onClose}
              disabled={isProcessing}
              className="w-full mt-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Avbryt
            </button>
          </div>
        </div>
      </div>

      {/* PIN Dialog */}
      <PinDialog
        isOpen={showPinDialog}
        userName={currentUser?.name || 'Forelder'}
        onSuccess={handlePinSuccess}
        onCancel={() => {
          setShowPinDialog(false)
          setPendingAction(null)
        }}
      />
    </>
  )
}

export default ApprovalDialog