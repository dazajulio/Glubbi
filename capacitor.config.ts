import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.glubbi.www.twa',
  appName: 'Glubbi',
  webDir: 'out', // The directory where Next.js exports static files (if using static export)
  server: {
    // Para desarrollo local puedes apuntar a localhost
    // url: 'http://10.0.2.2:3000', // (10.0.2.2 es el localhost del emulador de Android)
    // Para producción, apuntaremos directamente a la URL de Vercel
    url: 'https://glubbi.app/glubbi',
    cleartext: true
  }
};

export default config;
