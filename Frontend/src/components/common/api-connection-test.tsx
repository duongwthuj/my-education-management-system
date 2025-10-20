'use client';

import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Stack,
  Typography,
  Alert,
  CircularProgress,
  Chip,
  Divider
} from '@mui/material';
import { CheckCircle, XCircle, Warning } from '@phosphor-icons/react';

interface TestResult {
  name: string;
  status: 'success' | 'error' | 'pending';
  message: string;
  data?: any;
}

export function ApiConnectionTest() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  const runTests = async () => {
    setTesting(true);
    const testResults: TestResult[] = [];

    // Test 1: Health check
    try {
      const response = await fetch(apiUrl.replace('/api', '') + '/');
      const data = await response.json();
      testResults.push({
        name: 'Backend Health Check',
        status: response.ok ? 'success' : 'error',
        message: response.ok ? 'Backend is running' : 'Backend not responding',
        data
      });
    } catch (error) {
      testResults.push({
        name: 'Backend Health Check',
        status: 'error',
        message: `Cannot connect to backend: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }

    // Test 2: API Health
    try {
      const response = await fetch(`${apiUrl}/health`);
      const data = await response.json();
      testResults.push({
        name: 'API Health Endpoint',
        status: response.ok ? 'success' : 'error',
        message: response.ok ? 'API is healthy' : 'API health check failed',
        data
      });
    } catch (error) {
      testResults.push({
        name: 'API Health Endpoint',
        status: 'error',
        message: `API health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }

    // Test 3: Get Teachers
    try {
      const response = await fetch(`${apiUrl}/teachers`);
      const data = await response.json();
      testResults.push({
        name: 'GET /api/teachers',
        status: response.ok ? 'success' : 'error',
        message: response.ok 
          ? `Found ${data.data?.length || 0} teachers` 
          : 'Failed to fetch teachers',
        data
      });
    } catch (error) {
      testResults.push({
        name: 'GET /api/teachers',
        status: 'error',
        message: `Failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }

    // Test 4: Get Subjects
    try {
      const response = await fetch(`${apiUrl}/subjects`);
      const data = await response.json();
      testResults.push({
        name: 'GET /api/subjects',
        status: response.ok ? 'success' : 'error',
        message: response.ok 
          ? `Found ${data.data?.length || 0} subjects` 
          : 'Failed to fetch subjects',
        data
      });
    } catch (error) {
      testResults.push({
        name: 'GET /api/subjects',
        status: 'error',
        message: `Failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }

    // Test 5: Get Classes
    try {
      const response = await fetch(`${apiUrl}/classes`);
      const data = await response.json();
      testResults.push({
        name: 'GET /api/classes',
        status: response.ok ? 'success' : 'error',
        message: response.ok 
          ? `Found ${data.data?.length || 0} classes` 
          : 'Failed to fetch classes',
        data
      });
    } catch (error) {
      testResults.push({
        name: 'GET /api/classes',
        status: 'error',
        message: `Failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }

    // Test 6: Get Schedules
    try {
      const response = await fetch(`${apiUrl}/schedules`);
      const data = await response.json();
      testResults.push({
        name: 'GET /api/schedules',
        status: response.ok ? 'success' : 'error',
        message: response.ok 
          ? `Found ${data.data?.length || 0} schedules` 
          : 'Failed to fetch schedules',
        data
      });
    } catch (error) {
      testResults.push({
        name: 'GET /api/schedules',
        status: 'error',
        message: `Failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }

    setResults(testResults);
    setTesting(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle size={24} color="green" weight="fill" />;
      case 'error':
        return <XCircle size={24} color="red" weight="fill" />;
      default:
        return <Warning size={24} color="orange" weight="fill" />;
    }
  };

  const getStatusColor = (status: string): 'success' | 'error' | 'warning' => {
    switch (status) {
      case 'success':
        return 'success';
      case 'error':
        return 'error';
      default:
        return 'warning';
    }
  };

  const successCount = results.filter(r => r.status === 'success').length;
  const errorCount = results.filter(r => r.status === 'error').length;

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Stack spacing={3}>
        <Typography variant="h4">
          API Connection Test
        </Typography>

        <Alert severity="info">
          <Typography variant="body2">
            <strong>API URL:</strong> {apiUrl}
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Đảm bảo Backend đang chạy tại <code>http://localhost:5000</code>
          </Typography>
        </Alert>

        <Box>
          <Button
            variant="contained"
            size="large"
            onClick={runTests}
            disabled={testing}
            fullWidth
          >
            {testing ? <CircularProgress size={24} sx={{ mr: 1 }} /> : null}
            {testing ? 'Testing...' : 'Run Connection Tests'}
          </Button>
        </Box>

        {results.length > 0 && (
          <>
            <Card>
              <CardContent>
                <Stack direction="row" spacing={2} justifyContent="center">
                  <Chip
                    label={`${successCount} Passed`}
                    color="success"
                    variant="outlined"
                  />
                  <Chip
                    label={`${errorCount} Failed`}
                    color="error"
                    variant="outlined"
                  />
                  <Chip
                    label={`${results.length} Total`}
                    variant="outlined"
                  />
                </Stack>
              </CardContent>
            </Card>

            <Stack spacing={2}>
              {results.map((result, index) => (
                <Card key={index}>
                  <CardContent>
                    <Stack direction="row" spacing={2} alignItems="flex-start">
                      <Box sx={{ mt: 0.5 }}>
                        {getStatusIcon(result.status)}
                      </Box>
                      <Box flex={1}>
                        <Stack direction="row" spacing={2} alignItems="center" mb={1}>
                          <Typography variant="h6">
                            {result.name}
                          </Typography>
                          <Chip
                            label={result.status.toUpperCase()}
                            color={getStatusColor(result.status)}
                            size="small"
                          />
                        </Stack>
                        <Typography variant="body2" color="text.secondary">
                          {result.message}
                        </Typography>
                        {result.data && (
                          <>
                            <Divider sx={{ my: 2 }} />
                            <Typography variant="caption" component="pre" sx={{ 
                              overflow: 'auto',
                              backgroundColor: 'grey.100',
                              p: 1,
                              borderRadius: 1,
                              fontSize: '0.75rem'
                            }}>
                              {JSON.stringify(result.data, null, 2)}
                            </Typography>
                          </>
                        )}
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          </>
        )}

        {results.length > 0 && errorCount > 0 && (
          <Alert severity="error">
            <Typography variant="body2" fontWeight="bold">
              Troubleshooting Steps:
            </Typography>
            <Typography variant="body2" component="div">
              <ol style={{ margin: 0, paddingLeft: 20 }}>
                <li>Kiểm tra Backend có đang chạy không (<code>npm run dev</code> trong folder Backend)</li>
                <li>Kiểm tra MongoDB có đang chạy không</li>
                <li>Kiểm tra file <code>.env</code> trong Backend</li>
                <li>Kiểm tra file <code>.env.local</code> trong Frontend</li>
                <li>Kiểm tra console logs của Backend</li>
                <li>Chạy <code>npm run seed</code> trong Backend để thêm dữ liệu mẫu</li>
              </ol>
            </Typography>
          </Alert>
        )}

        {results.length > 0 && errorCount === 0 && (
          <Alert severity="success">
            <Typography variant="body2" fontWeight="bold">
              ✅ Tất cả tests đã passed!
            </Typography>
            <Typography variant="body2">
              Frontend và Backend đã được kết nối thành công. Bạn có thể bắt đầu sử dụng API.
            </Typography>
          </Alert>
        )}
      </Stack>
    </Container>
  );
}
