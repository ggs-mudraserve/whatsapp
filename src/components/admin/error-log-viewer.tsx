'use client';

import { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Typography,
  TablePagination,
  Grid,
  Card,
  CardContent,
  InputAdornment,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Alert,
  Stack
} from '@mui/material';
import {
  Search as SearchIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Visibility as VisibilityIcon,
  Close as CloseIcon,
  Check as CheckIcon,
  Undo as UndoIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useErrorLogs, useUpdateErrorLogStatus, ErrorLog } from '@/lib/hooks/use-error-logs';
import { format } from 'date-fns';

interface FilterState {
  resolvedStatus: boolean | 'all';
  errorSource: string | 'all';
  errorCode: string | 'all';
  dateFrom: Date | null;
  dateTo: Date | null;
  userId: string;
}

interface ErrorLogDetailsModalProps {
  errorLog: ErrorLog | null;
  open: boolean;
  onClose: () => void;
  onStatusUpdate: (id: string, resolved: boolean) => void;
}

function ErrorLogDetailsModal({ errorLog, open, onClose, onStatusUpdate }: ErrorLogDetailsModalProps) {
  if (!errorLog) return null;

  const handleStatusToggle = () => {
    onStatusUpdate(errorLog.id, !errorLog.resolved_status);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box className="flex justify-between items-center">
          <Typography variant="h6">Error Log Details</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Timestamp
            </Typography>
            <Typography variant="body2" className="mb-4">
              {format(new Date(errorLog.timestamp), 'MMM dd, yyyy HH:mm:ss')}
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Status
            </Typography>
            <Chip
              label={errorLog.resolved_status ? 'Resolved' : 'Unresolved'}
              color={errorLog.resolved_status ? 'success' : 'error'}
              size="small"
              icon={errorLog.resolved_status ? <CheckCircleIcon /> : <ErrorIcon />}
              className="mb-4"
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Error Source
            </Typography>
            <Typography variant="body2" className="mb-4">
              {errorLog.error_source}
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Error Code
            </Typography>
            <Typography variant="body2" className="mb-4">
              {errorLog.error_code || 'N/A'}
            </Typography>
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Error Message
            </Typography>
            <Alert severity="error" className="mb-4">
              {errorLog.error_message}
            </Alert>
          </Grid>
          
          {errorLog.user_id && (
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                User ID
              </Typography>
              <Typography variant="body2" className="mb-4">
                {errorLog.user_id}
              </Typography>
            </Grid>
          )}
          
          {errorLog.details && (
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Details
              </Typography>
              <Paper variant="outlined" className="p-3">
                <pre className="text-sm whitespace-pre-wrap overflow-auto max-h-64">
                  {JSON.stringify(errorLog.details, null, 2)}
                </pre>
              </Paper>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      
      <DialogActions>
        <Button
          onClick={handleStatusToggle}
          startIcon={errorLog.resolved_status ? <UndoIcon /> : <CheckIcon />}
          color={errorLog.resolved_status ? 'warning' : 'success'}
          variant="contained"
        >
          Mark as {errorLog.resolved_status ? 'Unresolved' : 'Resolved'}
        </Button>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

export function ErrorLogViewer() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [selectedErrorLog, setSelectedErrorLog] = useState<ErrorLog | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    resolvedStatus: 'all',
    errorSource: 'all',
    errorCode: 'all',
    dateFrom: null,
    dateTo: null,
    userId: ''
  });

  const { data: errorLogs = [], isLoading, error, refetch } = useErrorLogs();
  const updateStatusMutation = useUpdateErrorLogStatus();

  const uniqueErrorSources = useMemo(() => {
    const sourcesSet = new Set(errorLogs.map(log => log.error_source));
    const sources = Array.from(sourcesSet);
    return sources.sort();
  }, [errorLogs]);

  const uniqueErrorCodes = useMemo(() => {
    const codesSet = new Set(errorLogs.map(log => log.error_code).filter(Boolean));
    const codes = Array.from(codesSet);
    return codes.sort();
  }, [errorLogs]);

  const filteredErrorLogs = useMemo(() => {
    if (!errorLogs) return [];

    return errorLogs.filter(log => {
      // Resolved status filter
      if (filters.resolvedStatus !== 'all' && log.resolved_status !== filters.resolvedStatus) return false;
      
      // Error source filter
      if (filters.errorSource !== 'all' && log.error_source !== filters.errorSource) return false;
      
      // Error code filter
      if (filters.errorCode !== 'all' && log.error_code !== filters.errorCode) return false;
      
      // Date range filter
      if (filters.dateFrom && new Date(log.timestamp) < filters.dateFrom) return false;
      if (filters.dateTo && new Date(log.timestamp) > filters.dateTo) return false;
      
      // User ID filter
      if (filters.userId && !log.user_id?.toLowerCase().includes(filters.userId.toLowerCase())) return false;
      
      return true;
    });
  }, [errorLogs, filters]);

  const paginatedErrorLogs = useMemo(() => {
    const startIndex = page * rowsPerPage;
    return filteredErrorLogs.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredErrorLogs, page, rowsPerPage]);

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(0); // Reset to first page when filtering
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewDetails = (errorLog: ErrorLog) => {
    setSelectedErrorLog(errorLog);
    setDetailsModalOpen(true);
  };

  const handleStatusUpdate = async (id: string, resolved: boolean) => {
    try {
      await updateStatusMutation.mutateAsync({ id, resolved });
      refetch();
      setDetailsModalOpen(false);
    } catch (error) {
      console.error('Failed to update error log status:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
  };

  const getStatusChip = (resolved: boolean) => {
    return (
      <Chip
        label={resolved ? 'Resolved' : 'Unresolved'}
        size="small"
        color={resolved ? 'success' : 'error'}
        icon={resolved ? <CheckCircleIcon /> : <ErrorIcon />}
      />
    );
  };

  const getSeverityIcon = (errorSource: string) => {
    if (errorSource.includes('WhatsApp') || errorSource.includes('wa-')) {
      return <WarningIcon color="warning" fontSize="small" />;
    }
    return <ErrorIcon color="error" fontSize="small" />;
  };

  if (isLoading) {
    return (
      <Box className="flex justify-center items-center h-64">
        <Typography>Loading error logs...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Typography color="error">
            Error loading error logs: {error.message}
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        {/* Filters */}
        <Card className="mb-6">
          <CardContent>
            <Typography variant="h6" className="mb-4">
              Filters
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="Search by User ID"
                  value={filters.userId}
                  onChange={(e) => handleFilterChange('userId', e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                  size="small"
                />
              </Grid>
              
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={filters.resolvedStatus}
                    label="Status"
                    onChange={(e) => handleFilterChange('resolvedStatus', e.target.value)}
                  >
                    <MenuItem value="all">All Status</MenuItem>
                    <MenuItem value={false as any}>Unresolved</MenuItem>
                    <MenuItem value={true as any}>Resolved</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Error Source</InputLabel>
                  <Select
                    value={filters.errorSource}
                    label="Error Source"
                    onChange={(e) => handleFilterChange('errorSource', e.target.value)}
                  >
                    <MenuItem value="all">All Sources</MenuItem>
                    {uniqueErrorSources.map(source => (
                      <MenuItem key={source} value={source}>{source}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Error Code</InputLabel>
                  <Select
                    value={filters.errorCode}
                    label="Error Code"
                    onChange={(e) => handleFilterChange('errorCode', e.target.value)}
                  >
                    <MenuItem value="all">All Codes</MenuItem>
                    {uniqueErrorCodes.map(code => (
                      <MenuItem key={code} value={code as string}>{code}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6} md={1.5}>
                <DatePicker
                  label="From Date"
                  value={filters.dateFrom}
                  onChange={(date) => handleFilterChange('dateFrom', date)}
                  slotProps={{ textField: { size: 'small', fullWidth: true } }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6} md={1.5}>
                <DatePicker
                  label="To Date"
                  value={filters.dateTo}
                  onChange={(date) => handleFilterChange('dateTo', date)}
                  slotProps={{ textField: { size: 'small', fullWidth: true } }}
                />
              </Grid>
            </Grid>
            
            <Box className="mt-4">
              <Typography variant="body2" color="text.secondary">
                Showing {filteredErrorLogs.length} of {errorLogs.length} error logs
              </Typography>
            </Box>
          </CardContent>
        </Card>

        {/* Error Logs Table */}
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Timestamp</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Source</TableCell>
                  <TableCell>Code</TableCell>
                  <TableCell>Message</TableCell>
                  <TableCell>User ID</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedErrorLogs.map((log) => (
                  <TableRow key={log.id} hover>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(log.timestamp)}
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      {getStatusChip(log.resolved_status)}
                    </TableCell>
                    
                    <TableCell>
                      <Box className="flex items-center gap-2">
                        {getSeverityIcon(log.error_source)}
                        <Typography variant="body2">
                          {log.error_source}
                        </Typography>
                      </Box>
                    </TableCell>
                    
                    <TableCell>
                      {log.error_code ? (
                        <Chip label={log.error_code} size="small" variant="outlined" />
                      ) : (
                        <Typography variant="body2" color="text.secondary">-</Typography>
                      )}
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="body2" className="truncate max-w-md">
                        {log.error_message}
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      {log.user_id ? (
                        <Typography variant="body2" color="text.secondary" className="font-mono text-xs">
                          {log.user_id.substring(0, 8)}...
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="text.secondary">-</Typography>
                      )}
                    </TableCell>
                    
                    <TableCell align="center">
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <IconButton
                          size="small"
                          onClick={() => handleViewDetails(log)}
                          color="primary"
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleStatusUpdate(log.id, !log.resolved_status)}
                          color={log.resolved_status ? 'warning' : 'success'}
                          disabled={updateStatusMutation.isPending}
                        >
                          {log.resolved_status ? <UndoIcon fontSize="small" /> : <CheckIcon fontSize="small" />}
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
                
                {paginatedErrorLogs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography color="text.secondary" className="py-8">
                        No error logs found matching the current filters.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          
          <TablePagination
            rowsPerPageOptions={[10, 25, 50, 100]}
            component="div"
            count={filteredErrorLogs.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Paper>

        {/* Error Log Details Modal */}
        <ErrorLogDetailsModal
          errorLog={selectedErrorLog}
          open={detailsModalOpen}
          onClose={() => setDetailsModalOpen(false)}
          onStatusUpdate={handleStatusUpdate}
        />
      </Box>
    </LocalizationProvider>
  );
} 