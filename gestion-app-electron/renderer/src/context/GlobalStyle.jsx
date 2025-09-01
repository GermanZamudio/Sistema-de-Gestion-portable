import { createGlobalStyle } from 'styled-components';

const GlobalStyle = createGlobalStyle`
  /* Reset básico */
  *, *::before, *::after {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html {
    scroll-behavior: smooth;
  }

  body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background-color: #f4f6f9;  /* color de fondo claro */
    color: #2c3e50;
    min-height: 100vh;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
@media (max-width: 900px) {
  body {
    margin: 15%;
  }
}
  a {
    color: #357edd; /* azul Bootstrap */
    text-decoration: none;
    transition: color 0.2s ease;
  }

  a:hover {
    color: #285bb5;
  }

  button, input, select, textarea {
    font-family: inherit;
    border: 1px solid #ccc;
    padding: 0.5em 0.75em;
    border-radius: 6px;
    background-color: white;
    color: #2c3e50;
    transition: border-color 0.3s ease, box-shadow 0.3s ease;
  }

  button:focus,
  input:focus,
  select:focus,
  textarea:focus {
    outline: none;
    border-color: #357edd;
    box-shadow: 0 0 0 2px rgba(53, 126, 221, 0.2);
  }

  ::selection {
    background-color: #cce0ff;
    color: #000;
  }

  /* Scrollbar minimalista */
  ::-webkit-scrollbar {
    width: 8px;
  }

  ::-webkit-scrollbar-thumb {
    background-color: #bbb;
    border-radius: 4px;
  }

  ::-webkit-scrollbar-track {
    background: transparent;
  }
`;

export default GlobalStyle;
