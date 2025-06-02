'use client'

import React from 'react'
import { 
  Box, 
  Typography, 
  Avatar, 
  Paper, 
  Chip,
  IconButton,
  Link
} from '@mui/material'
import { 
  Person as CustomerIcon, 
  SupportAgent as AgentIcon, 
  SmartToy as ChatbotIcon, 
  Settings as SystemIcon,
  Download as DownloadIcon,
  Image as ImageIcon,
  Description as DocumentIcon
} from '@mui/icons-material'
import type { Message, MessageSenderType } from '@/lib/types/chat'
import { useAuthStore } from '@/lib/zustand/auth-store'

interface MessageItemProps {
  message: Message
  isCurrentUser?: boolean
  onMediaDownload?: (message: Message) => void
}

function getSenderIcon(senderType: MessageSenderType) {
  switch (senderType) {
    case 'customer':
      return <CustomerIcon />
    case 'agent':
      return <AgentIcon />
    case 'chatbot':
      return <ChatbotIcon />
    case 'system':
      return <SystemIcon />
    default:
      return <CustomerIcon />
  }
}

function getSenderColor(senderType: MessageSenderType) {
  switch (senderType) {
    case 'customer':
      return 'primary'
    case 'agent':
      return 'success'
    case 'chatbot':
      return 'secondary'
    case 'system':
      return 'warning'
    default:
      return 'default'
  }
}

function getSenderLabel(senderType: MessageSenderType) {
  switch (senderType) {
    case 'customer':
      return 'Customer'
    case 'agent':
      return 'Agent'
    case 'chatbot':
      return 'AI Assistant'
    case 'system':
      return 'System'
    default:
      return 'Unknown'
  }
}

function formatTimestamp(timestamp: string) {
  const date = new Date(timestamp)
  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()
  
  if (isToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } else {
    return date.toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }
}

function MediaContent({ message, onMediaDownload }: { 
  message: Message
  onMediaDownload?: (message: Message) => void 
}) {
  if (!message.media_url) return null

  const mediaType = message.customer_media_mime_type || message.media_type
  const mediaFilename = message.customer_media_filename || message.media_filename
  const isImage = mediaType?.startsWith('image/')
  const isDocument = !isImage
  const isCustomerMedia = message.sender_type === 'customer'

  const handleDownload = () => {
    onMediaDownload?.(message)
  }

  return (
    <Box sx={{ mt: 1 }}>
      {isImage ? (
        <Box
          sx={{
            position: 'relative',
            display: 'inline-block',
            maxWidth: 200,
            cursor: 'pointer',
            '&:hover .download-overlay': {
              opacity: 1
            }
          }}
          onClick={handleDownload}
        >
          <img
            src={message.media_url}
            alt={mediaFilename || 'Image'}
            style={{
              maxWidth: '100%',
              maxHeight: 200,
              borderRadius: 8,
              objectFit: 'cover'
            }}
          />
          <Box
            className="download-overlay"
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: 0,
              transition: 'opacity 0.2s',
              borderRadius: 2
            }}
          >
            <IconButton
              size="small"
              sx={{
                backgroundColor: 'rgba(255,255,255,0.9)',
                color: 'primary.main',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,1)'
                }
              }}
            >
              <DownloadIcon fontSize="small" />
            </IconButton>
          </Box>
          {isCustomerMedia && (
            <Chip
              label="Customer Media"
              size="small"
              color="info"
              variant="filled"
              sx={{
                position: 'absolute',
                top: 4,
                left: 4,
                fontSize: '0.7rem'
              }}
            />
          )}
        </Box>
      ) : (
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            cursor: 'pointer',
            transition: 'all 0.2s',
            '&:hover': {
              backgroundColor: 'action.hover',
              borderColor: 'primary.main'
            }
          }}
          onClick={handleDownload}
        >
          <DocumentIcon color="action" />
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" fontWeight="medium">
              {mediaFilename || 'Document'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {mediaType}
              {isCustomerMedia && ' • Customer Media'}
            </Typography>
          </Box>
          <IconButton size="small" color="primary">
            <DownloadIcon fontSize="small" />
          </IconButton>
        </Paper>
      )}
    </Box>
  )
}

export function MessageItem({ message, isCurrentUser = false, onMediaDownload }: MessageItemProps) {
  const { user } = useAuthStore()
  
  // Determine if this message is from the current user
  const isOwnMessage = message.sender_type === 'agent' && 
    (message.sender_id === user?.id || message.sender_id_override === user?.id)
  
  // Message alignment - own messages on right, others on left
  const alignment = isOwnMessage ? 'flex-end' : 'flex-start'
  
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: alignment,
        mb: 2,
        px: 2
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: isOwnMessage ? 'row-reverse' : 'row',
          alignItems: 'flex-start',
          gap: 1,
          maxWidth: '80%'
        }}
      >
        {/* Avatar */}
        <Avatar
          sx={{
            width: 32,
            height: 32,
            bgcolor: `${getSenderColor(message.sender_type)}.main`,
            mt: 0.5
          }}
        >
          {getSenderIcon(message.sender_type)}
        </Avatar>

        {/* Message Content */}
        <Box sx={{ flex: 1 }}>
          {/* Sender info and timestamp */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              mb: 0.5,
              flexDirection: isOwnMessage ? 'row-reverse' : 'row'
            }}
          >
            <Chip
              label={getSenderLabel(message.sender_type)}
              size="small"
              color={getSenderColor(message.sender_type)}
              variant="outlined"
            />
            <Typography variant="caption" color="text.secondary">
              {formatTimestamp(message.timestamp)}
            </Typography>
            {message.is_read && isOwnMessage && (
              <Typography variant="caption" color="text.secondary">
                ✓ Read
              </Typography>
            )}
          </Box>

          {/* Message bubble */}
          <Paper
            elevation={1}
            sx={{
              p: 2,
              backgroundColor: isOwnMessage 
                ? 'primary.light' 
                : message.sender_type === 'system' 
                  ? 'warning.light'
                  : message.sender_type === 'chatbot'
                    ? 'secondary.light'
                    : 'background.paper',
              color: isOwnMessage ? 'primary.contrastText' : 'text.primary',
              borderRadius: 2,
              maxWidth: '100%'
            }}
          >
            {/* Text content */}
            <Typography 
              variant="body2" 
              sx={{ 
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}
            >
              {message.text_content || message.content}
            </Typography>

            {/* Media content */}
            <MediaContent message={message} onMediaDownload={onMediaDownload} />

            {/* System message styling */}
            {message.sender_type === 'system' && (
              <Typography 
                variant="caption" 
                sx={{ 
                  display: 'block', 
                  mt: 1, 
                  fontStyle: 'italic',
                  opacity: 0.8
                }}
              >
                Automated message
              </Typography>
            )}
          </Paper>
        </Box>
      </Box>
    </Box>
  )
} 