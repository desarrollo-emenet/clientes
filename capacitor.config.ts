import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.miemenet.app',
  appName: 'Mi emenet',
  webDir: 'dist/front/browser',
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
  server: {  
    cleartext: true, 
    hostname: 'mi.emenet.mx',           
    androidScheme: 'https',   
    allowNavigation: ['://speedtest.com']  
  },
  android: {
    allowMixedContent: true   
  }
};

export default config;
