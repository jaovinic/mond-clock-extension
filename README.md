# Mond Clock Extension (GNOME Shell 48)

Widget de desktop idêntico à clássica skin **Mond** do Rainmeter, portado para o **GNOME Shell 48 no Debian 13 (Trixie)** com suporte a **Wayland**.

## Estrutura do Projeto

- `metadata.json` - Manifesto para o GNOME Shell 48.
- `extension.js` - Lógica em GJS / Clutter / St com Drag-and-Drop e Scroll-Zoom.
- `stylesheet.css` - Estilos visuais com fontes Anurati e Quicksand.
- `prefs.js` - Janela de configurações gráfica nativa em Libadwaita.
- `schemas/` - Esquema GSettings de persistência de coordenadas e opções.
- `fonts/` - Fontes de referência do projeto (`Anurati.otf` e `Quicksand.otf`).
- `install.sh` - Script de compilação e instalação automatizada.
- `uninstall.sh` - Script de desinstalação.
- `Makefile` - Atalhos de comando (`make install`, `make uninstall`).

## Como Instalar

Execute no terminal dentro desta pasta:

```bash
chmod +x install.sh
./install.sh
```
*(ou `make install`)*

O instalador verifica as fontes no sistema; se não estiverem instaladas, instala automaticamente a partir da pasta `fonts/` para `~/.local/share/fonts/mond-clock/`.
Em seguida, compila os schemas e registra a extensão em `~/.local/share/gnome-shell/extensions/mond-clock@local`.

## Como Desinstalar

```bash
./uninstall.sh
```
*(ou `make uninstall`)*
