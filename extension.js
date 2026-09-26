import Clutter from 'gi://Clutter';
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import Meta from 'gi://Meta';
import Pango from 'gi://Pango';
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
        this._container.set_clip_to_allocation(false);

        // 2. Criar os três rótulos de texto (Dia, Data, Hora)
        this._labelDay = new St.Label({
            style_class: 'mond-day',
            x_align: Clutter.ActorAlign.CENTER,
            x_expand: true,
        });
        this._labelDay.set_clip_to_allocation(false);
        this._labelDay.clutter_text.set_ellipsize(Pango.EllipsizeMode.NONE);
        this._labelDay.clutter_text.set_line_wrap(false);

        this._labelDate = new St.Label({
            style_class: 'mond-date',
            x_align: Clutter.ActorAlign.CENTER,
            x_expand: true,
        });
        this._labelDate.set_clip_to_allocation(false);
        this._labelDate.clutter_text.set_ellipsize(Pango.EllipsizeMode.NONE);
        this._labelDate.clutter_text.set_line_wrap(false);

        this._labelTime = new St.Label({
            style_class: 'mond-time',
            x_align: Clutter.ActorAlign.CENTER,
            x_expand: true,
        });
        this._labelTime.set_clip_to_allocation(false);
        this._labelTime.clutter_text.set_ellipsize(Pango.EllipsizeMode.NONE);
        this._labelTime.clutter_text.set_line_wrap(false);

        this._container.add_child(this._labelDay);
        this._container.add_child(this._labelDate);
        this._container.add_child(this._labelTime);

        // 3. Posicionamento e escala iniciais a partir do GSettings
        const posX = this._settings.get_double('pos-x');
        const posY = this._settings.get_double('pos-y');
        const scale = this._settings.get_double('scale');

        this._container.set_position(posX, posY);
        this._container.set_scale(scale, scale);

        // 4. Inserir na camada de fundo do GNOME (sobre o wallpaper, sob as janelas)
        if (Main.layoutManager._backgroundGroup) {
            Main.layoutManager._backgroundGroup.add_child(this._container);
            Main.layoutManager._backgroundGroup.set_child_above_sibling(this._container, null);
        } else {
            global.window_group.add_child(this._container);
        }

        // 5. Configurar eventos de interação (Arrastar com grab, Scroll de Zoom e Duplo Clique)
        this._setupInteractions();

        // 6. Configurar observadores de configurações
        this._settingsSignals = [];

        const styleKeys = [
            'text-color',
            'color-day',
            'color-date',
            'color-time',
            'font-size-day',
            'font-size-date',
            'font-size-time',
            'widget-spacing',
            'shadow-enabled',
            'shadow-color',
            'shadow-blur',
            'shadow-x',
            'shadow-y',
        ];

        for (const key of styleKeys) {
            this._settingsSignals.push(
                this._settings.connect(`changed::${key}`, () => {
                    this._applyStyles();
                })
            );
        }

        const clockKeys = [
            'clock-24h',
            'remove-accents-day',
            'day-uppercase',
            'date-uppercase',
        ];

        for (const key of clockKeys) {
            this._settingsSignals.push(
                this._settings.connect(`changed::${key}`, () => {
                    this._updateClock();
                })
            );
        }

        this._settingsSignals.push(
            this._settings.connect('changed::scale', () => {
                const s = this._settings.get_double('scale');
                this._container.set_scale(s, s);
            })
        );

        this._settingsSignals.push(
            this._settings.connect('changed::pos-x', () => {
                if (!this._isDragging) {
                    this._container.set_x(this._settings.get_double('pos-x'));
                }
            })
        );

        this._settingsSignals.push(
            this._settings.connect('changed::pos-y', () => {
                if (!this._isDragging) {
                    this._container.set_y(this._settings.get_double('pos-y'));
                }
            })
        );

        // Aplicar estilos e relógio iniciais
        this._applyStyles();
        this._updateClock();

        // 7. Agendamento do timer de 1 segundo
        this._timerId = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 1, () => {
            this._updateClock();
            return GLib.SOURCE_CONTINUE;
        });
    }

    _applyStyles() {
        if (!this._container || !this._labelDay || !this._labelDate || !this._labelTime)
            return;

        const defaultTextColor = this._settings.get_string('text-color') || '#ffffff';
        const colorDay = this._settings.get_string('color-day') || defaultTextColor;
        const colorDate = this._settings.get_string('color-date') || defaultTextColor;
        const colorTime = this._settings.get_string('color-time') || defaultTextColor;

        const fontSizeDay = this._settings.get_double('font-size-day');
        const fontSizeDate = this._settings.get_double('font-size-date');
        const fontSizeTime = this._settings.get_double('font-size-time');
        const spacing = this._settings.get_double('widget-spacing');

        const shadowEnabled = this._settings.get_boolean('shadow-enabled');
        let shadowCss = '';
        if (shadowEnabled) {
            const sx = Math.round(this._settings.get_double('shadow-x'));
            const sy = Math.round(this._settings.get_double('shadow-y'));
            const blur = Math.round(this._settings.get_double('shadow-blur'));
            const shadowColor = this._settings.get_string('shadow-color') || 'rgba(0, 0, 0, 0.75)';
            shadowCss = `text-shadow: ${sx}px ${sy}px ${blur}px ${shadowColor};`;
        } else {
            shadowCss = 'text-shadow: none;';
        }

        this._container.set_style(`spacing: ${Math.round(spacing)}px;`);
        this._labelDay.set_style(`color: ${colorDay}; font-size: ${Math.round(fontSizeDay)}pt; ${shadowCss}`);
        this._labelDate.set_style(`color: ${colorDate}; font-size: ${Math.round(fontSizeDate)}pt; ${shadowCss}`);
        this._labelTime.set_style(`color: ${colorTime}; font-size: ${Math.round(fontSizeTime)}pt; ${shadowCss}`);
    }

    _updateClock() {
        if (!this._labelDay || !this._labelDate || !this._labelTime)
            return;

        const now = GLib.DateTime.new_now_local();

        // 1. Formatação do Dia da Semana (Ex: SEXTA, SÁBADO / SABADO, DOMINGO)
        let dayStr = now.format('%A') || '';
        if (this._settings.get_boolean('day-uppercase')) {
            dayStr = dayStr.toLocaleUpperCase('pt-BR');
        }
        if (this._settings.get_boolean('remove-accents-day')) {
            // Remove acentos (ex: SÁBADO -> SABADO, TERÇA -> TERCA)
            // Essencial para renderizar sem distorções nem fontes substitutas na Anurati
            dayStr = dayStr.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        }
        this._labelDay.set_text(dayStr);

        // 2. Formatação da Data Completa: DD  MÊS,  AAAA. (Ex: 26  SETEMBRO,  2026.)
        const dayNum = now.format('%d');
        let monthName = now.format('%B') || '';
        if (this._settings.get_boolean('date-uppercase')) {
            monthName = monthName.toLocaleUpperCase('pt-BR');
        }
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
        this._isDragging = false;
        this._dragGrab = null;
        let dragStartX = 0;
        let dragStartY = 0;
        let widgetStartX = 0;
        let widgetStartY = 0;
        let lastClickTime = 0;

        // Clique para iniciar arraste (Drag) ou Duplo clique para configurações
        this._container.connect('button-press-event', (actor, event) => {
            const button = event.get_button();
            if (button !== 1)
                return Clutter.EVENT_PROPAGATE;

            const clickTime = event.get_time();

            // Duplo clique com botão esquerdo abre as preferências (< 350ms)
            if (clickTime - lastClickTime < 350) {
                lastClickTime = 0;
                this._cleanupDrag(actor);
                this.openPreferences();
                return Clutter.EVENT_STOP;
            }
            lastClickTime = clickTime;

            // Se a posição estiver travada nas configurações, ignora o arraste
            if (this._settings.get_boolean('lock-position')) {
                return Clutter.EVENT_PROPAGATE;
            }

            this._isDragging = true;
            const [stageX, stageY] = event.get_coords();
            dragStartX = stageX;
            dragStartY = stageY;
            [widgetStartX, widgetStartY] = actor.get_position();

            try {
                this._dragGrab = global.stage.grab(actor);
            } catch (e) {
                this._dragGrab = null;
            }

            try {
                global.display.set_cursor(Meta.Cursor.MOVE);
            } catch (e) {}

            return Clutter.EVENT_STOP;
        });

        // Movimento do mouse ao arrastar
        this._container.connect('motion-event', (actor, event) => {
            if (this._isDragging) {
                const [stageX, stageY] = event.get_coords();
                const deltaX = stageX - dragStartX;
                const deltaY = stageY - dragStartY;
                actor.set_position(widgetStartX + deltaX, widgetStartY + deltaY);
                return Clutter.EVENT_STOP;
            }
            return Clutter.EVENT_PROPAGATE;
        });

        // Soltar o mouse: finaliza o arraste e grava as coordenadas finais no GSettings
        this._container.connect('button-release-event', (actor, event) => {
            if (this._isDragging && event.get_button() === 1) {
                const [finalX, finalY] = actor.get_position();
                this._cleanupDrag(actor);
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

            currentScale = Math.round(currentScale * 100) / 100;
            this._settings.set_double('scale', currentScale);
            return Clutter.EVENT_STOP;
        });
    }

    _cleanupDrag(actor) {
        this._isDragging = false;
        if (this._dragGrab) {
            try {
                this._dragGrab.dismiss();
            } catch (e) {}
            this._dragGrab = null;
        }
        try {
            global.display.set_cursor(Meta.Cursor.DEFAULT);
        } catch (e) {}
    }

    disable() {
        if (this._timerId) {
            GLib.source_remove(this._timerId);
            this._timerId = null;
        }

        if (this._settingsSignals && this._settings) {
            for (const id of this._settingsSignals) {
                this._settings.disconnect(id);
            }
            this._settingsSignals = [];
        }

        this._cleanupDrag(this._container);

        if (this._container) {
            this._container.destroy();
            this._container = null;
        }

        this._labelDay = null;
        this._labelDate = null;
        this._labelTime = null;
        this._settings = null;
    }
}
