import React, { useState } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  Container
} from '@mui/material';
import { Lock as LockIcon } from '@mui/icons-material';
import { PRIMARY_MAIN, DARK_BLUE } from '../utilities/constants';

const AdminLogin = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const ADMIN_PASSWORD = 'bloodcenter2024'; // Change this to a secure password

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simple password check
    setTimeout(() => {
      if (password === ADMIN_PASSWORD) {
        onLogin(true);
      } else {
        setError('Invalid password. Please try again.');
        setPassword('');
      }
      setIsLoading(false);
    }, 500);
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f5f5f5'
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            width: '100%',
            maxWidth: 400,
            textAlign: 'center'
          }}
        >
          <Box sx={{ mb: 3 }}>
            <LockIcon sx={{ fontSize: 48, color: DARK_BLUE, mb: 2 }} />
            <Typography variant="h4" gutterBottom>
              Admin Access
            </Typography>
            <Typography variant="body2" color="textSecondary">
              America's Blood Centers Admin Dashboard
            </Typography>
          </Box>

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              type="password"
              label="Admin Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
              disabled={isLoading}
              sx={{ mb: 3 }}
            />

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={isLoading || !password}
              sx={{
                backgroundColor: PRIMARY_MAIN,
                py: 1.5,
                mb: 2,
                '&:hover': {
                  backgroundColor: DARK_BLUE
                }
              }}
            >
              {isLoading ? 'Authenticating...' : 'Access Dashboard'}
            </Button>

            <Button
              fullWidth
              variant="text"
              onClick={() => window.location.href = '/'}
              sx={{ color: 'textSecondary' }}
            >
              Back to Chat
            </Button>
          </form>
        </Paper>
      </Box>
    </Container>
  );
};

export default AdminLogin;