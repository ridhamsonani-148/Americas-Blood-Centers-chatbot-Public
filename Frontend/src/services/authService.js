/**
 * Simple Cognito Authentication Service
 * Handles login, signup, and token management for admin users
 */

import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  SignUpCommand,
  ConfirmSignUpCommand,
  ResendConfirmationCodeCommand,
} from '@aws-sdk/client-cognito-identity-provider';

// Cognito configuration from environment variables
const config = {
  region: process.env.REACT_APP_AWS_REGION || 'us-east-1',
  userPoolId: process.env.REACT_APP_USER_POOL_ID,
  clientId: process.env.REACT_APP_USER_POOL_CLIENT_ID,
};

// Validate configuration
if (!config.userPoolId || !config.clientId) {
  console.warn('Cognito configuration missing. Admin authentication will not work.');
}

// Initialize Cognito client
const cognitoClient = new CognitoIdentityProviderClient({
  region: config.region,
});

class AuthService {
  // Sign up new admin user
  async signUp(username, password, email, fullName = '') {
    if (!config.userPoolId || !config.clientId) {
      return {
        success: false,
        error: 'Cognito configuration not available. Please deploy the backend first.',
      };
    }

    try {
      const command = new SignUpCommand({
        ClientId: config.clientId,
        Username: username,
        Password: password,
        UserAttributes: [
          {
            Name: 'email',
            Value: email,
          },
          ...(fullName ? [{
            Name: 'name',
            Value: fullName,
          }] : []),
        ],
      });

      const response = await cognitoClient.send(command);
      return {
        success: true,
        userSub: response.UserSub,
        needsConfirmation: !response.UserConfirmed,
      };
    } catch (error) {
      console.error('Sign up error:', error);
      return {
        success: false,
        error: this.getErrorMessage(error),
      };
    }
  }

  // Sign in existing admin user
  async signIn(username, password) {
    if (!config.userPoolId || !config.clientId) {
      return {
        success: false,
        error: 'Cognito configuration not available. Please deploy the backend first.',
      };
    }

    try {
      const command = new InitiateAuthCommand({
        ClientId: config.clientId,
        AuthFlow: 'USER_PASSWORD_AUTH',
        AuthParameters: {
          USERNAME: username,
          PASSWORD: password,
        },
      });

      const response = await cognitoClient.send(command);
      
      if (response.AuthenticationResult) {
        const tokens = {
          accessToken: response.AuthenticationResult.AccessToken,
          idToken: response.AuthenticationResult.IdToken,
          refreshToken: response.AuthenticationResult.RefreshToken,
        };
        
        // Store tokens in localStorage
        this.storeTokens(tokens);
        
        return {
          success: true,
          tokens,
        };
      }
      
      return {
        success: false,
        error: 'Authentication failed',
      };
    } catch (error) {
      console.error('Sign in error:', error);
      return {
        success: false,
        error: this.getErrorMessage(error),
      };
    }
  }

  // Confirm sign up with verification code
  async confirmSignUp(username, confirmationCode) {
    try {
      const command = new ConfirmSignUpCommand({
        ClientId: config.clientId,
        Username: username,
        ConfirmationCode: confirmationCode,
      });

      await cognitoClient.send(command);
      return { success: true };
    } catch (error) {
      console.error('Confirm sign up error:', error);
      return {
        success: false,
        error: this.getErrorMessage(error),
      };
    }
  }

  // Resend confirmation code
  async resendConfirmationCode(username) {
    try {
      const command = new ResendConfirmationCodeCommand({
        ClientId: config.clientId,
        Username: username,
      });

      await cognitoClient.send(command);
      return { success: true };
    } catch (error) {
      console.error('Resend confirmation error:', error);
      return {
        success: false,
        error: this.getErrorMessage(error),
      };
    }
  }

  // Store tokens in localStorage
  storeTokens(tokens) {
    localStorage.setItem('adminTokens', JSON.stringify(tokens));
  }

  // Get stored tokens
  getStoredTokens() {
    const tokens = localStorage.getItem('adminTokens');
    return tokens ? JSON.parse(tokens) : null;
  }

  // Check if user is authenticated
  isAuthenticated() {
    const tokens = this.getStoredTokens();
    if (!tokens || !tokens.accessToken) {
      return false;
    }

    // Simple token expiry check (JWT tokens have exp claim)
    try {
      const payload = JSON.parse(atob(tokens.accessToken.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp > currentTime;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  }

  // Sign out user
  signOut() {
    localStorage.removeItem('adminTokens');
  }

  // Get user info from stored ID token
  getUserInfo() {
    const tokens = this.getStoredTokens();
    if (!tokens || !tokens.idToken) {
      return null;
    }

    try {
      const payload = JSON.parse(atob(tokens.idToken.split('.')[1]));
      return {
        username: payload['cognito:username'],
        email: payload.email,
        name: payload.name,
      };
    } catch (error) {
      console.error('Get user info error:', error);
      return null;
    }
  }

  // Helper method to get user-friendly error messages
  getErrorMessage(error) {
    switch (error.name) {
      case 'UserNotFoundException':
        return 'User not found. Please check your username.';
      case 'NotAuthorizedException':
        return 'Incorrect username or password.';
      case 'UserNotConfirmedException':
        return 'Please confirm your email address first.';
      case 'UsernameExistsException':
        return 'Username already exists. Please choose a different one.';
      case 'InvalidPasswordException':
        return 'Password does not meet requirements.';
      case 'CodeMismatchException':
        return 'Invalid verification code.';
      case 'ExpiredCodeException':
        return 'Verification code has expired.';
      default:
        return error.message || 'An error occurred. Please try again.';
    }
  }
}

const authService = new AuthService();
export default authService;