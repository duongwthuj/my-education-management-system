'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Alert,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Chip,
  Stack,
  CircularProgress,
} from '@mui/material';
import { Upload, FileText } from '@phosphor-icons/react';

interface ImportResult {
  success: any[];
  failed: any[];
  total: number;
}

interface ImportTeachDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ImportTeachDialog({ open, onClose, onSuccess }: ImportTeachDialogProps) {
  const [jsonText, setJsonText] = useState('');
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  const exampleJson = `[
  {
    "teacherEmail": "teacher@example.com",
    "subjectCode": "MATH101",
    "className": "10A1",
    "dayOfWeek": "Thứ 2",
    "startTime": "08:00",
    "endTime": "09:30"
  },
  {
    "teacherName": "Nguyễn Văn A",
    "subjectName": "Toán học",
    "className": "10A2",
    "dayOfWeek": "Thứ 3",
    "startTime": "14:00",
    "endTime": "15:30",
    "notes": "Lớp chuyên"
  }
]`;

  const handleImport = async () => {
    setError(null);
    setResult(null);

    // Validate JSON
    let teaches;
    try {
      teaches = JSON.parse(jsonText);
    } catch (err) {
      setError('JSON không hợp lệ. Vui lòng kiểm tra lại cú pháp.');
      return;
    }

    if (!Array.isArray(teaches)) {
      setError('Dữ liệu phải là một mảng các phân công dạy.');
      return;
    }

    setImporting(true);

    try {
      const response = await fetch('http://localhost:5000/api/import-schedules/teaches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ teaches }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.data);
        if (data.data.failed.length === 0) {
          setTimeout(() => {
            onSuccess();
            handleClose();
          }, 2000);
        }
      } else {
        setError(data.error || 'Import thất bại');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi import');
    } finally {
      setImporting(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setJsonText(content);
    };
    reader.readAsText(file);
  };

  const handleClose = () => {
    setJsonText('');
    setError(null);
    setResult(null);
    onClose();
  };

  const handleUseExample = () => {
    setJsonText(exampleJson);
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Stack direction="row" spacing={1} alignItems="center">
          <Upload size={24} />
          <Typography variant="h6">Import Lớp Cố Định của Giáo Viên</Typography>
        </Stack>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3}>
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {result && (
            <Alert severity={result.failed.length === 0 ? 'success' : 'warning'}>
              <Typography variant="subtitle2">
                Kết quả import: {result.success.length} thành công, {result.failed.length} thất bại
              </Typography>
              
              {result.failed.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" fontWeight="bold">Lỗi:</Typography>
                  <List dense>
                    {result.failed.slice(0, 5).map((item, idx) => (
                      <ListItem key={idx}>
                        <ListItemText
                          primary={`Dòng ${item.index + 1}: ${item.error}`}
                          secondary={JSON.stringify(item.data)}
                        />
                      </ListItem>
                    ))}
                    {result.failed.length > 5 && (
                      <ListItem>
                        <ListItemText primary={`... và ${result.failed.length - 5} lỗi khác`} />
                      </ListItem>
                    )}
                  </List>
                </Box>
              )}
            </Alert>
          )}

          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Định dạng JSON:
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Mỗi phân công dạy cần có các trường sau:
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
              <Chip label="teacherEmail hoặc teacherName" size="small" />
              <Chip label="subjectCode hoặc subjectName" size="small" />
              <Chip label="className (VD: 10A1, 11B2)" size="small" />
              <Chip label="classType (fixed | session)" size="small" variant="outlined" />
              <Chip label="dayOfWeek" size="small" />
              <Chip label="startTime (HH:mm)" size="small" />
              <Chip label="endTime (HH:mm)" size="small" />
              <Chip label="notes (tùy chọn)" size="small" variant="outlined" />
            </Stack>
            
            <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<FileText />}
                onClick={handleUseExample}
              >
                Dùng ví dụ mẫu
              </Button>
              <Button
                variant="outlined"
                size="small"
                component="label"
                startIcon={<Upload />}
              >
                Tải file JSON
                <input
                  type="file"
                  accept=".json"
                  hidden
                  onChange={handleFileUpload}
                />
              </Button>
            </Stack>
          </Box>

          <TextField
            label="Dán JSON vào đây"
            multiline
            rows={12}
            fullWidth
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            placeholder={exampleJson}
            disabled={importing}
            sx={{
              '& textarea': {
                fontFamily: 'monospace',
                fontSize: '0.875rem',
              },
            }}
          />
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={importing}>
          Đóng
        </Button>
        <Button
          onClick={handleImport}
          variant="contained"
          disabled={importing || !jsonText.trim()}
          startIcon={importing ? <CircularProgress size={16} /> : <Upload />}
        >
          {importing ? 'Đang import...' : 'Import'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
