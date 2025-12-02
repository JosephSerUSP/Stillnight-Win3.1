  openSettings() {
    if (this.sceneManager.currentScene() !== this) return;

    const themes = ThemeManager.getThemes().map(t => ({
        label: t.name,
        value: t.id
    }));

    const options = [
        {
            label: "Theme",
            type: "select",
            value: ThemeManager.getCurrentThemeId(),
            options: themes,
            onChange: (val) => {
                ThemeManager.applyTheme(val);
                SoundManager.play('UI_SELECT');
            }
        },
        {
            label: "Auto Battle",
            type: "select",
            value: ConfigManager.autoBattle ? "on" : "off",
            options: [
                { label: "On", value: "on" },
                { label: "Off", value: "off" }
            ],
            onChange: (val) => {
                ConfigManager.autoBattle = (val === "on");
                ConfigManager.save();
                SoundManager.play('UI_SELECT');
            }
        },
        {
            label: "Window Animations",
            type: "toggle",
            value: ConfigManager.windowAnimations,
            onChange: (val) => {
                ConfigManager.windowAnimations = val;
                ConfigManager.save();
                SoundManager.play('UI_SELECT');
            }
        }
    ];

    this.optionsWindow.setup(options);
    this.windowManager.push(this.optionsWindow);
  }
