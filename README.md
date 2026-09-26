# Mond Clock Extension (GNOME Shell 48)

Widget de desktop idêntico à clássica skin **Mond** do Rainmeter, portado para o **GNOME Shell 48 no Debian 13 (Trixie)** com suporte a **Wayland** e **X11**.

![Amostra Visual do Widget](assets/exemplo.png)

## Recursos

- **Tipografia Fiel ao Mond Original**: Fonte futurista Anurati para o dia da semana e Quicksand para data e hora.
- **Normalização de Acentos**: Opção inteligente de normalizar caracteres especiais do dia (ex: `SABADO` em vez de falhas de renderização de acentos na Anurati).
- **Sem Truncamento**: Textos sempre exibidos por completo, sem cortes com elipses (`...`).
- **Arrasto Suave (Drag-and-Drop)**: Clique e arraste o widget para qualquer lugar da tela (com cursor dinâmico e captura contínua via `Clutter Grab`).
- **Zoom via Scroll**: Role a roda do mouse sobre o widget para aumentar ou diminuir a escala em tempo real.
- **Painel de Preferências Completo (Libadwaita)**:
  - **Tamanhos de Fontes**: Ajuste individual do tamanho do Dia, Data e Hora (em pt).
  - **Cores Personalizadas**: Seletor de cores nativo GTK4 com canal alfa para cada elemento.
  - **Sombra de Texto (Text Shadow)**: Controle de cor, opacidade, raio de desfoque (blur) e deslocamentos horizontal/vertical.
  - **Layout & Espaçamento**: Espaçamento vertical entre linhas, formato 24h/12h e alternância de maiúsculas.
  - **Travar Posição**: Opção de bloquear arraste acidental e botão para redefinir coordenadas padrão.

## Estrutura do Projeto

- `metadata.json` - Manifesto para o GNOME Shell 48.
- `extension.js` - Lógica em GJS / Clutter / St com Drag-and-Drop, Scroll-Zoom e Duplo Clique.
- `stylesheet.css` - Estilos visuais com fontes Anurati e Quicksand.
- `prefs.js` - Janela de configurações gráfica nativa em Libadwaita.
- `schemas/` - Esquema GSettings de persistência de coordenadas e opções.
- `fonts/` - Fontes de referência do projeto (`Anurati.otf` e `Quicksand.otf`).
- `install.sh` - Script de compilação e instalação automatizada.
- `uninstall.sh` - Script de desinstalação.
- `Makefile` - Atalhos de comando (`make install`, `make uninstall`).

## Como Instalar / Atualizar

Execute no terminal dentro desta pasta:

```bash
chmod +x install.sh
./install.sh
```

_(ou `make install`)_

O instalador verifica as fontes no sistema; se não estiverem instaladas, instala automaticamente a partir da pasta `fonts/` para `~/.local/share/fonts/mond-clock/`.
Em seguida, compila os schemas e registra a extensão em `~/.local/share/gnome-shell/extensions/mond-clock@local`.

## Abrir Configurações

- Dê um **duplo clique** sobre o widget na área de trabalho, ou
- Execute no terminal:
  ```bash
  gnome-extensions prefs mond-clock@local
  ```

## Como Desinstalar

```bash
./uninstall.sh
```

_(ou `make uninstall`)_
