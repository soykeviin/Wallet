// ===== MANEJO DE GRÁFICOS CON CHART.JS =====

class ChartManager {
    
    constructor() {
        this.charts = new Map();
        this.defaultOptions = {
            responsive: CHART_CONFIG.RESPONSIVE,
            maintainAspectRatio: CHART_CONFIG.MAINTAIN_ASPECT_RATIO,
            animation: {
                duration: CHART_CONFIG.ANIMATION_DURATION
            },
            hover: {
                animationDuration: CHART_CONFIG.HOVER_ANIMATION_DURATION
            },
            plugins: {
                legend: {
                    labels: {
                        color: CHART_CONFIG.TEXT_COLOR,
                        font: {
                            family: 'Inter, sans-serif',
                            size: 12
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    borderColor: CHART_CONFIG.BORDER_COLOR,
                    borderWidth: 1,
                    cornerRadius: 8,
                    displayColors: true
                }
            },
            scales: {
                x: {
                    grid: {
                        color: CHART_CONFIG.GRID_COLOR
                    },
                    ticks: {
                        color: CHART_CONFIG.TEXT_COLOR
                    }
                },
                y: {
                    grid: {
                        color: CHART_CONFIG.GRID_COLOR
                    },
                    ticks: {
                        color: CHART_CONFIG.TEXT_COLOR,
                        callback: function(value) {
                            return Utils.formatCurrency(value);
                        }
                    }
                }
            }
        };
    }
    
    // ===== GRÁFICO DE DISTRIBUCIÓN DE CAPITAL =====
    
    /**
     * Crea el gráfico de distribución de capital
     * @param {Object} data - Datos del capital
     */
    createCapitalChart(data) {
        const ctx = document.getElementById('capital-chart');
        if (!ctx) return;
        
        // Destruir gráfico existente
        if (this.charts.has('capital')) {
            this.charts.get('capital').destroy();
        }
        
        const chartData = this.prepareCapitalData(data);
        
        const chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: chartData.labels,
                datasets: [{
                    data: chartData.values,
                    backgroundColor: CHART_COLORS.primary,
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 2,
                    hoverBorderColor: 'rgba(255, 255, 255, 0.3)',
                    hoverBorderWidth: 3
                }]
            },
            options: {
                ...this.defaultOptions,
                plugins: {
                    ...this.defaultOptions.plugins,
                    legend: {
                        ...this.defaultOptions.plugins.legend,
                        position: 'bottom',
                        labels: {
                            ...this.defaultOptions.plugins.legend.labels,
                            padding: 20,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        ...this.defaultOptions.plugins.tooltip,
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: ${Utils.formatCurrency(value)} (${percentage}%)`;
                            }
                        }
                    }
                },
                cutout: '60%',
                radius: '90%'
            }
        });
        
        this.charts.set('capital', chart);
    }
    
    /**
     * Prepara datos para el gráfico de capital
     * @param {Object} data - Datos brutos
     * @returns {Object} - Datos preparados
     */
    prepareCapitalData(data) {
        const categories = {
            'Dinero Líquido': 0,
            'Inversiones': 0,
            'Deudas': 0,
            'Otros': 0
        };
        
        // Procesar datos de capital
        if (data.capital && Array.isArray(data.capital)) {
            data.capital.forEach(item => {
                const amount = Utils.parseCurrency(item.Monto || 0);
                const category = item.Categoría || 'Otros';
                
                if (category.toLowerCase().includes('líquido') || category.toLowerCase().includes('efectivo')) {
                    categories['Dinero Líquido'] += amount;
                } else if (category.toLowerCase().includes('inversión')) {
                    categories['Inversiones'] += amount;
                } else if (category.toLowerCase().includes('deuda')) {
                    categories['Deudas'] += amount;
                } else {
                    categories['Otros'] += amount;
                }
            });
        }
        
        // Procesar datos de inversiones
        if (data.investments && Array.isArray(data.investments)) {
            data.investments.forEach(item => {
                const amount = Utils.parseCurrency(item.Monto || 0);
                categories['Inversiones'] += amount;
            });
        }
        
        // Procesar datos de deudas
        if (data.debts && Array.isArray(data.debts)) {
            data.debts.forEach(item => {
                const amount = Utils.parseCurrency(item.Monto || 0);
                categories['Deudas'] += amount;
            });
        }
        
        // Filtrar categorías con valor 0
        const filteredCategories = Object.entries(categories)
            .filter(([key, value]) => value > 0)
            .sort(([,a], [,b]) => b - a);
        
        return {
            labels: filteredCategories.map(([key]) => key),
            values: filteredCategories.map(([, value]) => value)
        };
    }
    
    // ===== GRÁFICO DE FLUJO DE EFECTIVO =====
    
    /**
     * Crea el gráfico de flujo de efectivo
     * @param {Object} data - Datos del flujo de efectivo
     * @param {number} days - Número de días a mostrar
     */
    createCashflowChart(data, days = 30) {
        const ctx = document.getElementById('cashflow-chart');
        if (!ctx) return;
        
        // Destruir gráfico existente
        if (this.charts.has('cashflow')) {
            this.charts.get('cashflow').destroy();
        }
        
        const chartData = this.prepareCashflowData(data, days);
        
        const chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartData.labels,
                datasets: [
                    {
                        label: 'Ingresos',
                        data: chartData.income,
                        borderColor: CHART_COLORS.primary[1], // Verde
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: CHART_COLORS.primary[1],
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                        pointRadius: 4,
                        pointHoverRadius: 6
                    },
                    {
                        label: 'Gastos',
                        data: chartData.expenses,
                        borderColor: CHART_COLORS.primary[3], // Rojo
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: CHART_COLORS.primary[3],
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                        pointRadius: 4,
                        pointHoverRadius: 6
                    }
                ]
            },
            options: {
                ...this.defaultOptions,
                plugins: {
                    ...this.defaultOptions.plugins,
                    legend: {
                        ...this.defaultOptions.plugins.legend,
                        position: 'top'
                    }
                },
                scales: {
                    ...this.defaultOptions.scales,
                    x: {
                        ...this.defaultOptions.scales.x,
                        type: 'time',
                        time: {
                            unit: 'day',
                            displayFormats: {
                                day: 'DD/MM'
                            }
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
        
        this.charts.set('cashflow', chart);
    }
    
    /**
     * Prepara datos para el gráfico de flujo de efectivo
     * @param {Object} data - Datos brutos
     * @param {number} days - Número de días
     * @returns {Object} - Datos preparados
     */
    prepareCashflowData(data, days) {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        
        const dates = [];
        const income = [];
        const expenses = [];
        
        // Generar fechas
        for (let i = 0; i < days; i++) {
            const date = new Date(startDate);
            date.setDate(date.getDate() + i);
            dates.push(date);
            
            let dayIncome = 0;
            let dayExpenses = 0;
            
            // Procesar gastos
            if (data.expenses && Array.isArray(data.expenses)) {
                data.expenses.forEach(item => {
                    const itemDate = new Date(item.Fecha);
                    if (itemDate.toDateString() === date.toDateString()) {
                        dayExpenses += Utils.parseCurrency(item['Precio-Gs'] || 0);
                    }
                });
            }
            
            // Procesar capital (ingresos y gastos)
            if (data.capital && Array.isArray(data.capital)) {
                data.capital.forEach(item => {
                    const itemDate = new Date(item.Fecha);
                    if (itemDate.toDateString() === date.toDateString()) {
                        const amount = Utils.parseCurrency(item.Monto || 0);
                        if (item.Tipo === 'Ingreso') {
                            dayIncome += amount;
                        } else {
                            dayExpenses += amount;
                        }
                    }
                });
            }
            
            income.push(dayIncome);
            expenses.push(dayExpenses);
        }
        
        return {
            labels: dates.map(date => Utils.formatDate(date, 'DD/MM')),
            income: income,
            expenses: expenses
        };
    }
    
    // ===== GRÁFICO DE GASTOS POR CATEGORÍA =====
    
    /**
     * Crea el gráfico de gastos por categoría
     * @param {Array} expenses - Datos de gastos
     */
    createExpensesByCategoryChart(expenses) {
        const ctx = document.getElementById('expenses-category-chart');
        if (!ctx) return;
        
        // Destruir gráfico existente
        if (this.charts.has('expenses-category')) {
            this.charts.get('expenses-category').destroy();
        }
        
        const chartData = this.prepareExpensesByCategoryData(expenses);
        
        const chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: chartData.labels,
                datasets: [{
                    label: 'Gastos por Categoría',
                    data: chartData.values,
                    backgroundColor: CHART_COLORS.primary,
                    borderColor: CHART_COLORS.primary.map(color => color + '80'),
                    borderWidth: 1,
                    borderRadius: 8,
                    borderSkipped: false
                }]
            },
            options: {
                ...this.defaultOptions,
                plugins: {
                    ...this.defaultOptions.plugins,
                    legend: {
                        display: false
                    }
                },
                scales: {
                    ...this.defaultOptions.scales,
                    x: {
                        ...this.defaultOptions.scales.x,
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        ...this.defaultOptions.scales.y,
                        beginAtZero: true
                    }
                }
            }
        });
        
        this.charts.set('expenses-category', chart);
    }
    
    /**
     * Prepara datos para el gráfico de gastos por categoría
     * @param {Array} expenses - Datos de gastos
     * @returns {Object} - Datos preparados
     */
    prepareExpensesByCategoryData(expenses) {
        const categories = {};
        
        if (Array.isArray(expenses)) {
            expenses.forEach(item => {
                const category = item.Categoria || 'Sin categoría';
                const amount = Utils.parseCurrency(item['Precio-Gs'] || 0);
                
                categories[category] = (categories[category] || 0) + amount;
            });
        }
        
        // Ordenar por valor descendente y tomar los top 10
        const sortedCategories = Object.entries(categories)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10);
        
        return {
            labels: sortedCategories.map(([key]) => key),
            values: sortedCategories.map(([, value]) => value)
        };
    }
    
    // ===== GRÁFICO DE TENDENCIAS =====
    
    /**
     * Crea el gráfico de tendencias
     * @param {Object} data - Datos de tendencias
     */
    createTrendsChart(data) {
        const ctx = document.getElementById('trends-chart');
        if (!ctx) return;
        
        // Destruir gráfico existente
        if (this.charts.has('trends')) {
            this.charts.get('trends').destroy();
        }
        
        const chartData = this.prepareTrendsData(data);
        
        const chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartData.labels,
                datasets: [
                    {
                        label: 'Capital Total',
                        data: chartData.capital,
                        borderColor: CHART_COLORS.primary[0],
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        borderWidth: 3,
                        fill: false,
                        tension: 0.4
                    },
                    {
                        label: 'Inversiones',
                        data: chartData.investments,
                        borderColor: CHART_COLORS.primary[1],
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        borderWidth: 3,
                        fill: false,
                        tension: 0.4
                    },
                    {
                        label: 'Deudas',
                        data: chartData.debts,
                        borderColor: CHART_COLORS.primary[3],
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        borderWidth: 3,
                        fill: false,
                        tension: 0.4
                    }
                ]
            },
            options: {
                ...this.defaultOptions,
                plugins: {
                    ...this.defaultOptions.plugins,
                    legend: {
                        ...this.defaultOptions.plugins.legend,
                        position: 'top'
                    }
                }
            }
        });
        
        this.charts.set('trends', chart);
    }
    
    /**
     * Prepara datos para el gráfico de tendencias
     * @param {Object} data - Datos brutos
     * @returns {Object} - Datos preparados
     */
    prepareTrendsData(data) {
        // Implementar lógica para preparar datos de tendencias
        // Por ahora retornamos datos de ejemplo
        return {
            labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
            capital: [5000000, 5200000, 5100000, 5400000, 5300000, 5500000],
            investments: [1000000, 1100000, 1050000, 1200000, 1150000, 1250000],
            debts: [500000, 480000, 520000, 450000, 470000, 430000]
        };
    }
    
    // ===== MÉTODOS UTILITARIOS =====
    
    /**
     * Actualiza un gráfico existente
     * @param {string} chartId - ID del gráfico
     * @param {Object} newData - Nuevos datos
     */
    updateChart(chartId, newData) {
        const chart = this.charts.get(chartId);
        if (chart) {
            chart.data = newData;
            chart.update();
        }
    }
    
    /**
     * Destruye un gráfico específico
     * @param {string} chartId - ID del gráfico
     */
    destroyChart(chartId) {
        const chart = this.charts.get(chartId);
        if (chart) {
            chart.destroy();
            this.charts.delete(chartId);
        }
    }
    
    /**
     * Destruye todos los gráficos
     */
    destroyAllCharts() {
        this.charts.forEach(chart => chart.destroy());
        this.charts.clear();
    }
    
    /**
     * Redimensiona todos los gráficos
     */
    resizeAllCharts() {
        this.charts.forEach(chart => chart.resize());
    }
    
    /**
     * Obtiene el gráfico por ID
     * @param {string} chartId - ID del gráfico
     * @returns {Chart|null} - Instancia del gráfico
     */
    getChart(chartId) {
        return this.charts.get(chartId) || null;
    }
}

// Crear instancia global del gestor de gráficos
window.chartManager = new ChartManager();
