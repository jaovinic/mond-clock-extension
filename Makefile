UUID = mond-clock@local
TARGET_DIR = $(HOME)/.local/share/gnome-shell/extensions/$(UUID)

.PHONY: all build install uninstall clean

all: build

build:
	@echo "Compilando schemas localmente..."
	@glib-compile-schemas schemas/

install:
	@chmod +x install.sh
	@./install.sh

uninstall:
	@chmod +x uninstall.sh
	@./uninstall.sh

clean:
	@rm -f schemas/gschemas.compiled
