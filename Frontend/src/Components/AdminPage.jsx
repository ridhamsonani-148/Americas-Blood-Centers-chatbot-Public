import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Button, 
  CircularProgress,
  Alert,
  Grid,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  TextField,
  MenuItem,
  Pagination,
  AppBar,
  Toolbar,
  Container,
  Card,
  CardContent
} from "@mui/material";
import HistoryIcon from "@mui/icons-material/History";
import SettingsIcon from "@mui/icons-material/Settings";
import DashboardIcon from "@mui/icons-material/Dashboard";
import { PRIMARY_MAIN, WHITE, DARK_BLUE } from '../utilities/constants';

const AdminPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  
  // Chat history state
  const [conversations, setConversations] = useState([]);
  const [totalConversations, setTotalConversations] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [dateFilter, setDateFilter] = useState('');
  const [languageFilter, setLanguageFilter] = useState('');

  // Get API URL from environment
  const API_URL = process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_CHAT_ENDPOINT;

  // Fetch chat history
  const fetchChatHistory = async (page = 1, filters = {}) => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
        ...filters
      });

      const response = await fetch(`${API_URL}/admin/conversations?${queryParams}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setConversations(data.conversations || []);
      setTotalConversations(data.total || 0);
    } catch (error) {
      console.error('Error fetching chat history:', error);
      setStatus('Error loading chat history');
    } finally {
      setIsLoading(false);
    }
  };

  // Load chat history when tab changes or filters change
  useEffect(() => {
    if (activeTab === 1) { // Chat History tab
      const filters = {};
      if (dateFilter) filters.date = dateFilter;
      if (languageFilter) filters.language = languageFilter;
      fetchChatHistory(currentPage, filters);
    }
  }, [activeTab, currentPage, dateFilter, languageFilter]);

  const triggerDataSync = async (syncType) => {
    setIsLoading(true);
    setStatus('');

    try {
      const response = await fetch(`${API_URL}/admin/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sync_type: syncType,
          data_source_type: 'both'
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setStatus(`${syncType} sync started successfully`);
    } catch (error) {
      console.error('Error triggering sync:', error);
      setStatus('Error starting sync');
    } finally {
      setIsLoading(false);
    }
  };

  const checkKnowledgeBaseStatus = async () => {
    setIsLoading(true);
    setStatus('');

    try {
      const response = await fetch(`${API_URL}/admin/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setStatus(`Status: ${data.status || 'Unknown'}`);
    } catch (error) {
      console.error('Error checking status:', error);
      setStatus('Error checking status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handlePageChange = (event, page) => {
    setCurrentPage(page);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateText = (text, maxLength = 100) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      {/* Header */}
      <AppBar position="static" sx={{ backgroundColor: DARK_BLUE }}>
        <Toolbar>
          <DashboardIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            America's Blood Centers - Admin Dashboard
          </Typography>
          <Button 
            color="inherit" 
            onClick={() => window.location.href = '/'}
            sx={{ ml: 2 }}
          >
            Back to Chat
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Welcome Card */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h4" gutterBottom>
              Admin Dashboard
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Manage your chatbot settings and view conversation history
            </Typography>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange} 
            sx={{ 
              borderBottom: 1, 
              borderColor: 'divider',
              '& .MuiTab-root': {
                minHeight: 64,
                fontSize: '1rem'
              }
            }}
          >
            <Tab 
              icon={<SettingsIcon />} 
              label="Settings & Sync" 
              iconPosition="start"
            />
            <Tab 
              icon={<HistoryIcon />} 
              label="Chat History" 
              iconPosition="start"
            />
          </Tabs>
        </Paper>

        {/* Settings Tab */}
        {activeTab === 0 && (
          <Paper sx={{ p: 4 }}>
            <Typography variant="h5" gutterBottom>
              System Settings
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Data Synchronization
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                      Sync knowledge base with latest data sources
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, flexDirection: 'column' }}>
                      <Button
                        variant="contained"
                        onClick={() => triggerDataSync('manual')}
                        disabled={isLoading}
                        sx={{ backgroundColor: PRIMARY_MAIN }}
                      >
                        Manual Sync
                      </Button>
                      <Button
                        variant="contained"
                        onClick={() => triggerDataSync('daily')}
                        disabled={isLoading}
                        sx={{ backgroundColor: PRIMARY_MAIN }}
                      >
                        Daily Sync
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      System Status
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                      Check knowledge base and system health
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, flexDirection: 'column' }}>
                      <Button
                        variant="outlined"
                        onClick={checkKnowledgeBaseStatus}
                        disabled={isLoading}
                      >
                        Check Status
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={() => window.open('https://console.aws.amazon.com/bedrock/home#/knowledge-bases', '_blank')}
                      >
                        AWS Console
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {status && (
              <Alert severity="info" sx={{ mt: 3 }}>
                {status}
              </Alert>
            )}

            {isLoading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 3 }}>
                <CircularProgress size={24} sx={{ mr: 1 }} />
                <Typography variant="body2" color="textSecondary">
                  Processing...
                </Typography>
              </Box>
            )}
          </Paper>
        )}

        {/* Chat History Tab */}
        {activeTab === 1 && (
          <Paper sx={{ p: 4 }}>
            <Typography variant="h5" gutterBottom>
              Chat History
            </Typography>

            {/* Filters */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
              <TextField
                label="Filter by date"
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                InputLabelProps={{ shrink: true }}
                size="small"
                sx={{ minWidth: 150 }}
              />
              <TextField
                select
                label="Language"
                value={languageFilter}
                onChange={(e) => setLanguageFilter(e.target.value)}
                size="small"
                sx={{ minWidth: 120 }}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="en">English</MenuItem>
                <MenuItem value="es">Español</MenuItem>
              </TextField>
            </Box>

            {/* Conversations Table */}
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell><strong>Question</strong></TableCell>
                    <TableCell><strong>Answer</strong></TableCell>
                    <TableCell><strong>Date</strong></TableCell>
                    <TableCell><strong>Language</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {conversations.map((conversation, index) => (
                    <TableRow key={conversation.id || index} hover>
                      <TableCell sx={{ maxWidth: 300 }}>
                        <Typography variant="body2" title={conversation.message}>
                          {truncateText(conversation.message || conversation.question, 80)}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ maxWidth: 400 }}>
                        <Typography variant="body2" color="textSecondary" title={conversation.response || conversation.answer}>
                          {truncateText(conversation.response || conversation.answer, 100)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(conversation.timestamp || conversation.created_at)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={conversation.language === 'es' ? 'Español' : 'English'} 
                          size="small"
                          color={conversation.language === 'es' ? 'secondary' : 'primary'}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {conversations.length === 0 && !isLoading && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="textSecondary">
                  No conversations found
                </Typography>
              </Box>
            )}

            {isLoading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            )}

            {/* Pagination */}
            {totalConversations > pageSize && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <Pagination
                  count={Math.ceil(totalConversations / pageSize)}
                  page={currentPage}
                  onChange={handlePageChange}
                  color="primary"
                />
              </Box>
            )}

            {/* Summary */}
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="textSecondary">
                Showing {conversations.length} of {totalConversations} conversations
              </Typography>
            </Box>
          </Paper>
        )}
      </Container>
    </Box>
  );
};

export default AdminPage;