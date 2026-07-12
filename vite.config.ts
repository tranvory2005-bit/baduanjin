import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/baduanjin-app/', // <-- Change this to match your EXACT GitHub repository name
});
