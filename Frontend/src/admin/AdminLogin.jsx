import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Link,
  CircularProgress,
  Divider,
} from '@mui/material';
import { Lock as LockIcon } from '@mui/icons-material';
import authService from '../services/authService';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form data
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    fullName: '',
    confirmPassword: '',
    confirmationCode: '',
  });

  // Handle input changes
  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
    setSuccess('');
  };

  // Handle login
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await authService.signIn(formData.username, formData.password);
    
    if (result.success) {
      setSuccess('Login successful! Redirecting...');
      setTimeout(() => navigate('/admin/dashboard'), 1000);
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  // Handle signup
  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    const result = await authService.signUp(
      formData.username,
      formData.password,
      formData.email,
      formData.fullName
    );
    
    if (result.success) {
      if (result.needsConfirmation) {
        setNeedsConfirmation(true);
        setSuccess('Account created! Please check your email for verification code.');
      } else {
        setSuccess('Account created successfully! You can now login.');
        setIsSignUp(false);
      }
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  // Handle email confirmation
  const handleConfirmation = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await authService.confirmSignUp(formData.username, formData.confirmationCode);
    
    if (result.success) {
      setSuccess('Email confirmed! You can now login.');
      setNeedsConfirmation(false);
      setIsSignUp(false);
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  // Resend confirmation code
  const handleResendCode = async () => {
    setLoading(true);
    const result = await authService.resendConfirmationCode(formData.username);
    
    if (result.success) {
      setSuccess('Confirmation code resent to your email.');
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  // Reset form when switching modes
  const switchMode = () => {
    setIsSignUp(!isSignUp);
    setNeedsConfirmation(false);
    setError('');
    setSuccess('');
    setFormData({
      username: '',
      password: '',
      email: '',
      fullName: '',
      confirmPassword: '',
      confirmationCode: '',
    });
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
        padding: 2,
      }}
    >
      <Card sx={{ maxWidth: 400, width: '100%' }}>
        <CardContent sx={{ padding: 4 }}>
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <LockIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
            <Typography variant="h4" component="h1" gutterBottom>
              Admin Access
            </Typography>
            <Typography variant="body2" color="text.secondary">
              America's Blood Centers Admin Dashboard
            </Typography>
          </Box>

          {/* Error/Success Messages */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          {/* Email Confirmation Form */}
          {needsConfirmation ? (
            <Box component="form" onSubmit={handleConfirmation}>
              <TextField
                fullWidth
                label="Verification Code"
                name="confirmationCode"
                value={formData.confirmationCode}
                onChange={handleInputChange}
                margin="normal"
                required
                placeholder="Enter 6-digit code from email"
              />
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                sx={{ mt: 2, mb: 2 }}
              >
                {loading ? <CircularProgress size={24} /> : 'Confirm Email'}
              </Button>

              <Box sx={{ textAlign: 'center' }}>
                <Link
                  component="button"
                  type="button"
                  onClick={handleResendCode}
                  disabled={loading}
                  sx={{ mr: 2 }}
                >
                  Resend Code
                </Link>
                <Link
                  component="button"
                  type="button"
                  onClick={switchMode}
                >
                  Back to Login
                </Link>
              </Box>
            </Box>
          ) : (
            <>
              {/* Login/Signup Form */}
              <Box component="form" onSubmit={isSignUp ? handleSignUp : handleLogin}>
                {/* Username Field */}
                <TextField
                  fullWidth
                  label="Username"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  margin="normal"
                  required
                />

                {/* Email Field (Signup only) */}
                {isSignUp && (
                  <TextField
                    fullWidth
                    label="Email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    margin="normal"
                    required
                  />
                )}

                {/* Full Name Field (Signup only) */}
                {isSignUp && (
                  <TextField
                    fullWidth
                    label="Full Name (Optional)"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    margin="normal"
                  />
                )}

                {/* Password Field */}
                <TextField
                  fullWidth
                  label="Password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  margin="normal"
                  required
                />

                {/* Confirm Password Field (Signup only) */}
                {isSignUp && (
                  <TextField
                    fullWidth
                    label="Confirm Password"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    margin="normal"
                    required
                  />
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={loading}
                  sx={{ mt: 3, mb: 2 }}
                >
                  {loading ? (
                    <CircularProgress size={24} />
                  ) : isSignUp ? (
                    'Create Admin Account'
                  ) : (
                    'Access Dashboard'
                  )}
                </Button>
              </Box>

              {/* Mode Switch */}
              <Divider sx={{ my: 2 }} />
              <Box sx={{ textAlign: 'center' }}>
                {isSignUp ? (
                  <Typography variant="body2">
                    Already have an account?{' '}
                    <Link component="button" type="button" onClick={switchMode}>
                      Login here
                    </Link>
                  </Typography>
                ) : (
                  <Typography variant="body2">
                    New admin user?{' '}
                    <Link component="button" type="button" onClick={switchMode}>
                      Sign up here
                    </Link>
                  </Typography>
                )}
              </Box>
            </>
          )}

          {/* Back to Chat Link */}
          <Divider sx={{ my: 2 }} />
          <Box sx={{ textAlign: 'center' }}>
            <Link
              component="button"
              type="button"
              onClick={() => navigate('/')}
              color="text.secondary"
            >
              Back to Chat
            </Link>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AdminLogin;