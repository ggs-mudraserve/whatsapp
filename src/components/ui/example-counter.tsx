'use client'

import { Box, Button, Typography, Alert } from "@mui/material";
import { Add, Remove, Refresh } from "@mui/icons-material";
import { useExampleStore } from "@/lib/zustand/example-store";

export function ExampleCounter() {
  const { 
    count, 
    isLoading, 
    error, 
    increment, 
    decrement, 
    reset, 
    setLoading 
  } = useExampleStore();

  const handleAsyncIncrement = async () => {
    setLoading(true);
    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 500));
    increment();
    setLoading(false);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <Typography variant="h4" component="div">
        Count: {count}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Add />}
          onClick={increment}
          disabled={isLoading}
        >
          Increment
        </Button>
        
        <Button
          variant="contained"
          color="secondary"
          startIcon={<Remove />}
          onClick={decrement}
          disabled={isLoading}
        >
          Decrement
        </Button>
        
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={reset}
          disabled={isLoading}
        >
          Reset
        </Button>
      </Box>

      <Button
        variant="text"
        onClick={handleAsyncIncrement}
        disabled={isLoading}
      >
        {isLoading ? 'Loading...' : 'Async Increment'}
      </Button>
    </Box>
  );
} 