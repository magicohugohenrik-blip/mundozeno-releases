# Mundo Zeno — aplicativo da mesa (Windows)

Empacotamento da plataforma para rodar em modo quiosque nas mesas interativas.

## Como gerar o instalador

Em um computador Windows, dentro desta pasta:

```bash
npm install
npm run dist
```

O instalador sai em `dist/MundoZeno-Setup-<versão>.exe`.

Para testar sem empacotar: `npm start` (abre em tela cheia, sem quiosque).

Para apontar a mesa para o ambiente de teste em vez do site publicado:

```bash
set ZENO_URL=https://project--60ac1bd7-38fe-4c45-8cd4-d0d970a40eb5-dev.lovable.app
npm start
```

## O que o aplicativo já faz

- Abre direto no ambiente infantil, em tela cheia e sem menus, barra ou atalhos visíveis.
- Bloqueia navegação para fora do Mundo Zeno e links externos.
- Uma instância só por computador.
- Reconecta sozinho quando a internet volta (a mesa continua jogando offline).
- Ponte com a área técnica: versão, início automático com o Windows, quiosque nativo, atualizar e sair.

## Início automático

Na área técnica da mesa (toque longo na logo), ligue **Iniciar com o Windows**.
Isso registra o aplicativo no login do usuário — não apaga nenhum dado da mesa.

## Modo quiosque do Windows

Para bloquear também o sistema operacional, configure o **Assigned Access**
(Acesso Atribuído) apontando para o executável do Mundo Zeno, com um usuário local
dedicado e login automático.

## Atualizações

Como o conteúdo é carregado da plataforma publicada, uma nova versão dos jogos chega
sem reinstalar nada: basta usar **Atualizar aplicativo** na área técnica. Reinstalar o
`.exe` também preserva alunos, resultados, fila offline e o código da mesa.

## Desligar o computador pela mesa

Na área técnica (toque longo na logo) existe **Desligar computador**. Ao confirmar, o
Mundo Zeno salva a fila local de partidas, avisa o jogo aberto para gravar a sessão,
fecha o aplicativo e pede ao Windows um desligamento normal (`shutdown /s /t 5`).
Nunca há corte de energia, então nenhum dado local se perde.

## Botão físico de energia = desligamento normal

Para que apertar o botão da mesa também desligue com segurança (e não suspenda):

1. Painel de Controle → Opções de Energia → **Escolher a função dos botões de energia**.
2. Em "Ao pressionar o botão de energia", escolha **Desligar** (na bateria e na tomada).
3. Clique em "Alterar configurações não disponíveis no momento" e **desmarque**
   "Ligar inicialização rápida", para o desligamento ser completo.
4. Salve as alterações.

Pela linha de comando (como administrador), o mesmo resultado:

```bat
powercfg /setacvalueindex SCHEME_CURRENT SUB_BUTTONS PBUTTONACTION 3
powercfg /setdcvalueindex SCHEME_CURRENT SUB_BUTTONS PBUTTONACTION 3
powercfg /setactive SCHEME_CURRENT
powercfg /hibernate off
```

Recomendado ainda: desativar suspensão e desligamento de tela
(`powercfg /change standby-timeout-ac 0` e `powercfg /change monitor-timeout-ac 0`)
para a mesa nunca dormir durante o uso.

## Usuário comum não vê o Windows

Com o **Assigned Access** (Acesso Atribuído) apontando para o Mundo Zeno e login
automático em um usuário local dedicado, a criança nunca chega à área de trabalho,
menu Iniciar ou Explorador de Arquivos — o desligamento sempre passa pela área técnica.
