/**
 * Investments Manager - Gestión de Inversiones
 * Maneja toda la lógica de la página de inversiones
 */

class InvestmentsManager {
  constructor() {
    this.investments = [];
    this.filteredInvestments = [];
    this.currentInvestment = null;
    this.investmentsChart = null;
    
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.loadInvestments();
    this.setupAutoRefresh();
    this.initMobileMenu();
  }

  setupEventListeners() {
    // Botones principales
    document.getElementById('add-investment-btn').addEventListener('click', () => this.showAddModal());
    document.getElementById('export-investments-btn').addEventListener('click', () => this.exportInvestments());
    document.getElementById('refresh-investments-btn').addEventListener('click', () => this.refreshData());

    // Búsqueda y filtros
    document.getElementById('search-investments').addEventListener('input', (e) => this.handleSearch(e.target.value));
    document.getElementById('filter-category').addEventListener('change', (e) => this.handleCategoryFilter(e.target.value));

    // Modal de agregar inversión
    document.getElementById('close-investment-modal').addEventListener('click', () => this.hideAddModal());
    document.getElementById('cancel-investment-btn').addEventListener('click', () => this.hideAddModal());
    document.getElementById('save-investment-btn').addEventListener('click', () => this.saveInvestment());

    // Modal de editar inversión
    document.getElementById('close-edit-investment-modal').addEventListener('click', () => this.hideEditModal());
    document.getElementById('cancel-edit-investment-btn').addEventListener('click', () => this.hideEditModal());
    document.getElementById('update-investment-btn').addEventListener('click', () => this.updateInvestment());

    // Cerrar modales con Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.hideAddModal();
        this.hideEditModal();
      }
    });

    // Cerrar modales haciendo clic fuera
    document.getElementById('add-investment-modal').addEventListener('click', (e) => {
      if (e.target.id === 'add-investment-modal') this.hideAddModal();
    });
    document.getElementById('edit-investment-modal').addEventListener('click', (e) => {
      if (e.target.id === 'edit-investment-modal') this.hideEditModal();
    });
  }

  async loadInvestments() {
    try {
      // Mostrar estado de conexión
      API.updateConnectionStatus('connecting');
      
      // Intentar cargar datos de la API
      const data = await API.getInvestments();
      
      if (data && data.length > 0) {
        this.investments = this.cleanInvestmentsData(data);
        API.updateConnectionStatus('connected');
      } else {
        // Usar datos de muestra si no hay datos reales
        this.investments = this.getSampleInvestments();
        API.updateConnectionStatus('offline');
      }

      this.filteredInvestments = [...this.investments];
      this.updateUI();
      
    } catch (error) {
      console.error('Error loading investments:', error);
      this.investments = this.getSampleInvestments();
      this.filteredInvestments = [...this.investments];
      this.updateUI();
      API.updateConnectionStatus('error');
    }
  }

  cleanInvestmentsData(data) {
    return data.map(investment => ({
      id: investment.id || Utils.generateId(),
      date: investment.date || investment.fecha || new Date().toISOString().split('T')[0],
      type: investment.type || investment.tipo || 'Acciones',
      description: investment.description || investment.descripcion || 'Sin descripción',
      category: investment.category || investment.categoria || 'Otros',
      initialAmount: parseFloat(investment.initialAmount || investment.montoInicial || 0),
      currentValue: parseFloat(investment.currentValue || investment.valorActual || 0),
      notes: investment.notes || investment.notas || ''
    })).filter(investment => investment.initialAmount > 0);
  }

  getSampleInvestments() {
    const types = ['Acciones', 'Bonos', 'Fondos Mutuos', 'Criptomonedas', 'Bienes Raíces', 'Oro', 'Plata', 'Forex'];
    const categories = ['Renta Variable', 'Renta Fija', 'Commodities', 'Bienes Raíces', 'Criptomonedas', 'Metales Preciosos', 'Otros'];
    const descriptions = [
      'Apple Inc.', 'Microsoft Corp.', 'Tesla Inc.', 'Amazon.com', 'Google LLC', 
      'Bitcoin', 'Ethereum', 'Fondo S&P 500', 'Bono del Tesoro', 'Oro Físico',
      'Apartamento Centro', 'Terreno Residencial', 'Oficina Comercial'
    ];

    const sampleInvestments = [];
    const today = new Date();
    
    for (let i = 0; i < 20; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - Math.floor(Math.random() * 1095)); // Últimos 3 años
      
      const initialAmount = Math.floor(Math.random() * 50000000) + 1000000; // 1M a 50M
      const performance = (Math.random() - 0.3) * 2; // -30% a +170%
      const currentValue = Math.max(initialAmount * (1 + performance), initialAmount * 0.1); // Mínimo 10% del valor inicial
      
      sampleInvestments.push({
        id: Utils.generateId(),
        date: date.toISOString().split('T')[0],
        type: types[Math.floor(Math.random() * types.length)],
        description: descriptions[Math.floor(Math.random() * descriptions.length)],
        category: categories[Math.floor(Math.random() * categories.length)],
        initialAmount: initialAmount,
        currentValue: Math.floor(currentValue),
        notes: Math.random() > 0.7 ? 'Nota de muestra' : ''
      });
    }

    return sampleInvestments.sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  updateUI() {
    this.updateOverviewCards();
    this.updateInvestmentsTable();
  }

  updateOverviewCards() {
    const totalValue = this.investments.reduce((sum, inv) => sum + inv.currentValue, 0);
    const totalInitial = this.investments.reduce((sum, inv) => sum + inv.initialAmount, 0);
    const totalReturn = totalValue - totalInitial;
    const averageROI = totalInitial > 0 ? (totalReturn / totalInitial) * 100 : 0;
    const diversification = new Set(this.investments.map(inv => inv.category)).size;

    // Actualizar tarjetas de resumen
    document.getElementById('total-value').textContent = Utils.formatCurrency(totalValue);
    document.getElementById('total-return').textContent = Utils.formatCurrency(totalReturn);
    document.getElementById('average-roi').textContent = `${averageROI.toFixed(2)}%`;
    document.getElementById('diversification-count').textContent = diversification;

    // Configurar colores según el rendimiento
    const returnElement = document.getElementById('total-return');
    const roiElement = document.getElementById('average-roi');
    
    if (totalReturn >= 0) {
      returnElement.className = 'card-value text-success';
      roiElement.className = 'card-value text-success';
    } else {
      returnElement.className = 'card-value text-danger';
      roiElement.className = 'card-value text-danger';
    }

    // Calcular cambios porcentuales (simulado)
    const valueChange = Math.floor(Math.random() * 15) + 2;
    const returnChange = Math.floor(Math.random() * 20) + 5;
    const roiChange = Math.floor(Math.random() * 10) + 1;

    document.getElementById('value-change').innerHTML = `<i class="fas fa-arrow-up"></i><span>+${valueChange}%</span>`;
    document.getElementById('return-change').innerHTML = `<i class="fas fa-arrow-up"></i><span>+${returnChange}%</span>`;
    document.getElementById('roi-change').innerHTML = `<i class="fas fa-arrow-up"></i><span>+${roiChange}%</span>`;
  }

  updateInvestmentsTable() {
    const tbody = document.getElementById('investments-tbody');
    tbody.innerHTML = '';

    if (this.filteredInvestments.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" class="text-center text-muted">
            <i class="fas fa-chart-line"></i>
            <p>No se encontraron inversiones</p>
          </td>
        </tr>
      `;
      return;
    }

    this.filteredInvestments.forEach(investment => {
      const returnAmount = investment.currentValue - investment.initialAmount;
      const returnPercentage = (returnAmount / investment.initialAmount) * 100;
      
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${Utils.formatDate(investment.date)}</td>
        <td>
          <div class="investment-description">
            <strong>${Utils.escapeHtml(investment.description)}</strong>
            <small class="text-muted">${Utils.escapeHtml(investment.type)}</small>
          </div>
        </td>
        <td>
          <span class="badge badge-category">${Utils.escapeHtml(investment.category)}</span>
        </td>
        <td class="text-right">
          <strong>${Utils.formatCurrency(investment.initialAmount)}</strong>
        </td>
        <td class="text-right">
          <strong class="${returnAmount >= 0 ? 'text-success' : 'text-danger'}">
            ${Utils.formatCurrency(investment.currentValue)}
          </strong>
        </td>
        <td class="text-right">
          <span class="${returnAmount >= 0 ? 'text-success' : 'text-danger'}">
            ${returnAmount >= 0 ? '+' : ''}${Utils.formatCurrency(returnAmount)}
          </span>
        </td>
        <td class="text-right">
          <span class="${returnPercentage >= 0 ? 'text-success' : 'text-danger'}">
            ${returnPercentage >= 0 ? '+' : ''}${returnPercentage.toFixed(2)}%
          </span>
        </td>
        <td>
          <div class="table-actions">
            <button class="btn btn-icon btn-sm" onclick="investmentsManager.editInvestment('${investment.id}')" title="Editar">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-icon btn-sm btn-danger" onclick="investmentsManager.deleteInvestment('${investment.id}')" title="Eliminar">
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
    
    this.filteredInvestments = this.investments.filter(investment => 
      investment.description.toLowerCase().includes(searchTerm) ||
      investment.type.toLowerCase().includes(searchTerm) ||
      investment.category.toLowerCase().includes(searchTerm) ||
      investment.notes.toLowerCase().includes(searchTerm)
    );
    
    this.updateInvestmentsTable();
  }

  handleCategoryFilter(category) {
    if (!category) {
      this.filteredInvestments = [...this.investments];
    } else {
      this.filteredInvestments = this.investments.filter(investment => investment.category === category);
    }
    
    this.updateInvestmentsTable();
  }

  showAddModal() {
    document.getElementById('add-investment-modal').classList.add('show');
    document.getElementById('investment-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('investment-form').reset();
  }

  hideAddModal() {
    document.getElementById('add-investment-modal').classList.remove('show');
  }

  showEditModal(investment) {
    this.currentInvestment = investment;
    document.getElementById('edit-investment-modal').classList.add('show');
    
    // Llenar el formulario con los datos de la inversión
    document.getElementById('edit-investment-id').value = investment.id;
    document.getElementById('edit-investment-date').value = investment.date;
    document.getElementById('edit-investment-type').value = investment.type;
    document.getElementById('edit-investment-description').value = investment.description;
    document.getElementById('edit-investment-category').value = investment.category;
    document.getElementById('edit-investment-initial-amount').value = investment.initialAmount;
    document.getElementById('edit-investment-current-value').value = investment.currentValue;
    document.getElementById('edit-investment-notes').value = investment.notes;
  }

  hideEditModal() {
    document.getElementById('edit-investment-modal').classList.remove('show');
    this.currentInvestment = null;
  }

  saveInvestment() {
    const formData = this.getFormData('investment');
    
    if (!this.validateInvestmentForm(formData)) {
      return;
    }

    const newInvestment = {
      id: Utils.generateId(),
      ...formData
    };

    this.investments.unshift(newInvestment);
    this.filteredInvestments = [...this.investments];
    
    this.updateUI();
    this.hideAddModal();
    
    Utils.showNotification('Inversión agregada exitosamente', 'success');
  }

  updateInvestment() {
    const formData = this.getFormData('edit-investment');
    
    if (!this.validateInvestmentForm(formData)) {
      return;
    }

    const index = this.investments.findIndex(inv => inv.id === this.currentInvestment.id);
    if (index !== -1) {
      this.investments[index] = { ...this.currentInvestment, ...formData };
      this.filteredInvestments = [...this.investments];
      
      this.updateUI();
      this.hideEditModal();
      
      Utils.showNotification('Inversión actualizada exitosamente', 'success');
    }
  }

  deleteInvestment(id) {
    if (confirm('¿Estás seguro de que quieres eliminar esta inversión?')) {
      this.investments = this.investments.filter(inv => inv.id !== id);
      this.filteredInvestments = this.filteredInvestments.filter(inv => inv.id !== id);
      
      this.updateUI();
      
      Utils.showNotification('Inversión eliminada exitosamente', 'success');
    }
  }

  getFormData(prefix) {
    return {
      date: document.getElementById(`${prefix}-date`).value,
      type: document.getElementById(`${prefix}-type`).value,
      description: document.getElementById(`${prefix}-description`).value.trim(),
      category: document.getElementById(`${prefix}-category`).value,
      initialAmount: parseFloat(document.getElementById(`${prefix}-initial-amount`).value),
      currentValue: parseFloat(document.getElementById(`${prefix}-current-value`).value),
      notes: document.getElementById(`${prefix}-notes`).value.trim()
    };
  }

  validateInvestmentForm(data) {
    if (!data.description) {
      Utils.showNotification('La descripción es requerida', 'error');
      return false;
    }
    
    if (!data.type) {
      Utils.showNotification('El tipo de inversión es requerido', 'error');
      return false;
    }
    
    if (!data.category) {
      Utils.showNotification('La categoría es requerida', 'error');
      return false;
    }
    
    if (!data.initialAmount || data.initialAmount <= 0) {
      Utils.showNotification('El monto inicial debe ser mayor a 0', 'error');
      return false;
    }
    
    if (!data.currentValue || data.currentValue < 0) {
      Utils.showNotification('El valor actual debe ser mayor o igual a 0', 'error');
      return false;
    }
    
    return true;
  }

  async refreshData() {
    const refreshBtn = document.getElementById('refresh-investments-btn');
    refreshBtn.disabled = true;
    refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    
    await this.loadInvestments();
    
    refreshBtn.disabled = false;
    refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i>';
    
    Utils.showNotification('Datos actualizados', 'success');
  }

  exportInvestments() {
    const csvContent = this.generateCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `inversiones_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  generateCSV() {
    const headers = ['Fecha', 'Tipo', 'Descripción', 'Categoría', 'Monto Inicial', 'Valor Actual', 'Retorno', 'ROI %', 'Notas'];
    const rows = this.filteredInvestments.map(investment => {
      const returnAmount = investment.currentValue - investment.initialAmount;
      const roi = (returnAmount / investment.initialAmount) * 100;
      
      return [
        investment.date,
        investment.type,
        investment.description,
        investment.category,
        investment.initialAmount,
        investment.currentValue,
        returnAmount,
        roi.toFixed(2),
        investment.notes
      ];
    });

    return [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
  }

  setupAutoRefresh() {
    // Actualizar datos cada 5 minutos
    setInterval(() => {
      this.loadInvestments();
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

// Inicializar el gestor de inversiones cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  window.investmentsManager = new InvestmentsManager();
});
