# Mundo Zeno — Tablet Android (modo Quiosque)

A camada Android é **adicional**: a versão Web/PWA e o aplicativo Windows
(`desktop/`) continuam funcionando exatamente como antes. O app Android é um
invólucro Capacitor que abre a plataforma publicada em tela cheia.

## 1. Gerar o projeto Android (uma vez, em qualquer computador com Node.js)

```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap add android
npx cap sync android
```

O projeto nativo aparece na pasta `android/` (usa `capacitor.config.ts` da raiz:
appId `br.com.mundozeno.mesa`, nome "Mundo Zeno", tela cheia, paisagem).

## 2. Gerar APK / AAB

Com o Android Studio instalado:

```bash
npx cap open android
```

- APK de teste: `Build > Build Bundle(s)/APK(s) > Build APK(s)`
  → `android/app/build/outputs/apk/debug/app-debug.apk`
- AAB para a Play Store / MDM: `Build > Generate Signed Bundle / APK` → Android App Bundle
  → `android/app/build/outputs/bundle/release/app-release.aab`

Sem Android Studio, por linha de comando:

```bash
cd android && ./gradlew assembleDebug      # APK
cd android && ./gradlew bundleRelease      # AAB (precisa de chave de assinatura)
```

## 3. Instalar no tablet

1. Ative "Origens desconhecidas" (ou instale via MDM).
2. Copie o `.apk` para o tablet (USB, cabo, e-mail ou `adb install app-debug.apk`).
3. Abra o Mundo Zeno e ative a mesa com o código `MESA-XXXX-XXXX` gerado no painel.

## 4. Modo Quiosque / Dispositivo Dedicado (feito no tablet, não no código)

Opção A — **Fixar tela** (simples, sem MDM):
Ajustes > Segurança > Fixação de tela → ativar, exigir PIN ao desafixar.
Abrir o Mundo Zeno → Recentes → fixar.

Opção B — **Dispositivo Dedicado / MDM** (recomendado em rede de escolas):
Fazer o *enrollment* do tablet em um MDM (Android Enterprise, Scalefusion,
Hexnode, Fully Kiosk, TinyMDM…) e definir o Mundo Zeno como **aplicativo em
modo quiosque (lock task)**. No MDM configure também:

- Início automático do app ao ligar (boot).
- Tela sempre acesa e sem bloqueio.
- Orientação paisagem travada.
- Barra de status e botões Home/Recentes bloqueados.
- Volume e brilho fixos, se desejado.

Opção C — **Launcher quiosque** (ex. Fully Kiosk Browser em modo app
dedicado / launcher padrão) apontando para o Mundo Zeno.

Nenhuma dessas travas é feita pelo código do site: o Android é quem bloqueia.

## 5. Saída para manutenção (administrador)

- Área Técnica escondida: **toque longo de 2,5 s na logo** da mesa e código de acesso.
- Dentro dela, o modo quiosque da aplicação sai com **PIN** (padrão 2468, alterável).
- Sair do quiosque do Android: PIN da fixação de tela, senha do MDM, ou desafixar
  pelo botão Voltar + Recentes pressionados juntos (fixação de tela).
- Nenhum botão de saída fica visível para as crianças.

## 6. Offline

O tablet continua usando os recursos offline já existentes: fila local de
partidas em `localStorage`, relatório simplificado da mesa e sincronização
automática quando a internet volta.
