import { Suspense } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import { ErrorLogViewer } from '@/components/admin';

export default function AdminErrorLogsPage() {
  return (
    <Box className="p-6">
      <Typography variant="h4" component="h1" className="mb-6">
        Error Log Viewer
      </Typography>
      <Typography variant="body1" className="mb-6 text-gray-600">
        Monitor and manage application errors with filtering, detailed view, and resolution tracking.
      </Typography>
      
      <Suspense fallback={
        <Box className="flex justify-center items-center h-64">
          <CircularProgress />
        </Box>
      }>
        <ErrorLogViewer />
      </Suspense>
    </Box>
  );
} 