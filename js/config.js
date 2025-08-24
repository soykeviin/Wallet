// ===== CONFIGURACIÓN DEL SISTEMA =====

// Configuración de Google Sheets
const GOOGLE_SHEETS_CONFIG = {
    EXPENSES_SHEET_ID: '1-71MXkppgdH3q-F8t6TnKK4V18s_AHqlMIzxG3mfWLg',
    DEBTS_SHEET_ID: '1X6QSvmqkIH87lRQqw96Bv0TPUkjHVpKGjp0z-qEPCL4',
    INCOME_SHEET_ID: '1vsWkRV0ehb4_-hGEKzGT5inEnq_9N-vb3vf26KzmXbM',
    SHEET_NAME: 'Sheet1'
};

// Mapeo de columnas para gastos
const EXPENSES_COLUMNS = {
    producto: 'A',
    fecha: 'B',
    precio: 'C',
    formaPago: 'D',
    hora: 'E',
    categoria: 'F'
};

// Mapeo de columnas para deudas
const DEBTS_COLUMNS = {
    fecha: 'A',
    entidad: 'B', 
    monto: 'C',
    interes: 'D',
    vencimiento: 'E',
    hora: 'F'
};

// Mapeo de columnas para ingresos
const INCOME_COLUMNS = {
    fecha: 'A',
    entidad: 'B',
    monto: 'C',
    formaPago: 'D',
    hora: 'E'
};

// Configuración de la aplicación
const APP_CONFIG = {
    NAME: 'ProFinance CRM',
    VERSION: '1.0.0',
    CURRENCY: 'PYG',
    CURRENCY_SYMBOL: '₲',
    DATE_FORMAT: 'DD/MM/YYYY',
    TIME_FORMAT: 'HH:mm',
    DECIMAL_SEPARATOR: ',',
    THOUSANDS_SEPARATOR: '.',
    AUTO_REFRESH_INTERVAL: 5 * 60 * 1000, // 5 minutos
    ANIMATION_DURATION: 1000,
    MAX_RECENT_ACTIVITIES: 10
};

// Configuración de categorías
const CATEGORIES = {
    EXPENSES: [
        'Alimentos',
        'Transporte',
        'Entretenimiento',
        'Salud',
        'Educación',
        'Vivienda',
        'Servicios',
        'Ropa',
        'Tecnología',
        'Otros'
    ],
    INVESTMENTS: [
        'Acciones',
        'Bonos',
        'Fondos Mutuos',
        'Criptomonedas',
        'Bienes Raíces',
        'Oro',
        'Plata',
        'Otros'
    ],
    DEBTS: [
        'Tarjeta de Crédito',
        'Préstamo Personal',
        'Préstamo Hipotecario',
        'Préstamo Automotriz',
        'Préstamo Estudiantil',
        'Otros'
    ]
};

// Configuración de colores para gráficos
const CHART_COLORS = {
    primary: [
        '#3b82f6', // Blue
        '#10b981', // Green
        '#f59e0b', // Yellow
        '#ef4444', // Red
        '#8b5cf6', // Purple
        '#06b6d4', // Cyan
        '#f97316', // Orange
        '#ec4899', // Pink
        '#84cc16', // Lime
        '#6366f1'  // Indigo
    ],
    gradients: [
        'linear-gradient(135deg, #3b82f6, #1d4ed8)',
        'linear-gradient(135deg, #10b981, #059669)',
        'linear-gradient(135deg, #f59e0b, #d97706)',
        'linear-gradient(135deg, #ef4444, #dc2626)',
        'linear-gradient(135deg, #8b5cf6, #7c3aed)',
        'linear-gradient(135deg, #06b6d4, #0891b2)',
        'linear-gradient(135deg, #f97316, #ea580c)',
        'linear-gradient(135deg, #ec4899, #db2777)',
        'linear-gradient(135deg, #84cc16, #65a30d)',
        'linear-gradient(135deg, #6366f1, #4f46e5)'
    ]
};

// Configuración de estados de conexión
const CONNECTION_STATUS = {
    CONNECTING: 'connecting',
    CONNECTED: 'connected',
    ERROR: 'error',
    DISCONNECTED: 'disconnected'
};

// Configuración de tipos de transacciones
const TRANSACTION_TYPES = {
    INCOME: 'income',
    EXPENSE: 'expense',
    INVESTMENT: 'investment',
    DEBT: 'debt',
    TRANSFER: 'transfer'
};

// Configuración de métodos de pago
const PAYMENT_METHODS = [
    'Efectivo',
    'Débito',
    'Crédito',
    'Transferencia',
    'Pago Móvil',
    'Cheque',
    'Otros'
];

// Configuración de monedas
const CURRENCIES = {
    PYG: {
        symbol: '₲',
        name: 'Guaraní Paraguayo',
        format: 'es-PY'
    },
    USD: {
        symbol: '$',
        name: 'Dólar Estadounidense',
        format: 'en-US'
    },
    EUR: {
        symbol: '€',
        name: 'Euro',
        format: 'de-DE'
    }
};

// Configuración de validaciones
const VALIDATIONS = {
    MIN_AMOUNT: 0,
    MAX_AMOUNT: 999999999999,
    MIN_LENGTH: 1,
    MAX_LENGTH: 255,
    EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    PHONE_REGEX: /^[\+]?[0-9\s\-\(\)]{8,}$/,
    DATE_REGEX: /^\d{4}-\d{2}-\d{2}$/
};

// Configuración de notificaciones
const NOTIFICATIONS = {
    SUCCESS_DURATION: 3000,
    ERROR_DURATION: 5000,
    WARNING_DURATION: 4000,
    INFO_DURATION: 3000
};

// Configuración de exportación
const EXPORT_CONFIG = {
    CSV_DELIMITER: ',',
    DATE_FORMAT: 'YYYY-MM-DD',
    TIME_FORMAT: 'HH:mm:ss',
    ENCODING: 'UTF-8'
};

// Configuración de almacenamiento local
const STORAGE_KEYS = {
    USER_PREFERENCES: 'profinance_user_preferences',
    RECENT_ACTIVITIES: 'profinance_recent_activities',
    DASHBOARD_SETTINGS: 'profinance_dashboard_settings',
    THEME: 'profinance_theme',
    LANGUAGE: 'profinance_language'
};

// Configuración de temas
const THEMES = {
    DARK: 'dark',
    LIGHT: 'light',
    AUTO: 'auto'
};

// Configuración de idiomas
const LANGUAGES = {
    ES: {
        code: 'es',
        name: 'Español',
        flag: '🇪🇸'
    },
    EN: {
        code: 'en',
        name: 'English',
        flag: '🇺🇸'
    }
};

// Configuración de gráficos
const CHART_CONFIG = {
    RESPONSIVE: true,
    MAINTAIN_ASPECT_RATIO: false,
    ANIMATION_DURATION: 1000,
    HOVER_ANIMATION_DURATION: 300,
    DEFAULT_COLOR: '#3b82f6',
    GRID_COLOR: 'rgba(255, 255, 255, 0.1)',
    TEXT_COLOR: '#e2e8f0',
    BORDER_COLOR: 'rgba(255, 255, 255, 0.2)'
};

// Configuración de paginación
const PAGINATION_CONFIG = {
    DEFAULT_PAGE_SIZE: 20,
    PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
    MAX_PAGE_BUTTONS: 5
};

// Configuración de filtros
const FILTER_CONFIG = {
    DEFAULT_DATE_RANGE: 30, // días
    DATE_RANGE_OPTIONS: [7, 30, 90, 180, 365],
    MAX_CATEGORIES: 10,
    SORT_OPTIONS: ['date', 'amount', 'category', 'description']
};

// Exportar configuración
window.APP_CONFIG = APP_CONFIG;
window.GOOGLE_SHEETS_CONFIG = GOOGLE_SHEETS_CONFIG;
window.CATEGORIES = CATEGORIES;
window.CHART_COLORS = CHART_COLORS;
window.CONNECTION_STATUS = CONNECTION_STATUS;
window.TRANSACTION_TYPES = TRANSACTION_TYPES;
window.PAYMENT_METHODS = PAYMENT_METHODS;
window.CURRENCIES = CURRENCIES;
window.VALIDATIONS = VALIDATIONS;
window.NOTIFICATIONS = NOTIFICATIONS;
window.EXPORT_CONFIG = EXPORT_CONFIG;
window.STORAGE_KEYS = STORAGE_KEYS;
window.THEMES = THEMES;
window.LANGUAGES = LANGUAGES;
window.CHART_CONFIG = CHART_CONFIG;
window.PAGINATION_CONFIG = PAGINATION_CONFIG;
window.FILTER_CONFIG = FILTER_CONFIG;
window.EXPENSES_COLUMNS = EXPENSES_COLUMNS;
window.DEBTS_COLUMNS = DEBTS_COLUMNS;
window.INCOME_COLUMNS = INCOME_COLUMNS;
