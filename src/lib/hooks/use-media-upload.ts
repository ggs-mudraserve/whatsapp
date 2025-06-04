'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/lib/zustand/auth-store'
import { chatQueryKeys } from './use-chat-queries'

interface UploadMediaResponse {
  success: boolean
  media_url: string
  path: string
  mime: string
  size: number
}

interface UploadAndSendMediaParams {
  file: File
  conversationId: string
}

export function useUploadAndSendMedia() {
  const queryClient = useQueryClient()
  const { session } = useAuthStore()

  return useMutation({
    mutationFn: async ({ file, conversationId }: UploadAndSendMediaParams) => {
      if (!session?.access_token) {
        throw new Error('Authentication required')
      }

      console.log('📎 Starting media upload for conversation:', conversationId)

      // Step 1: Upload the media file
      const formData = new FormData()
      formData.append('file', file)

      const uploadResponse = await fetch('/api/upload-chat-media', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formData,
      })

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text()
        console.error('❌ Media upload failed:', errorText)
        throw new Error(`Upload failed: ${errorText}`)
      }

      const uploadResult: UploadMediaResponse = await uploadResponse.json()
      console.log('✅ Media uploaded successfully:', uploadResult)

      // Step 2: Send the message with the media URL
      const messageType = file.type.startsWith('image/') ? 'image' : 'document'
      
      const messagePayload = {
        conversation_id: conversationId,
        type: messageType as 'image' | 'document',
        media_url: uploadResult.media_url,
      }

      console.log('📤 Sending media message:', messagePayload)

      const sendResponse = await fetch('/api/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(messagePayload),
      })

      if (!sendResponse.ok) {
        const errorText = await sendResponse.text()
        console.error('❌ Media message send failed:', errorText)
        throw new Error(`Failed to send media message: ${errorText}`)
      }

      const sendResult = await sendResponse.json()
      console.log('✅ Media message sent successfully:', sendResult)

      return {
        upload: uploadResult,
        message: sendResult,
        file: {
          name: file.name,
          size: file.size,
          type: file.type,
        },
      }
    },
    onSuccess: (data, variables) => {
      console.log('✅ Media upload and send completed:', data)
      
      // Invalidate messages query for this conversation
      queryClient.invalidateQueries({ 
        queryKey: chatQueryKeys.messages(variables.conversationId)
      })
      
      // Invalidate conversations list to update last_message_at
      queryClient.invalidateQueries({ 
        queryKey: chatQueryKeys.conversations()
      })
    },
    onError: (error) => {
      console.error('❌ Media upload and send failed:', error)
    },
  })
}

export function useUploadMedia() {
  const { session } = useAuthStore()

  return useMutation({
    mutationFn: async (file: File) => {
      if (!session?.access_token) {
        throw new Error('Authentication required')
      }

      console.log('📎 Uploading media file:', file.name)

      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload-chat-media', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formData,
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Media upload failed:', errorText)
        throw new Error(`Upload failed: ${errorText}`)
      }

      const result: UploadMediaResponse = await response.json()
      console.log('✅ Media uploaded successfully:', result)
      return result
    },
    onError: (error) => {
      console.error('❌ Media upload failed:', error)
    },
  })
} 