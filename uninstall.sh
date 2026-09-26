#!/usr/bin/env bash
# ==============================================================================
# Script de Desinstalação do Mond Clock Desktop Widget
# ==============================================================================

set -e

RED="\033[1;31m"
GREEN="\033[1;32m"
YELLOW="\033[1;33m"
RESET="\033[0m"

UUID="mond-clock@local"
TARGET_DIR="$HOME/.local/share/gnome-shell/extensions/$UUID"
USER_FONTS_DIR="$HOME/.local/share/fonts/mond-clock"

echo -e "${YELLOW}Desinstalando Mond Clock Extension...${RESET}"

if command -v gnome-extensions &> /dev/null; then
    gnome-extensions disable "$UUID" 2>/dev/null || true
fi

if [ -d "$TARGET_DIR" ]; then
    rm -rf "$TARGET_DIR"
    echo -e "${GREEN}✓ Diretório da extensão removido: $TARGET_DIR${RESET}"
fi

read -p "Deseja também remover as fontes instaladas em $USER_FONTS_DIR? (s/N): " -r CONFIRM
if [[ $CONFIRM =~ ^[Ss]$ ]]; then
    if [ -d "$USER_FONTS_DIR" ]; then
        rm -rf "$USER_FONTS_DIR"
        fc-cache -f "$HOME/.local/share/fonts"
        echo -e "${GREEN}✓ Fontes removidas.${RESET}"
    fi
fi

echo -e "${GREEN}Desinstalação concluída com sucesso!${RESET}"
