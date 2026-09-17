import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.miemenet.app',
  appName: 'Mi emenet',
  webDir: 'dist/front/browser',
  server: {                       //evitar validacion https en android 
    cleartext: true,            //y probar en localhost
    androidScheme: 'http'     
  },
  android: {
    allowMixedContent: true   
  }
};

export default config;
