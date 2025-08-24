/**
 * Debts Manager - Gestión de Deudas
 * Maneja toda la lógica de la página de deudas
 */

class DebtsManager {
  constructor() {
    this.debts = [];
    this.filteredDebts = [];
    this.currentDebt = null;
    this.debtsChart = null;
    
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.loadDebts();
    this.setupAutoRefresh();
    this.initMobileMenu();
  }

  setupEventListeners() {
    // Botones principales
    document.getElementById('add-debt-btn').addEventListener('click', () => this.showAddModal());
    document.getElementById('export-debts-btn').addEventListener('click', () => this.exportDebts());
    document.getElementById('refresh-debts-btn').addEventListener('click', () => this.refreshData());

    // Búsqueda y filtros
    document.getElementById('search-debts').addEventListener('input', (e) => this.handleSearch(e.target.value));
    document.getElementById('filter-category').addEventListener('change', (e) => this.handleCategoryFilter(e.target.value));

    // Modal de agregar deuda
    document.getElementById('close-debt-modal').addEventListener('click', () => this.hideAddModal());
    document.getElementById('cancel-debt-btn').addEventListener('click', () => this.hideAddModal());
    document.getElementById('save-debt-btn').addEventListener('click', () => this.saveDebt());

    // Modal de editar deuda
    document.getElementById('close-edit-debt-modal').addEventListener('click', () => this.hideEditModal());
    document.getElementById('cancel-edit-debt-btn').addEventListener('click', () => this.hideEditModal());
    document.getElementById('update-debt-btn').addEventListener('click', () => this.updateDebt());

    // Cerrar modales con Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.hideAddModal();
        this.hideEditModal();
      }
    });

    // Cerrar modales haciendo clic fuera
    document.getElementById('add-debt-modal').addEventListener('click', (e) => {
      if (e.target.id === 'add-debt-modal') this.hideAddModal();
    });
    document.getElementById('edit-debt-modal').addEventListener('click', (e) => {
      if (e.target.id === 'edit-debt-modal') this.hideEditModal();
    });
  }

  async loadDebts() {
    try {
      // Mostrar estado de conexión
      API.updateConnectionStatus('connecting');
      
      // Intentar cargar datos de la API
      const data = await API.getDebts();
      
      if (data && data.length > 0) {
        this.debts = this.cleanDebtsData(data);
        API.updateConnectionStatus('connected');
      } else {
        // Usar datos de muestra si no hay datos reales
        this.debts = this.getSampleDebts();
        API.updateConnectionStatus('offline');
      }

      this.filteredDebts = [...this.debts];
      this.updateUI();
      
    } catch (error) {
      console.error('Error loading debts:', error);
      this.debts = this.getSampleDebts();
      this.filteredDebts = [...this.debts];
      this.updateUI();
      API.updateConnectionStatus('error');
    }
  }

  cleanDebtsData(data) {
    return data.map(debt => ({
      id: debt.id || Utils.generateId(),
      date: debt.date || debt.fecha || debt[DEBTS_COLUMNS.fecha] || new Date().toISOString().split('T')[0],
      entity: debt.entity || debt.entidad || debt[DEBTS_COLUMNS.entidad] || 'Sin entidad',
      originalAmount: parseFloat(debt.originalAmount || debt.monto || debt[DEBTS_COLUMNS.monto] || 0),
      currentBalance: parseFloat(debt.currentBalance || debt.saldoActual || debt[DEBTS_COLUMNS.monto] || 0),
      interestRate: parseFloat(debt.interestRate || debt.tasaInteres || debt[DEBTS_COLUMNS.interes] || 0),
      dueDate: debt.dueDate || debt.fechaVencimiento || debt[DEBTS_COLUMNS.vencimiento] || '',
      time: debt.time || debt.hora || debt[DEBTS_COLUMNS.hora] || '00:00',
      notes: debt.notes || debt.notas || ''
    })).filter(debt => debt.originalAmount > 0);
  }

  getSampleDebts() {
    const types = ['Tarjeta de Crédito', 'Préstamo Personal', 'Préstamo Hipotecario', 'Préstamo Automotriz', 'Préstamo Estudiantil', 'Línea de Crédito'];
    const categories = ['Tarjetas de Crédito', 'Préstamos Personales', 'Hipotecas', 'Préstamos Automotrices', 'Préstamos Estudiantiles', 'Otros'];
    const descriptions = [
      'Visa Banco Central', 'Mastercard Itaú', 'Préstamo Personal Banco Familiar', 
      'Hipoteca Casa Principal', 'Préstamo Auto Toyota', 'Préstamo Universidad',
      'Línea de Crédito Comercial', 'Tarjeta de Crédito Shopping', 'Préstamo Renovación'
    ];

    const sampleDebts = [];
    const today = new Date();
    
    for (let i = 0; i < 15; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - Math.floor(Math.random() * 1095)); // Últimos 3 años
      
      const originalAmount = Math.floor(Math.random() * 50000000) + 1000000; // 1M a 50M
      const paymentProgress = Math.random() * 0.8; // 0% a 80% pagado
      const currentBalance = originalAmount * (1 - paymentProgress);
      const interestRate = Math.random() * 30 + 5; // 5% a 35%
      
      // Fecha de vencimiento entre hoy y 5 años
      const dueDate = new Date(today);
      dueDate.setDate(dueDate.getDate() + Math.floor(Math.random() * 1825));
      
      sampleDebts.push({
        id: Utils.generateId(),
        date: date.toISOString().split('T')[0],
        type: types[Math.floor(Math.random() * types.length)],
        description: descriptions[Math.floor(Math.random() * descriptions.length)],
        category: categories[Math.floor(Math.random() * categories.length)],
        originalAmount: originalAmount,
        currentBalance: Math.floor(currentBalance),
        interestRate: parseFloat(interestRate.toFixed(2)),
        dueDate: dueDate.toISOString().split('T')[0],
        notes: Math.random() > 0.7 ? 'Nota de muestra' : ''
      });
    }

    return sampleDebts.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  }

  updateUI() {
    this.updateOverviewCards();
    this.updateDebtsTable();
    this.updateFilterOptions();
  }

  updateOverviewCards() {
    const totalDebts = this.debts.reduce((sum, debt) => sum + debt.currentBalance, 0);
    const totalOriginal = this.debts.reduce((sum, debt) => sum + debt.originalAmount, 0);
    const totalPaid = totalOriginal - totalDebts;
    const averageInterest = this.debts.length > 0 ? 
      this.debts.reduce((sum, debt) => sum + debt.interestRate, 0) / this.debts.length : 0;
    
    // Encontrar la próxima fecha de vencimiento
    const upcomingDue = this.debts
      .filter(debt => new Date(debt.dueDate) > new Date())
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))[0];

    // Calcular progreso de pago
    const paymentProgress = totalOriginal > 0 ? (totalPaid / totalOriginal) * 100 : 0;

    // Actualizar tarjetas de resumen
    document.getElementById('total-debts').textContent = Utils.formatCurrency(totalDebts);
    document.getElementById('average-interest').textContent = `${averageInterest.toFixed(2)}%`;
    document.getElementById('next-due').textContent = upcomingDue ? Utils.formatDate(upcomingDue.dueDate) : 'Sin vencimientos';
    document.getElementById('payment-progress').textContent = `${paymentProgress.toFixed(1)}%`;

    // Configurar colores según el progreso
    const progressElement = document.getElementById('payment-progress');
    if (paymentProgress >= 70) {
      progressElement.className = 'card-value text-success';
    } else if (paymentProgress >= 40) {
      progressElement.className = 'card-value text-warning';
    } else {
      progressElement.className = 'card-value text-danger';
    }

    // Calcular cambios porcentuales (simulado)
    const debtChange = Math.floor(Math.random() * 10) + 2;
    const interestChange = Math.floor(Math.random() * 5) + 1;
    const progressChange = Math.floor(Math.random() * 8) + 2;

    document.getElementById('debt-change').innerHTML = `<i class="fas fa-arrow-down"></i><span>-${debtChange}%</span>`;
    document.getElementById('interest-change').innerHTML = `<i class="fas fa-arrow-up"></i><span>+${interestChange}%</span>`;
    document.getElementById('progress-change').innerHTML = `<i class="fas fa-arrow-up"></i><span>+${progressChange}%</span>`;
  }

  updateDebtsTable() {
    const tbody = document.getElementById('debts-tbody');
    tbody.innerHTML = '';

    if (this.filteredDebts.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" class="text-center text-muted">
            <i class="fas fa-credit-card"></i>
            <p>No se encontraron deudas</p>
          </td>
        </tr>
      `;
      return;
    }

    this.filteredDebts.forEach(debt => {
      const paidAmount = debt.originalAmount - debt.currentBalance;
      const paidPercentage = (paidAmount / debt.originalAmount) * 100;
      const daysUntilDue = debt.dueDate && debt.dueDate !== 'No especificado' ? 
        Math.ceil((new Date(debt.dueDate) - new Date()) / (1000 * 60 * 60 * 24)) : null;
      
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${Utils.formatDate(debt.date)}</td>
        <td>
          <div class="debt-description">
            <strong>${Utils.escapeHtml(debt.entity)}</strong>
            <small class="text-muted">${debt.time}</small>
          </div>
        </td>
        <td class="text-right">
          <strong>${Utils.formatCurrency(debt.originalAmount)}</strong>
        </td>
        <td class="text-right">
          <strong class="text-danger">${Utils.formatCurrency(debt.currentBalance)}</strong>
        </td>
        <td class="text-right">
          <span class="text-success">${Utils.formatCurrency(paidAmount)}</span>
        </td>
        <td class="text-right">
          <span class="text-info">${debt.interestRate}%</span>
        </td>
        <td>
          ${debt.dueDate && debt.dueDate !== 'No especificado' ? 
            `<span class="${daysUntilDue <= 30 ? 'text-danger' : daysUntilDue <= 90 ? 'text-warning' : 'text-success'}">
              ${Utils.formatDate(debt.dueDate)}
              ${daysUntilDue > 0 ? `<small>(${daysUntilDue} días)</small>` : '<small>(Vencida)</small>'}
            </span>` : 
            '<span class="text-muted">No especificado</span>'
          }
        </td>
        <td>
          <div class="table-actions">
            <button class="btn btn-icon btn-sm" onclick="debtsManager.editDebt('${debt.id}')" title="Editar">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-icon btn-sm btn-danger" onclick="debtsManager.deleteDebt('${debt.id}')" title="Eliminar">
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
    
    this.filteredDebts = this.debts.filter(debt => 
      debt.entity.toLowerCase().includes(searchTerm) ||
      debt.notes.toLowerCase().includes(searchTerm)
    );
    
    this.updateDebtsTable();
  }

  handleCategoryFilter(category) {
    if (!category) {
      this.filteredDebts = [...this.debts];
    } else {
      this.filteredDebts = this.debts.filter(debt => debt.entity === category);
    }
    
    this.updateDebtsTable();
  }

  showAddModal() {
    document.getElementById('add-debt-modal').classList.add('show');
    document.getElementById('debt-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('debt-form').reset();
  }

  hideAddModal() {
    document.getElementById('add-debt-modal').classList.remove('show');
  }

  showEditModal(debt) {
    this.currentDebt = debt;
    document.getElementById('edit-debt-modal').classList.add('show');
    
    // Llenar el formulario con los datos de la deuda
    document.getElementById('edit-debt-id').value = debt.id;
    document.getElementById('edit-debt-date').value = debt.date;
    document.getElementById('edit-debt-time').value = debt.time;
    document.getElementById('edit-debt-entity').value = debt.entity;
    document.getElementById('edit-debt-original-amount').value = debt.originalAmount;
    document.getElementById('edit-debt-current-balance').value = debt.currentBalance;
    document.getElementById('edit-debt-interest-rate').value = debt.interestRate;
    document.getElementById('edit-debt-due-date').value = debt.dueDate;
    document.getElementById('edit-debt-notes').value = debt.notes;
  }

  hideEditModal() {
    document.getElementById('edit-debt-modal').classList.remove('show');
    this.currentDebt = null;
  }

  saveDebt() {
    const formData = this.getFormData('debt');
    
    if (!this.validateDebtForm(formData)) {
      return;
    }

    const newDebt = {
      id: Utils.generateId(),
      ...formData
    };

    this.debts.unshift(newDebt);
    this.filteredDebts = [...this.debts];
    
    this.updateUI();
    this.hideAddModal();
    
    Utils.showNotification('Deuda registrada exitosamente', 'success');
  }

  updateDebt() {
    const formData = this.getFormData('edit-debt');
    
    if (!this.validateDebtForm(formData)) {
      return;
    }

    const index = this.debts.findIndex(debt => debt.id === this.currentDebt.id);
    if (index !== -1) {
      this.debts[index] = { ...this.currentDebt, ...formData };
      this.filteredDebts = [...this.debts];
      
      this.updateUI();
      this.hideEditModal();
      
      Utils.showNotification('Deuda actualizada exitosamente', 'success');
    }
  }

  deleteDebt(id) {
    if (confirm('¿Estás seguro de que quieres eliminar esta deuda?')) {
      this.debts = this.debts.filter(debt => debt.id !== id);
      this.filteredDebts = this.filteredDebts.filter(debt => debt.id !== id);
      
      this.updateUI();
      
      Utils.showNotification('Deuda eliminada exitosamente', 'success');
    }
  }

  getFormData(prefix) {
    return {
      date: document.getElementById(`${prefix}-date`).value,
      time: document.getElementById(`${prefix}-time`).value,
      entity: document.getElementById(`${prefix}-entity`).value.trim(),
      originalAmount: parseFloat(document.getElementById(`${prefix}-original-amount`).value),
      currentBalance: parseFloat(document.getElementById(`${prefix}-current-balance`).value),
      interestRate: parseFloat(document.getElementById(`${prefix}-interest-rate`).value),
      dueDate: document.getElementById(`${prefix}-due-date`).value,
      notes: document.getElementById(`${prefix}-notes`).value.trim()
    };
  }

  validateDebtForm(data) {
    if (!data.entity) {
      Utils.showNotification('La entidad es requerida', 'error');
      return false;
    }
    
    if (!data.time) {
      Utils.showNotification('La hora es requerida', 'error');
      return false;
    }
    
    if (!data.originalAmount || data.originalAmount <= 0) {
      Utils.showNotification('El monto original debe ser mayor a 0', 'error');
      return false;
    }
    
    if (!data.currentBalance || data.currentBalance < 0) {
      Utils.showNotification('El saldo actual debe ser mayor o igual a 0', 'error');
      return false;
    }
    
    if (data.currentBalance > data.originalAmount) {
      Utils.showNotification('El saldo actual no puede ser mayor al monto original', 'error');
      return false;
    }
    
    if (!data.interestRate || data.interestRate < 0) {
      Utils.showNotification('La tasa de interés debe ser mayor o igual a 0', 'error');
      return false;
    }
    
    if (!data.dueDate) {
      Utils.showNotification('La fecha de vencimiento es requerida', 'error');
      return false;
    }
    
    return true;
  }

  async refreshData() {
    const refreshBtn = document.getElementById('refresh-debts-btn');
    refreshBtn.disabled = true;
    refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    
    await this.loadDebts();
    
    refreshBtn.disabled = false;
    refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i>';
    
    Utils.showNotification('Datos actualizados', 'success');
  }

  exportDebts() {
    const csvContent = this.generateCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `deudas_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  generateCSV() {
    const headers = ['Fecha', 'Hora', 'Entidad', 'Monto', 'Saldo Actual', 'Pagado', 'Interés', 'Vencimiento', 'Progreso %', 'Notas'];
    const rows = this.filteredDebts.map(debt => {
      const paidAmount = debt.originalAmount - debt.currentBalance;
      const paidPercentage = (paidAmount / debt.originalAmount) * 100;
      
      return [
        debt.date,
        debt.time,
        debt.entity,
        debt.originalAmount,
        debt.currentBalance,
        paidAmount,
        debt.interestRate,
        debt.dueDate,
        paidPercentage.toFixed(2),
        debt.notes
      ];
    });

    return [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
  }

  updateFilterOptions() {
    const filterSelect = document.getElementById('filter-category');
    if (!filterSelect) return;
    
    // Obtener entidades únicas
    const uniqueEntities = [...new Set(this.debts.map(debt => debt.entity))].sort();
    
    // Mantener la opción "Todas las entidades"
    filterSelect.innerHTML = '<option value="">Todas las entidades</option>';
    
    // Agregar opciones para cada entidad
    uniqueEntities.forEach(entity => {
      const option = document.createElement('option');
      option.value = entity;
      option.textContent = entity;
      filterSelect.appendChild(option);
    });
  }

  setupAutoRefresh() {
    // Actualizar datos cada 5 minutos
    setInterval(() => {
      this.loadDebts();
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

// Inicializar el gestor de deudas cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  window.debtsManager = new DebtsManager();
});
