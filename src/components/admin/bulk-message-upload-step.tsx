'use client'

import { useState, useRef } from 'react'
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Alert,
  IconButton,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material'
import {
  CloudUpload as UploadIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Description as FileIcon
} from '@mui/icons-material'
import { ProcessedTemplate } from '@/lib/hooks/use-templates'
import { parseCsvText, generateSampleCsv } from '@/lib/hooks/use-bulk-campaigns'
import type { BulkMessageFormData, CsvRecipient } from '@/lib/types/bulk-campaigns'

interface BulkMessageUploadStepProps {
  formData: BulkMessageFormData
  onUpdate: (updates: Partial<BulkMessageFormData>) => void
  onCsvDataUpdate: (csvData: CsvRecipient[]) => void
  selectedTemplate?: ProcessedTemplate
}

export function BulkMessageUploadStep({
  formData,
  onUpdate,
  onCsvDataUpdate,
  selectedTemplate
}: BulkMessageUploadStepProps) {
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      alert('Please select a CSV file')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const csvText = e.target?.result as string
      const csvData = parseCsvText(csvText)
      
      onUpdate({ csvFile: file })
      onCsvDataUpdate(csvData)
    }
    reader.readAsText(file)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    
    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = () => {
    setDragOver(false)
  }

  const handleDownloadSample = () => {
    if (!selectedTemplate) return

    const sampleCsv = generateSampleCsv(selectedTemplate.variables)
    const blob = new Blob([sampleCsv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.href = url
    a.download = `sample_${selectedTemplate.name.toLowerCase().replace(/\s+/g, '_')}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleRemoveFile = () => {
    onUpdate({ csvFile: undefined })
    onCsvDataUpdate([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const hasMediaHeader = selectedTemplate?.variables.includes('MEDIA_URL')

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Upload Recipients
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Upload a CSV file containing recipient phone numbers and template variable values.
      </Typography>

      {/* Template Requirements */}
      {selectedTemplate && (
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle2" gutterBottom>
              CSV Requirements for &quot;{selectedTemplate.name}&quot;
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Required Columns:</strong>
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                <Chip label="mobile" size="small" color="primary" />
                <Chip label="name (optional)" size="small" variant="outlined" />
                {selectedTemplate.variables.filter(v => v !== 'MEDIA_URL').map(variable => (
                  <Chip 
                    key={variable} 
                    label={variable.replace(/[{}]/g, '')} 
                    size="small" 
                    color="secondary" 
                  />
                ))}
                {hasMediaHeader && (
                  <Chip label="header_image_url" size="small" color="warning" />
                )}
              </Box>
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  • Mobile numbers must be in E.164 format (e.g., +1234567890)<br/>
                  • All template variables are required<br/>
                  {hasMediaHeader && '• Header image URLs must be valid and accessible\n'}
                  • Maximum 5,000 recipients per campaign
                </Typography>
              </Alert>
            </Box>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleDownloadSample}
              size="small"
            >
              Download Sample CSV
            </Button>
          </CardContent>
        </Card>
      )}

      {/* File Upload Area */}
      <Card
        variant="outlined"
        sx={{
          mb: 3,
          border: dragOver ? '2px dashed' : '1px solid',
          borderColor: dragOver ? 'primary.main' : 'divider',
          bgcolor: dragOver ? 'action.hover' : 'background.paper',
          cursor: 'pointer'
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <UploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            {formData.csvFile ? 'File Selected' : 'Upload CSV File'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {formData.csvFile 
              ? `${formData.csvFile.name} (${(formData.csvFile.size / 1024).toFixed(1)} KB)`
              : 'Drag and drop your CSV file here, or click to browse'
            }
          </Typography>
          {!formData.csvFile && (
            <Button variant="contained" startIcon={<UploadIcon />}>
              Choose File
            </Button>
          )}
        </CardContent>
      </Card>

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileInputChange}
        style={{ display: 'none' }}
      />

      {/* File Info */}
      {formData.csvFile && formData.csvData && (
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FileIcon color="primary" />
                <Typography variant="subtitle2">
                  {formData.csvFile.name}
                </Typography>
                <Chip 
                  label={`${formData.csvData.length} rows`} 
                  size="small" 
                  color="primary" 
                />
              </Box>
              <IconButton onClick={handleRemoveFile} color="error" size="small">
                <DeleteIcon />
              </IconButton>
            </Box>

            {/* Preview first few rows */}
            {formData.csvData.length > 0 && (
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Preview (first 3 rows):
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        {Object.keys(formData.csvData[0]).map(header => (
                          <TableCell key={header}>{header}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {formData.csvData.slice(0, 3).map((row, index) => (
                        <TableRow key={index}>
                          {Object.values(row).map((value, cellIndex) => (
                            <TableCell key={cellIndex}>
                              {value || '-'}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* Validation Messages */}
      {!selectedTemplate && (
        <Alert severity="warning">
          Please select a template in the previous step before uploading recipients.
        </Alert>
      )}
    </Box>
  )
} 