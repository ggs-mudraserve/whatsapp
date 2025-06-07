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
  InputAdornment
} from '@mui/material';
import {
  Search as SearchIcon,
  Person as PersonIcon,
  AdminPanelSettings as AdminIcon,
  SupervisorAccount as TeamLeaderIcon,
  SupportAgent as AgentIcon
} from '@mui/icons-material';
import { useUsers, User, UserRole, UserSegment } from '@/lib/hooks/use-users';
import { format } from 'date-fns';

interface FilterState {
  role: UserRole | 'all';
  segment: UserSegment | 'all' | null;
  isActive: boolean | 'all';
  presentToday: boolean | 'all';
  search: string;
}

const roleConfig = {
  admin: { label: 'Admin', icon: AdminIcon, color: 'error' as const },
  team_leader: { label: 'Team Leader', icon: TeamLeaderIcon, color: 'warning' as const },
  agent: { label: 'Agent', icon: AgentIcon, color: 'primary' as const },
  backend: { label: 'Backend', icon: PersonIcon, color: 'secondary' as const },
  system: { label: 'System', icon: PersonIcon, color: 'default' as const },
  chatbot: { label: 'Chatbot', icon: PersonIcon, color: 'default' as const }
};

export function UserManagement() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [filters, setFilters] = useState<FilterState>({
    role: 'all',
    segment: 'all',
    isActive: 'all',
    presentToday: 'all',
    search: ''
  });

  const { data: users = [], isLoading, error } = useUsers();

  const filteredUsers = useMemo(() => {
    if (!users) return [];

    return users.filter((user: User) => {
      // Role filter
      if (filters.role !== 'all' && user.role !== filters.role) return false;
      
      // Segment filter
      if (filters.segment !== 'all' && user.segment !== filters.segment) return false;
      
      // Active status filter
      if (filters.isActive !== 'all' && user.is_active !== filters.isActive) return false;
      
      // Present today filter
      if (filters.presentToday !== 'all' && user.present_today !== filters.presentToday) return false;
      
      // Search filter (name/email)
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const fullName = `${user.first_name || ''} ${user.last_name || ''}`.toLowerCase();
        const email = (user.email || '').toLowerCase();
        
        if (!fullName.includes(searchLower) && !email.includes(searchLower)) {
          return false;
        }
      }
      
      return true;
    });
  }, [users, filters]);

  const paginatedUsers = useMemo(() => {
    const startIndex = page * rowsPerPage;
    return filteredUsers.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredUsers, page, rowsPerPage]);

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

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'Never';
    return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
  };

  const getRoleChip = (role: UserRole | null) => {
    if (!role) return <Chip label="No Role" size="small" color="default" />;
    
    const config = roleConfig[role as keyof typeof roleConfig];
    if (!config) return <Chip label="Unknown Role" size="small" color="default" />;
    
    const IconComponent = config.icon;
    
    return (
      <Chip
        label={config.label}
        size="small"
        color={config.color}
        icon={<IconComponent fontSize="small" />}
      />
    );
  };

  const getSegmentChip = (segment: UserSegment | null) => {
    if (!segment) return <Chip label="No Segment" size="small" variant="outlined" />;
    
    return (
      <Chip
        label={segment}
        size="small"
        color={segment === 'PL' ? 'primary' : 'secondary'}
        variant="outlined"
      />
    );
  };

  if (isLoading) {
    return (
      <Box className="flex justify-center items-center h-64">
        <Typography>Loading users...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Typography color="error">
            Error loading users: {error.message}
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
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
                label="Search by name or email"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
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
                <InputLabel>Role</InputLabel>
                <Select
                  value={filters.role}
                  label="Role"
                  onChange={(e) => handleFilterChange('role', e.target.value)}
                >
                  <MenuItem value="all">All Roles</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                  <MenuItem value="team_leader">Team Leader</MenuItem>
                  <MenuItem value="agent">Agent</MenuItem>
                  <MenuItem value="backend">Backend</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Segment</InputLabel>
                <Select
                  value={filters.segment}
                  label="Segment"
                  onChange={(e) => handleFilterChange('segment', e.target.value)}
                >
                  <MenuItem value="all">All Segments</MenuItem>
                  <MenuItem value="PL">PL</MenuItem>
                  <MenuItem value="BL">BL</MenuItem>
                  <MenuItem value={null as any}>No Segment</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Active Status</InputLabel>
                <Select
                  value={filters.isActive}
                  label="Active Status"
                  onChange={(e) => handleFilterChange('isActive', e.target.value)}
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value={true as any}>Active</MenuItem>
                  <MenuItem value={false as any}>Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Present Today</InputLabel>
                <Select
                  value={filters.presentToday}
                  label="Present Today"
                  onChange={(e) => handleFilterChange('presentToday', e.target.value)}
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value={true as any}>Present</MenuItem>
                  <MenuItem value={false as any}>Not Present</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          
          <Box className="mt-4">
            <Typography variant="body2" color="text.secondary">
              Showing {filteredUsers.length} of {users.length} users
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Segment</TableCell>
                <TableCell align="center">Active</TableCell>
                <TableCell align="center">Present Today</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Last Chat Assigned</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedUsers.map((user: User) => (
                <TableRow key={user.id} hover>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {user.first_name && user.last_name 
                          ? `${user.first_name} ${user.last_name}`
                          : user.first_name || user.last_name || 'No Name'
                        }
                      </Typography>
                    </Box>
                  </TableCell>
                  
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {user.email || 'No Email'}
                    </Typography>
                  </TableCell>
                  
                  <TableCell>
                    {getRoleChip(user.role)}
                  </TableCell>
                  
                  <TableCell>
                    {getSegmentChip(user.segment)}
                  </TableCell>
                  
                  <TableCell align="center">
                    <Chip
                      label={user.is_active ? 'Active' : 'Inactive'}
                      size="small"
                      color={user.is_active ? 'success' : 'default'}
                      variant={user.is_active ? 'filled' : 'outlined'}
                    />
                  </TableCell>
                  
                  <TableCell align="center">
                    <Chip
                      label={user.present_today ? 'Present' : 'Absent'}
                      size="small"
                      color={user.present_today ? 'primary' : 'default'}
                      variant={user.present_today ? 'filled' : 'outlined'}
                    />
                  </TableCell>
                  
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(user.created_at)}
                    </Typography>
                  </TableCell>
                  
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(user.last_chat_assigned_at)}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
              
              {paginatedUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography color="text.secondary" className="py-8">
                      No users found matching the current filters.
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
          count={filteredUsers.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </Box>
  );
} 