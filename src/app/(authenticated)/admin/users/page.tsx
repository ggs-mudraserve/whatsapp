import { Suspense } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import { UserManagement } from '@/components/admin';

export default function AdminUsersPage() {
  return (
    <Box className="p-6">
      <Typography variant="h4" component="h1" className="mb-6">
        User Management
      </Typography>
      <Typography variant="body1" className="mb-6 text-gray-600">
        Read-only view of all users in the system with filtering and search capabilities.
      </Typography>
      
      <Suspense fallback={
        <Box className="flex justify-center items-center h-64">
          <CircularProgress />
        </Box>
      }>
        <UserManagement />
      </Suspense>
    </Box>
  );
} 