// ===== API Y CONEXIÓN CON GOOGLE SHEETS =====

class API {
    
    constructor() {
        this.connectionStatus = CONNECTION_STATUS.DISCONNECTED;
        this.lastSync = null;
    }
    
    // ===== CONEXIÓN CON GOOGLE SHEETS =====
    
    /**
     * Obtiene datos de una hoja específica
     * @param {string} sheetId - ID de la hoja de Google Sheets
     * @returns {Promise<Array>} - Datos de la hoja
     */
    async getSheetData(sheetId) {
        try {
            this.updateConnectionStatus(CONNECTION_STATUS.CONNECTING);
            
            const urls = [
                `https://docs.google.com/spreadsheets/d/${sheetId}/pub?gid=0&single=true&output=csv`,
                `https://docs.google.com/spreadsheets/d/${sheetId}/export?gid=0&format=csv`
            ];
            
            let csvData = null;
            let lastError = null;
            
            // Intentar cada URL
            for (const url of urls) {
                try {
                    console.log(`Intentando obtener datos desde ${url}`);
                    const response = await fetch(url);
                    
                    if (response.ok) {
                        csvData = await response.text();
                        console.log(`Datos obtenidos exitosamente`);
                        break;
                    } else {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }
                } catch (error) {
                    console.warn(`Error con URL:`, url, error);
                    lastError = error;
                    continue;
                }
            }
            
            if (!csvData) {
                throw new Error(`No se pudo acceder a la hoja. Verifica que esté publicada.`);
            }
            
            const data = this.parseCSV(csvData);
            this.updateConnectionStatus(CONNECTION_STATUS.CONNECTED);
            this.lastSync = new Date();
            
            return data;
            
        } catch (error) {
            console.error(`Error al obtener datos:`, error);
            this.updateConnectionStatus(CONNECTION_STATUS.ERROR, error.message);
            throw error;
        }
    }
    
    /**
     * Obtiene datos de gastos
     * @returns {Promise<Array>} - Datos de gastos
     */
    async getExpenses() {
        return this.getSheetData(GOOGLE_SHEETS_CONFIG.EXPENSES_SHEET_ID);
    }
    
    /**
     * Obtiene datos de ingresos
     * @returns {Promise<Array>} - Datos de ingresos
     */
    async getIncome() {
        return this.getSheetData(GOOGLE_SHEETS_CONFIG.INCOME_SHEET_ID);
    }
    
    /**
     * Obtiene datos de deudas
     * @returns {Promise<Array>} - Datos de deudas
     */
    async getDebts() {
        return this.getSheetData(GOOGLE_SHEETS_CONFIG.DEBTS_SHEET_ID);
    }
    
    /**
     * Obtiene todos los datos del sistema
     * @returns {Promise<Object>} - Todos los datos
     */
    async getAllData() {
        try {
            const [expenses, income, debts] = await Promise.allSettled([
                this.getExpenses(),
                this.getIncome(),
                this.getDebts()
            ]);
            
            return {
                expenses: expenses.status === 'fulfilled' ? expenses.value : [],
                income: income.status === 'fulfilled' ? income.value : [],
                debts: debts.status === 'fulfilled' ? debts.value : [],
                lastSync: this.lastSync
            };
        } catch (error) {
            console.error('Error al obtener todos los datos:', error);
            throw error;
        }
    }
    
    // ===== PARSEO DE CSV =====
    
    /**
     * Parsea datos CSV a array de objetos
     * @param {string} csvText - Texto CSV
     * @returns {Array} - Array de objetos
     */
    parseCSV(csvText) {
        const lines = csvText.trim().split('\n');
        if (lines.length < 2) return [];
        
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const data = [];
        
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
            
            // Solo procesar filas con datos válidos
            if (values.length > 0 && values.slice(0, 3).some(v => v !== '')) {
                const row = {};
                headers.forEach((header, index) => {
                    row[header] = values[index] || '';
                });
                data.push(row);
            }
        }
        
        return data;
    }
    
    // ===== ESTADO DE CONEXIÓN =====
    
    /**
     * Actualiza el estado de conexión
     * @param {string} status - Estado de conexión
     * @param {string} message - Mensaje de error (opcional)
     */
    updateConnectionStatus(status, message = '') {
        this.connectionStatus = status;
        
        const statusElement = document.getElementById('connection-status');
        const statusText = document.getElementById('status-text');
        
        if (!statusElement || !statusText) return;
        
        // Remover clases anteriores
        statusElement.className = 'connection-status';
        statusElement.querySelector('.status-indicator').className = 'status-indicator';
        
        let statusMessage = '';
        let iconClass = '';
        
        switch (status) {
            case CONNECTION_STATUS.CONNECTED:
                statusMessage = 'Conectado a Google Sheets';
                iconClass = 'connected';
                break;
            case CONNECTION_STATUS.CONNECTING:
                statusMessage = 'Conectando a Google Sheets...';
                iconClass = 'connecting';
                break;
            case CONNECTION_STATUS.ERROR:
                statusMessage = `Error: ${message}`;
                iconClass = 'error';
                break;
            case CONNECTION_STATUS.DISCONNECTED:
                statusMessage = 'Desconectado';
                iconClass = 'error';
                break;
        }
        
        statusText.textContent = statusMessage;
        statusElement.querySelector('.status-indicator').classList.add(iconClass);
    }
    
    /**
     * Obtiene el estado actual de conexión
     * @returns {string} - Estado de conexión
     */
    getConnectionStatus() {
        return this.connectionStatus;
    }
    
    /**
     * Verifica si está conectado
     * @returns {boolean} - True si está conectado
     */
    isConnected() {
        return this.connectionStatus === CONNECTION_STATUS.CONNECTED;
    }
    
    // ===== DATOS DE EJEMPLO =====
    
    /**
     * Obtiene datos de ejemplo para desarrollo
     * @returns {Object} - Datos de ejemplo
     */
    getSampleData() {
        return {
            expenses: [
                {
                    'Fecha': '2024-12-19',
                    'Producto': 'Galletita',
                    'Precio-Gs': '8000',
                    'forma de pago': 'CRÉDITO',
                    'Hora': '14:30',
                    'Categoria': 'Alimentos'
                },
                {
                    'Fecha': '2024-12-19',
                    'Producto': 'Netflix',
                    'Precio-Gs': '75000',
                    'forma de pago': 'EFECTIVO',
                    'Hora': '15:30',
                    'Categoria': 'Suscripción'
                },
                {
                    'Fecha': '2024-12-19',
                    'Producto': 'Pizza',
                    'Precio-Gs': '47500',
                    'forma de pago': 'EFECTIVO',
                    'Hora': '14:30',
                    'Categoria': 'Alimentos'
                }
            ],
            capital: [
                {
                    'Fecha': '2024-12-19',
                    'Tipo': 'Ingreso',
                    'Monto': '5000000',
                    'Descripción': 'Salario',
                    'Categoría': 'Ingresos'
                },
                {
                    'Fecha': '2024-12-19',
                    'Tipo': 'Gasto',
                    'Monto': '150000',
                    'Descripción': 'Compras del mes',
                    'Categoría': 'Gastos'
                }
            ],
            investments: [
                {
                    'Fecha': '2024-12-19',
                    'Tipo': 'Acciones',
                    'Monto': '1000000',
                    'Descripción': 'Compra de acciones',
                    'Rendimiento': '5.2'
                }
            ],
            debts: [
                {
                    'Fecha': '2024-12-19',
                    'Tipo': 'Tarjeta de Crédito',
                    'Monto': '500000',
                    'Descripción': 'Visa',
                    'Interés': '15.5'
                }
            ]
        };
    }
    
    // ===== EXPORTACIÓN =====
    
    /**
     * Exporta datos a CSV
     * @param {Array} data - Datos a exportar
     * @param {string} filename - Nombre del archivo
     */
    exportToCSV(data, filename) {
        if (!Array.isArray(data) || data.length === 0) {
            Utils.showNotification('No hay datos para exportar', 'warning');
            return;
        }
        
        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(EXPORT_CONFIG.CSV_DELIMITER),
            ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(EXPORT_CONFIG.CSV_DELIMITER))
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `${filename}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }
    
    // ===== SINCRONIZACIÓN =====
    
    /**
     * Sincroniza datos automáticamente
     * @returns {Promise<Object>} - Datos sincronizados
     */
    async syncData() {
        try {
            console.log('Iniciando sincronización automática...');
            const data = await this.getAllData();
            
            // Guardar en localStorage como caché
            Utils.saveToStorage('profinance_cache', {
                data: data,
                timestamp: new Date().toISOString()
            });
            
            Utils.showNotification('Datos sincronizados correctamente', 'success');
            return data;
            
        } catch (error) {
            console.error('Error en sincronización:', error);
            Utils.showNotification('Error al sincronizar datos', 'error');
            throw error;
        }
    }
    
    /**
     * Obtiene datos del caché local
     * @returns {Object|null} - Datos en caché
     */
    getCachedData() {
        const cache = Utils.getFromStorage('profinance_cache');
        if (!cache || !cache.timestamp) return null;
        
        const cacheAge = new Date() - new Date(cache.timestamp);
        const maxAge = 5 * 60 * 1000; // 5 minutos
        
        if (cacheAge > maxAge) {
            Utils.removeFromStorage('profinance_cache');
            return null;
        }
        
        return cache.data;
    }
    
    // ===== VALIDACIÓN DE DATOS =====
    
    /**
     * Valida la estructura de datos de gastos
     * @param {Array} data - Datos a validar
     * @returns {boolean} - True si es válido
     */
    validateExpensesData(data) {
        if (!Array.isArray(data)) return false;
        
        const requiredFields = ['Fecha', 'Producto', 'Precio-Gs'];
        
        return data.every(item => {
            return requiredFields.every(field => {
                return item.hasOwnProperty(field) && item[field] !== '';
            });
        });
    }
    
    /**
     * Valida la estructura de datos de capital
     * @param {Array} data - Datos a validar
     * @returns {boolean} - True si es válido
     */
    validateCapitalData(data) {
        if (!Array.isArray(data)) return false;
        
        const requiredFields = ['Fecha', 'Tipo', 'Monto'];
        
        return data.every(item => {
            return requiredFields.every(field => {
                return item.hasOwnProperty(field) && item[field] !== '';
            });
        });
    }
    
    /**
     * Limpia y normaliza datos
     * @param {Array} data - Datos a limpiar
     * @returns {Array} - Datos limpios
     */
    cleanData(data) {
        if (!Array.isArray(data)) return [];
        
        return data.map(item => {
            const cleaned = {};
            
            Object.keys(item).forEach(key => {
                let value = item[key];
                
                // Limpiar espacios en blanco
                if (typeof value === 'string') {
                    value = value.trim();
                }
                
                // Convertir números
                if (key.includes('Precio') || key.includes('Monto') || key.includes('Rendimiento') || key.includes('Interés')) {
                    value = Utils.parseCurrency(value.toString());
                }
                
                cleaned[key] = value;
            });
            
            return cleaned;
        });
    }
}

// Crear instancia global de API
window.api = new API();
