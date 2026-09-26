#!/usr/bin/env bash
# ==============================================================================
# Script de Instalação e Compilação do Mond Clock Desktop Widget
# Extensão para GNOME Shell 48 no Debian 13 (Wayland / X11)
# ==============================================================================

set -e

# Cores para saída no terminal
GREEN="\033[1;32m"
BLUE="\033[1;34m"
YELLOW="\033[1;33m"
RED="\033[1;31m"
RESET="\033[0m"

UUID="mond-clock@jaovinic"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET_DIR="$HOME/.local/share/gnome-shell/extensions/$UUID"
USER_FONTS_DIR="$HOME/.local/share/fonts/mond-clock"

echo -e "${BLUE}======================================================${RESET}"
echo -e "${BLUE}   Instalador do Mond Clock Widget (GNOME Shell 48)   ${RESET}"
echo -e "${BLUE}======================================================${RESET}"
echo -e "Diretório do projeto de origem: ${YELLOW}$SCRIPT_DIR${RESET}"
echo -e "Diretório de destino da extensão: ${YELLOW}$TARGET_DIR${RESET}\n"

# 1. Verificar dependência do compilador de schemas
echo -e "${BLUE}[1/5] Verificando ferramentas do sistema...${RESET}"
if ! command -v glib-compile-schemas &> /dev/null; then
    echo -e "${RED}Erro: 'glib-compile-schemas' não foi encontrado!${RESET}"
    echo -e "Instale a ferramenta necessária executando:"
    echo -e "  ${YELLOW}sudo apt update && sudo apt install -y libglib2.0-bin${RESET}"
    exit 1
fi
echo -e "${GREEN}✓ glib-compile-schemas encontrado.${RESET}"

# 2. Gerenciamento e verificação das fontes (Anurati e Quicksand)
echo -e "\n${BLUE}[2/5] Verificando fontes tipográficas...${RESET}"
NEED_FONT_UPDATE=0

if ! fc-list : family | grep -qi "Anurati"; then
    echo -e "${YELLOW}Fonte 'Anurati' não detectada no sistema.${RESET}"
    NEED_FONT_UPDATE=1
else
    echo -e "${GREEN}✓ Fonte 'Anurati' já está disponível.${RESET}"
fi

if ! fc-list : family | grep -qi "Quicksand"; then
    echo -e "${YELLOW}Fonte 'Quicksand' não detectada no sistema.${RESET}"
    NEED_FONT_UPDATE=1
else
    echo -e "${GREEN}✓ Fonte 'Quicksand' já está disponível.${RESET}"
fi

if [ $NEED_FONT_UPDATE -eq 1 ]; then
    echo -e "${BLUE}Instalando as fontes de referência do projeto em: ${YELLOW}$USER_FONTS_DIR${RESET}"
    mkdir -p "$USER_FONTS_DIR"
    cp -v "$SCRIPT_DIR/fonts/"*.otf "$USER_FONTS_DIR/"
    echo -e "Atualizando cache de fontes do usuário (fc-cache)..."
    fc-cache -f "$HOME/.local/share/fonts"
    echo -e "${GREEN}✓ Fontes instaladas e registradas com sucesso!${RESET}"
fi

# 3. Copiar os arquivos para o diretório de extensões do GNOME Shell
echo -e "\n${BLUE}[3/5] Instalando arquivos da extensão...${RESET}"
mkdir -p "$TARGET_DIR/schemas"
mkdir -p "$TARGET_DIR/fonts"

cp -v "$SCRIPT_DIR/metadata.json" "$TARGET_DIR/"
cp -v "$SCRIPT_DIR/extension.js" "$TARGET_DIR/"
cp -v "$SCRIPT_DIR/stylesheet.css" "$TARGET_DIR/"
cp -v "$SCRIPT_DIR/prefs.js" "$TARGET_DIR/"
cp -v "$SCRIPT_DIR/schemas/"*.gschema.xml "$TARGET_DIR/schemas/"
cp -v "$SCRIPT_DIR/fonts/"*.otf "$TARGET_DIR/fonts/"

# 4. Compilar o esquema GSettings
echo -e "\n${BLUE}[4/5] Compilando esquema GSettings...${RESET}"
glib-compile-schemas "$TARGET_DIR/schemas"
echo -e "${GREEN}✓ Esquemas GSettings compilados com sucesso.${RESET}"

# 5. Habilitar a extensão no GNOME Shell
echo -e "\n${BLUE}[5/5] Registrando e habilitando a extensão...${RESET}"
if command -v gnome-extensions &> /dev/null; then
    gnome-extensions enable "$UUID" 2>/dev/null || true
    echo -e "${GREEN}✓ Extensão registrada como habilitada.${RESET}"
fi

echo -e "\n${GREEN}======================================================${RESET}"
echo -e "${GREEN}     Instalação do Mond Clock Concluída com Sucesso!  ${RESET}"
echo -e "${GREEN}======================================================${RESET}"
echo -e "Dicas importantes:"
echo -e "1. No ${YELLOW}Wayland${RESET}, se for a primeira vez instalando a extensão,"
echo -e "   é necessário ${YELLOW}encerrar a sessão (Logout)${RESET} e fazer login novamente"
echo -e "   para que o GNOME Shell carregue a nova extensão."
echo -e "2. Para abrir as preferências: ${YELLOW}gnome-extensions prefs $UUID${RESET}"
echo -e "3. Para verificar logs: ${YELLOW}journalctl -f -o cat /usr/bin/gnome-shell | grep -i mond-clock${RESET}\n"
