import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.contextflow.app',
  appName: 'ContextFlow',
  webDir: 'dist',
  backgroundColor: '#141311',
  android: {
    allowMixedContent: false,
  },
}

export default config
