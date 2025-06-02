'use client'

import React from 'react'
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Stack,
  Typography
} from '@mui/material'
import {
  FilterList as FilterIcon,
  Clear as ClearIcon
} from '@mui/icons-material'
import type { ConversationStatus } from '@/lib/types/chat'

export interface ConversationFilters {
  status?: ConversationStatus[]
  assignedAgent?: string[]
  businessNumber?: string[]
  dateRange?: {
    from: Date | null
    to: Date | null
  }
}

interface ConversationFiltersProps {
  filters: ConversationFilters
  onFiltersChange: (filters: ConversationFilters) => void
  userRole?: 'admin' | 'team_leader' | 'agent'
  availableAgents?: Array<{ id: string; name: string | null; email: string }>
  availableBusinessNumbers?: Array<{ id: string; friendly_name: string; phone_number: string }>
  className?: string
}

const STATUS_OPTIONS: Array<{ value: ConversationStatus; label: string; color: 'success' | 'default' }> = [
  { value: 'open', label: 'Open', color: 'success' },
  { value: 'closed', label: 'Closed', color: 'default' }
]

export function ConversationFilters({
  filters,
  onFiltersChange,
  userRole = 'agent',
  availableAgents = [],
  availableBusinessNumbers = [],
  className
}: ConversationFiltersProps) {
  const handleStatusChange = (statuses: ConversationStatus[]) => {
    onFiltersChange({
      ...filters,
      status: statuses.length > 0 ? statuses : undefined
    })
  }

  const handleAssignedAgentChange = (agentIds: string[]) => {
    onFiltersChange({
      ...filters,
      assignedAgent: agentIds.length > 0 ? agentIds : undefined
    })
  }

  const handleBusinessNumberChange = (numberIds: string[]) => {
    onFiltersChange({
      ...filters,
      businessNumber: numberIds.length > 0 ? numberIds : undefined
    })
  }

  const clearAllFilters = () => {
    onFiltersChange({})
  }

  const hasActiveFilters = !!(
    filters.status?.length ||
    filters.assignedAgent?.length ||
    filters.businessNumber?.length ||
    filters.dateRange
  )

  return (
    <Box className={className}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FilterIcon fontSize="small" />
          <Typography variant="subtitle2">Filters</Typography>
        </Box>
        {hasActiveFilters && (
          <Chip
            icon={<ClearIcon />}
            label="Clear All"
            size="small"
            variant="outlined"
            onClick={clearAllFilters}
            clickable
          />
        )}
      </Box>

      <Stack spacing={2}>
        {/* Status Filter - Available for all user roles */}
        <FormControl size="small" fullWidth>
          <InputLabel>Status</InputLabel>
          <Select
            multiple
            value={filters.status || []}
            onChange={(e) => handleStatusChange(e.target.value as ConversationStatus[])}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map((status) => {
                  const option = STATUS_OPTIONS.find(opt => opt.value === status)
                  return (
                    <Chip
                      key={status}
                      label={option?.label || status}
                      size="small"
                      color={option?.color}
                      variant="outlined"
                    />
                  )
                })}
              </Box>
            )}
          >
            {STATUS_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                <Chip
                  label={option.label}
                  size="small"
                  color={option.color}
                  variant="outlined"
                />
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Assigned Agent Filter - Only for Team Leaders and Admins */}
        {(userRole === 'team_leader' || userRole === 'admin') && availableAgents.length > 0 && (
          <FormControl size="small" fullWidth>
            <InputLabel>
              {userRole === 'team_leader' ? 'Team Members' : 'Assigned Agent'}
            </InputLabel>
            <Select
              multiple
              value={filters.assignedAgent || []}
              onChange={(e) => handleAssignedAgentChange(e.target.value as string[])}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((agentId) => {
                    const agent = availableAgents.find(a => a.id === agentId)
                    return (
                      <Chip
                        key={agentId}
                        label={agent?.name || agent?.email || agentId}
                        size="small"
                        variant="outlined"
                      />
                    )
                  })}
                </Box>
              )}
            >
              {availableAgents.map((agent) => (
                <MenuItem key={agent.id} value={agent.id}>
                  {agent.name || agent.email}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {/* Business Number Filter - Available for Admins */}
        {userRole === 'admin' && availableBusinessNumbers.length > 0 && (
          <FormControl size="small" fullWidth>
            <InputLabel>Business Number</InputLabel>
            <Select
              multiple
              value={filters.businessNumber || []}
              onChange={(e) => handleBusinessNumberChange(e.target.value as string[])}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((numberId) => {
                    const number = availableBusinessNumbers.find(n => n.id === numberId)
                    return (
                      <Chip
                        key={numberId}
                        label={number?.friendly_name || number?.phone_number || numberId}
                        size="small"
                        variant="outlined"
                      />
                    )
                  })}
                </Box>
              )}
            >
              {availableBusinessNumbers.map((number) => (
                <MenuItem key={number.id} value={number.id}>
                  {number.friendly_name || number.phone_number}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </Stack>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Active filters: {[
              filters.status?.length && `${filters.status.length} status`,
              filters.assignedAgent?.length && `${filters.assignedAgent.length} agent`,
              filters.businessNumber?.length && `${filters.businessNumber.length} number`
            ].filter(Boolean).join(', ')}
          </Typography>
        </Box>
      )}
    </Box>
  )
} 