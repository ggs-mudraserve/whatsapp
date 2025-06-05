'use client'

import { useState, useMemo } from 'react'
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  IconButton,
  Button,
  Box,
  Alert,
  Skeleton,
  Tooltip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Grid,
} from '@mui/material'
import {
  Visibility as PreviewIcon,
  Sync as SyncIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material'
import { format } from 'date-fns'
import {
  useAllTemplates,
  type MessageTemplate,
  getTemplateStatusColor,
  getTemplateCategoryColor,
  getTemplateVariables,
} from '@/lib/hooks/use-templates'
import { TemplatePreviewModal } from './template-preview-modal'
import { SyncTemplatesModal } from './sync-templates-modal'

interface TemplatesTableProps {
  availableWabaIds: string[]
}

export function TemplatesTable({ availableWabaIds }: TemplatesTableProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [showSyncModal, setShowSyncModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [wabaFilter, setWabaFilter] = useState<string>('')
  const [languageFilter, setLanguageFilter] = useState<string>('')

  const { data: templates, isLoading, error, refetch } = useAllTemplates()

  // Filter and search templates
  const filteredTemplates = useMemo(() => {
    if (!templates) return []

    return templates.filter((template) => {
      const matchesSearch = searchTerm === '' || 
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.language.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus = statusFilter === '' || template.status_from_whatsapp === statusFilter
      const matchesCategory = categoryFilter === '' || template.category === categoryFilter
      const matchesWaba = wabaFilter === '' || template.waba_id === wabaFilter
      const matchesLanguage = languageFilter === '' || template.language === languageFilter

      return matchesSearch && matchesStatus && matchesCategory && matchesWaba && matchesLanguage
    })
  }, [templates, searchTerm, statusFilter, categoryFilter, wabaFilter, languageFilter])

  // Get unique values for filters
  const uniqueStatuses = useMemo(() => {
    if (!templates) return []
    return Array.from(new Set(templates.map(t => t.status_from_whatsapp))).sort()
  }, [templates])

  const uniqueCategories = useMemo(() => {
    if (!templates) return []
    return Array.from(new Set(templates.map(t => t.category))).sort()
  }, [templates])

  const uniqueLanguages = useMemo(() => {
    if (!templates) return []
    return Array.from(new Set(templates.map(t => t.language))).sort()
  }, [templates])

  const handlePreviewTemplate = (template: MessageTemplate) => {
    setSelectedTemplate(template)
    setShowPreviewModal(true)
  }

  const clearFilters = () => {
    setSearchTerm('')
    setStatusFilter('')
    setCategoryFilter('')
    setWabaFilter('')
    setLanguageFilter('')
  }

  if (error) {
    return (
      <Alert severity="error">
        <Typography variant="body2">
          Failed to load templates: {error.message}
        </Typography>
      </Alert>
    )
  }

  return (
    <Box>
      {/* Header Actions */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h6" gutterBottom>
            Message Templates
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {filteredTemplates.length} of {templates?.length || 0} templates
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => refetch()}
            disabled={isLoading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<SyncIcon />}
            onClick={() => setShowSyncModal(true)}
            disabled={availableWabaIds.length === 0}
          >
            Sync Templates
          </Button>
        </Stack>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <FilterIcon sx={{ mr: 1 }} />
          <Typography variant="subtitle1">Filters</Typography>
          <Button size="small" onClick={clearFilters} sx={{ ml: 'auto' }}>
            Clear All
          </Button>
        </Box>
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
              }}
            />
          </Grid>
          
          <Grid item xs={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                {uniqueStatuses.map((status) => (
                  <MenuItem key={status} value={status}>
                    {status}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Category</InputLabel>
              <Select
                value={categoryFilter}
                label="Category"
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                {uniqueCategories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Language</InputLabel>
              <Select
                value={languageFilter}
                label="Language"
                onChange={(e) => setLanguageFilter(e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                {uniqueLanguages.map((language) => (
                  <MenuItem key={language} value={language}>
                    {language}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>WABA ID</InputLabel>
              <Select
                value={wabaFilter}
                label="WABA ID"
                onChange={(e) => setWabaFilter(e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                {availableWabaIds.map((wabaId) => (
                  <MenuItem key={wabaId} value={wabaId}>
                    <Typography fontFamily="monospace" fontSize="0.75rem">
                      {wabaId}
                    </Typography>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Templates Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Template Name</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Language</TableCell>
              <TableCell>Variables</TableCell>
              <TableCell>WABA ID</TableCell>
              <TableCell>Last Synced</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              // Loading skeleton
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell><Skeleton width="120px" /></TableCell>
                  <TableCell><Skeleton width="80px" /></TableCell>
                  <TableCell><Skeleton width="80px" /></TableCell>
                  <TableCell><Skeleton width="60px" /></TableCell>
                  <TableCell><Skeleton width="40px" /></TableCell>
                  <TableCell><Skeleton width="100px" /></TableCell>
                  <TableCell><Skeleton width="120px" /></TableCell>
                  <TableCell><Skeleton width="60px" /></TableCell>
                </TableRow>
              ))
            ) : filteredTemplates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    {templates?.length === 0 
                      ? 'No templates found. Try syncing templates from WhatsApp.'
                      : 'No templates match the current filters.'
                    }
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredTemplates.map((template) => {
                const variables = getTemplateVariables(template)
                
                return (
                  <TableRow key={template.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {template.name}
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      <Chip
                        label={template.status_from_whatsapp}
                        color={getTemplateStatusColor(template.status_from_whatsapp)}
                        size="small"
                      />
                    </TableCell>
                    
                    <TableCell>
                      <Chip
                        label={template.category}
                        color={getTemplateCategoryColor(template.category)}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace">
                        {template.language}
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {variables.length > 0 ? variables.length : '—'}
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace" fontSize="0.75rem">
                        {template.waba_id || '—'}
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {template.last_synced_at 
                          ? format(new Date(template.last_synced_at), 'MMM dd, yyyy HH:mm')
                          : '—'
                        }
                      </Typography>
                    </TableCell>
                    
                    <TableCell align="center">
                      <Tooltip title="Preview Template">
                        <IconButton
                          size="small"
                          onClick={() => handlePreviewTemplate(template)}
                        >
                          <PreviewIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Modals */}
      <TemplatePreviewModal
        open={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        template={selectedTemplate}
      />

      <SyncTemplatesModal
        open={showSyncModal}
        onClose={() => setShowSyncModal(false)}
        availableWabaIds={availableWabaIds}
      />
    </Box>
  )
} 