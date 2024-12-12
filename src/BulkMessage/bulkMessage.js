import React from 'react';
import ReactDOM from 'react-dom/client';
import { createTheme, ThemeProvider } from "@mui/material/styles";
import BulkMessage from './bulkMessage.jsx';


const theme = createTheme({
  palette: {
    mode: "light",
  },
});


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
        <ThemeProvider theme={theme}>
            <BulkMessage/>
        </ThemeProvider>
);

