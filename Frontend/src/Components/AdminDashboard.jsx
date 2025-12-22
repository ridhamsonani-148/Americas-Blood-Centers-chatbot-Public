import { useState } from 'react'
import { 
  Box, 
  Paper, 
  Typography, 
  Button, 
  IconButton, 
  CircularProgress,
  Alert,
  Grid
} from "@mui/material"
import CloseIcon from "@mui/icons-material/Close"
import { API_GATEWAY_URL } from '../utilities/constants'

const AdminDashboard = ({ language, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('');

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

  return (
    <Paper
      elevation={3}
      sx={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: { xs: '90%', sm: '500px' },
        maxHeight: '80vh',
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
    </Paper>
  );
};

export default AdminDashboard;