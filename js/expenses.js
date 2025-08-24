/**
 * Expenses Manager - Gestión de Gastos
 * Maneja toda la lógica de la página de gastos
 */

class ExpensesManager {
  constructor() {
    this.expenses = [];
    this.filteredExpenses = [];
    this.currentExpense = null;
    this.expensesChart = null;
    
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.loadExpenses();
    this.setupAutoRefresh();
    this.initMobileMenu();
  }

  setupEventListeners() {
    // Botones principales
    document.getElementById('add-expense-btn').addEventListener('click', () => this.showAddModal());
    document.getElementById('export-expenses-btn').addEventListener('click', () => this.exportExpenses());
    document.getElementById('refresh-expenses-btn').addEventListener('click', () => this.refreshData());

    // Búsqueda y filtros
    document.getElementById('search-expenses').addEventListener('input', (e) => this.handleSearch(e.target.value));
    document.getElementById('filter-category').addEventListener('change', (e) => this.handleCategoryFilter(e.target.value));

    // Modal de agregar gasto
    document.getElementById('close-expense-modal').addEventListener('click', () => this.hideAddModal());
    document.getElementById('cancel-expense-btn').addEventListener('click', () => this.hideAddModal());
    document.getElementById('save-expense-btn').addEventListener('click', () => this.saveExpense());

    // Modal de editar gasto
    document.getElementById('close-edit-expense-modal').addEventListener('click', () => this.hideEditModal());
    document.getElementById('cancel-edit-expense-btn').addEventListener('click', () => this.hideEditModal());
    document.getElementById('update-expense-btn').addEventListener('click', () => this.updateExpense());

    // Cambio de período del gráfico
    document.getElementById('chart-period').addEventListener('change', (e) => this.updateChart(e.target.value));

    // Cerrar modales con Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.hideAddModal();
        this.hideEditModal();
      }
    });

    // Cerrar modales haciendo clic fuera
    document.getElementById('add-expense-modal').addEventListener('click', (e) => {
      if (e.target.id === 'add-expense-modal') this.hideAddModal();
    });
    document.getElementById('edit-expense-modal').addEventListener('click', (e) => {
      if (e.target.id === 'edit-expense-modal') this.hideEditModal();
    });
  }

  async loadExpenses() {
    try {
      // Mostrar estado de conexión
      API.updateConnectionStatus('connecting');
      
      // Intentar cargar datos de la API
      const data = await API.getExpenses();
      
      if (data && data.length > 0) {
        this.expenses = this.cleanExpensesData(data);
        API.updateConnectionStatus('connected');
      } else {
        // Usar datos de muestra si no hay datos reales
        this.expenses = this.getSampleExpenses();
        API.updateConnectionStatus('offline');
      }

      this.filteredExpenses = [...this.expenses];
      this.updateUI();
      this.createExpensesChart();
      
    } catch (error) {
      console.error('Error loading expenses:', error);
      this.expenses = this.getSampleExpenses();
      this.filteredExpenses = [...this.expenses];
      this.updateUI();
      this.createExpensesChart();
      API.updateConnectionStatus('error');
    }
  }

  cleanExpensesData(data) {
    return data.map(expense => ({
      id: expense.id || Utils.generateId(),
      date: expense.date || expense.fecha || expense[EXPENSES_COLUMNS.fecha] || new Date().toISOString().split('T')[0],
      time: expense.time || expense.hora || expense[EXPENSES_COLUMNS.hora] || '12:00',
      product: expense.product || expense.producto || expense[EXPENSES_COLUMNS.producto] || 'Sin descripción',
      category: expense.category || expense.categoria || expense[EXPENSES_COLUMNS.categoria] || 'Otros',
      price: parseFloat(expense.price || expense.precio || expense[EXPENSES_COLUMNS.precio] || 0),
      paymentMethod: expense.paymentMethod || expense.formaPago || expense[EXPENSES_COLUMNS.formaPago] || 'Efectivo',
      notes: expense.notes || expense.notas || ''
    })).filter(expense => expense.price > 0);
  }

  getSampleExpenses() {
    const categories = ['Alimentos', 'Transporte', 'Entretenimiento', 'Salud', 'Educación', 'Vivienda', 'Servicios', 'Ropa', 'Tecnología', 'Otros'];
    const paymentMethods = ['Efectivo', 'Débito', 'Crédito', 'Transferencia', 'Pago Móvil'];
    const products = [
      'Supermercado', 'Restaurante', 'Gasolina', 'Uber', 'Netflix', 'Medicamentos', 
      'Libros', 'Alquiler', 'Luz', 'Agua', 'Camisa', 'Laptop', 'Café', 'Pan'
    ];

    const sampleExpenses = [];
    const today = new Date();
    
    for (let i = 0; i < 50; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - Math.floor(Math.random() * 365));
      
      sampleExpenses.push({
        id: Utils.generateId(),
        date: date.toISOString().split('T')[0],
        time: `${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
        product: products[Math.floor(Math.random() * products.length)],
        category: categories[Math.floor(Math.random() * categories.length)],
        price: Math.floor(Math.random() * 500000) + 10000,
        paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
        notes: Math.random() > 0.7 ? 'Nota de muestra' : ''
      });
    }

    return sampleExpenses.sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  updateUI() {
    this.updateOverviewCards();
    this.updateExpensesTable();
  }

  updateOverviewCards() {
    const totalExpenses = this.expenses.reduce((sum, expense) => sum + expense.price, 0);
    const monthlyExpenses = this.getMonthlyExpenses();
    const dailyAverage = this.getDailyAverage();
    const categoriesCount = new Set(this.expenses.map(e => e.category)).size;

    // Actualizar tarjetas de resumen
    document.getElementById('total-expenses').textContent = Utils.formatCurrency(totalExpenses);
    document.getElementById('monthly-expenses').textContent = Utils.formatCurrency(monthlyExpenses);
    document.getElementById('daily-average').textContent = Utils.formatCurrency(dailyAverage);
    document.getElementById('categories-count').textContent = categoriesCount;

    // Calcular cambios porcentuales (simulado)
    const totalChange = Math.floor(Math.random() * 20) + 5;
    const monthlyChange = Math.floor(Math.random() * 15) + 3;
    const dailyChange = Math.floor(Math.random() * 25) + 8;

    document.getElementById('total-change').innerHTML = `<i class="fas fa-arrow-up"></i><span>+${totalChange}%</span>`;
    document.getElementById('monthly-change').innerHTML = `<i class="fas fa-arrow-up"></i><span>+${monthlyChange}%</span>`;
    document.getElementById('daily-change').innerHTML = `<i class="fas fa-arrow-up"></i><span>+${dailyChange}%</span>`;
  }

  getMonthlyExpenses() {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    return this.expenses
      .filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
      })
      .reduce((sum, expense) => sum + expense.price, 0);
  }

  getDailyAverage() {
    const last30Days = this.expenses
      .filter(expense => {
        const expenseDate = new Date(expense.date);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return expenseDate >= thirtyDaysAgo;
      });

    if (last30Days.length === 0) return 0;
    
    const total = last30Days.reduce((sum, expense) => sum + expense.price, 0);
    return total / 30;
  }

  updateExpensesTable() {
    const tbody = document.getElementById('expenses-tbody');
    tbody.innerHTML = '';

    if (this.filteredExpenses.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center text-muted">
            <i class="fas fa-inbox"></i>
            <p>No se encontraron gastos</p>
          </td>
        </tr>
      `;
      return;
    }

    this.filteredExpenses.forEach(expense => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${Utils.formatDate(expense.date)}</td>
        <td>
          <div class="expense-product">
            <strong>${Utils.escapeHtml(expense.product)}</strong>
            ${expense.notes ? `<small class="text-muted">${Utils.escapeHtml(expense.notes)}</small>` : ''}
          </div>
        </td>
        <td>
          <span class="badge badge-category">${Utils.escapeHtml(expense.category)}</span>
        </td>
        <td class="text-right">
          <strong class="text-danger">${Utils.formatCurrency(expense.price)}</strong>
        </td>
        <td>
          <span class="badge badge-payment">${Utils.escapeHtml(expense.paymentMethod)}</span>
        </td>
        <td>${expense.time}</td>
        <td>
          <div class="table-actions">
            <button class="btn btn-icon btn-sm" onclick="expensesManager.editExpense('${expense.id}')" title="Editar">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-icon btn-sm btn-danger" onclick="expensesManager.deleteExpense('${expense.id}')" title="Eliminar">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      `;
      tbody.appendChild(row);
    });
  }

  handleSearch(query) {
    const searchTerm = query.toLowerCase().trim();
    
    this.filteredExpenses = this.expenses.filter(expense => 
      expense.product.toLowerCase().includes(searchTerm) ||
      expense.category.toLowerCase().includes(searchTerm) ||
      expense.paymentMethod.toLowerCase().includes(searchTerm) ||
      expense.notes.toLowerCase().includes(searchTerm)
    );
    
    this.updateExpensesTable();
  }

  handleCategoryFilter(category) {
    if (!category) {
      this.filteredExpenses = [...this.expenses];
    } else {
      this.filteredExpenses = this.expenses.filter(expense => expense.category === category);
    }
    
    this.updateExpensesTable();
  }

  showAddModal() {
    document.getElementById('add-expense-modal').classList.add('show');
    document.getElementById('expense-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('expense-time').value = new Date().toTimeString().slice(0, 5);
    document.getElementById('expense-form').reset();
  }

  hideAddModal() {
    document.getElementById('add-expense-modal').classList.remove('show');
  }

  showEditModal(expense) {
    this.currentExpense = expense;
    document.getElementById('edit-expense-modal').classList.add('show');
    
    // Llenar el formulario con los datos del gasto
    document.getElementById('edit-expense-id').value = expense.id;
    document.getElementById('edit-expense-date').value = expense.date;
    document.getElementById('edit-expense-time').value = expense.time;
    document.getElementById('edit-expense-product').value = expense.product;
    document.getElementById('edit-expense-category').value = expense.category;
    document.getElementById('edit-expense-price').value = expense.price;
    document.getElementById('edit-expense-payment-method').value = expense.paymentMethod;
    document.getElementById('edit-expense-notes').value = expense.notes;
  }

  hideEditModal() {
    document.getElementById('edit-expense-modal').classList.remove('show');
    this.currentExpense = null;
  }

  saveExpense() {
    const formData = this.getFormData('expense');
    
    if (!this.validateExpenseForm(formData)) {
      return;
    }

    const newExpense = {
      id: Utils.generateId(),
      ...formData
    };

    this.expenses.unshift(newExpense);
    this.filteredExpenses = [...this.expenses];
    
    this.updateUI();
    this.updateExpensesChart();
    this.hideAddModal();
    
    Utils.showNotification('Gasto agregado exitosamente', 'success');
  }

  updateExpense() {
    const formData = this.getFormData('edit-expense');
    
    if (!this.validateExpenseForm(formData)) {
      return;
    }

    const index = this.expenses.findIndex(e => e.id === this.currentExpense.id);
    if (index !== -1) {
      this.expenses[index] = { ...this.currentExpense, ...formData };
      this.filteredExpenses = [...this.expenses];
      
      this.updateUI();
      this.updateExpensesChart();
      this.hideEditModal();
      
      Utils.showNotification('Gasto actualizado exitosamente', 'success');
    }
  }

  deleteExpense(id) {
    if (confirm('¿Estás seguro de que quieres eliminar este gasto?')) {
      this.expenses = this.expenses.filter(e => e.id !== id);
      this.filteredExpenses = this.filteredExpenses.filter(e => e.id !== id);
      
      this.updateUI();
      this.updateExpensesChart();
      
      Utils.showNotification('Gasto eliminado exitosamente', 'success');
    }
  }

  getFormData(prefix) {
    return {
      date: document.getElementById(`${prefix}-date`).value,
      time: document.getElementById(`${prefix}-time`).value,
      product: document.getElementById(`${prefix}-product`).value.trim(),
      category: document.getElementById(`${prefix}-category`).value,
      price: parseFloat(document.getElementById(`${prefix}-price`).value),
      paymentMethod: document.getElementById(`${prefix}-payment-method`).value,
      notes: document.getElementById(`${prefix}-notes`).value.trim()
    };
  }

  validateExpenseForm(data) {
    if (!data.product) {
      Utils.showNotification('El producto/servicio es requerido', 'error');
      return false;
    }
    
    if (!data.category) {
      Utils.showNotification('La categoría es requerida', 'error');
      return false;
    }
    
    if (!data.price || data.price <= 0) {
      Utils.showNotification('El precio debe ser mayor a 0', 'error');
      return false;
    }
    
    if (!data.paymentMethod) {
      Utils.showNotification('La forma de pago es requerida', 'error');
      return false;
    }
    
    return true;
  }

  createExpensesChart() {
    const ctx = document.getElementById('expenses-chart');
    if (!ctx) return;

    const chartData = this.getChartData();
    
    this.expensesChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: chartData.labels,
        datasets: [{
          data: chartData.data,
          backgroundColor: [
            '#ef4444', '#f97316', '#eab308', '#84cc16',
            '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
            '#8b5cf6', '#ec4899'
          ],
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 20,
              usePointStyle: true,
              font: {
                size: 12
              }
            }
          },
          tooltip: {
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
        }
      }
    });
  }

  updateExpensesChart() {
    if (this.expensesChart) {
      const chartData = this.getChartData();
      this.expensesChart.data.labels = chartData.labels;
      this.expensesChart.data.datasets[0].data = chartData.data;
      this.expensesChart.update();
    }
  }

  getChartData() {
    const period = parseInt(document.getElementById('chart-period').value);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - period);

    const filteredExpenses = this.expenses.filter(expense => 
      new Date(expense.date) >= cutoffDate
    );

    const categoryTotals = {};
    filteredExpenses.forEach(expense => {
      categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.price;
    });

    const sortedCategories = Object.entries(categoryTotals)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);

    return {
      labels: sortedCategories.map(([category]) => category),
      data: sortedCategories.map(([, total]) => total)
    };
  }

  updateChart(period) {
    if (this.expensesChart) {
      const chartData = this.getChartData();
      this.expensesChart.data.labels = chartData.labels;
      this.expensesChart.data.datasets[0].data = chartData.data;
      this.expensesChart.update();
    }
  }

  async refreshData() {
    const refreshBtn = document.getElementById('refresh-expenses-btn');
    refreshBtn.disabled = true;
    refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    
    await this.loadExpenses();
    
    refreshBtn.disabled = false;
    refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i>';
    
    Utils.showNotification('Datos actualizados', 'success');
  }

  exportExpenses() {
    const csvContent = this.generateCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `gastos_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  generateCSV() {
    const headers = ['Fecha', 'Hora', 'Producto', 'Categoría', 'Precio', 'Forma de Pago', 'Notas'];
    const rows = this.filteredExpenses.map(expense => [
      expense.date,
      expense.time,
      expense.product,
      expense.category,
      expense.price,
      expense.paymentMethod,
      expense.notes
    ]);

    return [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
  }

  setupAutoRefresh() {
    // Actualizar datos cada 5 minutos
    setInterval(() => {
      this.loadExpenses();
    }, 5 * 60 * 1000);
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

// Inicializar el gestor de gastos cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  window.expensesManager = new ExpensesManager();
});
