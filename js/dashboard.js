// ===== DASHBOARD PRINCIPAL =====

class Dashboard {
    
    constructor() {
        this.data = {
            expenses: [],
            income: [],
            debts: []
        };
        this.isLoading = false;
        this.init();
    }
    
    // ===== INICIALIZACIÓN =====
    
    /**
     * Inicializa el dashboard
     */
    async init() {
        try {
            console.log('Inicializando dashboard...');
            
            // Configurar event listeners
            this.setupEventListeners();
            
            // Cargar datos
            await this.loadData();
            
            // Actualizar UI
            this.updateDashboard();
            
            // Configurar actualización automática
            this.setupAutoRefresh();
            
            console.log('Dashboard inicializado correctamente');
            
        } catch (error) {
            console.error('Error al inicializar dashboard:', error);
            Utils.showNotification('Error al cargar el dashboard', 'error');
        }
    }
    
    /**
     * Configura los event listeners
     */
    setupEventListeners() {
        // Botón de refresh
        const refreshBtn = document.getElementById('refresh-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.handleRefresh());
        }
        
        // Botón de exportar
        const exportBtn = document.getElementById('export-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.handleExport());
        }
        
        // Selector de período para flujo de efectivo
        const cashflowPeriod = document.getElementById('cashflow-period');
        if (cashflowPeriod) {
            cashflowPeriod.addEventListener('change', (e) => {
                this.updateCashflowChart(parseInt(e.target.value));
            });
        }
        
        // Botones de cambio de gráfico
        const pieChartBtn = document.getElementById('pie-chart-btn');
        const barChartBtn = document.getElementById('bar-chart-btn');
        
        if (pieChartBtn) {
            pieChartBtn.addEventListener('click', () => this.switchToPieChart());
        }
        
        if (barChartBtn) {
            barChartBtn.addEventListener('click', () => this.switchToBarChart());
        }
        
        // Event listener para cambios de visibilidad
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && !api.isConnected()) {
                this.loadData();
            }
        });
    }
    
    // ===== CARGA DE DATOS =====
    
    /**
     * Carga los datos del sistema
     */
    async loadData() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.showLoadingState();
        
        try {
            // Intentar cargar datos del caché primero
            let data = api.getCachedData();
            
            if (!data) {
                // Si no hay caché, cargar desde Google Sheets
                data = await api.getAllData();
            }
            
            // Si no se pudieron cargar datos, usar datos de ejemplo
            if (!data || (!data.expenses && !data.income && !data.debts)) {
                console.log('Usando datos de ejemplo...');
                data = api.getSampleData();
            }
            
            this.data = data;
            
            // Limpiar y validar datos
            this.cleanData();
            
            console.log('Datos cargados:', this.data);
            
        } catch (error) {
            console.error('Error al cargar datos:', error);
            
            // Usar datos de ejemplo en caso de error
            this.data = api.getSampleData();
            Utils.showNotification('Error al cargar datos. Mostrando datos de ejemplo.', 'warning');
        } finally {
            this.isLoading = false;
            this.hideLoadingState();
        }
    }
    
    /**
     * Limpia y valida los datos
     */
    cleanData() {
        this.data.expenses = this.cleanExpensesData(this.data.expenses || []);
        this.data.income = this.cleanIncomeData(this.data.income || []);
        this.data.debts = this.cleanDebtsData(this.data.debts || []);
    }
    
    // ===== LIMPIEZA DE DATOS =====
    
    /**
     * Limpia datos de gastos
     */
    cleanExpensesData(data) {
        return data.map(expense => ({
            id: expense.id || Utils.generateId(),
            date: expense.date || expense.fecha || expense[EXPENSES_COLUMNS.fecha] || new Date().toISOString().split('T')[0],
            product: expense.product || expense.producto || expense[EXPENSES_COLUMNS.producto] || 'Sin producto',
            price: parseFloat(expense.price || expense.precio || expense[EXPENSES_COLUMNS.precio] || 0),
            paymentMethod: expense.paymentMethod || expense.formaPago || expense[EXPENSES_COLUMNS.formaPago] || 'Efectivo',
            time: expense.time || expense.hora || expense[EXPENSES_COLUMNS.hora] || '00:00',
            category: expense.category || expense.categoria || expense[EXPENSES_COLUMNS.categoria] || 'Otros',
            notes: expense.notes || expense.notas || ''
        })).filter(expense => expense.price > 0);
    }
    
    /**
     * Limpia datos de ingresos
     */
    cleanIncomeData(data) {
        return data.map(income => ({
            id: income.id || Utils.generateId(),
            date: income.date || income.fecha || income[INCOME_COLUMNS.fecha] || new Date().toISOString().split('T')[0],
            entity: income.entity || income.entidad || income[INCOME_COLUMNS.entidad] || 'Sin entidad',
            amount: parseFloat(income.amount || income.monto || income[INCOME_COLUMNS.monto] || 0),
            paymentMethod: income.paymentMethod || income.formaPago || income[INCOME_COLUMNS.formaPago] || 'Efectivo',
            time: income.time || income.hora || income[INCOME_COLUMNS.hora] || '00:00',
            notes: income.notes || income.notas || ''
        })).filter(income => income.amount > 0);
    }
    
    /**
     * Limpia datos de deudas
     */
    cleanDebtsData(data) {
        return data.map(debt => ({
            id: debt.id || Utils.generateId(),
            date: debt.date || debt.fecha || debt[DEBTS_COLUMNS.fecha] || new Date().toISOString().split('T')[0],
            entity: debt.entity || debt.entidad || debt[DEBTS_COLUMNS.entidad] || 'Sin entidad',
            amount: parseFloat(debt.amount || debt.monto || debt[DEBTS_COLUMNS.monto] || 0),
            interest: parseFloat(debt.interest || debt.interes || debt[DEBTS_COLUMNS.interes] || 0),
            dueDate: debt.dueDate || debt.vencimiento || debt[DEBTS_COLUMNS.vencimiento] || '',
            time: debt.time || debt.hora || debt[DEBTS_COLUMNS.hora] || '00:00',
            notes: debt.notes || debt.notas || ''
        })).filter(debt => debt.amount > 0);
    }

    // ===== ACTUALIZACIÓN DEL DASHBOARD =====
    
    /**
     * Actualiza todo el dashboard
     */
    updateDashboard() {
        this.updateOverviewCards();
        this.updateCharts();
        this.updateRecentActivity();
        this.updateConnectionStatus();
    }
    
    /**
     * Actualiza las tarjetas de resumen
     */
    updateOverviewCards() {
        const calculations = this.calculateFinancialMetrics();
        
        // Capital Total
        this.updateCard('total-capital', calculations.totalCapital, 'capital-change', calculations.capitalChange);
        
        // Dinero Líquido
        this.updateCard('liquid-money', calculations.liquidMoney, 'liquid-change', calculations.liquidChange);
        
        // Ingresos
        this.updateCard('total-income', calculations.totalIncome, 'income-change', calculations.incomeChange);
        
        // Deudas
        this.updateCard('total-debts', calculations.totalDebts, 'debts-change', calculations.debtsChange);
    }
    
    /**
     * Actualiza una tarjeta específica
     * @param {string} valueId - ID del elemento de valor
     * @param {number} value - Valor a mostrar
     * @param {string} changeId - ID del elemento de cambio
     * @param {Object} change - Datos del cambio
     */
    updateCard(valueId, value, changeId, change) {
        const valueElement = document.getElementById(valueId);
        const changeElement = document.getElementById(changeId);
        
        if (valueElement) {
            // Animar el valor
            Utils.animateValue(valueId, 0, value, APP_CONFIG.ANIMATION_DURATION);
        }
        
        if (changeElement) {
            const isPositive = change.percentage >= 0;
            const icon = isPositive ? 'arrow-up' : 'arrow-down';
            const sign = isPositive ? '+' : '';
            
            changeElement.className = `card-change ${isPositive ? 'positive' : 'negative'}`;
            changeElement.innerHTML = `
                <i class="fas fa-${icon}"></i>
                <span>${sign}${change.percentage.toFixed(1)}%</span>
            `;
        }
    }
    
    /**
     * Calcula las métricas financieras
     * @returns {Object} - Métricas calculadas
     */
    calculateFinancialMetrics() {
        // Calcular totales
        const totalExpenses = this.data.expenses.reduce((sum, expense) => sum + expense.price, 0);
        const totalIncome = this.data.income.reduce((sum, income) => sum + income.amount, 0);
        const totalDebts = this.data.debts.reduce((sum, debt) => sum + debt.amount, 0);
        
        // Capital total (ingresos - gastos - deudas)
        const totalCapital = totalIncome - totalExpenses - totalDebts;
        const liquidMoney = totalIncome - totalExpenses;
        
        // Calcular cambios (simulado por ahora)
        const capitalChange = { percentage: 5.2 };
        const liquidChange = { percentage: 2.1 };
        const incomeChange = { percentage: 8.7 };
        const debtsChange = { percentage: -3.4 };
        
        return {
            totalCapital,
            liquidMoney,
            totalIncome,
            totalDebts,
            totalExpenses,
            capitalChange,
            liquidChange,
            incomeChange,
            debtsChange
        };
    }
    
    /**
     * Calcula el dinero líquido total
     * @returns {number} - Dinero líquido
     */
    calculateLiquidMoney() {
        let liquidMoney = 0;
        
        if (this.data.capital && Array.isArray(this.data.capital)) {
            this.data.capital.forEach(item => {
                const amount = Utils.parseCurrency(item.Monto || 0);
                const category = item.Categoría || '';
                
                if (category.toLowerCase().includes('líquido') || 
                    category.toLowerCase().includes('efectivo') ||
                    category.toLowerCase().includes('cuenta')) {
                    liquidMoney += amount;
                }
            });
        }
        
        return liquidMoney;
    }
    
    /**
     * Calcula el total de inversiones
     * @returns {number} - Total de inversiones
     */
    calculateTotalInvestments() {
        let total = 0;
        
        if (this.data.investments && Array.isArray(this.data.investments)) {
            this.data.investments.forEach(item => {
                total += Utils.parseCurrency(item.Monto || 0);
            });
        }
        
        return total;
    }
    
    /**
     * Calcula el total de deudas
     * @returns {number} - Total de deudas
     */
    calculateTotalDebts() {
        let total = 0;
        
        if (this.data.debts && Array.isArray(this.data.debts)) {
            this.data.debts.forEach(item => {
                total += Utils.parseCurrency(item.Monto || 0);
            });
        }
        
        return total;
    }
    
    // ===== GRÁFICOS =====
    
    /**
     * Actualiza todos los gráficos
     */
    updateCharts() {
        // Gráfico de distribución de capital
        chartManager.createCapitalChart(this.data);
        
        // Gráfico de flujo de efectivo
        const cashflowPeriod = document.getElementById('cashflow-period');
        const days = cashflowPeriod ? parseInt(cashflowPeriod.value) : 30;
        chartManager.createCashflowChart(this.data, days);
    }
    
    /**
     * Actualiza el gráfico de flujo de efectivo
     * @param {number} days - Número de días
     */
    updateCashflowChart(days) {
        chartManager.createCashflowChart(this.data, days);
    }
    
    /**
     * Cambia al gráfico circular
     */
    switchToPieChart() {
        chartManager.createCapitalChart(this.data);
    }
    
    /**
     * Cambia al gráfico de barras
     */
    switchToBarChart() {
        // Implementar cambio a gráfico de barras
        console.log('Cambiando a gráfico de barras...');
    }
    
    // ===== ACTIVIDAD RECIENTE =====
    
    /**
     * Actualiza la sección de actividad reciente
     */
    updateRecentActivity() {
        const activityList = document.getElementById('recent-activity');
        if (!activityList) return;
        
        const recentActivities = this.getRecentActivities();
        
        if (recentActivities.length === 0) {
            activityList.innerHTML = `
                <div class="activity-item">
                    <div class="activity-content">
                        <div class="activity-title">No hay actividad reciente</div>
                        <div class="activity-description">Los nuevos movimientos aparecerán aquí</div>
                    </div>
                </div>
            `;
            return;
        }
        
        const activityHTML = recentActivities.map(activity => this.createActivityItem(activity)).join('');
        activityList.innerHTML = activityHTML;
    }
    
    /**
     * Obtiene las actividades recientes
     * @returns {Array} - Actividades recientes
     */
    getRecentActivities() {
        const activities = [];
        
        // Agregar gastos recientes
        if (this.data.expenses && Array.isArray(this.data.expenses)) {
            this.data.expenses.slice(-5).forEach(expense => {
                activities.push({
                    type: 'expense',
                    title: expense.product || 'Gasto',
                    description: expense.category || 'Sin categoría',
                    amount: -expense.price,
                    date: expense.date,
                    time: expense.time,
                    icon: 'receipt',
                    color: 'danger'
                });
            });
        }
        
        // Agregar ingresos recientes
        if (this.data.income && Array.isArray(this.data.income)) {
            this.data.income.slice(-5).forEach(income => {
                activities.push({
                    type: 'income',
                    title: income.entity || 'Ingreso',
                    description: income.paymentMethod || 'Sin método de pago',
                    amount: income.amount,
                    date: income.date,
                    time: income.time,
                    icon: 'plus-circle',
                    color: 'success'
                });
            });
        }
        
        // Agregar deudas recientes
        if (this.data.debts && Array.isArray(this.data.debts)) {
            this.data.debts.slice(-5).forEach(debt => {
                activities.push({
                    type: 'debt',
                    title: debt.entity || 'Deuda',
                    description: `Interés: ${debt.interest}%`,
                    amount: -debt.amount,
                    date: debt.date,
                    time: debt.time,
                    icon: 'credit-card',
                    color: 'warning'
                });
            });
        }
        
        // Ordenar por fecha y tomar los más recientes
        return activities
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, APP_CONFIG.MAX_RECENT_ACTIVITIES);
    }
    
    /**
     * Crea un elemento de actividad
     * @param {Object} activity - Datos de la actividad
     * @returns {string} - HTML del elemento
     */
    createActivityItem(activity) {
        const isPositive = activity.amount >= 0;
        const amountClass = isPositive ? 'positive' : 'negative';
        const amountSign = isPositive ? '+' : '';
        const timeInfo = activity.time ? ` • ${activity.time}` : '';
        
        return `
            <div class="activity-item">
                <div class="activity-icon" style="background: var(--${activity.color}-color);">
                    <i class="fas fa-${activity.icon}"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-title">${Utils.escapeHtml(activity.title)}</div>
                    <div class="activity-description">${Utils.escapeHtml(activity.description)} • ${Utils.getRelativeDate(activity.date)}${timeInfo}</div>
                </div>
                <div class="activity-amount ${amountClass}">
                    ${amountSign}${Utils.formatCurrency(Math.abs(activity.amount))}
                </div>
            </div>
        `;
    }
    
    // ===== MANEJO DE EVENTOS =====
    
    /**
     * Maneja el evento de refresh
     */
    async handleRefresh() {
        if (this.isLoading) return;
        
        const refreshBtn = document.getElementById('refresh-btn');
        if (refreshBtn) {
            refreshBtn.classList.add('loading');
        }
        
        try {
            await this.loadData();
            this.updateDashboard();
            Utils.showNotification('Datos actualizados correctamente', 'success');
        } catch (error) {
            console.error('Error al actualizar datos:', error);
            Utils.showNotification('Error al actualizar datos', 'error');
        } finally {
            if (refreshBtn) {
                refreshBtn.classList.remove('loading');
            }
        }
    }
    
    /**
     * Maneja el evento de exportar
     */
    handleExport() {
        try {
            const timestamp = new Date().toISOString().split('T')[0];
            const filename = `profinance_dashboard_${timestamp}`;
            
            // Exportar datos combinados
            const exportData = [
                ...this.data.expenses.map(e => ({ ...e, Tipo: 'Gasto' })),
                ...this.data.capital,
                ...this.data.investments.map(i => ({ ...i, Tipo: 'Inversión' })),
                ...this.data.debts.map(d => ({ ...d, Tipo: 'Deuda' }))
            ];
            
            api.exportToCSV(exportData, filename);
            Utils.showNotification('Datos exportados correctamente', 'success');
        } catch (error) {
            console.error('Error al exportar datos:', error);
            Utils.showNotification('Error al exportar datos', 'error');
        }
    }
    
    // ===== ESTADOS DE CARGA =====
    
    /**
     * Muestra el estado de carga
     */
    showLoadingState() {
        const refreshBtn = document.getElementById('refresh-btn');
        if (refreshBtn) {
            refreshBtn.classList.add('loading');
        }
    }
    
    /**
     * Oculta el estado de carga
     */
    hideLoadingState() {
        const refreshBtn = document.getElementById('refresh-btn');
        if (refreshBtn) {
            refreshBtn.classList.remove('loading');
        }
    }
    
    /**
     * Actualiza el estado de conexión
     */
    updateConnectionStatus() {
        const status = api.getConnectionStatus();
        const lastSync = api.lastSync;
        
        if (lastSync) {
            const timeAgo = Utils.getRelativeDate(lastSync);
            console.log(`Última sincronización: ${timeAgo}`);
        }
    }
    
    // ===== ACTUALIZACIÓN AUTOMÁTICA =====
    
    /**
     * Configura la actualización automática
     */
    setupAutoRefresh() {
        setInterval(() => {
            if (!document.hidden && api.isConnected()) {
                this.loadData();
            }
        }, APP_CONFIG.AUTO_REFRESH_INTERVAL);
    }
    
    // ===== MÉTODOS PÚBLICOS =====
    
    /**
     * Obtiene los datos actuales
     * @returns {Object} - Datos del dashboard
     */
    getData() {
        return this.data;
    }
    
    /**
     * Fuerza una actualización del dashboard
     */
    async refresh() {
        await this.handleRefresh();
    }
    
    // ===== FUNCIONALIDAD MÓVIL =====
    
    /**
     * Inicializa la funcionalidad del menú móvil
     */
    initMobileMenu() {
        const mobileMenuBtn = document.getElementById('mobile-menu-btn');
        const navbar = document.getElementById('navbar');
        
        if (mobileMenuBtn && navbar) {
            mobileMenuBtn.addEventListener('click', () => {
                navbar.classList.toggle('mobile-open');
                this.updateMobileMenuIcon();
            });
            
            // Cerrar menú al hacer clic en un enlace
            const navLinks = navbar.querySelectorAll('.nav-link');
            navLinks.forEach(link => {
                link.addEventListener('click', () => {
                    navbar.classList.remove('mobile-open');
                    this.updateMobileMenuIcon();
                });
            });
            
            // Cerrar menú al hacer clic fuera
            document.addEventListener('click', (event) => {
                if (!navbar.contains(event.target) && !mobileMenuBtn.contains(event.target)) {
                    navbar.classList.remove('mobile-open');
                    this.updateMobileMenuIcon();
                }
            });
            
            // Manejar orientación del dispositivo
            window.addEventListener('orientationchange', () => {
                setTimeout(() => {
                    if (window.innerWidth > 767) {
                        navbar.classList.remove('mobile-open');
                        this.updateMobileMenuIcon();
                    }
                }, 100);
            });
        }
    }
    
    /**
     * Actualiza el ícono del botón de menú móvil
     */
    updateMobileMenuIcon() {
        const mobileMenuBtn = document.getElementById('mobile-menu-btn');
        const navbar = document.getElementById('navbar');
        
        if (mobileMenuBtn && navbar) {
            const icon = mobileMenuBtn.querySelector('i');
            if (navbar.classList.contains('mobile-open')) {
                icon.className = 'fas fa-times';
            } else {
                icon.className = 'fas fa-bars';
            }
        }
    }
}

// ===== INICIALIZACIÓN CUANDO EL DOM ESTÉ LISTO =====

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM cargado, inicializando dashboard...');
    
    // Crear instancia global del dashboard
    window.dashboard = new Dashboard();
    
    // Configurar manejo de errores global
    window.addEventListener('error', function(event) {
        console.error('Error global:', event.error);
        Utils.showNotification('Ha ocurrido un error inesperado', 'error');
    });
    
    // Configurar manejo de promesas rechazadas
    window.addEventListener('unhandledrejection', function(event) {
        console.error('Promesa rechazada:', event.reason);
        Utils.showNotification('Error en operación asíncrona', 'error');
    });
});

// ===== FUNCIONES GLOBALES PARA ACCESO DESDE HTML =====

/**
 * Función global para refrescar el dashboard
 */
window.refreshDashboard = function() {
    if (window.dashboard) {
        window.dashboard.refresh();
    }
};

/**
 * Función global para exportar datos
 */
window.exportDashboard = function() {
    if (window.dashboard) {
        window.dashboard.handleExport();
    }
};
