/**
 * Capital Manager - Gestión de Capital
 * Maneja toda la lógica de la página de capital
 */

class CapitalManager {
  constructor() {
    this.capitalMovements = [];
    this.filteredMovements = [];
    this.currentMovement = null;
    this.capitalChart = null;
    
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.loadCapitalMovements();
    this.setupAutoRefresh();
    this.initMobileMenu();
  }

  setupEventListeners() {
    // Botones principales
    document.getElementById('add-movement-btn').addEventListener('click', () => this.showAddModal());
    document.getElementById('export-movements-btn').addEventListener('click', () => this.exportMovements());
    document.getElementById('refresh-movements-btn').addEventListener('click', () => this.refreshData());

    // Búsqueda y filtros
    document.getElementById('search-movements').addEventListener('input', (e) => this.handleSearch(e.target.value));
    document.getElementById('filter-category').addEventListener('change', (e) => this.handleCategoryFilter(e.target.value));

    // Modal de agregar movimiento
    document.getElementById('close-movement-modal').addEventListener('click', () => this.hideAddModal());
    document.getElementById('cancel-movement-btn').addEventListener('click', () => this.hideAddModal());
    document.getElementById('save-movement-btn').addEventListener('click', () => this.saveMovement());

    // Modal de editar movimiento
    document.getElementById('close-edit-movement-modal').addEventListener('click', () => this.hideEditModal());
    document.getElementById('cancel-edit-movement-btn').addEventListener('click', () => this.hideEditModal());
    document.getElementById('update-movement-btn').addEventListener('click', () => this.updateMovement());

    // Cerrar modales con Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.hideAddModal();
        this.hideEditModal();
      }
    });

    // Cerrar modales haciendo clic fuera
    document.getElementById('add-movement-modal').addEventListener('click', (e) => {
      if (e.target.id === 'add-movement-modal') this.hideAddModal();
    });
    document.getElementById('edit-movement-modal').addEventListener('click', (e) => {
      if (e.target.id === 'edit-movement-modal') this.hideEditModal();
    });
  }

  async loadCapitalMovements() {
    try {
      // Mostrar estado de conexión
      API.updateConnectionStatus('connecting');
      
      // Intentar cargar datos de la API
      const data = await API.getCapital();
      
      if (data && data.length > 0) {
        this.capitalMovements = this.cleanCapitalData(data);
        API.updateConnectionStatus('connected');
      } else {
        // Usar datos de muestra si no hay datos reales
        this.capitalMovements = this.getSampleCapitalMovements();
        API.updateConnectionStatus('offline');
      }

      this.filteredMovements = [...this.capitalMovements];
      this.updateUI();
      
    } catch (error) {
      console.error('Error loading capital movements:', error);
      this.capitalMovements = this.getSampleCapitalMovements();
      this.filteredMovements = [...this.capitalMovements];
      this.updateUI();
      API.updateConnectionStatus('error');
    }
  }

  cleanCapitalData(data) {
    return data.map(movement => ({
      id: movement.id || Utils.generateId(),
      date: movement.date || movement.fecha || new Date().toISOString().split('T')[0],
      type: movement.type || movement.tipo || 'Ingreso',
      description: movement.description || movement.descripcion || 'Sin descripción',
      category: movement.category || movement.categoria || 'Otros',
      amount: parseFloat(movement.amount || movement.monto || 0),
      notes: movement.notes || movement.notas || ''
    })).filter(movement => movement.amount !== 0);
  }

  getSampleCapitalMovements() {
    const types = ['Ingreso', 'Egreso', 'Transferencia', 'Inversión', 'Préstamo', 'Pago'];
    const categories = ['Salario', 'Freelance', 'Inversiones', 'Ventas', 'Gastos Personales', 'Gastos de Negocio', 'Transferencias', 'Otros'];
    const descriptions = [
      'Salario Mensual', 'Pago por Proyecto', 'Dividendos', 'Venta de Productos', 
      'Gastos de Alimentación', 'Pago de Servicios', 'Transferencia Bancaria',
      'Inversión en Acciones', 'Préstamo Personal', 'Pago de Deuda', 'Comisión por Venta'
    ];

    const sampleMovements = [];
    const today = new Date();
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - Math.floor(Math.random() * 365)); // Último año
      
      const type = types[Math.floor(Math.random() * types.length)];
      const isIncome = ['Ingreso', 'Freelance', 'Inversiones', 'Ventas'].includes(type);
      const amount = isIncome ? 
        Math.floor(Math.random() * 10000000) + 100000 : // 100K a 10M para ingresos
        -(Math.floor(Math.random() * 5000000) + 50000); // -50K a -5M para egresos
      
      sampleMovements.push({
        id: Utils.generateId(),
        date: date.toISOString().split('T')[0],
        type: type,
        description: descriptions[Math.floor(Math.random() * descriptions.length)],
        category: categories[Math.floor(Math.random() * categories.length)],
        amount: amount,
        notes: Math.random() > 0.7 ? 'Nota de muestra' : ''
      });
    }

    return sampleMovements.sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  updateUI() {
    this.updateOverviewCards();
    this.updateMovementsTable();
  }

  updateOverviewCards() {
    const totalIncome = this.capitalMovements
      .filter(m => m.amount > 0)
      .reduce((sum, m) => sum + m.amount, 0);
    
    const totalExpenses = this.capitalMovements
      .filter(m => m.amount < 0)
      .reduce((sum, m) => sum + Math.abs(m.amount), 0);
    
    const netBalance = totalIncome - totalExpenses;
    const liquidMoney = this.calculateLiquidMoney();

    // Calcular ingresos y gastos del mes actual
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const monthlyIncome = this.capitalMovements
      .filter(m => {
        const movementDate = new Date(m.date);
        return m.amount > 0 && 
               movementDate.getMonth() === currentMonth && 
               movementDate.getFullYear() === currentYear;
      })
      .reduce((sum, m) => sum + m.amount, 0);
    
    const monthlyExpenses = this.capitalMovements
      .filter(m => {
        const movementDate = new Date(m.date);
        return m.amount < 0 && 
               movementDate.getMonth() === currentMonth && 
               movementDate.getFullYear() === currentYear;
      })
      .reduce((sum, m) => sum + Math.abs(m.amount), 0);

    // Actualizar tarjetas de resumen
    document.getElementById('liquid-money').textContent = Utils.formatCurrency(liquidMoney);
    document.getElementById('monthly-income').textContent = Utils.formatCurrency(monthlyIncome);
    document.getElementById('monthly-expenses').textContent = Utils.formatCurrency(monthlyExpenses);
    document.getElementById('net-balance').textContent = Utils.formatCurrency(netBalance);

    // Configurar colores según el balance
    const balanceElement = document.getElementById('net-balance');
    if (netBalance >= 0) {
      balanceElement.className = 'card-value text-success';
    } else {
      balanceElement.className = 'card-value text-danger';
    }

    // Calcular cambios porcentuales (simulado)
    const liquidChange = Math.floor(Math.random() * 15) + 2;
    const incomeChange = Math.floor(Math.random() * 20) + 5;
    const expensesChange = Math.floor(Math.random() * 15) + 3;
    const balanceChange = Math.floor(Math.random() * 25) + 8;

    document.getElementById('liquid-change').innerHTML = `<i class="fas fa-arrow-up"></i><span>+${liquidChange}%</span>`;
    document.getElementById('income-change').innerHTML = `<i class="fas fa-arrow-up"></i><span>+${incomeChange}%</span>`;
    document.getElementById('expenses-change').innerHTML = `<i class="fas fa-arrow-down"></i><span>-${expensesChange}%</span>`;
    document.getElementById('balance-change').innerHTML = `<i class="fas fa-arrow-up"></i><span>+${balanceChange}%</span>`;
  }

  calculateLiquidMoney() {
    // Simular cálculo de dinero líquido basado en movimientos recientes
    const recentMovements = this.capitalMovements
      .filter(m => {
        const movementDate = new Date(m.date);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return movementDate >= thirtyDaysAgo;
      });

    const recentBalance = recentMovements.reduce((sum, m) => sum + m.amount, 0);
    
    // Base líquida simulada
    const baseLiquid = 50000000; // 50M base
    return Math.max(baseLiquid + recentBalance, 0);
  }

  updateMovementsTable() {
    const tbody = document.getElementById('movements-tbody');
    tbody.innerHTML = '';

    if (this.filteredMovements.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center text-muted">
            <i class="fas fa-coins"></i>
            <p>No se encontraron movimientos</p>
          </td>
        </tr>
      `;
      return;
    }

    this.filteredMovements.forEach(movement => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${Utils.formatDate(movement.date)}</td>
        <td>
          <div class="movement-description">
            <strong>${Utils.escapeHtml(movement.description)}</strong>
            <small class="text-muted">${Utils.escapeHtml(movement.type)}</small>
          </div>
        </td>
        <td>
          <span class="badge badge-category">${Utils.escapeHtml(movement.category)}</span>
        </td>
        <td class="text-right">
          <strong class="${movement.amount >= 0 ? 'text-success' : 'text-danger'}">
            ${movement.amount >= 0 ? '+' : ''}${Utils.formatCurrency(movement.amount)}
          </strong>
        </td>
        <td>
          <span class="badge ${movement.amount >= 0 ? 'badge-success' : 'badge-danger'}">
            ${movement.amount >= 0 ? 'Ingreso' : 'Egreso'}
          </span>
        </td>
        <td>${movement.notes || '-'}</td>
        <td>
          <div class="table-actions">
            <button class="btn btn-icon btn-sm" onclick="capitalManager.editMovement('${movement.id}')" title="Editar">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-icon btn-sm btn-danger" onclick="capitalManager.deleteMovement('${movement.id}')" title="Eliminar">
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
    
    this.filteredMovements = this.capitalMovements.filter(movement => 
      movement.description.toLowerCase().includes(searchTerm) ||
      movement.type.toLowerCase().includes(searchTerm) ||
      movement.category.toLowerCase().includes(searchTerm) ||
      movement.notes.toLowerCase().includes(searchTerm)
    );
    
    this.updateMovementsTable();
  }

  handleCategoryFilter(category) {
    if (!category) {
      this.filteredMovements = [...this.capitalMovements];
    } else {
      this.filteredMovements = this.capitalMovements.filter(movement => movement.category === category);
    }
    
    this.updateMovementsTable();
  }

  showAddModal() {
    document.getElementById('add-movement-modal').classList.add('show');
    document.getElementById('movement-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('movement-form').reset();
  }

  hideAddModal() {
    document.getElementById('add-movement-modal').classList.remove('show');
  }

  showEditModal(movement) {
    this.currentMovement = movement;
    document.getElementById('edit-movement-modal').classList.add('show');
    
    // Llenar el formulario con los datos del movimiento
    document.getElementById('edit-movement-id').value = movement.id;
    document.getElementById('edit-movement-date').value = movement.date;
    document.getElementById('edit-movement-type').value = movement.type;
    document.getElementById('edit-movement-description').value = movement.description;
    document.getElementById('edit-movement-category').value = movement.category;
    document.getElementById('edit-movement-amount').value = Math.abs(movement.amount);
    document.getElementById('edit-movement-notes').value = movement.notes;
  }

  hideEditModal() {
    document.getElementById('edit-movement-modal').classList.remove('show');
    this.currentMovement = null;
  }

  saveMovement() {
    const formData = this.getFormData('movement');
    
    if (!this.validateMovementForm(formData)) {
      return;
    }

    const newMovement = {
      id: Utils.generateId(),
      ...formData
    };

    this.capitalMovements.unshift(newMovement);
    this.filteredMovements = [...this.capitalMovements];
    
    this.updateUI();
    this.hideAddModal();
    
    Utils.showNotification('Movimiento agregado exitosamente', 'success');
  }

  updateMovement() {
    const formData = this.getFormData('edit-movement');
    
    if (!this.validateMovementForm(formData)) {
      return;
    }

    const index = this.capitalMovements.findIndex(m => m.id === this.currentMovement.id);
    if (index !== -1) {
      this.capitalMovements[index] = { ...this.currentMovement, ...formData };
      this.filteredMovements = [...this.capitalMovements];
      
      this.updateUI();
      this.hideEditModal();
      
      Utils.showNotification('Movimiento actualizado exitosamente', 'success');
    }
  }

  deleteMovement(id) {
    if (confirm('¿Estás seguro de que quieres eliminar este movimiento?')) {
      this.capitalMovements = this.capitalMovements.filter(m => m.id !== id);
      this.filteredMovements = this.filteredMovements.filter(m => m.id !== id);
      
      this.updateUI();
      
      Utils.showNotification('Movimiento eliminado exitosamente', 'success');
    }
  }

  getFormData(prefix) {
    const type = document.getElementById(`${prefix}-type`).value;
    const amount = parseFloat(document.getElementById(`${prefix}-amount`).value);
    
    return {
      date: document.getElementById(`${prefix}-date`).value,
      type: type,
      description: document.getElementById(`${prefix}-description`).value.trim(),
      category: document.getElementById(`${prefix}-category`).value,
      amount: ['Ingreso', 'Freelance', 'Inversiones', 'Ventas'].includes(type) ? amount : -amount,
      notes: document.getElementById(`${prefix}-notes`).value.trim()
    };
  }

  validateMovementForm(data) {
    if (!data.description) {
      Utils.showNotification('La descripción es requerida', 'error');
      return false;
    }
    
    if (!data.type) {
      Utils.showNotification('El tipo de movimiento es requerido', 'error');
      return false;
    }
    
    if (!data.category) {
      Utils.showNotification('La categoría es requerida', 'error');
      return false;
    }
    
    if (!data.amount || data.amount <= 0) {
      Utils.showNotification('El monto debe ser mayor a 0', 'error');
      return false;
    }
    
    return true;
  }

  async refreshData() {
    const refreshBtn = document.getElementById('refresh-movements-btn');
    refreshBtn.disabled = true;
    refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    
    await this.loadCapitalMovements();
    
    refreshBtn.disabled = false;
    refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i>';
    
    Utils.showNotification('Datos actualizados', 'success');
  }

  exportMovements() {
    const csvContent = this.generateCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `movimientos_capital_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  generateCSV() {
    const headers = ['Fecha', 'Tipo', 'Descripción', 'Categoría', 'Monto', 'Tipo de Movimiento', 'Notas'];
    const rows = this.filteredMovements.map(movement => [
      movement.date,
      movement.type,
      movement.description,
      movement.category,
      movement.amount,
      movement.amount >= 0 ? 'Ingreso' : 'Egreso',
      movement.notes
    ]);

    return [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
  }

  setupAutoRefresh() {
    // Actualizar datos cada 5 minutos
    setInterval(() => {
      this.loadCapitalMovements();
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

// Inicializar el gestor de capital cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  window.capitalManager = new CapitalManager();
});
