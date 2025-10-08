import React from 'react';
import ReactDOM from 'react-dom/client';
import { createTheme, ThemeProvider } from "@mui/material/styles";
import Settings from './setting';


const theme = createTheme({
  palette: {
    mode: "light",
  },
});


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
        <ThemeProvider theme={theme}>
            <Settings/>
        </ThemeProvider>
);

