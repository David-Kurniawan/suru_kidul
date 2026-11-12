(function () {
  const STORAGE_KEY = 'desaSuruKidulAccessibility';
  const DEFAULT_STATE = {
    font: 0,
    spacing: 0,
    lineHeight: 0
  };

  const LIMITS = {
    font: [-2, 4],
    spacing: [-2, 4],
    lineHeight: [-2, 4]
  };

  let state = loadState();
  let widget;
  let panel;
  let trigger;

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return sanitizeState({ ...DEFAULT_STATE, ...saved });
    } catch (error) {
      return { ...DEFAULT_STATE };
    }
  }

  function sanitizeState(nextState) {
    return {
      ...DEFAULT_STATE,
      ...nextState,
      font: clamp(Number(nextState.font) || 0, LIMITS.font[0], LIMITS.font[1]),
      spacing: clamp(Number(nextState.spacing) || 0, LIMITS.spacing[0], LIMITS.spacing[1]),
      lineHeight: clamp(Number(nextState.lineHeight) || 0, LIMITS.lineHeight[0], LIMITS.lineHeight[1])
    };
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function icon(name) {
    const icons = {
      close: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6 6 18"/></svg>',
      reset: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M21 12a9 9 0 1 1-2.64-6.36"/><path d="M21 3v6h-6"/></svg>',
      wheelchair: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="10" cy="4.5" r="2.2"/><path d="M10 8v5h4.2l2.6 4.5"/><path d="M9.5 11.5a5.2 5.2 0 1 0 4.8 7.2"/><path d="M7 13h8"/></svg>',
      zoomIn: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="10.5" cy="10.5" r="6"/><path d="M10.5 7.5v6M7.5 10.5h6M15 15l5 5"/></svg>',
      zoomOut: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="10.5" cy="10.5" r="6"/><path d="M7.5 10.5h6M15 15l5 5"/></svg>',
      spacingUp: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m8 8-4 4 4 4M16 8l4 4-4 4"/></svg>',
      spacingDown: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m4 8 4 4-4 4M20 8l-4 4 4 4"/></svg>',
      heightUp: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m7 8 5-5 5 5M7 16l5 5 5-5"/></svg>',
      heightDown: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m7 5 5 5 5-5M7 19l5-5 5 5"/></svg>'
    };

    return icons[name] || '';
  }

  function createToolButton(tool) {
    const pressed = tool.toggle ? ` aria-pressed="${Boolean(state[tool.toggle])}" data-toggle="${tool.toggle}"` : '';
    return [
      `<button class="accessibility-action" type="button" data-action="${tool.action}"${pressed}>`,
      `<span class="accessibility-action-icon">${icon(tool.icon)}</span>`,
      `<span>${tool.label}</span>`,
      '</button>'
    ].join('');
  }

  function createWidget() {
    const tools = [
      { action: 'font-up', icon: 'zoomIn', label: 'Perbesar Teks' },
      { action: 'font-down', icon: 'zoomOut', label: 'Perkecil Teks' },
      { action: 'spacing-up', icon: 'spacingUp', label: 'Tambah Jarak Teks' },
      { action: 'spacing-down', icon: 'spacingDown', label: 'Kurangi Jarak Teks' },
      { action: 'height-up', icon: 'heightUp', label: 'Tambah Tinggi Teks' },
      { action: 'height-down', icon: 'heightDown', label: 'Kurangi Tinggi Teks' }
    ];

    widget = document.createElement('div');
    widget.className = 'accessibility-widget';
    widget.innerHTML = [
      '<button class="accessibility-trigger" type="button" aria-label="Buka alat aksesibilitas" aria-expanded="false" aria-controls="accessibility-panel">',
      icon('wheelchair'),
      '</button>',
      '<section id="accessibility-panel" class="accessibility-panel" role="dialog" aria-labelledby="accessibility-title" hidden>',
      '<div class="accessibility-panel-header">',
      '<button class="accessibility-close" type="button" aria-label="Tutup alat aksesibilitas">',
      icon('close'),
      '</button>',
      '<h2 id="accessibility-title">Aksesibilitas</h2>',
      '<button class="accessibility-reset" type="button" aria-label="Atur ulang aksesibilitas">',
      icon('reset'),
      '</button>',
      '</div>',
      '<div class="accessibility-actions">',
      tools.map(createToolButton).join(''),
      '</div>',
      '</section>'
    ].join('');

    document.body.appendChild(widget);

    panel = widget.querySelector('.accessibility-panel');
    trigger = widget.querySelector('.accessibility-trigger');

    trigger.addEventListener('click', togglePanel);
    widget.querySelector('.accessibility-close').addEventListener('click', closePanel);
    widget.querySelector('.accessibility-reset').addEventListener('click', resetState);
    widget.querySelector('.accessibility-actions').addEventListener('click', handleActionClick);
    document.addEventListener('keydown', handleEscape);

    syncControls();
  }

  function togglePanel() {
    if (panel.hidden) {
      openPanel();
    } else {
      closePanel();
    }
  }

  function openPanel() {
    panel.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
    const closeButton = widget.querySelector('.accessibility-close');
    closeButton.focus({ preventScroll: true });
  }

  function closePanel() {
    panel.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
    trigger.focus({ preventScroll: true });
  }

  function handleEscape(event) {
    if (event.key === 'Escape' && panel && !panel.hidden) {
      closePanel();
    }
  }

  function handleActionClick(event) {
    const button = event.target.closest('.accessibility-action');
    if (!button) {
      return;
    }

    const action = button.dataset.action;

    if (action === 'font-up') {
      state.font = clamp(state.font + 1, LIMITS.font[0], LIMITS.font[1]);
    }

    if (action === 'font-down') {
      state.font = clamp(state.font - 1, LIMITS.font[0], LIMITS.font[1]);
    }

    if (action === 'spacing-up') {
      state.spacing = clamp(state.spacing + 1, LIMITS.spacing[0], LIMITS.spacing[1]);
    }

    if (action === 'spacing-down') {
      state.spacing = clamp(state.spacing - 1, LIMITS.spacing[0], LIMITS.spacing[1]);
    }

    if (action === 'height-up') {
      state.lineHeight = clamp(state.lineHeight + 1, LIMITS.lineHeight[0], LIMITS.lineHeight[1]);
    }

    if (action === 'height-down') {
      state.lineHeight = clamp(state.lineHeight - 1, LIMITS.lineHeight[0], LIMITS.lineHeight[1]);
    }

    applyState(true);
  }

  function resetState() {
    state = { ...DEFAULT_STATE };
    applyState(true);
  }

  function applyState(shouldSave) {
    const fontScale = 1 + state.font * 0.08;
    const letterSpacing = state.spacing === 0 ? 'normal' : `${state.spacing * 0.035}em`;
    const lineHeight = 1.6 + state.lineHeight * 0.15;

    document.documentElement.style.setProperty('--a11y-font-size', `${Math.round(fontScale * 100)}%`);
    document.documentElement.style.setProperty('--a11y-font-scale', fontScale.toFixed(2));
    document.documentElement.style.setProperty('--a11y-letter-spacing', letterSpacing);
    document.documentElement.style.setProperty('--a11y-line-height', lineHeight.toFixed(2));

    document.body.classList.toggle('a11y-letter-spacing', state.spacing !== 0);
    document.body.classList.toggle('a11y-line-height', state.lineHeight !== 0);
    document.body.classList.remove('a11y-invert', 'a11y-gray', 'a11y-underline', 'a11y-large-cursor', 'a11y-reading-active', 'a11y-no-motion');

    if (shouldSave) {
      saveState();
    }

    syncControls();
    window.dispatchEvent(new CustomEvent('desaAccessibilityChange', { detail: { ...state } }));
  }

  function syncControls() {
    if (!widget) {
      return;
    }

    widget.querySelectorAll('[data-toggle]').forEach((button) => {
      const key = button.dataset.toggle;
      const isActive = Boolean(state[key]);
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-pressed', String(isActive));
    });

    setActionDisabled('font-up', state.font >= LIMITS.font[1]);
    setActionDisabled('font-down', state.font <= LIMITS.font[0]);
    setActionDisabled('spacing-up', state.spacing >= LIMITS.spacing[1]);
    setActionDisabled('spacing-down', state.spacing <= LIMITS.spacing[0]);
    setActionDisabled('height-up', state.lineHeight >= LIMITS.lineHeight[1]);
    setActionDisabled('height-down', state.lineHeight <= LIMITS.lineHeight[0]);
  }

  function setActionDisabled(action, disabled) {
    const button = widget.querySelector(`[data-action="${action}"]`);
    if (button) {
      button.disabled = disabled;
    }
  }

  function init() {
    createWidget();
    applyState(true);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
