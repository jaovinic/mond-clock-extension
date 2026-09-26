import Adw from 'gi://Adw';
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';
import { ExtensionPreferences, gettext as _ } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class MondClockPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings();

        const page = new Adw.PreferencesPage({
            title: _('Geral'),
            icon_name: 'preferences-other-symbolic',
        });
        window.add(page);

        // Grupo: Aparência e Formato
        const groupGeneral = new Adw.PreferencesGroup({
            title: _('Configurações do Relógio'),
            description: _('Personalize o formato e o comportamento do widget Mond Clock'),
        });
        page.add(groupGeneral);

        // Opção: Formato 24 Horas
        const row24h = new Adw.SwitchRow({
            title: _('Formato 24 Horas'),
            subtitle: _('Exibir no formato 24h (- 20:38 -) em vez de 12h (- 08:38 PM -)'),
        });
        settings.bind('clock-24h', row24h, 'active', Gio.SettingsBindFlags.DEFAULT);
        groupGeneral.add(row24h);

        // Opção: Bloquear Posição
        const rowLock = new Adw.SwitchRow({
            title: _('Bloquear Posição'),
            subtitle: _('Evita arrastar o widget acidentalmente com o mouse'),
        });
        settings.bind('lock-position', rowLock, 'active', Gio.SettingsBindFlags.DEFAULT);
        groupGeneral.add(rowLock);

        // Opção: Escala (Zoom)
        const rowScale = new Adw.SpinRow({
            title: _('Escala (Tamanho)'),
            subtitle: _('Ajuste fino da escala. Também é possível usar a roda do mouse sobre o widget.'),
            adjustment: new Gtk.Adjustment({
                lower: 0.4,
                upper: 3.0,
                step_increment: 0.05,
                page_increment: 0.2,
                value: settings.get_double('scale'),
            }),
            digits: 2,
        });
        settings.bind('scale', rowScale.adjustment, 'value', Gio.SettingsBindFlags.DEFAULT);
        groupGeneral.add(rowScale);
    }
}
