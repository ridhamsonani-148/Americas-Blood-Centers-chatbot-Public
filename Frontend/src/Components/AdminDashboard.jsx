import { useState, useEffect } from 'react'
import { 
  Box, 
  Paper, 
  Typography, 
  Button, 
  IconButton, 
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
  Pagination
} from "@mui/material"
import CloseIcon from "@mui/icons-material/Close"
import HistoryIcon from "@mui/icons-material/History"
import SettingsIcon from "@mui/icons-material/Settings"
import { API_GATEWAY_URL } from '../utilities/constants'

const AdminDashboard = ({ language, onClose }) => {
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

  // Fetch chat history
  const fetchChatHistory = async (page = 1, filters = {}) => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
        ...filters
      });

      const response = await fetch(`${API_GATEWAY_URL}/admin/conversations?${queryParams}`, {
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
      setStatus(
        language === 'es' 
          ? 'Error al cargar el historial de chat'
          : 'Error loading chat history'
      );
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
      const response = await fetch(`${API_GATEWAY_URL}/admin/sync`, {
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
      setStatus(
        language === 'es' 
          ? `Sincronización ${syncType} iniciada exitosamente`
          : `${syncType} sync started successfully`
      );
    } catch (error) {
      console.error('Error triggering sync:', error);
      setStatus(
        language === 'es' 
          ? 'Error al iniciar la sincronización'
          : 'Error starting sync'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const checkKnowledgeBaseStatus = async () => {
    setIsLoading(true);
    setStatus('');

    try {
      const response = await fetch(`${API_GATEWAY_URL}/admin/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setStatus(
        language === 'es' 
          ? `Estado: ${data.status || 'Desconocido'}`
          : `Status: ${data.status || 'Unknown'}`
      );
    } catch (error) {
      console.error('Error checking status:', error);
      setStatus(
        language === 'es' 
          ? 'Error al verificar el estado'
          : 'Error checking status'
      );
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
    return new Date(dateString).toLocaleString(language === 'es' ? 'es-ES' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateText = (text, maxLength = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <Paper
      elevation={3}
      sx={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: { xs: '95%', sm: '90%', md: '80%', lg: '70%' },
        maxWidth: '1200px',
        maxHeight: '90vh',
        overflow: 'auto',
        zIndex: 1300,
        p: 3,
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" component="h2">
          {language === 'es' ? 'Panel de Administración' : 'Admin Dashboard'}
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </Box>

      <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab 
          icon={<SettingsIcon />} 
          label={language === 'es' ? 'Configuración' : 'Settings'} 
          iconPosition="start"
        />
        <Tab 
          icon={<HistoryIcon />} 
          label={language === 'es' ? 'Historial de Chat' : 'Chat History'} 
          iconPosition="start"
        />
      </Tabs>

      {/* Settings Tab */}
      {activeTab === 0 && (
        <Box>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Button
                variant="contained"
                fullWidth
                onClick={() => triggerDataSync('manual')}
                disabled={isLoading}
                sx={{ mb: 1 }}
              >
                {language === 'es' ? 'Sincronizar Datos' : 'Sync Data'}
              </Button>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Button
                variant="contained"
                fullWidth
                onClick={() => triggerDataSync('daily')}
                disabled={isLoading}
                sx={{ mb: 1 }}
              >
                {language === 'es' ? 'Sincronización Diaria' : 'Daily Sync'}
              </Button>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Button
                variant="outlined"
                fullWidth
                onClick={checkKnowledgeBaseStatus}
                disabled={isLoading}
                sx={{ mb: 1 }}
              >
                {language === 'es' ? 'Verificar Estado' : 'Check Status'}
              </Button>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => window.open('https://console.aws.amazon.com/bedrock/home#/knowledge-bases', '_blank')}
                sx={{ mb: 1 }}
              >
                {language === 'es' ? 'Consola AWS' : 'AWS Console'}
              </Button>
            </Grid>
          </Grid>

          {status && (
            <Alert severity="success" sx={{ mt: 2 }}>
              {status}
            </Alert>
          )}

          {isLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 2 }}>
              <CircularProgress size={24} sx={{ mr: 1 }} />
              <Typography variant="body2" color="textSecondary">
                {language === 'es' ? 'Procesando...' : 'Processing...'}
              </Typography>
            </Box>
          )}
        </Box>
      )}

      {/* Chat History Tab */}
      {activeTab === 1 && (
        <Box>
          {/* Filters */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
            <TextField
              label={language === 'es' ? 'Filtrar por fecha' : 'Filter by date'}
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              InputLabelProps={{ shrink: true }}
              size="small"
              sx={{ minWidth: 150 }}
            />
            <TextField
              select
              label={language === 'es' ? 'Idioma' : 'Language'}
              value={languageFilter}
              onChange={(e) => setLanguageFilter(e.target.value)}
              size="small"
              sx={{ minWidth: 120 }}
            >
              <MenuItem value="">{language === 'es' ? 'Todos' : 'All'}</MenuItem>
              <MenuItem value="en">English</MenuItem>
              <MenuItem value="es">Español</MenuItem>
            </TextField>
          </Box>

          {/* Conversations Table */}
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{language === 'es' ? 'Pregunta' : 'Question'}</TableCell>
                  <TableCell>{language === 'es' ? 'Respuesta' : 'Answer'}</TableCell>
                  <TableCell>{language === 'es' ? 'Fecha' : 'Date'}</TableCell>
                  <TableCell>{language === 'es' ? 'Idioma' : 'Language'}</TableCell>
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
                {language === 'es' ? 'No se encontraron conversaciones' : 'No conversations found'}
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
              {language === 'es' 
                ? `Mostrando ${conversations.length} de ${totalConversations} conversaciones`
                : `Showing ${conversations.length} of ${totalConversations} conversations`
              }
            </Typography>
          </Box>
        </Box>
      )}
    </Paper>
  );
};
};

export default AdminDashboard;