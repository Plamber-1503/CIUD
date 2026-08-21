/* ==========================================================================
   OJOS EN ALERTA - CORDOBESES EN ALERTA
   Lógica de Aplicación Web SPA Multi-Rol Real-Time con Chat & Analytics
   ========================================================================== */

import {
  DEMO_CITIZENS,
  DEMO_PATROLS,
  CENTRAL_OPERATOR,
  INCIDENT_CATEGORIES,
  MUNICIPAL_SETTINGS,
  CHAT_STORE,
  playAlertSound,
  calculateDistanceKm
} from './data.js';

class OjosEnAlertaApp {
  constructor() {
    this.map = null;
    this.currentRoleType = 'citizen'; // 'citizen' | 'patrol' | 'central'
    this.currentUser = DEMO_CITIZENS[0]; // Usuario 1 Juan Pérez por defecto
    this.patrols = [...DEMO_PATROLS];
    this.activeIncidents = [];
    this.broadcastRadiusKm = 5.0;
    this.centralActiveTab = 'live'; // 'live' | 'analytics'
    
    // Audio / Media Recording State
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.currentAudioBlob = null;
    this.currentAudioUrl = null;
    this.currentPhotoFile = null;
    this.currentPhotoUrl = null;
    this.currentVideoFile = null;
    this.currentVideoUrl = null;
    this.selectedCategory = 'robo';
    
    // Elementos de UI
    this.roleSelectEl = document.getElementById('roleSelect');
    this.citizenViewEl = document.getElementById('citizenView');
    this.patrolViewEl = document.getElementById('patrolView');
    this.centralViewEl = document.getElementById('centralView');
    this.incomingDispatchModalEl = document.getElementById('incomingDispatchModal');

    // Capas de Mapa Leaflet
    this.markersGroup = null;
    this.routeLineGroup = null;
    this.radarCircleGroup = null;
  }

  init() {
    this.initMap();
    this.setupEventListeners();
    this.setupViewModeSwitcher();
    this.setupAuthModalLogic();
    this.renderCurrentRoleView();
    this.startPatrolAnimationLoop();
  }

  // ------------------------------------------------------------------------
  // 1.INICIO DE SESIÓN Y LÓGICA DEL MODAL DE AUTENTICACIÓN CIDI / ANSES
  // ------------------------------------------------------------------------
  setupAuthModalLogic() {
    const authModal = document.getElementById('authModal');
    const tabCitizen = document.getElementById('tabAuthCitizen');
    const tabPatrol = document.getElementById('tabAuthPatrol');
    const formCitizen = document.getElementById('formCitizenAuth');
    const formPatrol = document.getElementById('formPatrolAuth');

    const btnCidi = document.getElementById('btnAuthCidi');
    const btnAnses = document.getElementById('btnAuthAnses');
    const btnSubmitCitizen = document.getElementById('btnSubmitCitizenAuth');
    const btnSubmitPatrol = document.getElementById('btnSubmitPatrolAuth');

    if (!authModal) return;

    const btnOpenLoginModal = document.getElementById('btnOpenLoginModal');
    if (btnOpenLoginModal) {
      btnOpenLoginModal.addEventListener('click', () => {
        authModal.classList.remove('hidden');
      });
    }

    // Verificar si ya hay una sesión validada activa en localStorage
    const savedUser = localStorage.getItem('ojos_user_session');
    if (savedUser) {
      try {
        const userObj = JSON.parse(savedUser);
        this.currentUser = userObj;
        authModal.classList.add('hidden');
      } catch (e) {
        authModal.classList.remove('hidden');
      }
    } else {
      authModal.classList.remove('hidden');
    }

    // Pestañas
    if (tabCitizen && tabPatrol) {
      tabCitizen.addEventListener('click', () => {
        tabCitizen.classList.add('active');
        tabPatrol.classList.remove('active');
        formCitizen.classList.remove('hidden');
        formPatrol.classList.add('hidden');
      });
      tabPatrol.addEventListener('click', () => {
        tabPatrol.classList.add('active');
        tabCitizen.classList.remove('active');
        formPatrol.classList.remove('hidden');
        formCitizen.classList.add('hidden');
      });
    }

    // Botón CiDi Nivel 2
    if (btnCidi) {
      btnCidi.addEventListener('click', () => {
        this.currentRoleType = 'citizen';
        this.currentUser = { ...DEMO_CITIZENS[0], authProvider: 'CiDi Nivel 2' };
        localStorage.setItem('ojos_user_session', JSON.stringify(this.currentUser));
        authModal.classList.add('hidden');
        this.renderCurrentRoleView();
        this.updateMapElements();
      });
    }

    // Botón ANSES
    if (btnAnses) {
      btnAnses.addEventListener('click', () => {
        this.currentRoleType = 'citizen';
        this.currentUser = { ...DEMO_CITIZENS[1], authProvider: 'ANSES / Mi Argentina' };
        localStorage.setItem('ojos_user_session', JSON.stringify(this.currentUser));
        authModal.classList.add('hidden');
        this.renderCurrentRoleView();
        this.updateMapElements();
      });
    }

    // Formulario DNI Manual
    if (btnSubmitCitizen) {
      btnSubmitCitizen.addEventListener('click', () => {
        const dniVal = document.getElementById('authDniInput')?.value || '35.123.456';
        this.currentRoleType = 'citizen';
        this.currentUser = {
          id: `cit-${Date.now()}`,
          name: 'Ciudadano Registrado',
          dni: dniVal,
          address: 'Av. Colón 1234, Córdoba',
          authProvider: 'Validación DNI',
          coords: [-31.4135, -64.1867]
        };
        localStorage.setItem('ojos_user_session', JSON.stringify(this.currentUser));
        authModal.classList.add('hidden');
        this.renderCurrentRoleView();
        this.updateMapElements();
      });
    }

    // Formulario Policial
    if (btnSubmitPatrol) {
      btnSubmitPatrol.addEventListener('click', () => {
        const selVal = document.getElementById('patrolRoleSelect')?.value || 'pat-101';
        if (selVal.startsWith('pat-')) {
          this.currentRoleType = 'patrol';
          this.currentUser = this.patrols.find((p) => p.id === selVal);
        } else {
          this.currentRoleType = 'central';
          this.currentUser = CENTRAL_OPERATOR;
        }
        localStorage.setItem('ojos_user_session', JSON.stringify(this.currentUser));
        authModal.classList.add('hidden');
        this.renderCurrentRoleView();
        this.updateMapElements();
      });
    }
  }

  showAuthModal() {
    const authModal = document.getElementById('authModal');
    if (authModal) {
      authModal.classList.remove('hidden');
    }
  }

  // ------------------------------------------------------------------------
  // 1. INICIALIZACIÓN DEL MAPA INTERACTIVO (LEAFLET / OPENSTREETMAP)
  // ------------------------------------------------------------------------
  initMap() {
    this.map = L.map('map', {
      zoomControl: false,
      attributionControl: false
    }).setView([-31.4167, -64.1833], 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(this.map);

    L.control.zoom({ position: 'topright' }).addTo(this.map);

    this.markersGroup = L.layerGroup().addTo(this.map);
    this.routeLineGroup = L.layerGroup().addTo(this.map);
    this.radarCircleGroup = L.layerGroup().addTo(this.map);

    this.updateMapElements();
  }

  // ------------------------------------------------------------------------
  // 1.B ALTERNADOR DE MODO DE VISUALIZACIÓN (PC vs MÓVIL)
  // ------------------------------------------------------------------------
  setupViewModeSwitcher() {
    const btnPc = document.getElementById('btnViewPc');
    const btnMobile = document.getElementById('btnViewMobile');
    const phoneClock = document.getElementById('phoneClock');

    // Actualizar reloj en la barra de estado del teléfono simulado
    const updateClock = () => {
      if (!phoneClock) return;
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      phoneClock.textContent = `${hours}:${minutes}`;
    };
    updateClock();
    setInterval(updateClock, 30000);

    if (!btnPc || !btnMobile) return;

    const setMode = (mode) => {
      if (mode === 'mobile') {
        document.body.classList.add('device-mode-mobile');
        btnMobile.classList.add('active');
        btnPc.classList.remove('active');
      } else {
        document.body.classList.remove('device-mode-mobile');
        btnPc.classList.add('active');
        btnMobile.classList.remove('active');
      }
      localStorage.setItem('ojos_view_mode', mode);

      // Re-calcular tamaño del mapa Leaflet tras la transición de pantalla
      setTimeout(() => {
        if (this.map) {
          this.map.invalidateSize();
        }
      }, 420);
    };

    btnPc.addEventListener('click', () => setMode('pc'));
    btnMobile.addEventListener('click', () => setMode('mobile'));

    // Cargar modo guardado o por defecto PC
    const savedMode = localStorage.getItem('ojos_view_mode') || 'pc';
    setMode(savedMode);
  }

  // ------------------------------------------------------------------------
  // 2. CAMBIO DE ROL Y USUARIO (DEMO SWITCHER)
  // ------------------------------------------------------------------------
  setupEventListeners() {
    this.roleSelectEl.addEventListener('change', (e) => {
      const val = e.target.value;
      if (val.startsWith('cit-')) {
        this.currentRoleType = 'citizen';
        this.currentUser = DEMO_CITIZENS.find((c) => c.id === val);
      } else if (val.startsWith('pat-')) {
        this.currentRoleType = 'patrol';
        this.currentUser = this.patrols.find((p) => p.id === val);
      } else if (val === 'central-01') {
        this.currentRoleType = 'central';
        this.currentUser = CENTRAL_OPERATOR;
      }
      this.renderCurrentRoleView();
      this.updateMapElements();
    });
  }

  renderCurrentRoleView() {
    this.citizenViewEl.classList.add('hidden');
    this.patrolViewEl.classList.add('hidden');
    this.centralViewEl.classList.add('hidden');
    this.incomingDispatchModalEl.classList.add('hidden');

    if (this.currentRoleType === 'citizen') {
      this.citizenViewEl.classList.remove('hidden');
      this.renderCitizenPanel();
    } else if (this.currentRoleType === 'patrol') {
      this.patrolViewEl.classList.remove('hidden');
      this.renderPatrolPanel();
      this.checkIncomingDispatchForPatrol();
    } else if (this.currentRoleType === 'central') {
      this.centralViewEl.classList.remove('hidden');
      this.renderCentralPanel();
    }

    setTimeout(() => {
      if (this.map) this.map.invalidateSize();
    }, 150);
  }

  // ------------------------------------------------------------------------
  // 3. VISTA CIUDADANO (REDISEÑADA)
  // ------------------------------------------------------------------------
  renderCitizenPanel() {
    const activeIncident = this.activeIncidents.find(
      (inc) => inc.citizenId === this.currentUser.id && inc.status !== 'resolved'
    );

    if (activeIncident) {
      this.citizenViewEl.innerHTML = this.buildActiveIncidentHtml(activeIncident);
      this.attachActiveIncidentEvents(activeIncident);
    } else {
      this.citizenViewEl.innerHTML = `
        <div class="panel-handle"></div>
        <div class="citizen-dashboard">
          <!-- CABECERA DEL PERFIL DE USUARIO -->
          <div class="user-profile-header">
            <div class="user-info">
              <div class="user-avatar">${this.currentUser.name.charAt(0)}</div>
              <div>
                <div class="user-name">${this.currentUser.name}</div>
                <div class="user-meta">DNI: ${this.currentUser.dni} • ${this.currentUser.address}</div>
              </div>
            </div>
            <div class="gps-badge">
              <div class="pulse-dot"></div>
              <span>GPS Activo</span>
            </div>
          </div>

          <!-- SECCIÓN SUPERIOR: TIPO DE ALERTA -->
          <div class="section-title">
            <span>🏷️ Tipo de Alerta:</span>
          </div>
          <div class="incident-categories" id="categoriesGrid">
            ${INCIDENT_CATEGORIES.map(
              (cat) => `
              <div class="category-btn ${this.selectedCategory === cat.id ? 'active' : ''}" data-cat="${cat.id}">
                <span class="cat-icon">${cat.icon}</span>
                <span class="cat-name">${cat.name}</span>
              </div>
            `
            ).join('')}
          </div>

          <!-- SECCIÓN MEDIA: REDACCIÓN CON TEXTO PRELLENADO "Quiero reportar... " -->
          <div class="media-reporter">
            <div class="section-title">
              <span>✍️ Detalle del Reporte:</span>
            </div>
            <textarea class="text-report-input" id="textDescriptionInput">Quiero reportar... </textarea>
            
            <!-- BOTONES DE ADJUNTOS EN MEDIO -->
            <div class="media-actions">
              <button class="media-action-btn" id="btnRecordAudio">
                <span>🎙️</span> <span id="recordAudioText">${this.currentAudioBlob ? 'Audio Listo' : 'Grabar Audio'}</span>
              </button>
              <label class="media-action-btn">
                <span>📷</span> <span>Adjuntar Foto</span>
                <input type="file" id="photoInput" accept="image/*" style="display:none">
              </label>
              <label class="media-action-btn">
                <span>📹</span> <span>Adjuntar Video</span>
                <input type="file" id="videoInput" accept="video/*" style="display:none">
              </label>
            </div>

            <div class="attachments-preview" id="attachmentsPreview">
              ${this.currentAudioBlob ? `<div class="attachment-chip">🎙️ Nota de Voz <span class="remove-attach" id="removeAudioBtn">✕</span></div>` : ''}
              ${this.currentPhotoFile ? `<div class="attachment-chip">📷 Foto: ${this.currentPhotoFile.name.substring(0, 10)}... <span class="remove-attach" id="removePhotoBtn">✕</span></div>` : ''}
              ${this.currentVideoFile ? `<div class="attachment-chip">📹 Video: ${this.currentVideoFile.name.substring(0, 10)}... <span class="remove-attach" id="removeVideoBtn">✕</span></div>` : ''}
            </div>
          </div>

          <!-- CHAT INFORMATIVO GENERAL DE RADIO -->
          ${this.buildChatWidgetHtml('general', 'Chat Informativo (Radial)')}

          <!-- BOTÓN URGENTE AL PIE DE PANTALLA: ¡ALERTA! -->
          <div class="panic-footer-area">
            <button class="panic-button-urgent" id="btnPanicTap">
              <span>🚨</span>
              <span>¡ALERTA!</span>
            </button>
            <div class="panic-urgent-hint">Presione solo para emergencias o asistencia urgente</div>
          </div>
        </div>
      `;

      this.attachCitizenFormEvents();
    }
  }

  attachCitizenFormEvents() {
    const catBtns = this.citizenViewEl.querySelectorAll('.category-btn');
    const textInput = this.citizenViewEl.querySelector('#textDescriptionInput');

    catBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        catBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.selectedCategory = btn.dataset.cat;
        
        const selectedCatObj = INCIDENT_CATEGORIES.find((c) => c.id === this.selectedCategory);
        if (textInput) {
          textInput.value = `Quiero reportar un suceso de ${selectedCatObj.name.toLowerCase()}: `;
          textInput.focus();
        }
      });
    });

    // Botón Emergencia URGENTE ¡ALERTA!
    const btnPanicTap = this.citizenViewEl.querySelector('#btnPanicTap');
    if (btnPanicTap) {
      btnPanicTap.addEventListener('click', () => {
        const textVal = textInput ? textInput.value : '';
        this.triggerNewAlert(this.selectedCategory, textVal || '¡SOLICITUD DE ALERTA URGENTE!');
      });
    }

    // Grabación Audio
    const btnRecordAudio = this.citizenViewEl.querySelector('#btnRecordAudio');
    if (btnRecordAudio) {
      btnRecordAudio.addEventListener('click', () => this.toggleAudioRecording());
    }

    // Adjuntar Foto
    const photoInput = this.citizenViewEl.querySelector('#photoInput');
    if (photoInput) {
      photoInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          this.currentPhotoFile = e.target.files[0];
          this.currentPhotoUrl = URL.createObjectURL(this.currentPhotoFile);
          this.renderCitizenPanel();
        }
      });
    }

    // Adjuntar Video
    const videoInput = this.citizenViewEl.querySelector('#videoInput');
    if (videoInput) {
      videoInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          this.currentVideoFile = e.target.files[0];
          this.currentVideoUrl = URL.createObjectURL(this.currentVideoFile);
          this.renderCitizenPanel();
        }
      });
    }

    // Adjuntos remover
    const removeAudioBtn = this.citizenViewEl.querySelector('#removeAudioBtn');
    if (removeAudioBtn) {
      removeAudioBtn.addEventListener('click', () => {
        this.currentAudioBlob = null;
        this.currentAudioUrl = null;
        this.renderCitizenPanel();
      });
    }
    const removePhotoBtn = this.citizenViewEl.querySelector('#removePhotoBtn');
    if (removePhotoBtn) {
      removePhotoBtn.addEventListener('click', () => {
        this.currentPhotoFile = null;
        this.currentPhotoUrl = null;
        this.renderCitizenPanel();
      });
    }
    const removeVideoBtn = this.citizenViewEl.querySelector('#removeVideoBtn');
    if (removeVideoBtn) {
      removeVideoBtn.addEventListener('click', () => {
        this.currentVideoFile = null;
        this.currentVideoUrl = null;
        this.renderCitizenPanel();
      });
    }

    // Chat Event Binding
    this.attachChatEvents(this.citizenViewEl, 'general');
  }

  toggleAudioRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.stop();
    } else {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then((stream) => {
          this.mediaRecorder = new MediaRecorder(stream);
          this.audioChunks = [];
          this.mediaRecorder.ondataavailable = (e) => this.audioChunks.push(e.data);
          this.mediaRecorder.onstop = () => {
            this.currentAudioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
            this.currentAudioUrl = URL.createObjectURL(this.currentAudioBlob);
            this.renderCitizenPanel();
          };
          this.mediaRecorder.start();
          const btnRecordAudio = this.citizenViewEl.querySelector('#btnRecordAudio');
          if (btnRecordAudio) {
            btnRecordAudio.classList.add('recording');
            btnRecordAudio.innerHTML = '<span>🔴</span> Grabando...';
          }
        })
        .catch((err) => {
          alert('Creando nota de voz simulada para pruebas...');
          this.currentAudioBlob = new Blob(['audio-demo'], { type: 'audio/wav' });
          this.currentAudioUrl = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
          this.renderCitizenPanel();
        });
    }
  }

  triggerNewAlert(categoryKey, textDesc) {
    const categoryObj = INCIDENT_CATEGORIES.find((c) => c.id === categoryKey) || INCIDENT_CATEGORIES[0];
    
    const defaultPhoto = 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80';
    const defaultAudio = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';

    const newIncident = {
      id: 'inc-' + Date.now(),
      citizenId: this.currentUser.id,
      citizenName: this.currentUser.name,
      citizenDni: this.currentUser.dni,
      citizenPhone: this.currentUser.phone,
      citizenAddress: this.currentUser.address,
      coords: [...this.currentUser.coords],
      category: categoryObj,
      description: textDesc,
      hasAudio: !!this.currentAudioBlob || categoryKey === 'robo',
      audioUrl: this.currentAudioUrl || defaultAudio,
      hasPhoto: !!this.currentPhotoFile || categoryKey === 'robo',
      photoUrl: this.currentPhotoUrl || defaultPhoto,
      photoName: this.currentPhotoFile ? this.currentPhotoFile.name : 'foto_incidente.jpg',
      hasVideo: !!this.currentVideoFile,
      videoUrl: this.currentVideoUrl,
      status: 'searching',
      assignedPatrolId: null,
      assignedPatrol: null,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      etaMinutes: 3
    };

    this.activeIncidents.push(newIncident);
    playAlertSound('panic');

    this.map.setView(newIncident.coords, 15);
    this.updateMapElements();

    this.currentAudioBlob = null;
    this.currentAudioUrl = null;
    this.currentPhotoFile = null;
    this.currentPhotoUrl = null;
    this.currentVideoFile = null;
    this.currentVideoUrl = null;

    this.renderCitizenPanel();

    if (this.currentRoleType === 'patrol') {
      this.checkIncomingDispatchForPatrol();
    }
  }

  buildActiveIncidentHtml(inc) {
    if (inc.status === 'searching') {
      return `
        <div class="panel-handle"></div>
        <div class="active-alert-card">
          <div class="status-header-banner">
            <div class="status-title-group">
              <span class="status-icon">📡</span>
              <div>
                <div class="status-text-main">BUSCANDO PATRULLAS CERCANAS</div>
                <div class="status-subtext">Emitiendo broadcast radial (${this.broadcastRadiusKm} km)</div>
              </div>
            </div>
            <div class="pulse-dot"></div>
          </div>
          <div style="font-size:0.85rem; color:var(--color-navy-dark); font-weight:700; margin-bottom:8px;">
            Alerta enviada: ${inc.category.icon} ${inc.category.name}
          </div>

          <!-- CHAT DE CASO DIRECTO -->
          ${this.buildChatWidgetHtml('case-' + inc.id, 'Chat Directo con la Patrulla')}

          <button class="btn-cancel-alert" id="btnCancelIncident" style="margin-top:12px;">Cancelar Alerta</button>
        </div>
      `;
    } else {
      const patrol = inc.assignedPatrol;
      return `
        <div class="panel-handle"></div>
        <div class="active-alert-card">
          <div class="status-header-banner" style="background:#E8F5E9; border-color:#2E7D32;">
            <div class="status-title-group">
              <span class="status-icon">🚨</span>
              <div>
                <div class="status-text-main" style="color:#2E7D32;">${inc.status === 'on_site' ? 'PATRULLA EN EL LUGAR' : 'PATRULLA EN CAMINO'}</div>
                <div class="status-subtext">Respuesta Oficial Asignada</div>
              </div>
            </div>
            <div class="eta-pill">${inc.status === 'on_site' ? '0 MIN' : inc.etaMinutes + ' MIN ETA'}</div>
          </div>

          <div class="assigned-patrol-box">
            <div class="patrol-officer-info">
              <div class="patrol-avatar">👮</div>
              <div>
                <div class="patrol-name">${patrol.officer}</div>
                <div class="patrol-unit-code">${patrol.code} • ${patrol.vehicle}</div>
              </div>
            </div>
            <a href="tel:${patrol.phone}" style="font-size:1.4rem; text-decoration:none;">📞</a>
          </div>

          <!-- CHAT DIRECTO PRIVADO CON EL MÓVIL QUE ACEPTÓ EL CASO -->
          ${this.buildChatWidgetHtml('case-' + inc.id, 'Chat Directo con ' + patrol.code)}

          <button class="btn-cancel-alert" id="btnCancelIncident" style="margin-top:12px;">Finalizar Asistencia</button>
        </div>
      `;
    }
  }

  attachActiveIncidentEvents(inc) {
    const btnCancel = this.citizenViewEl.querySelector('#btnCancelIncident');
    if (btnCancel) {
      btnCancel.addEventListener('click', () => {
        inc.status = 'resolved';
        if (inc.assignedPatrol) {
          inc.assignedPatrol.status = 'online';
        }
        this.updateMapElements();
        this.renderCitizenPanel();
      });
    }
    this.attachChatEvents(this.citizenViewEl, 'case-' + inc.id);
  }

  // ------------------------------------------------------------------------
  // 4. CHAT WIDGET REUTILIZABLE (INFORMATIVO / DIRECTO DE CASO)
  // ------------------------------------------------------------------------
  buildChatWidgetHtml(channelId, titleText) {
    const channelMessages = CHAT_STORE.filter((m) => m.channelId === channelId);
    return `
      <div class="chat-box-container">
        <div class="chat-header">
          <span>💬 ${titleText}</span>
          <span class="chat-mode-tag">${channelId.startsWith('case-') ? 'DIRECTO CASO' : 'BROADCAST RADIO'}</span>
        </div>
        <div class="chat-messages-list" id="chatList-${channelId}">
          ${
            channelMessages.length === 0
              ? `<div style="font-size:0.75rem; color:var(--color-text-muted); text-align:center; margin-top:30px;">
                  Canal de chat abierto para comunicarse con ${channelId.startsWith('case-') ? 'el móvil asignado' : 'los móviles cercanos'}.
                </div>`
              : channelMessages
                  .map(
                    (msg) => `
              <div class="chat-bubble ${msg.senderId === this.currentUser.id ? 'mine' : 'other'}">
                <div style="font-size:0.68rem; opacity:0.8; margin-bottom:2px;">${msg.senderName} • ${msg.time}</div>
                <div>${msg.text}</div>
              </div>
            `
                  )
                  .join('')
          }
        </div>
        <div class="chat-input-bar">
          <input type="text" id="chatInput-${channelId}" placeholder="Escribir mensaje..." />
          <button id="btnSendChat-${channelId}">Enviar</button>
        </div>
      </div>
    `;
  }

  attachChatEvents(parentContainer, channelId) {
    const btnSend = parentContainer.querySelector(`#btnSendChat-${channelId}`);
    const input = parentContainer.querySelector(`#chatInput-${channelId}`);

    if (btnSend && input) {
      const sendAction = () => {
        const txt = input.value.trim();
        if (txt) {
          CHAT_STORE.push({
            id: 'msg-' + Date.now(),
            channelId: channelId,
            senderId: this.currentUser.id,
            senderName: this.currentUser.name || this.currentUser.code,
            text: txt,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          });
          input.value = '';
          this.renderCurrentRoleView();
        }
      };

      btnSend.addEventListener('click', sendAction);
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendAction();
      });
    }
  }

  // ------------------------------------------------------------------------
  // 5. VISTA AGENTE / PATRULLA (CHOFER DE SEGURIDAD)
  // ------------------------------------------------------------------------
  renderPatrolPanel() {
    const patrol = this.currentUser;
    const activeAssignedInc = this.activeIncidents.find(
      (inc) => inc.assignedPatrolId === patrol.id && inc.status !== 'resolved'
    );

    this.patrolViewEl.innerHTML = `
      <div class="panel-handle"></div>
      <div class="patrol-dashboard">
        <div class="user-profile-header">
          <div class="user-info">
            <div class="user-avatar" style="background:var(--color-navy-dark); color:var(--color-cyan-accent);">🚔</div>
            <div>
              <div class="user-name">${patrol.code} (${patrol.officer})</div>
              <div class="user-meta">${patrol.vehicle} • ${patrol.zone}</div>
            </div>
          </div>
        </div>

        <!-- SEMÁFORO DE ESTADOS DE LA PATRULLA (VERDE, ROJO, AMARILLO) -->
        <div class="patrol-status-toggle">
          <div class="status-opt-btn ${patrol.status === 'online' ? 'active-online' : ''}" id="btnStatusOnline">
            🟢 En Patrullaje
          </div>
          <div class="status-opt-btn ${patrol.status === 'busy' ? 'active-busy' : ''}" id="btnStatusBusy">
            🔴 En Incidente
          </div>
          <div class="status-opt-btn ${patrol.status === 'stopped' ? 'active-stopped' : ''}" id="btnStatusStopped">
            🟡 Detenido > 15m
          </div>
        </div>

        ${
          activeAssignedInc
            ? `
          <div style="background:#F8FAFC; border:1px solid var(--color-cyan-accent); border-radius:var(--radius-md); padding:12px; margin-top:8px;">
            <div style="font-weight:800; color:var(--color-navy-dark); font-size:0.92rem; margin-bottom:4px;">
              ASISTENCIA ACTIVA: ${activeAssignedInc.category.icon} ${activeAssignedInc.category.name}
            </div>
            <div style="font-size:0.8rem; color:var(--color-text-muted); margin-bottom:8px;">
              Ciudadano: <strong>${activeAssignedInc.citizenName}</strong> (DNI: ${activeAssignedInc.citizenDni})<br>
              Ubicación: ${activeAssignedInc.citizenAddress}
            </div>
            ${
              activeAssignedInc.status === 'accepted'
                ? `<button class="btn-accept-dispatch" id="btnArrivedOnSite" style="width:100%;">LLEGUÉ AL LUGAR</button>`
                : `<button class="btn-accept-dispatch" id="btnResolveInc" style="width:100%; background:var(--color-navy-dark);">RESOLVER Y COMPLETAR</button>`
            }
          </div>
          ${this.buildChatWidgetHtml('case-' + activeAssignedInc.id, 'Chat Directo con ' + activeAssignedInc.citizenName)}
        `
            : `
          <div style="text-align:center; padding:12px; color:var(--color-text-muted); font-size:0.8rem;">
            Esperando alertas radiales en el área de ${this.broadcastRadiusKm} km...
          </div>
          ${this.buildChatWidgetHtml('general', 'Chat Informativo (Broadcast)')}
        `
        }
      </div>
    `;

    // Eventos de estado de semáforo
    const btnOnline = this.patrolViewEl.querySelector('#btnStatusOnline');
    if (btnOnline) {
      btnOnline.addEventListener('click', () => {
        patrol.status = 'online';
        this.renderPatrolPanel();
        this.updateMapElements();
      });
    }
    const btnBusy = this.patrolViewEl.querySelector('#btnStatusBusy');
    if (btnBusy) {
      btnBusy.addEventListener('click', () => {
        patrol.status = 'busy';
        this.renderPatrolPanel();
        this.updateMapElements();
      });
    }
    const btnStopped = this.patrolViewEl.querySelector('#btnStatusStopped');
    if (btnStopped) {
      btnStopped.addEventListener('click', () => {
        patrol.status = 'stopped';
        this.renderPatrolPanel();
        this.updateMapElements();
      });
    }

    const btnArrived = this.patrolViewEl.querySelector('#btnArrivedOnSite');
    if (btnArrived && activeAssignedInc) {
      btnArrived.addEventListener('click', () => {
        activeAssignedInc.status = 'on_site';
        this.renderPatrolPanel();
        this.updateMapElements();
      });
    }

    const btnResolve = this.patrolViewEl.querySelector('#btnResolveInc');
    if (btnResolve && activeAssignedInc) {
      btnResolve.addEventListener('click', () => {
        activeAssignedInc.status = 'resolved';
        patrol.status = 'online';
        this.renderPatrolPanel();
        this.updateMapElements();
      });
    }

    const channelId = activeAssignedInc ? 'case-' + activeAssignedInc.id : 'general';
    this.attachChatEvents(this.patrolViewEl, channelId);
  }

  // POP-UP SONORO ENTRANTE CON RECEPCIÓN MULTIMEDIA COMPLETA
  checkIncomingDispatchForPatrol() {
    if (this.currentRoleType !== 'patrol') return;

    const patrol = this.currentUser;
    if (patrol.status !== 'online') return;

    const pendingInc = this.activeIncidents.find((inc) => {
      if (inc.status !== 'searching') return false;
      const dist = calculateDistanceKm(
        patrol.coords[0],
        patrol.coords[1],
        inc.coords[0],
        inc.coords[1]
      );
      return dist <= this.broadcastRadiusKm;
    });

    if (pendingInc) {
      playAlertSound('dispatch');
      const dist = calculateDistanceKm(
        patrol.coords[0],
        patrol.coords[1],
        pendingInc.coords[0],
        pendingInc.coords[1]
      ).toFixed(1);

      this.incomingDispatchModalEl.classList.remove('hidden');
      this.incomingDispatchModalEl.innerHTML = `
        <div class="incoming-dispatch-modal">
          <div class="dispatch-header">
            <span class="dispatch-badge-tag">${pendingInc.category.icon} ${pendingInc.category.name}</span>
            <div class="dispatch-timer-ring">30s</div>
          </div>
          <div class="dispatch-citizen-details">
            <div class="dispatch-citizen-name">${pendingInc.citizenName}</div>
            <div class="dispatch-citizen-meta">DNI: ${pendingInc.citizenDni} • ${pendingInc.citizenPhone}</div>
            <div style="font-size:0.78rem; margin-top:4px; color:var(--color-navy-dark); font-weight:700;">
              📍 Ubicación (${dist} km): ${pendingInc.citizenAddress}
            </div>

            ${
              pendingInc.description
                ? `
              <div class="dispatch-media-box">
                <div class="media-box-title">💬 Mensaje de Texto:</div>
                <div style="font-size:0.82rem; color:var(--color-navy-dark); font-weight:600;">"${pendingInc.description}"</div>
              </div>
            `
                : ''
            }

            ${
              pendingInc.hasAudio
                ? `
              <div class="dispatch-media-box">
                <div class="media-box-title">🎙️ Nota de Voz Recibida:</div>
                <audio controls src="${pendingInc.audioUrl}" style="width:100%; height:36px; margin-top:4px; outline:none; border-radius:6px;"></audio>
              </div>
            `
                : ''
            }

            ${
              pendingInc.hasPhoto
                ? `
              <div class="dispatch-media-box">
                <div class="media-box-title">📷 Captura de Foto del Hecho:</div>
                <img src="${pendingInc.photoUrl}" alt="Foto del evento" style="width:100%; max-height:140px; object-fit:cover; border-radius:8px; margin-top:4px; border:1px solid var(--color-border);">
              </div>
            `
                : ''
            }

            ${
              pendingInc.hasVideo
                ? `
              <div class="dispatch-media-box">
                <div class="media-box-title">📹 Clip de Video Adjunto:</div>
                <video controls src="${pendingInc.videoUrl}" style="width:100%; max-height:140px; border-radius:8px; margin-top:4px; background:black;"></video>
              </div>
            `
                : ''
            }
          </div>
          <div class="dispatch-action-btns">
            <button class="btn-accept-dispatch" id="btnAcceptDispatch">ACEPTAR ASISTENCIA</button>
            <button class="btn-reject-dispatch" id="btnRejectDispatch">Ignorar</button>
          </div>
        </div>
      `;

      const btnAccept = this.incomingDispatchModalEl.querySelector('#btnAcceptDispatch');
      if (btnAccept) {
        btnAccept.addEventListener('click', () => {
          pendingInc.status = 'accepted';
          pendingInc.assignedPatrolId = patrol.id;
          pendingInc.assignedPatrol = patrol;
          patrol.status = 'busy';
          patrol.metrics.acceptedToday += 1;
          patrol.metrics.acceptedMonth += 1;

          playAlertSound('accept');
          this.incomingDispatchModalEl.classList.add('hidden');
          this.renderPatrolPanel();
          this.updateMapElements();
        });
      }

      const btnReject = this.incomingDispatchModalEl.querySelector('#btnRejectDispatch');
      if (btnReject) {
        btnReject.addEventListener('click', () => {
          patrol.metrics.rejectedToday += 1;
          patrol.metrics.rejectedMonth += 1;
          this.incomingDispatchModalEl.classList.add('hidden');
        });
      }
    } else {
      this.incomingDispatchModalEl.classList.add('hidden');
    }
  }

  // ------------------------------------------------------------------------
  // 6. VISTA CENTRAL DE MONITOREO Y DASHBOARD DE REPORTES ANALÍTICOS
  // ------------------------------------------------------------------------
  renderCentralPanel() {
    const totalPatrols = this.patrols.length;
    const onlinePatrols = this.patrols.filter((p) => p.status === 'online').length;
    const busyPatrols = this.patrols.filter((p) => p.status === 'busy').length;
    const stoppedPatrols = this.patrols.filter((p) => p.status === 'stopped').length;
    const activeIncidentsCount = this.activeIncidents.filter((i) => i.status !== 'resolved').length;

    this.centralViewEl.innerHTML = `
      <div class="panel-handle"></div>
      <div class="central-dashboard">
        <!-- PESTAÑAS DE LA CENTRAL DE MONITOREO -->
        <div class="central-tabs-header">
          <div class="central-tab-btn ${this.centralActiveTab === 'live' ? 'active' : ''}" id="tabBtnLive">
            🗺️ Control en Vivo
          </div>
          <div class="central-tab-btn ${this.centralActiveTab === 'analytics' ? 'active' : ''}" id="tabBtnAnalytics">
            📊 Reportes & Métricas
          </div>
        </div>

        ${
          this.centralActiveTab === 'live'
            ? `
          <!-- SEMÁFORO LEYENDA -->
          <div class="patrol-status-legend">
            <div class="legend-item"><span style="color:#2E7D32;">🟢</span> Patrullaje (${onlinePatrols})</div>
            <div class="legend-item"><span style="color:#D32F2F;">🔴</span> En Caso (${busyPatrols})</div>
            <div class="legend-item"><span style="color:#F57C00;">🟡</span> Detenido > 15m (${stoppedPatrols})</div>
          </div>

          <!-- ESTADÍSTICAS RÁPIDAS -->
          <div class="central-stats-grid">
            <div class="stat-card">
              <div class="stat-val">${totalPatrols}</div>
              <div class="stat-lbl">Patrullas</div>
            </div>
            <div class="stat-card">
              <div class="stat-val" style="color:#2E7D32;">${onlinePatrols}</div>
              <div class="stat-lbl">En Patrullaje</div>
            </div>
            <div class="stat-card">
              <div class="stat-val" style="color:#D32F2F;">${activeIncidentsCount}</div>
              <div class="stat-lbl">Alertas Activas</div>
            </div>
            <div class="stat-card">
              <div class="stat-val" style="color:#F57C00;">${stoppedPatrols}</div>
              <div class="stat-lbl">Inactivas</div>
            </div>
          </div>

          <!-- CONFIGURADOR DEL RADIO DE BROADCAST Y MUNICIPAL -->
          <div class="radius-control-box">
            <div class="radius-label-row">
              <span>Radio de Cobertura Broadcast:</span>
              <span id="radiusValueText" style="color:var(--color-cyan-accent); font-weight:800;">${this.broadcastRadiusKm} km</span>
            </div>
            <input type="range" min="1" max="10" step="0.5" value="${this.broadcastRadiusKm}" class="radius-slider" id="radiusSlider">
          </div>

          <!-- PANEL DE CONFIGURACIONES MUNICIPALES (VISIBILIDAD MÓVIL & CIDI/ANSES) -->
          <div class="radius-control-box" style="margin-top:8px; background:var(--color-navy-dark); color:white;">
            <div style="font-weight:700; font-size:0.8rem; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
              <span>⚙️ Ajustes Municipales en Vivo</span>
              <span style="font-size:0.7rem; background:rgba(255,255,255,0.2); padding:2px 6px; border-radius:4px;">CiDi / ANSES Habilitados</span>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.75rem; background:rgba(255,255,255,0.08); padding:8px 10px; border-radius:6px;">
              <div>
                <strong>🔒 Visibilidad GPS Móvil a Vecinos:</strong><br>
                <span style="color:rgba(255,255,255,0.7); font-size:0.7rem;" id="patrolVisText">
                  ${MUNICIPAL_SETTINGS.patrolVisibilityToCitizen ? '🟢 Habilitada (Vecino ve patrulla en mapa)' : '🔴 Oculta (Solo estado por seguridad)'}
                </span>
              </div>
              <button id="btnTogglePatrolVis" style="background:var(--color-cyan-accent); color:var(--color-navy-dark); border:none; padding:4px 10px; font-weight:800; border-radius:4px; cursor:pointer;">
                ${MUNICIPAL_SETTINGS.patrolVisibilityToCitizen ? 'Ocultar Móvil' : 'Mostrar Móvil'}
              </button>
            </div>
          </div>

          <!-- LISTADO DE ALERTAS URBANAS VIGENTES -->
          <div class="incidents-table-container">
            <div class="incidents-table-title">ALERTAS REGISTRADAS EN LA CAPITAL</div>
            ${
              this.activeIncidents.length === 0
                ? `<div style="padding:12px; text-align:center; color:var(--color-text-muted); font-size:0.78rem;">Sin incidentes registrados en el sistema</div>`
                : this.activeIncidents
                    .map(
                      (inc) => `
                <div class="incident-row">
                  <div>
                    <strong>${inc.category.icon} ${inc.category.name}</strong> • ${inc.citizenName}<br>
                    <span style="color:var(--color-text-muted);">${inc.citizenAddress} (${inc.timestamp})</span>
                  </div>
                  <div>
                    <span style="font-weight:700; color:${inc.status === 'searching' ? '#D32F2F' : '#2E7D32'};">
                      ${inc.status === 'searching' ? 'BUSCANDO MÓVIL' : inc.assignedPatrol ? inc.assignedPatrol.code : 'EN PROCESO'}
                    </span>
                  </div>
                </div>
              `
                    )
                    .join('')
            }
          </div>
        `
            : `
          <!-- DASHBOARD DE REPORTES Y ANALÍTICA (DIARIO Y MENSUAL) -->
          <div class="incidents-table-container" style="margin-bottom:12px;">
            <div class="incidents-table-title">MÉTRICAS DE ATENCIÓN DE ASISTENCIAS (ACEPTADAS / RECHAZADAS)</div>
            <div style="padding:8px 12px;">
              <table style="width:100%; font-size:0.75rem; border-collapse:collapse;">
                <thead>
                  <tr style="border-bottom:1px solid var(--color-border); text-align:left; color:var(--color-navy-dark);">
                    <th style="padding:6px;">Móvil</th>
                    <th style="padding:6px;">Aceptadas (Hoy)</th>
                    <th style="padding:6px;">Ignoradas (Hoy)</th>
                    <th style="padding:6px;">Aceptadas (Mes)</th>
                    <th style="padding:6px;">Ignoradas (Mes)</th>
                  </tr>
                </thead>
                <tbody>
                  ${this.patrols
                    .map(
                      (p) => `
                    <tr style="border-bottom:1px solid #F1F5F9;">
                      <td style="padding:6px; font-weight:700; color:var(--color-navy-dark);">${p.code}</td>
                      <td style="padding:6px; color:#2E7D32; font-weight:700;">${p.metrics.acceptedToday}</td>
                      <td style="padding:6px; color:#D32F2F;">${p.metrics.rejectedToday}</td>
                      <td style="padding:6px; color:#2E7D32; font-weight:700;">${p.metrics.acceptedMonth}</td>
                      <td style="padding:6px; color:#D32F2F;">${p.metrics.rejectedMonth}</td>
                    </tr>
                  `
                    )
                    .join('')}
                </tbody>
              </table>
            </div>
          </div>

          <div class="incidents-table-container">
            <div class="incidents-table-title">REGISTRO DE INACTIVIDAD / MÓVILES DETENIDOS (> 15 MIN)</div>
            <div style="padding:8px 12px;">
              <table style="width:100%; font-size:0.75rem; border-collapse:collapse;">
                <thead>
                  <tr style="border-bottom:1px solid var(--color-border); text-align:left; color:var(--color-navy-dark);">
                    <th style="padding:6px;">Móvil</th>
                    <th style="padding:6px;">Estado Actual</th>
                    <th style="padding:6px;">Tiempo Detenido (Hoy)</th>
                    <th style="padding:6px;">Tiempo Detenido (Mes)</th>
                  </tr>
                </thead>
                <tbody>
                  ${this.patrols
                    .map(
                      (p) => `
                    <tr style="border-bottom:1px solid #F1F5F9;">
                      <td style="padding:6px; font-weight:700; color:var(--color-navy-dark);">${p.code}</td>
                      <td style="padding:6px;">
                        <span style="font-weight:700; color:${p.status === 'online' ? '#2E7D32' : p.status === 'busy' ? '#D32F2F' : '#F57C00'};">
                          ${p.status === 'online' ? '🟢 Patrullando' : p.status === 'busy' ? '🔴 En Caso' : '🟡 Detenido > 15m'}
                        </span>
                      </td>
                      <td style="padding:6px; font-weight:700;">${p.metrics.stoppedTimeMinutesToday} min</td>
                      <td style="padding:6px; font-weight:700;">${p.metrics.stoppedTimeMinutesMonth} min (${(p.metrics.stoppedTimeMinutesMonth / 60).toFixed(1)} hs)</td>
                    </tr>
                  `
                    )
                    .join('')}
                </tbody>
              </table>
            </div>
          </div>
        `
        }
      </div>
    `;

    // Eventos de Pestañas
    const tabBtnLive = this.centralViewEl.querySelector('#tabBtnLive');
    if (tabBtnLive) {
      tabBtnLive.addEventListener('click', () => {
        this.centralActiveTab = 'live';
        this.renderCentralPanel();
      });
    }
    const tabBtnAnalytics = this.centralViewEl.querySelector('#tabBtnAnalytics');
    if (tabBtnAnalytics) {
      tabBtnAnalytics.addEventListener('click', () => {
        this.centralActiveTab = 'analytics';
        this.renderCentralPanel();
      });
    }

    const radiusSlider = this.centralViewEl.querySelector('#radiusSlider');
    if (radiusSlider) {
      radiusSlider.addEventListener('input', (e) => {
        this.broadcastRadiusKm = parseFloat(e.target.value);
        const radiusText = this.centralViewEl.querySelector('#radiusValueText');
        if (radiusText) radiusText.innerText = `${this.broadcastRadiusKm} km`;
        this.updateMapElements();
      });
    }

    const btnTogglePatrolVis = this.centralViewEl.querySelector('#btnTogglePatrolVis');
    if (btnTogglePatrolVis) {
      btnTogglePatrolVis.addEventListener('click', () => {
        MUNICIPAL_SETTINGS.patrolVisibilityToCitizen = !MUNICIPAL_SETTINGS.patrolVisibilityToCitizen;
        this.renderCentralPanel();
        this.updateMapElements();
      });
    }
  }

  // ------------------------------------------------------------------------
  // 7. RENDERIZADO DE MARKERS CON SEMÁFORO (VERDE, ROJO, AMARILLO) Y CAPAS MAPA
  // ------------------------------------------------------------------------
  updateMapElements() {
    this.markersGroup.clearLayers();
    this.routeLineGroup.clearLayers();
    this.radarCircleGroup.clearLayers();

    // A) Renderizar Patrullas con Semáforo de Estado
    this.patrols.forEach((patrol) => {
      let statusClass = 'status-online';
      let iconSymbol = '🚔';
      if (patrol.status === 'busy') {
        statusClass = 'status-busy'; // 🔴 Rojo
        iconSymbol = '🚨';
      } else if (patrol.status === 'stopped') {
        statusClass = 'status-stopped'; // 🟡 Amarillo
        iconSymbol = '⚠️';
      }

      const patrolIcon = L.divIcon({
        className: 'custom-map-pin',
        html: `<div class="patrol-pin-icon ${statusClass}" title="${patrol.code}">${iconSymbol}</div>`,
        iconSize: [44, 44],
        iconAnchor: [22, 22]
      });

      L.marker(patrol.coords, { icon: patrolIcon })
        .bindPopup(`
          <b>${patrol.code}</b><br>
          ${patrol.officer}<br>
          Estado: <strong>${patrol.status === 'online' ? '🟢 En Patrullaje' : patrol.status === 'busy' ? '🔴 En Atencion de Caso' : '🟡 Detenido > 15 min'}</strong>
        `)
        .addTo(this.markersGroup);
    });

    // B) Renderizar Ciudadanos / Incidentes Activos
    this.activeIncidents.forEach((inc) => {
      if (inc.status === 'resolved') return;

      const citizenIcon = L.divIcon({
        className: 'custom-map-pin',
        html: `<div class="citizen-pin-icon" title="${inc.citizenName}">${inc.category.icon}</div>`,
        iconSize: [38, 38],
        iconAnchor: [19, 19]
      });

      L.marker(inc.coords, { icon: citizenIcon })
        .bindPopup(`<b>${inc.category.name}</b><br>${inc.citizenName}<br>${inc.citizenAddress}`)
        .addTo(this.markersGroup);

      // C) Radio Radar
      if (inc.status === 'searching') {
        L.circle(inc.coords, {
          radius: this.broadcastRadiusKm * 1000,
          color: '#00AEEF',
          fillColor: '#00AEEF',
          fillOpacity: 0.15,
          weight: 2,
          dashArray: '6, 6'
        }).addTo(this.radarCircleGroup);
      }

      // D) Línea de Ruta
      if ((inc.status === 'accepted' || inc.status === 'on_site') && inc.assignedPatrol) {
        L.polyline([inc.assignedPatrol.coords, inc.coords], {
          color: '#004C8C',
          weight: 4,
          opacity: 0.8,
          dashArray: '8, 8'
        }).addTo(this.routeLineGroup);
      }
    });
  }

  startPatrolAnimationLoop() {
    setInterval(() => {
      this.patrols.forEach((patrol) => {
        if (patrol.status === 'online') {
          patrol.coords[0] += (Math.random() - 0.5) * 0.0003;
          patrol.coords[1] += (Math.random() - 0.5) * 0.0003;
        } else if (patrol.status === 'busy') {
          const inc = this.activeIncidents.find((i) => i.assignedPatrolId === patrol.id && i.status === 'accepted');
          if (inc) {
            const dLat = inc.coords[0] - patrol.coords[0];
            const dLng = inc.coords[1] - patrol.coords[1];
            patrol.coords[0] += dLat * 0.1;
            patrol.coords[1] += dLng * 0.1;
          }
        }
      });
      this.updateMapElements();
    }, 3000);
  }
}

// Inicializar la aplicación al cargar el DOM
document.addEventListener('DOMContentLoaded', () => {
  window.app = new OjosEnAlertaApp();
  window.app.init();
});
