import Adw from 'gi://Adw';
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';
import Gdk from 'gi://Gdk';
import { ExtensionPreferences, gettext as _ } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

function createColorRow(title, subtitle, settingsKey, settings) {
    const row = new Adw.ActionRow({
        title: title,
        subtitle: subtitle,
    });

    const dialog = new Gtk.ColorDialog({ with_alpha: true });
    const button = new Gtk.ColorDialogButton({
        dialog: dialog,
        valign: Gtk.Align.CENTER,
    });

    const currentColorStr = settings.get_string(settingsKey);
    const rgba = new Gdk.RGBA();
    if (!rgba.parse(currentColorStr)) {
        rgba.parse('#ffffff');
    }
    button.set_rgba(rgba);

    button.connect('notify::rgba', () => {
        const color = button.get_rgba();
        settings.set_string(settingsKey, color.to_string());
    });

    settings.connect(`changed::${settingsKey}`, () => {
        const updatedStr = settings.get_string(settingsKey);
        const newRgba = new Gdk.RGBA();
        if (newRgba.parse(updatedStr)) {
            button.set_rgba(newRgba);
        }
    });

    row.add_suffix(button);
    row.activatable_widget = button;
    return row;
}

export default class MondClockPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings();

        // =========================================================================
        // PÁGINA 1: APARÊNCIA (Fontes, Cores, Sombra)
        // =========================================================================
        const pageAppearance = new Adw.PreferencesPage({
            title: _('Aparência'),
            icon_name: 'preferences-desktop-theme-symbolic',
        });
        window.add(pageAppearance);

        // Grupo 1: Tamanho das Fontes
        const groupFonts = new Adw.PreferencesGroup({
            title: _('Tamanho das Fontes (pt)'),
            description: _('Ajuste individual do tamanho das fontes para cada linha do widget'),
        });
        pageAppearance.add(groupFonts);

        // Fonte do Dia
        const rowFontDay = new Adw.SpinRow({
            title: _('Fonte do Dia da Semana'),
            subtitle: _('Tamanho do texto principal (fonte futurista Anurati)'),
            adjustment: new Gtk.Adjustment({
                lower: 20.0,
                upper: 140.0,
                step_increment: 2.0,
                page_increment: 10.0,
                value: settings.get_double('font-size-day'),
            }),
            digits: 0,
        });
        settings.bind('font-size-day', rowFontDay.adjustment, 'value', Gio.SettingsBindFlags.DEFAULT);
        groupFonts.add(rowFontDay);

        // Fonte da Data
        const rowFontDate = new Adw.SpinRow({
            title: _('Fonte da Data Completa'),
            subtitle: _('Tamanho do texto intermediário (ex: 26 SETEMBRO, 2026)'),
            adjustment: new Gtk.Adjustment({
                lower: 10.0,
                upper: 60.0,
                step_increment: 1.0,
                page_increment: 5.0,
                value: settings.get_double('font-size-date'),
            }),
            digits: 0,
        });
        settings.bind('font-size-date', rowFontDate.adjustment, 'value', Gio.SettingsBindFlags.DEFAULT);
        groupFonts.add(rowFontDate);

        // Fonte da Hora
        const rowFontTime = new Adw.SpinRow({
            title: _('Fonte do Horário'),
            subtitle: _('Tamanho do texto inferior (ex: - 14:30 -)'),
            adjustment: new Gtk.Adjustment({
                lower: 8.0,
                upper: 50.0,
                step_increment: 1.0,
                page_increment: 5.0,
                value: settings.get_double('font-size-time'),
            }),
            digits: 0,
        });
        settings.bind('font-size-time', rowFontTime.adjustment, 'value', Gio.SettingsBindFlags.DEFAULT);
        groupFonts.add(rowFontTime);

        // Grupo 2: Cores do Texto
        const groupColors = new Adw.PreferencesGroup({
            title: _('Cores do Texto'),
            description: _('Personalize a tonalidade de cada elemento ou sincronize todas'),
        });
        pageAppearance.add(groupColors);

        const rowColorDay = createColorRow(_('Cor do Dia da Semana'), _('Cor do título principal'), 'color-day', settings);
        groupColors.add(rowColorDay);

        const rowColorDate = createColorRow(_('Cor da Data Completa'), _('Cor da linha central da data'), 'color-date', settings);
        groupColors.add(rowColorDate);

        const rowColorTime = createColorRow(_('Cor do Horário'), _('Cor da linha do relógio'), 'color-time', settings);
        groupColors.add(rowColorTime);

        // Botão para sincronizar cores
        const rowSyncColors = new Adw.ActionRow({
            title: _('Sincronizar Cores'),
            subtitle: _('Aplica a cor do Dia da Semana para a Data e o Horário'),
        });
        const btnSync = new Gtk.Button({
            label: _('Copiar Cor do Dia'),
            valign: Gtk.Align.CENTER,
        });
        btnSync.connect('clicked', () => {
            const masterColor = settings.get_string('color-day');
            settings.set_string('color-date', masterColor);
            settings.set_string('color-time', masterColor);
            settings.set_string('text-color', masterColor);
        });
        rowSyncColors.add_suffix(btnSync);
        rowSyncColors.activatable_widget = btnSync;
        groupColors.add(rowSyncColors);

        // Grupo 3: Sombra do Texto
        const groupShadow = new Adw.PreferencesGroup({
            title: _('Sombra do Texto (Text Shadow)'),
            description: _('Melhora drasticamente a legibilidade e contraste sobre papéis de parede claros ou vibrantes'),
        });
        pageAppearance.add(groupShadow);

        // Habilitar Sombra
        const rowShadowEnabled = new Adw.SwitchRow({
            title: _('Habilitar Sombra'),
            subtitle: _('Projeta sombra suave atrás dos textos'),
        });
        settings.bind('shadow-enabled', rowShadowEnabled, 'active', Gio.SettingsBindFlags.DEFAULT);
        groupShadow.add(rowShadowEnabled);

        // Cor e Opacidade da Sombra
        const rowShadowColor = createColorRow(_('Cor e Transparência da Sombra'), _('Recomendado preto com alfa de 60% a 85%'), 'shadow-color', settings);
        groupShadow.add(rowShadowColor);

        // Desfoque da Sombra (Blur)
        const rowShadowBlur = new Adw.SpinRow({
            title: _('Desfoque da Sombra (Blur)'),
            subtitle: _('Raio de difusão da sombra em pixels (0 = contorno seco, 15 = sombra difusa)'),
            adjustment: new Gtk.Adjustment({
                lower: 0.0,
                upper: 30.0,
                step_increment: 1.0,
                page_increment: 5.0,
                value: settings.get_double('shadow-blur'),
            }),
            digits: 0,
        });
        settings.bind('shadow-blur', rowShadowBlur.adjustment, 'value', Gio.SettingsBindFlags.DEFAULT);
        groupShadow.add(rowShadowBlur);

        // Deslocamento X da Sombra
        const rowShadowX = new Adw.SpinRow({
            title: _('Deslocamento Horizontal (X)'),
            subtitle: _('Deslocamento da sombra para os lados em pixels'),
            adjustment: new Gtk.Adjustment({
                lower: -20.0,
                upper: 20.0,
                step_increment: 1.0,
                page_increment: 5.0,
                value: settings.get_double('shadow-x'),
            }),
            digits: 0,
        });
        settings.bind('shadow-x', rowShadowX.adjustment, 'value', Gio.SettingsBindFlags.DEFAULT);
        groupShadow.add(rowShadowX);

        // Deslocamento Y da Sombra
        const rowShadowY = new Adw.SpinRow({
            title: _('Deslocamento Vertical (Y)'),
            subtitle: _('Deslocamento da sombra para baixo/cima em pixels'),
            adjustment: new Gtk.Adjustment({
                lower: -20.0,
                upper: 20.0,
                step_increment: 1.0,
                page_increment: 5.0,
                value: settings.get_double('shadow-y'),
            }),
            digits: 0,
        });
        settings.bind('shadow-y', rowShadowY.adjustment, 'value', Gio.SettingsBindFlags.DEFAULT);
        groupShadow.add(rowShadowY);

        // =========================================================================
        // PÁGINA 2: COMPORTAMENTO E LAYOUT
        // =========================================================================
        const pageBehavior = new Adw.PreferencesPage({
            title: _('Comportamento'),
            icon_name: 'preferences-other-symbolic',
        });
        window.add(pageBehavior);

        // Grupo: Formatação e Tipografia
        const groupFormat = new Adw.PreferencesGroup({
            title: _('Formato do Relógio e Tipografia'),
            description: _('Opções de formatação de data, caracteres e espaçamentos'),
        });
        pageBehavior.add(groupFormat);

        // Formato 24 Horas
        const row24h = new Adw.SwitchRow({
            title: _('Formato 24 Horas'),
            subtitle: _('Exibir no formato 24h (- 20:38 -) em vez de 12h (- 08:38 PM -)'),
        });
        settings.bind('clock-24h', row24h, 'active', Gio.SettingsBindFlags.DEFAULT);
        groupFormat.add(row24h);

        // Normalizar Acentos no Dia
        const rowRemoveAccents = new Adw.SwitchRow({
            title: _('Normalizar Acentos no Dia (Estilo Anurati)'),
            subtitle: _('Remove acentos no dia (ex: SÁBADO vira SABADO) para preservar a renderização pura da fonte Anurati'),
        });
        settings.bind('remove-accents-day', rowRemoveAccents, 'active', Gio.SettingsBindFlags.DEFAULT);
        groupFormat.add(rowRemoveAccents);

        // Dia em Maiúsculas
        const rowDayUpper = new Adw.SwitchRow({
            title: _('Dia em Letras Maiúsculas'),
            subtitle: _('Exibe o dia da semana todo em caixa alta'),
        });
        settings.bind('day-uppercase', rowDayUpper, 'active', Gio.SettingsBindFlags.DEFAULT);
        groupFormat.add(rowDayUpper);

        // Data em Maiúsculas
        const rowDateUpper = new Adw.SwitchRow({
            title: _('Mês da Data em Maiúsculas'),
            subtitle: _('Exibe o nome do mês da data em caixa alta'),
        });
        settings.bind('date-uppercase', rowDateUpper, 'active', Gio.SettingsBindFlags.DEFAULT);
        groupFormat.add(rowDateUpper);

        // Espaçamento vertical entre linhas
        const rowSpacing = new Adw.SpinRow({
            title: _('Espaçamento entre Linhas (px)'),
            subtitle: _('Distância vertical entre dia, data e hora'),
            adjustment: new Gtk.Adjustment({
                lower: 0.0,
                upper: 30.0,
                step_increment: 1.0,
                page_increment: 5.0,
                value: settings.get_double('widget-spacing'),
            }),
            digits: 0,
        });
        settings.bind('widget-spacing', rowSpacing.adjustment, 'value', Gio.SettingsBindFlags.DEFAULT);
        groupFormat.add(rowSpacing);

        // Grupo: Posição e Zoom
        const groupPosition = new Adw.PreferencesGroup({
            title: _('Posição e Interatividade'),
            description: _('Controle de arraste do mouse e escala do widget'),
        });
        pageBehavior.add(groupPosition);

        // Bloquear Posição
        const rowLock = new Adw.SwitchRow({
            title: _('Bloquear Posição (Travar Arraste)'),
            subtitle: _('Impede arrastar o widget com o mouse na área de trabalho'),
        });
        settings.bind('lock-position', rowLock, 'active', Gio.SettingsBindFlags.DEFAULT);
        groupPosition.add(rowLock);

        // Escala (Zoom)
        const rowScale = new Adw.SpinRow({
            title: _('Escala do Widget (Zoom)'),
            subtitle: _('Fator de escala proporcional. Também ajustável rolando a roda do mouse sobre o widget.'),
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
        groupPosition.add(rowScale);

        // Redefinir Posição
        const rowResetPos = new Adw.ActionRow({
            title: _('Redefinir Posição e Escala'),
            subtitle: _('Restaura as coordenadas para a posição inicial recomendada (X: 100, Y: 150)'),
        });
        const btnReset = new Gtk.Button({
            label: _('Redefinir Padrões'),
            valign: Gtk.Align.CENTER,
        });
        btnReset.connect('clicked', () => {
            settings.set_double('pos-x', 100.0);
            settings.set_double('pos-y', 150.0);
            settings.set_double('scale', 1.0);
        });
        rowResetPos.add_suffix(btnReset);
        rowResetPos.activatable_widget = btnReset;
        groupPosition.add(rowResetPos);
    }
}
