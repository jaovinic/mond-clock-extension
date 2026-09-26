import Clutter from 'gi://Clutter';
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import St from 'gi://St';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import { Extension, gettext as _ } from 'resource:///org/gnome/shell/extensions/extension.js';

export default class MondClockExtension extends Extension {
    enable() {
        this._settings = this.getSettings();

        // 1. Criar o contêiner vertical principal
        this._container = new St.BoxLayout({
            name: 'mond-clock-widget',
            style_class: 'mond-container',
            vertical: true,
            reactive: true,
            can_focus: true,
            track_hover: true,
        });

        // 2. Criar os três rótulos de texto (Dia, Data, Hora)
        this._labelDay = new St.Label({
            style_class: 'mond-day',
            x_align: Clutter.ActorAlign.CENTER,
        });

        this._labelDate = new St.Label({
            style_class: 'mond-date',
            x_align: Clutter.ActorAlign.CENTER,
        });

        this._labelTime = new St.Label({
            style_class: 'mond-time',
            x_align: Clutter.ActorAlign.CENTER,
        });

        this._container.add_child(this._labelDay);
        this._container.add_child(this._labelDate);
        this._container.add_child(this._labelTime);

        // 3. Posicionamento e escala iniciais a partir do GSettings
        const posX = this._settings.get_double('pos-x');
        const posY = this._settings.get_double('pos-y');
        const scale = this._settings.get_double('scale');

        this._container.set_position(posX, posY);
        this._container.set_scale(scale, scale);

        // 4. Inserir na camada de fundo do GNOME (atrás de todas as janelas)
        Main.layoutManager._backgroundGroup.add_child(this._container);

        // 5. Configurar eventos de interação (Arrastar e Scroll)
        this._setupInteractions();

        // 6. Configurar observadores de configurações
        this._settingsSignals = [];
        this._settingsSignals.push(
            this._settings.connect('changed::scale', () => {
                const s = this._settings.get_double('scale');
                this._container.set_scale(s, s);
            })
        );
        this._settingsSignals.push(
            this._settings.connect('changed::clock-24h', () => {
                this._updateClock();
            })
        );
        this._settingsSignals.push(
            this._settings.connect('changed::text-color', () => {
                this._applyCustomColor();
            })
        );

        this._applyCustomColor();

        // 7. Atualização inicial e agendamento do timer de 1 segundo
        this._updateClock();
        this._timerId = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 1, () => {
            this._updateClock();
            return GLib.SOURCE_CONTINUE;
        });
    }

    _applyCustomColor() {
        const color = this._settings.get_string('text-color');
        if (color) {
            const style = `color: ${color};`;
            this._labelDay.set_style(style);
            this._labelDate.set_style(style);
            this._labelTime.set_style(style);
        }
    }

    _updateClock() {
        const now = GLib.DateTime.new_now_local();

        // 1. Formatação do Dia da Semana (Ex: SEXTA, SÁBADO, DOMINGO)
        const dayFormat = now.format('%A') || '';
        this._labelDay.set_text(dayFormat.toLocaleUpperCase('pt-BR'));

        // 2. Formatação da Data Completa: DD  MÊS,  AAAA. (Ex: 25  SETEMBRO,  2026.)
        const dayNum = now.format('%d');
        const monthName = (now.format('%B') || '').toLocaleUpperCase('pt-BR');
        const year = now.format('%Y');
        this._labelDate.set_text(`${dayNum}  ${monthName},  ${year}.`);

        // 3. Formatação da Hora: - HH:MM - ou - HH:MM AM/PM -
        const is24h = this._settings.get_boolean('clock-24h');
        if (is24h) {
            const timeStr = now.format('%H:%M');
            this._labelTime.set_text(`- ${timeStr} -`);
        } else {
            const timeStr = now.format('%I:%M');
            const ampm = (now.format('%p') || '').toLocaleUpperCase('pt-BR');
            this._labelTime.set_text(`- ${timeStr} ${ampm} -`);
        }
    }

    _setupInteractions() {
        let isDragging = false;
        let dragStartX = 0;
        let dragStartY = 0;
        let widgetStartX = 0;
        let widgetStartY = 0;

        // Clique para iniciar o arraste (Drag)
        this._container.connect('button-press-event', (actor, event) => {
            if (this._settings.get_boolean('lock-position')) return Clutter.EVENT_PROPAGATE;

            if (event.get_button() === 1) { // Botão esquerdo
                isDragging = true;
                const [stageX, stageY] = event.get_coords();
                dragStartX = stageX;
                dragStartY = stageY;
                [widgetStartX, widgetStartY] = actor.get_position();
                global.display.set_cursor(Clutter.CursorType.MOVE);
                return Clutter.EVENT_STOP;
            }
            return Clutter.EVENT_PROPAGATE;
        });

        // Movimento do mouse ao arrastar
        this._container.connect('motion-event', (actor, event) => {
            if (isDragging) {
                const [stageX, stageY] = event.get_coords();
                const deltaX = stageX - dragStartX;
                const deltaY = stageY - dragStartY;
                actor.set_position(widgetStartX + deltaX, widgetStartY + deltaY);
                return Clutter.EVENT_STOP;
            }
            return Clutter.EVENT_PROPAGATE;
        });

        // Soltar o mouse: grava as coordenadas finais no GSettings
        this._container.connect('button-release-event', (actor, event) => {
            if (isDragging && event.get_button() === 1) {
                isDragging = false;
                global.display.set_cursor(Clutter.CursorType.DEFAULT);
                const [finalX, finalY] = actor.get_position();
                this._settings.set_double('pos-x', finalX);
                this._settings.set_double('pos-y', finalY);
                return Clutter.EVENT_STOP;
            }
            return Clutter.EVENT_PROPAGATE;
        });

        // Roda do mouse (Scroll) para alterar a Escala (Zoom)
        this._container.connect('scroll-event', (actor, event) => {
            const direction = event.get_scroll_direction();
            let currentScale = this._settings.get_double('scale');
            const step = 0.05;

            if (direction === Clutter.ScrollDirection.UP) {
                currentScale = Math.min(currentScale + step, 3.0);
            } else if (direction === Clutter.ScrollDirection.DOWN) {
                currentScale = Math.max(currentScale - step, 0.4);
            } else {
                return Clutter.EVENT_PROPAGATE;
            }

            this._settings.set_double('scale', currentScale);
            return Clutter.EVENT_STOP;
        });
    }

    disable() {
        // Cancelar o timer periódio
        if (this._timerId) {
            GLib.source_remove(this._timerId);
            this._timerId = null;
        }

        // Desconectar observadores do GSettings
        if (this._settingsSignals && this._settings) {
            for (const id of this._settingsSignals) {
                this._settings.disconnect(id);
            }
            this._settingsSignals = [];
        }

        // Destruir o container Clutter e remover do desktop
        if (this._container) {
            this._container.destroy();
            this._container = null;
        }

        this._settings = null;
    }
}
