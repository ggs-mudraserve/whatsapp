'use client'

import React from 'react'
import { 
  Box, 
  Typography, 
  Paper, 
  Chip, 
  IconButton,
  Tooltip,
  useTheme,
  alpha
} from '@mui/material'
import {
  CheckCircle,
  Schedule,
  Error,
  Download,
  Image,
  Description,
  SmartToy,
  Settings,
  Person,
  Support
} from '@mui/icons-material'
import { format, isToday, isYesterday } from 'date-fns'
import type { MessageWithDetails } from '@/lib/types/chat'

interface MessageItemProps {
  message: MessageWithDetails
  showTimestamp?: boolean
  isFirstInGroup?: boolean
  isLastInGroup?: boolean
}

export function MessageItem({ 
  message, 
  showTimestamp = false,
  isFirstInGroup = false,
  isLastInGroup = false 
}: MessageItemProps) {
  const theme = useTheme()

  // Determine message styling based on sender type
  const getMessageStyling = () => {
    switch (message.sender_type) {
      case 'customer':
        return {
          backgroundColor: theme.palette.grey[100],
          color: theme.palette.text.primary,
          alignSelf: 'flex-start',
          marginLeft: 0,
          marginRight: 'auto',
          maxWidth: '75%',
          borderRadius: isFirstInGroup 
            ? '18px 18px 18px 4px' 
            : isLastInGroup 
              ? '18px 18px 18px 18px'
              : '18px 18px 18px 4px'
        }
      case 'agent':
        return {
          backgroundColor: message.is_own_message 
            ? theme.palette.primary.main 
            : theme.palette.secondary.main,
          color: theme.palette.primary.contrastText,
          alignSelf: 'flex-end',
          marginLeft: 'auto',
          marginRight: 0,
          maxWidth: '75%',
          borderRadius: isFirstInGroup 
            ? '18px 18px 4px 18px' 
            : isLastInGroup 
              ? '18px 18px 18px 18px'
              : '18px 18px 4px 18px'
        }
      case 'chatbot':
        return {
          backgroundColor: alpha(theme.palette.info.main, 0.1),
          color: theme.palette.info.dark,
          border: `1px solid ${alpha(theme.palette.info.main, 0.3)}`,
          alignSelf: 'flex-start',
          marginLeft: 0,
          marginRight: 'auto',
          maxWidth: '75%',
          borderRadius: '18px'
        }
      case 'system':
        return {
          backgroundColor: alpha(theme.palette.warning.main, 0.1),
          color: theme.palette.warning.dark,
          border: `1px solid ${alpha(theme.palette.warning.main, 0.3)}`,
          alignSelf: 'center',
          marginLeft: 'auto',
          marginRight: 'auto',
          maxWidth: '90%',
          borderRadius: '18px'
        }
      default:
        return {
          backgroundColor: theme.palette.grey[100],
          color: theme.palette.text.primary,
          alignSelf: 'flex-start',
          marginLeft: 0,
          marginRight: 'auto',
          maxWidth: '75%',
          borderRadius: '18px'
        }
    }
  }

  // Get sender icon
  const getSenderIcon = () => {
    switch (message.sender_type) {
      case 'customer':
        return <Person fontSize="small" />
      case 'agent':
        return <Support fontSize="small" />
      case 'chatbot':
        return <SmartToy fontSize="small" />
      case 'system':
        return <Settings fontSize="small" />
      default:
        return null
    }
  }

  // Get status icon for outgoing messages
  const getStatusIcon = () => {
    if (message.sender_type !== 'agent' || !message.is_own_message) return null

    switch (message.status) {
      case 'sending':
        return <Schedule sx={{ fontSize: 14, opacity: 0.7 }} />
      case 'sent':
        return <CheckCircle sx={{ fontSize: 14, opacity: 0.7 }} />
      case 'delivered':
        return <CheckCircle sx={{ fontSize: 14, color: theme.palette.success.main }} />
      case 'read':
        return <CheckCircle sx={{ fontSize: 14, color: theme.palette.info.main }} />
      case 'failed':
        return <Error sx={{ fontSize: 14, color: theme.palette.error.main }} />
      default:
        return null
    }
  }

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    if (isToday(date)) {
      return format(date, 'HH:mm')
    } else if (isYesterday(date)) {
      return `Yesterday ${format(date, 'HH:mm')}`
    } else {
      return format(date, 'MMM dd, HH:mm')
    }
  }

  // Render media content
  const renderMediaContent = () => {
    if (message.content_type === 'image') {
      return (
        <Box sx={{ position: 'relative', maxWidth: '100%' }}>
          <img
            src={message.media_url || '#'}
            alt="Shared image"
            style={{
              maxWidth: '100%',
              height: 'auto',
              borderRadius: theme.spacing(1),
              display: 'block'
            }}
          />
          {message.sender_type === 'customer' && message.customer_media_whatsapp_id && (
            <IconButton
              size="small"
              sx={{
                position: 'absolute',
                top: 4,
                right: 4,
                backgroundColor: alpha(theme.palette.common.black, 0.5),
                color: theme.palette.common.white,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.common.black, 0.7),
                }
              }}
            >
              <Download fontSize="small" />
            </IconButton>
          )}
        </Box>
      )
    }

    if (message.content_type === 'document') {
      return (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          p: 1,
          backgroundColor: alpha(theme.palette.common.black, 0.05),
          borderRadius: 1
        }}>
          <Description color="action" />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" noWrap>
              {message.customer_media_filename || 'Document'}
            </Typography>
            {message.customer_media_mime_type && (
              <Typography variant="caption" color="text.secondary">
                {message.customer_media_mime_type}
              </Typography>
            )}
          </Box>
          {message.sender_type === 'customer' && message.customer_media_whatsapp_id && (
            <IconButton size="small">
              <Download fontSize="small" />
            </IconButton>
          )}
        </Box>
      )
    }

    return null
  }

  // Render template content
  const renderTemplateContent = () => {
    if (message.content_type !== 'template') return null

    return (
      <Box sx={{ mb: 1 }}>
        <Chip
          size="small"
          label={`Template: ${message.template_name_used}`}
          variant="outlined"
          sx={{ mb: 1 }}
        />
        {message.template_variables_used && (
          <Typography variant="caption" display="block" color="text.secondary">
            Variables: {JSON.stringify(message.template_variables_used)}
          </Typography>
        )}
      </Box>
    )
  }

  const styling = getMessageStyling()

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: styling.alignSelf === 'center' ? 'center' : 
                   styling.alignSelf === 'flex-end' ? 'flex-end' : 'flex-start',
        mb: isLastInGroup ? 2 : 0.5,
        px: 1
      }}
    >
      {/* Sender label for non-own messages */}
      {(message.sender_type !== 'agent' || !message.is_own_message) && isFirstInGroup && (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 0.5, 
          mb: 0.5,
          alignSelf: styling.alignSelf
        }}>
          {getSenderIcon()}
          <Typography variant="caption" color="text.secondary">
            {message.sender_type === 'customer' ? 'Customer' :
             message.sender_type === 'agent' ? 'Agent' :
             message.sender_type === 'chatbot' ? 'AI Assistant' :
             message.sender_type === 'system' ? 'System' : 
             'Unknown'}
          </Typography>
        </Box>
      )}

      <Paper
        elevation={1}
        sx={{
          ...styling,
          p: message.content_type === 'system_notification' ? 1 : 1.5,
          position: 'relative',
          wordBreak: 'break-word'
        }}
      >
        {/* Template info */}
        {renderTemplateContent()}

        {/* Media content */}
        {renderMediaContent()}

        {/* Text content */}
        {message.text_content && (
          <Typography 
            variant={message.sender_type === 'system' ? 'caption' : 'body2'}
            sx={{ 
              whiteSpace: 'pre-wrap',
              fontStyle: message.sender_type === 'system' ? 'italic' : 'normal'
            }}
          >
            {message.text_content}
          </Typography>
        )}

        {/* Error message */}
        {message.error_message && (
          <Typography variant="caption" color="error" display="block" sx={{ mt: 0.5 }}>
            Error: {message.error_message}
          </Typography>
        )}

        {/* Timestamp and status */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          gap: 1,
          mt: message.text_content || message.error_message ? 0.5 : 0
        }}>
          <Typography 
            variant="caption" 
            color="text.secondary"
            sx={{ opacity: 0.8 }}
          >
            {formatTimestamp(message.timestamp)}
          </Typography>
          
          {getStatusIcon()}
        </Box>
      </Paper>
    </Box>
  )
} 