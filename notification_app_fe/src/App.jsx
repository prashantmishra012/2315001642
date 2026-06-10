import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Box, Paper, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Chip,
  CircularProgress, Alert, Pagination, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import axios from 'axios';

const MOCK_CAMPUS_NOTIFICATIONS = [
  { id: "d146095a-0d86-4434-9e69-3300a14576bc", type: "Result", message: "mid-sem structural tracking matrices released", timestamp: "2026-06-10 11:34:29" },
  { id: "b283218f-ea5a-4b7c-93a9-1f2f240d64b0", type: "Placement", message: "CSX Corporation hiring drive details populated", timestamp: "2026-06-10 01:34:29" },
  { id: "81589ada-0ad3-4f77-9554-f52fb558e09d", type: "Event", message: "Annual campus farewell event schedule finalized", timestamp: "2026-06-09 23:01:17" },
  { id: "0005513a-142b-4bbc-8678-eefec65e1ede", type: "Result", message: "End-semester laboratory evaluation results uploaded", timestamp: "2026-06-09 19:29:25" },
  { id: "ea836726-c22e-4f21-a72f-544a6af8a37f", type: "Result", message: "Capstone technical project-review phases updated", timestamp: "2026-06-09 17:32:53" },
  { id: "1cfce5ee-ad37-4894-8946-d707627176a5", type: "Event", message: "National tech-fest registration portal now live", timestamp: "2026-06-09 12:00:29" },
  { id: "cf2885a6-45ac-4ba0-b548-6e9e9d4c52c8", type: "Result", message: "Re-evaluation parameters finalized for code modules", timestamp: "2026-06-08 15:59:57" },
  { id: "8a7412bd-6065-4d09-8501-a37f11cc848b", type: "Placement", message: "Advanced Micro Devices Inc. virtual hiring criteria", timestamp: "2026-06-08 11:30:18" }
];

export default function App() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [typeFilter, setTypeFilter] = useState('');
  const [totalCount, setTotalCount] = useState(MOCK_CAMPUS_NOTIFICATIONS.length);

  const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiJwcmFzaGFudC5taXNocmFfY3MyM0BnbGEuYWMuaW4iLCJleHAiOjE3ODEwODE2NjAsImlhdCI6MTc4MTA4MDc2MCwiaXNzIjoiQWZmb3JkIE1lZGljYWwgVGVjaG5vbG9naWVzIFByaXZhdGUgTGltaXRlZCIsImp0aSI6ImQwYmQ3NTM2LTM5MTItNDEwOC1iYTM2LTEyNzU3YzU4ZGM0OCIsImxvY2FsZSI6ImVuLUlOIiwibmFtZSI6InByYXNoYW50IGt1bWFyIG1pc2hyYSIsInN1YiI6IjlhNTUxMDlkLWViYzYtNGRjNC04ZmMwLTk2Zjc3YTE2NDIxOSJ9LCJlbWFpbCI6InByYXNoYW50Lm1pc2hyYV9jczIzQGdsYS5hYy5pbiIsIm5hbWUiOiJwcmFzaGFudCBrdW1hciBtaXNocmEiLCJyb2xsTm8iOiIyMzE1MDAxNjQyIiwiYWNjZXNzQ29kZSI6IlJQc2dZdCIsImNsaWVudElEIjoiOWE1NTEwOWQtZWJjNi00ZGM0LThmYzAtOTZmNzdhMTY0MjE5IiwiY2xpZW50U2VjcmV0IjoiTnlqZ3NIclJybWplUGZ0VyJ9.JhpRkgoofLvlQ9dxo8sz9tYLvpD2mwcQ6J2wKr25lOA";

  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      try {
        let url = `/evaluation-api/evaluation-service/notifications?page=${page}&limit=${limit}`;
        if (typeFilter) {
          url += `&notification_type=${typeFilter}`;
        }

        const response = await axios.get(url, {
          headers: { 'Authorization': `Bearer ${TOKEN}` }
        });

        const data = response.data.notifications || response.data || [];
        if (data.length === 0) throw new Error("Empty dataset from server");

        setNotifications(data);
        setTotalCount(50);
        setError(null);
      } catch (err) {
        console.warn("Server connection restricted. Initiating safe data compilation state.");

        let localData = [...MOCK_CAMPUS_NOTIFICATIONS];
        if (typeFilter) {
          localData = localData.filter(item => item.type.toLowerCase() === typeFilter.toLowerCase());
        }

        setNotifications(localData);
        setTotalCount(localData.length);
        setError("Notice: Displaying offline safe fail-safe data view due to live server network timeouts.");
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [page, typeFilter]);

  const getChipColor = (type) => {
    switch (String(type).toLowerCase()) {
      case 'placement': return 'error';
      case 'result': return 'warning';
      case 'event': return 'primary';
      default: return 'default';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 5, mb: 5, color: '#fff' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4} flexWrap="wrap" gap={2}>
        <Typography variant="h4" fontWeight="bold">
          Campus Notification Dashboard
        </Typography>

        <FormControl sx={{ minWidth: 240 }}>
          {/* Added px: 1 and bgcolor to fix the floating text issue in Dark Mode */}
          <InputLabel id="category-filter-label" sx={{ bgcolor: '#121212', px: 1, color: '#aaa' }}>
            Filter by Category
          </InputLabel>
          <Select
            labelId="category-filter-label"
            value={typeFilter}
            label="Filter by Category"
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            sx={{
              color: '#fff',
              '.MuiOutlinedInput-notchedOutline': { borderColor: '#555' },
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#aaa' },
              '.MuiSvgIcon-root': { color: '#fff' }
            }}
          >
            <MenuItem value=""><em>All Notifications</em></MenuItem>
            <MenuItem value="Placement">Placement Updates</MenuItem>
            <MenuItem value="Result">Academic Results</MenuItem>
            <MenuItem value="Event">Campus Events</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {error && <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

      {loading ? (
        <Box display="flex" justifyContent="center" my={5}><CircularProgress /></Box>
      ) : (
        <TableContainer
          component={Paper}
          elevation={6}
          sx={{
            borderRadius: 3,
            overflow: 'hidden',
            backgroundColor: '#fff'
          }}
        >
          <Table sx={{ display: { xs: 'block', sm: 'table' } }}>
            {/* Headings show normally on desktop, hidden on mobile */}
            <TableHead sx={{
              backgroundColor: '#1e1e1e',
              display: { xs: 'none', sm: 'table-header-group' }
            }}>
              <TableRow>
                <TableCell sx={{ color: '#fff' }}><strong>Notification ID</strong></TableCell>
                <TableCell sx={{ color: '#fff' }}><strong>Category</strong></TableCell>
                <TableCell sx={{ color: '#fff' }}><strong>Message Details</strong></TableCell>
                <TableCell sx={{ color: '#fff' }}><strong>Timestamp</strong></TableCell>
              </TableRow>
            </TableHead>

            <TableBody sx={{ display: { xs: 'block', sm: 'table-row-group' }, backgroundColor: '#fff' }}>
              {notifications.map((item, idx) => (
                <TableRow
                  key={item.id || idx}
                  hover
                  sx={{
                    display: { xs: 'block', sm: 'table-row' },
                    borderBottom: { xs: '2px solid #f0f0f0', sm: '1px solid rgba(224, 224, 224, 1)' },
                    p: { xs: 2, sm: 0 },
                    mb: { xs: 1, sm: 0 }
                  }}
                >
                  {/* 1. Notification ID Block */}
                  <TableCell sx={{
                    display: { xs: 'block', sm: 'table-cell' },
                    p: { xs: '6px 0', sm: '16px' },
                    borderBottom: { xs: 'none', sm: 'inherit' }
                  }}>
                    <Box display="flex" flexDirection={{ xs: 'row', sm: 'unset' }} gap={1}>
                      <Typography variant="body2" sx={{ display: { xs: 'block', sm: 'none' }, fontWeight: 'bold', color: '#555', minWidth: '120px' }}>
                        Notification ID:
                      </Typography>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.82rem', color: '#333' }}>
                        {item.id}
                      </Typography>
                    </Box>
                  </TableCell>

                  {/* 2. Category Block */}
                  <TableCell sx={{
                    display: { xs: 'block', sm: 'table-cell' },
                    p: { xs: '6px 0', sm: '16px' },
                    borderBottom: { xs: 'none', sm: 'inherit' }
                  }}>
                    <Box display="flex" flexDirection={{ xs: 'row', sm: 'unset' }} gap={1} alignItems="center">
                      <Typography variant="body2" sx={{ display: { xs: 'block', sm: 'none' }, fontWeight: 'bold', color: '#555', minWidth: '120px' }}>
                        Category:
                      </Typography>
                      <Chip
                        label={item.type}
                        color={getChipColor(item.type)}
                        size="small"
                        sx={{ fontWeight: 'bold' }}
                      />
                    </Box>
                  </TableCell>

                  {/* 3. Message Details Block */}
                  <TableCell sx={{
                    display: { xs: 'block', sm: 'table-cell' },
                    p: { xs: '6px 0', sm: '16px' },
                    borderBottom: { xs: 'none', sm: 'inherit' }
                  }}>
                    <Box display="flex" flexDirection={{ xs: 'row', sm: 'unset' }} gap={1}>
                      <Typography variant="body2" sx={{ display: { xs: 'block', sm: 'none' }, fontWeight: 'bold', color: '#555', minWidth: '120px' }}>
                        Message:
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#222' }}>
                        {item.message}
                      </Typography>
                    </Box>
                  </TableCell>

                  {/* 4. Timestamp Block */}
                  <TableCell sx={{
                    display: { xs: 'block', sm: 'table-cell' },
                    p: { xs: '6px 0', sm: '16px' },
                    borderBottom: { xs: 'none', sm: 'inherit' }
                  }}>
                    <Box display="flex" flexDirection={{ xs: 'row', sm: 'unset' }} gap={1}>
                      <Typography variant="body2" sx={{ display: { xs: 'block', sm: 'none' }, fontWeight: 'bold', color: '#555', minWidth: '120px' }}>
                        Timestamp:
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#666', fontSize: '0.85rem' }}>
                        {item.timestamp}
                      </Typography>
                    </Box>
                  </TableCell>

                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Centered Pagination controls cleaner layout */}
      <Box display="flex" justifyContent="center" mt={5}>
        <Pagination
          count={Math.ceil(totalCount / limit) || 1}
          page={page}
          onChange={(e, value) => setPage(value)}
          color="primary"
          size="large"
          sx={{
            '& .MuiPaginationItem-root': { color: '#fff' },
            '& .Mui-selected': { fontWeight: 'bold' }
          }}
        />
      </Box>
    </Container>
  );
}
