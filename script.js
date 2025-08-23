// Configuración de la aplicación
const CONFIG = {
    GOOGLE_SHEETS_URL: 'https://docs.google.com/spreadsheets/d/1-71MXkppgdH3q-F8t6TnKK4V18s_AHqlMIzxG3mfWLg/edit?usp=sharing',
    SHEET_ID: '1-71MXkppgdH3q-F8t6TnKK4V18s_AHqlMIzxG3mfWLg',
    SHEET_NAME: 'Sheet1'
};

// Estado global de la aplicación
let expensesData = [];
let filteredData = [];

// Elementos del DOM
const elements = {
    tableBody: document.getElementById('table-body'),
    loading: document.getElementById('loading'),
    noData: document.getElementById('no-data'),
    searchInput: document.getElementById('search-input'),
    refreshBtn: document.getElementById('refresh-btn'),
    exportBtn: document.getElementById('export-btn'),
    testBtn: document.getElementById('test-btn'),
    totalGastos: document.getElementById('total-gastos'),
    totalTarjeta: document.getElementById('total-tarjeta'),
    totalTransacciones: document.getElementById('total-transacciones')
};

// Inicialización de la aplicación
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
});

// Configurar event listeners
function setupEventListeners() {
    elements.searchInput.addEventListener('input', handleSearch);
    elements.refreshBtn.addEventListener('click', loadData);
    elements.exportBtn.addEventListener('click', exportToCSV);
    elements.testBtn.addEventListener('click', testConnection);
}

// Inicializar la aplicación
function initializeApp() {
    showLoading();
    loadData();
}

// Cargar datos desde Google Sheets
async function loadData() {
    try {
        showLoading();
        
        // Cargar datos reales de Google Sheets
        const data = await fetchGoogleSheetsData();
        
        if (data && data.length > 0) {
            expensesData = data;
            filteredData = [...data];
            renderTable();
            updateStats();
            hideLoading();
        } else {
            // Si no hay datos, mostrar mensaje apropiado
            showNoData();
        }
    } catch (error) {
        console.error('Error al cargar datos:', error);
        showNoData();
    }
}

// Intentar obtener datos de Google Sheets
async function fetchGoogleSheetsData() {
    try {
        // Intentar múltiples formatos de URL para Google Sheets
        const urls = [
            // URL de publicación directa (recomendada)
            'https://docs.google.com/spreadsheets/d/1-71MXkppgdH3q-F8t6TnKK4V18s_AHqlMIzxG3mfWLg/pub?gid=0&single=true&output=csv',
            // URL alternativa
            'https://docs.google.com/spreadsheets/d/1-71MXkppgdH3q-F8t6TnKK4V18s_AHqlMIzxG3mfWLg/export?gid=0&format=csv',
            // URL de edición convertida
            CONFIG.GOOGLE_SHEETS_URL.replace('/edit?usp=sharing', '/pub?gid=0&single=true&output=csv')
        ];
        
        for (let i = 0; i < urls.length; i++) {
            try {
                console.log(`Intentando URL ${i + 1}:`, urls[i]);
                
                const response = await fetch(urls[i]);
                if (response.ok) {
                    const csvText = await response.text();
                    console.log('Datos CSV recibidos:', csvText.substring(0, 200) + '...');
                    
                    const parsedData = parseCSV(csvText);
                    console.log('Datos parseados:', parsedData.length, 'filas');
                    
                    return parsedData;
                }
            } catch (urlError) {
                console.warn(`Error con URL ${i + 1}:`, urlError);
                continue;
            }
        }
        
        throw new Error('No se pudo acceder a ninguna URL de Google Sheets');
    } catch (error) {
        console.error('Error al cargar datos de Google Sheets:', error);
        return null;
    }
}

// Parsear CSV a array de objetos
function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) {
        console.warn('CSV vacío o sin datos');
        return [];
    }
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    console.log('Columnas detectadas:', headers);
    
    const data = [];
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
        
        // Solo procesar filas que tengan al menos un valor no vacío en las primeras columnas
        if (values.length > 0 && values.slice(0, 3).some(v => v !== '')) {
            const row = {};
            headers.forEach((header, index) => {
                row[header] = values[index] || '';
            });
            data.push(row);
        }
    }
    
    console.log('Filas procesadas:', data.length);
    return data;
}



// Renderizar la tabla
function renderTable() {
    if (filteredData.length === 0) {
        showNoData();
        elements.exportBtn.style.display = 'none';
        return;
    }
    
    const tableHTML = filteredData.map(row => `
        <tr>
            <td>${escapeHtml(row['Producto'] || '')}</td>
            <td>${escapeHtml(row['Fecha'] || '')}</td>
            <td>${formatPrice(row['Precio-Gs'] || '0')}</td>
            <td>${escapeHtml(row['Tarjeta'] || '')}</td>
            <td>${escapeHtml(row['Hora'] || '')}</td>
        </tr>
    `).join('');
    
    elements.tableBody.innerHTML = tableHTML;
    elements.noData.style.display = 'none';
    elements.exportBtn.style.display = 'flex';
}

// Actualizar estadísticas
function updateStats() {
    const totalGastos = expensesData.reduce((sum, row) => {
        const precio = parseInt(row['Precio-Gs'] || '0') || 0;
        return sum + precio;
    }, 0);
    
    const totalTarjeta = expensesData.reduce((sum, row) => {
        if (row['Tarjeta'] && row['Tarjeta'].toLowerCase().includes('crédito')) {
            const precio = parseInt(row['Precio-Gs'] || '0') || 0;
            return sum + precio;
        }
        return sum;
    }, 0);
    
    const totalTransacciones = expensesData.length;
    
    elements.totalGastos.textContent = formatPrice(totalGastos.toString());
    elements.totalTarjeta.textContent = formatPrice(totalTarjeta.toString());
    elements.totalTransacciones.textContent = totalTransacciones;
}

// Manejar búsqueda
function handleSearch() {
    const searchTerm = elements.searchInput.value.toLowerCase().trim();
    
    if (searchTerm === '') {
        filteredData = [...expensesData];
    } else {
        filteredData = expensesData.filter(row => {
            const producto = (row['Producto'] || '').toLowerCase();
            const tarjeta = (row['Tarjeta'] || '').toLowerCase();
            const fecha = (row['Fecha'] || '').toLowerCase();
            
            return producto.includes(searchTerm) || 
                   tarjeta.includes(searchTerm) || 
                   fecha.includes(searchTerm);
        });
    }
    
    renderTable();
}

// Mostrar estado de carga
function showLoading() {
    elements.loading.style.display = 'block';
    elements.noData.style.display = 'none';
    elements.exportBtn.style.display = 'none';
    elements.tableBody.innerHTML = '';
}

// Ocultar estado de carga
function hideLoading() {
    elements.loading.style.display = 'none';
}

// Mostrar mensaje de no datos
function showNoData() {
    elements.noData.style.display = 'block';
    elements.tableBody.innerHTML = '';
    elements.exportBtn.style.display = 'none';
    
    // Actualizar el mensaje para ser más específico
    const noDataElement = document.getElementById('no-data');
    noDataElement.innerHTML = `
        <i class="fas fa-inbox"></i>
        <p>No hay datos disponibles</p>
        <p style="font-size: 0.9rem; color: #666; margin-top: 10px;">
            Verifica que tu Google Sheets esté publicado y contenga datos
        </p>
    `;
}

// Utilidades
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatPrice(price) {
    const numPrice = parseInt(price) || 0;
    return new Intl.NumberFormat('es-PY', {
        style: 'currency',
        currency: 'PYG',
        minimumFractionDigits: 0
    }).format(numPrice);
}

// Función para exportar datos (opcional)
function exportToCSV() {
    if (filteredData.length === 0) return;
    
    const headers = Object.keys(filteredData[0]);
    const csvContent = [
        headers.join(','),
        ...filteredData.map(row => 
            headers.map(header => `"${row[header] || ''}"`).join(',')
        )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'billetera_gastos.csv');
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Función para probar la conexión con Google Sheets
async function testConnection() {
    const originalText = elements.testBtn.innerHTML;
    elements.testBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Probando...';
    elements.testBtn.disabled = true;
    
    try {
        console.log('=== PRUEBA DE CONEXIÓN ===');
        const data = await fetchGoogleSheetsData();
        
        if (data && data.length > 0) {
            alert(`✅ Conexión exitosa!\n\nSe encontraron ${data.length} filas de datos.\n\nPrimera fila:\n${JSON.stringify(data[0], null, 2)}`);
            console.log('✅ Conexión exitosa:', data);
        } else {
            alert('❌ No se pudieron cargar datos.\n\nVerifica que tu Google Sheets esté publicado.');
            console.log('❌ No se pudieron cargar datos');
        }
    } catch (error) {
        alert(`❌ Error de conexión:\n\n${error.message}\n\nVerifica que tu Google Sheets esté publicado.`);
        console.error('❌ Error de conexión:', error);
    } finally {
        elements.testBtn.innerHTML = originalText;
        elements.testBtn.disabled = false;
    }
}

// Función para refrescar datos automáticamente cada 5 minutos
setInterval(() => {
    // Solo refrescar si la página está visible
    if (!document.hidden) {
        loadData();
    }
}, 5 * 60 * 1000);

// Manejar errores globales
window.addEventListener('error', function(e) {
    console.error('Error en la aplicación:', e.error);
    showNoData();
});

// Notificación de estado de conexión
window.addEventListener('online', function() {
    console.log('Conexión restaurada');
    loadData();
});

window.addEventListener('offline', function() {
    console.log('Sin conexión a internet');
    showNoData();
}); 