'use client'

import {
  Box,
  Typography,
  Card,
  CardContent,
  Alert,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material'
import {
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Warning as WarningIcon
} from '@mui/icons-material'
import { ProcessedTemplate } from '@/lib/hooks/use-templates'
import { WhatsAppNumber } from '@/lib/hooks/use-whatsapp-numbers'
import type { BulkMessageFormData, CsvValidationResult } from '@/lib/types/bulk-campaigns'

interface BulkMessagePreviewStepProps {
  formData: BulkMessageFormData
  csvValidation?: CsvValidationResult
  selectedTemplate?: ProcessedTemplate
  selectedBusinessNumber?: WhatsAppNumber
}

export function BulkMessagePreviewStep({
  formData,
  csvValidation,
  selectedTemplate,
  selectedBusinessNumber
}: BulkMessagePreviewStepProps) {
  if (!csvValidation || !selectedTemplate || !selectedBusinessNumber) {
    return (
      <Alert severity="warning">
        Missing required data. Please complete the previous steps.
      </Alert>
    )
  }

  const { isValid, validRows, invalidRows, rowCount } = csvValidation

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Preview & Validate
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Review your campaign data and fix any validation errors before proceeding.
      </Typography>

      {/* Validation Summary */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            {isValid ? (
              <CheckIcon color="success" />
            ) : (
              <ErrorIcon color="error" />
            )}
            <Typography variant="h6">
              Validation {isValid ? 'Passed' : 'Failed'}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Chip 
              label={`${rowCount} Total Rows`} 
              variant="outlined" 
            />
            <Chip 
              label={`${validRows.length} Valid`} 
              color="success" 
              variant={validRows.length > 0 ? 'filled' : 'outlined'}
            />
            <Chip 
              label={`${invalidRows.length} Invalid`} 
              color="error" 
              variant={invalidRows.length > 0 ? 'filled' : 'outlined'}
            />
          </Box>

          {validRows.length > 5000 && (
            <Alert severity="error" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Too many recipients!</strong> The maximum limit is 5,000 recipients per campaign. 
                You have {validRows.length} valid recipients. Please reduce the number of recipients.
              </Typography>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Campaign Summary */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            Campaign Summary
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography variant="body2">
              <strong>Business Number:</strong> {selectedBusinessNumber.friendly_name || selectedBusinessNumber.display_number} ({selectedBusinessNumber.display_number})
            </Typography>
            <Typography variant="body2">
              <strong>Template:</strong> {selectedTemplate.name} ({selectedTemplate.language})
            </Typography>
            <Typography variant="body2">
              <strong>Category:</strong> {selectedTemplate.category}
            </Typography>
            {formData.campaignName && (
              <Typography variant="body2">
                <strong>Campaign Name:</strong> {formData.campaignName}
              </Typography>
            )}
            <Typography variant="body2">
              <strong>Recipients:</strong> {validRows.length} valid recipients
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Invalid Rows */}
      {invalidRows.length > 0 && (
        <Accordion sx={{ mb: 3 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ErrorIcon color="error" />
              <Typography variant="subtitle1">
                Validation Errors ({invalidRows.length} rows)
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Alert severity="error" sx={{ mb: 2 }}>
              The following rows have validation errors and will be excluded from the campaign:
            </Alert>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Row</TableCell>
                    <TableCell>Mobile</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Errors</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invalidRows.slice(0, 10).map((invalidRow) => (
                    <TableRow key={invalidRow.row}>
                      <TableCell>{invalidRow.row}</TableCell>
                      <TableCell>{invalidRow.data.mobile || '-'}</TableCell>
                      <TableCell>{invalidRow.data.name || '-'}</TableCell>
                      <TableCell>
                        <List dense>
                          {invalidRow.errors.map((error, index) => (
                            <ListItem key={index} sx={{ py: 0 }}>
                              <ListItemText 
                                primary={error} 
                                primaryTypographyProps={{ variant: 'caption', color: 'error' }}
                              />
                            </ListItem>
                          ))}
                        </List>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            {invalidRows.length > 10 && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Showing first 10 invalid rows. Total: {invalidRows.length}
              </Typography>
            )}
          </AccordionDetails>
        </Accordion>
      )}

      {/* Valid Rows Preview */}
      {validRows.length > 0 && (
        <Accordion defaultExpanded={invalidRows.length === 0}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckIcon color="success" />
              <Typography variant="subtitle1">
                Valid Recipients ({validRows.length} rows)
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Alert severity="success" sx={{ mb: 2 }}>
              These recipients will be included in your bulk messaging campaign:
            </Alert>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Mobile</TableCell>
                    <TableCell>Name</TableCell>
                    {selectedTemplate.variables.filter(v => v !== 'MEDIA_URL').map(variable => (
                      <TableCell key={variable}>
                        {variable.replace(/[{}]/g, '')}
                      </TableCell>
                    ))}
                    {selectedTemplate.variables.includes('MEDIA_URL') && (
                      <TableCell>Header Image</TableCell>
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {validRows.slice(0, 5).map((row, index) => (
                    <TableRow key={index}>
                      <TableCell>{row.mobile}</TableCell>
                      <TableCell>{row.name || '-'}</TableCell>
                      {selectedTemplate.variables.filter(v => v !== 'MEDIA_URL').map(variable => {
                        const varName = variable.replace(/[{}]/g, '')
                        return (
                          <TableCell key={variable}>
                            {row[varName] || '-'}
                          </TableCell>
                        )
                      })}
                      {selectedTemplate.variables.includes('MEDIA_URL') && (
                        <TableCell>
                          {row.header_image_url || row.image_url || row.media_url ? (
                            <Chip label="✓ URL" size="small" color="success" />
                          ) : (
                            '-'
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            {validRows.length > 5 && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Showing first 5 valid rows. Total: {validRows.length}
              </Typography>
            )}
          </AccordionDetails>
        </Accordion>
      )}

      {/* Final Validation Message */}
      {!isValid && (
        <Alert severity="error" sx={{ mt: 3 }}>
          <Typography variant="body2">
            Please fix the validation errors above before proceeding to the next step.
          </Typography>
        </Alert>
      )}

      {isValid && validRows.length > 5000 && (
        <Alert severity="error" sx={{ mt: 3 }}>
          <Typography variant="body2">
            Please reduce the number of recipients to 5,000 or fewer before proceeding.
          </Typography>
        </Alert>
      )}

      {isValid && validRows.length <= 5000 && validRows.length > 0 && (
        <Alert severity="success" sx={{ mt: 3 }}>
          <Typography variant="body2">
            ✅ All validation checks passed! You can proceed to the final confirmation step.
          </Typography>
        </Alert>
      )}
    </Box>
  )
} 