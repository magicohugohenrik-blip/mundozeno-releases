/**
 * Camada Android (Capacitor) do Mundo Zeno.
 *
 * A aplicação web/PWA continua sendo a base: o app Android é apenas um
 * invólucro que abre a plataforma publicada em tela cheia, pronto para o
 * modo Quiosque / Dispositivo Dedicado do Android.
 *
 * Para gerar o projeto Android, ver ANDROID.md.
 */
import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "br.com.mundozeno.mesa",
  appName: "Mundo Zeno",
  // Sem build local: o app carrega a plataforma publicada (mesma versão da web).
  webDir: "public",
  server: {
    url: "https://turmadozeno.lovable.app",
    cleartext: false,
    androidScheme: "https",
  },
  android: {
    allowMixedContent: false,
    backgroundColor: "#1D4ED8",
    // Evita que o botão "voltar" tire a criança da experiência.
    webContentsDebuggingEnabled: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: "#1D4ED8",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
    },
  },
};

export default config;
