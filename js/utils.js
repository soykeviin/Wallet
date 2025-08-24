// ===== UTILIDADES DEL SISTEMA =====

// Clase principal de utilidades
class Utils {
    
    // ===== FORMATEO DE NÚMEROS Y MONEDAS =====
    
    /**
     * Formatea un número como moneda
     * @param {number} amount - Cantidad a formatear
     * @param {string} currency - Código de moneda (default: PYG)
     * @returns {string} - Número formateado
     */
    static formatCurrency(amount, currency = 'PYG') {
        if (amount === null || amount === undefined || isNaN(amount)) {
            return '₲0';
        }
        
        const numAmount = parseFloat(amount);
        const currencyConfig = CURRENCIES[currency] || CURRENCIES.PYG;
        
        return new Intl.NumberFormat(currencyConfig.format, {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(numAmount);
    }
    
    /**
     * Formatea un número con separadores de miles
     * @param {number} number - Número a formatear
     * @returns {string} - Número formateado
     */
    static formatNumber(number) {
        if (number === null || number === undefined || isNaN(number)) {
            return '0';
        }
        
        return new Intl.NumberFormat('es-PY').format(number);
    }
    
    /**
     * Convierte un string de moneda a número
     * @param {string} currencyString - String de moneda
     * @returns {number} - Número
     */
    static parseCurrency(currencyString) {
        if (!currencyString) return 0;
        
        // Remover símbolos de moneda y separadores
        const cleanString = currencyString.replace(/[₲$,€\s.]/g, '').replace(',', '.');
        return parseFloat(cleanString) || 0;
    }
    
    // ===== FORMATEO DE FECHAS =====
    
    /**
     * Formatea una fecha
     * @param {string|Date} date - Fecha a formatear
     * @param {string} format - Formato deseado
     * @returns {string} - Fecha formateada
     */
    static formatDate(date, format = 'DD/MM/YYYY') {
        if (!date) return '';
        
        const dateObj = new Date(date);
        if (isNaN(dateObj.getTime())) return '';
        
        const day = dateObj.getDate().toString().padStart(2, '0');
        const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
        const year = dateObj.getFullYear();
        
        switch (format) {
            case 'DD/MM/YYYY':
                return `${day}/${month}/${year}`;
            case 'YYYY-MM-DD':
                return `${year}-${month}-${day}`;
            case 'MM/DD/YYYY':
                return `${month}/${day}/${year}`;
            default:
                return `${day}/${month}/${year}`;
        }
    }
    
    /**
     * Formatea una fecha y hora
     * @param {string|Date} date - Fecha a formatear
     * @returns {string} - Fecha y hora formateada
     */
    static formatDateTime(date) {
        if (!date) return '';
        
        const dateObj = new Date(date);
        if (isNaN(dateObj.getTime())) return '';
        
        const formattedDate = this.formatDate(dateObj);
        const hours = dateObj.getHours().toString().padStart(2, '0');
        const minutes = dateObj.getMinutes().toString().padStart(2, '0');
        
        return `${formattedDate} ${hours}:${minutes}`;
    }
    
    /**
     * Obtiene la fecha relativa (ej: "hace 2 días")
     * @param {string|Date} date - Fecha
     * @returns {string} - Fecha relativa
     */
    static getRelativeDate(date) {
        if (!date) return '';
        
        const dateObj = new Date(date);
        if (isNaN(dateObj.getTime())) return '';
        
        const now = new Date();
        const diffTime = Math.abs(now - dateObj);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return 'Hoy';
        if (diffDays === 1) return 'Ayer';
        if (diffDays < 7) return `Hace ${diffDays} días`;
        if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`;
        if (diffDays < 365) return `Hace ${Math.floor(diffDays / 30)} meses`;
        return `Hace ${Math.floor(diffDays / 365)} años`;
    }
    
    // ===== VALIDACIONES =====
    
    /**
     * Valida si un valor es un número válido
     * @param {*} value - Valor a validar
     * @returns {boolean} - True si es válido
     */
    static isValidNumber(value) {
        return !isNaN(parseFloat(value)) && isFinite(value);
    }
    
    /**
     * Valida si un valor es un email válido
     * @param {string} email - Email a validar
     * @returns {boolean} - True si es válido
     */
    static isValidEmail(email) {
        return VALIDATIONS.EMAIL_REGEX.test(email);
    }
    
    /**
     * Valida si un valor es una fecha válida
     * @param {string|Date} date - Fecha a validar
     * @returns {boolean} - True si es válida
     */
    static isValidDate(date) {
        const dateObj = new Date(date);
        return !isNaN(dateObj.getTime());
    }
    
    /**
     * Valida si un string tiene la longitud correcta
     * @param {string} value - Valor a validar
     * @param {number} min - Longitud mínima
     * @param {number} max - Longitud máxima
     * @returns {boolean} - True si es válido
     */
    static isValidLength(value, min = VALIDATIONS.MIN_LENGTH, max = VALIDATIONS.MAX_LENGTH) {
        return value && value.length >= min && value.length <= max;
    }
    
    // ===== MANIPULACIÓN DE ARRAYS Y OBJETOS =====
    
    /**
     * Agrupa un array por una propiedad específica
     * @param {Array} array - Array a agrupar
     * @param {string} key - Propiedad para agrupar
     * @returns {Object} - Objeto agrupado
     */
    static groupBy(array, key) {
        return array.reduce((groups, item) => {
            const group = item[key] || 'Sin categoría';
            groups[group] = groups[group] || [];
            groups[group].push(item);
            return groups;
        }, {});
    }
    
    /**
     * Ordena un array por una propiedad específica
     * @param {Array} array - Array a ordenar
     * @param {string} key - Propiedad para ordenar
     * @param {string} order - Orden (asc/desc)
     * @returns {Array} - Array ordenado
     */
    static sortBy(array, key, order = 'asc') {
        return [...array].sort((a, b) => {
            let aVal = a[key];
            let bVal = b[key];
            
            // Convertir a números si es posible
            if (this.isValidNumber(aVal) && this.isValidNumber(bVal)) {
                aVal = parseFloat(aVal);
                bVal = parseFloat(bVal);
            }
            
            if (order === 'desc') {
                return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
            }
            return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
        });
    }
    
    /**
     * Filtra un array por múltiples criterios
     * @param {Array} array - Array a filtrar
     * @param {Object} filters - Objeto con filtros
     * @returns {Array} - Array filtrado
     */
    static filterBy(array, filters) {
        return array.filter(item => {
            return Object.keys(filters).every(key => {
                const filterValue = filters[key];
                const itemValue = item[key];
                
                if (filterValue === null || filterValue === undefined || filterValue === '') {
                    return true;
                }
                
                if (typeof filterValue === 'string') {
                    return itemValue && itemValue.toLowerCase().includes(filterValue.toLowerCase());
                }
                
                if (typeof filterValue === 'number') {
                    return itemValue === filterValue;
                }
                
                if (Array.isArray(filterValue)) {
                    return filterValue.includes(itemValue);
                }
                
                return itemValue === filterValue;
            });
        });
    }
    
    // ===== CÁLCULOS FINANCIEROS =====
    
    /**
     * Calcula el porcentaje de cambio entre dos valores
     * @param {number} oldValue - Valor anterior
     * @param {number} newValue - Valor nuevo
     * @returns {number} - Porcentaje de cambio
     */
    static calculatePercentageChange(oldValue, newValue) {
        if (oldValue === 0) return newValue > 0 ? 100 : 0;
        return ((newValue - oldValue) / oldValue) * 100;
    }
    
    /**
     * Calcula el promedio de un array de números
     * @param {Array} numbers - Array de números
     * @returns {number} - Promedio
     */
    static calculateAverage(numbers) {
        if (!Array.isArray(numbers) || numbers.length === 0) return 0;
        const sum = numbers.reduce((acc, num) => acc + parseFloat(num || 0), 0);
        return sum / numbers.length;
    }
    
    /**
     * Calcula la suma de un array de números
     * @param {Array} numbers - Array de números
     * @returns {number} - Suma
     */
    static calculateSum(numbers) {
        if (!Array.isArray(numbers)) return 0;
        return numbers.reduce((acc, num) => acc + parseFloat(num || 0), 0);
    }
    
    /**
     * Calcula el valor máximo de un array
     * @param {Array} numbers - Array de números
     * @returns {number} - Valor máximo
     */
    static calculateMax(numbers) {
        if (!Array.isArray(numbers) || numbers.length === 0) return 0;
        return Math.max(...numbers.map(num => parseFloat(num || 0)));
    }
    
    /**
     * Calcula el valor mínimo de un array
     * @param {Array} numbers - Array de números
     * @returns {number} - Valor mínimo
     */
    static calculateMin(numbers) {
        if (!Array.isArray(numbers) || numbers.length === 0) return 0;
        return Math.min(...numbers.map(num => parseFloat(num || 0)));
    }
    
    // ===== MANIPULACIÓN DEL DOM =====
    
    /**
     * Crea un elemento HTML con atributos
     * @param {string} tag - Tag del elemento
     * @param {Object} attributes - Atributos del elemento
     * @param {string} content - Contenido del elemento
     * @returns {HTMLElement} - Elemento creado
     */
    static createElement(tag, attributes = {}, content = '') {
        const element = document.createElement(tag);
        
        Object.keys(attributes).forEach(key => {
            if (key === 'className') {
                element.className = attributes[key];
            } else if (key === 'innerHTML') {
                element.innerHTML = attributes[key];
            } else {
                element.setAttribute(key, attributes[key]);
            }
        });
        
        if (content) {
            element.textContent = content;
        }
        
        return element;
    }
    
    /**
     * Escapa HTML para prevenir XSS
     * @param {string} text - Texto a escapar
     * @returns {string} - Texto escapado
     */
    static escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    /**
     * Anima un valor numérico
     * @param {string} elementId - ID del elemento
     * @param {number} start - Valor inicial
     * @param {number} end - Valor final
     * @param {number} duration - Duración en ms
     */
    static animateValue(elementId, start, end, duration) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const value = Math.floor(progress * (end - start) + start);
            element.textContent = Utils.formatCurrency(value);
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }
    
    // ===== ALMACENAMIENTO LOCAL =====
    
    /**
     * Guarda datos en localStorage
     * @param {string} key - Clave
     * @param {*} value - Valor
     */
    static saveToStorage(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error('Error al guardar en localStorage:', error);
        }
    }
    
    /**
     * Obtiene datos de localStorage
     * @param {string} key - Clave
     * @param {*} defaultValue - Valor por defecto
     * @returns {*} - Valor guardado
     */
    static getFromStorage(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Error al obtener de localStorage:', error);
            return defaultValue;
        }
    }
    
    /**
     * Elimina datos de localStorage
     * @param {string} key - Clave
     */
    static removeFromStorage(key) {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error('Error al eliminar de localStorage:', error);
        }
    }
    
    // ===== NOTIFICACIONES =====
    
    /**
     * Muestra una notificación
     * @param {string} message - Mensaje
     * @param {string} type - Tipo (success, error, warning, info)
     * @param {number} duration - Duración en ms
     */
    static showNotification(message, type = 'info', duration = 3000) {
        const notification = this.createElement('div', {
            className: `alert alert-${type}`,
            innerHTML: `
                <i class="fas fa-${this.getNotificationIcon(type)}"></i>
                <span>${this.escapeHtml(message)}</span>
            `
        });
        
        document.body.appendChild(notification);
        
        // Animar entrada
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateY(0)';
        }, 100);
        
        // Remover después del tiempo especificado
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateY(-20px)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);
    }
    
    /**
     * Obtiene el icono para el tipo de notificación
     * @param {string} type - Tipo de notificación
     * @returns {string} - Nombre del icono
     */
    static getNotificationIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }
    
    // ===== UTILIDADES DE FECHA =====
    
    /**
     * Obtiene el primer día del mes
     * @param {Date} date - Fecha
     * @returns {Date} - Primer día del mes
     */
    static getFirstDayOfMonth(date = new Date()) {
        return new Date(date.getFullYear(), date.getMonth(), 1);
    }
    
    /**
     * Obtiene el último día del mes
     * @param {Date} date - Fecha
     * @returns {Date} - Último día del mes
     */
    static getLastDayOfMonth(date = new Date()) {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0);
    }
    
    /**
     * Obtiene el número de días en un mes
     * @param {Date} date - Fecha
     * @returns {number} - Número de días
     */
    static getDaysInMonth(date = new Date()) {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    }
    
    /**
     * Verifica si una fecha está en el mes actual
     * @param {Date} date - Fecha a verificar
     * @returns {boolean} - True si está en el mes actual
     */
    static isCurrentMonth(date) {
        const now = new Date();
        return date.getMonth() === now.getMonth() && 
               date.getFullYear() === now.getFullYear();
    }
    
    // ===== UTILIDADES DE STRING =====
    
    /**
     * Capitaliza la primera letra de un string
     * @param {string} str - String a capitalizar
     * @returns {string} - String capitalizado
     */
    static capitalize(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }
    
    /**
     * Trunca un string a una longitud específica
     * @param {string} str - String a truncar
     * @param {number} length - Longitud máxima
     * @param {string} suffix - Sufijo para strings truncados
     * @returns {string} - String truncado
     */
    static truncate(str, length = 50, suffix = '...') {
        if (!str || str.length <= length) return str;
        return str.substring(0, length) + suffix;
    }
    
    /**
     * Genera un ID único
     * @returns {string} - ID único
     */
    static generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
}

// Exportar utilidades
window.Utils = Utils;
