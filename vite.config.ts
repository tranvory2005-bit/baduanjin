import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => {
  return {
    base: './', // <-- Added relative path resolution
    plugins: [react(), tailwindcss()],
    // ...
