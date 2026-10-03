/**
 * =============================================================================
 * SCRIPT: js/app.js
 * CONSULTA DE IMAGENES DE LA NASA - JAVASCRIPT NATIVO -
 * Copyright (c) [2025] [René Peña Martínez]. Licensed under CC BY 4.0.
 * Full license text available at https://creativecommons.org
 * =============================================================================
 */

const NASA_BASE_URL = 'https://images-api.nasa.gov/search';
const MAX_RESULTS = 36;

const searchForm = document.getElementById('searchForm');
const queryInput = document.getElementById('queryInput');
const queryPreviewText = document.getElementById('queryPreviewText');
const apiEndpointUrl = document.getElementById('apiEndpointUrl');
const statusContainer = document.getElementById('statusContainer');
const statusMessage = document.getElementById('statusMessage');
const resultsGrid = document.getElementById('resultsGrid');
const resultsCount = document.getElementById('resultsCount');
const quickOptions = document.getElementById('quickOptions');

const imageModal = document.getElementById('imageModal');
const modalImage = document.getElementById('modalImage');
const modalTitle = document.getElementById('modalTitle');
const modalDescription = document.getElementById('modalDescription');
const closeModalBtn = document.getElementById('closeModalBtn');

let currentResults = [];

function escaparHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function construirEndpoint(query) {
  return `${NASA_BASE_URL}?q=${encodeURIComponent(query)}&media_type=image`;
}

function actualizarVistaPreviaQuery(query) {
  const cleanQuery = query.trim() || 'planets';
  queryPreviewText.textContent = `"${cleanQuery}"`;
  apiEndpointUrl.textContent = construirEndpoint(cleanQuery);
}

async function consultarNasaApi(searchKeyword) {
  const query = searchKeyword.trim();
  if (!query) {
    alert('Ingrese un termino valido antes de realizar la consulta.');
    return;
  }

  mostrarCargando(true, `Consultando servidores de la NASA para "${query}"...`);
  resultsGrid.innerHTML = '';
  resultsCount.textContent = 'Buscando...';

  try {
    const response = await fetch(construirEndpoint(query));

    if (!response.ok) {
      throw new Error(`Respuesta del servidor: HTTP ${response.status} (${response.statusText})`);
    }

    const json = await response.json();
    currentResults = json.collection?.items || [];
    mostrarResultados(currentResults, query);

  } catch (error) {
    console.error('Error en la peticion HTTP:', error);
    mostrarError(`Error al consultar la API: ${error.message}. Compruebe la conexion de red.`);
  } finally {
    mostrarCargando(false);
  }
}

function mostrarResultados(items, query) {
  resultsGrid.innerHTML = '';

  if (items.length === 0) {
    resultsCount.textContent = '0 imagenes encontradas';
    resultsGrid.innerHTML = `
      <div class="grid-message empty">
        <p><strong>No se encontraron registros para "${escaparHtml(query)}"</strong></p>
        <small>Sugerencia: Ingrese terminos en ingles como Jupiter, Saturn, Mars, Hubble o Apollo.</small>
      </div>`;
    return;
  }

  let mostradas = 0;

  items.slice(0, MAX_RESULTS).forEach((item, index) => {
    const data = item.data && item.data[0] ? item.data[0] : {};
    const previewLink = item.links && item.links[0] ? item.links[0].href : null;
    if (!previewLink) return;

    const title = data.title || 'Registro de la NASA';
    const description = data.description || 'Sin descripcion provista en el archivo oficial.';
    const fecha = data.date_created ? new Date(data.date_created) : null;
    const dateCreated = fecha && !isNaN(fecha)
      ? fecha.toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' })
      : 'Fecha no especificada';
    const nasaId = data.nasa_id || 'N/A';

    const card = document.createElement('article');
    card.className = 'card-item';
    card.innerHTML = `
      <div class="card-image-box">
        <img src="${escaparHtml(previewLink)}" alt="${escaparHtml(title)}" loading="lazy">
        <span class="card-id-tag">${escaparHtml(nasaId)}</span>
      </div>
      <div class="card-body">
        <h3 class="card-title">${escaparHtml(title)}</h3>
        <div class="card-date">Fecha: ${escaparHtml(dateCreated)}</div>
        <p class="card-description">${escaparHtml(description)}</p>
        <div class="card-footer">
          <button type="button" class="btn-detail">Ver detalle completo</button>
        </div>
      </div>`;

    card.querySelector('img').addEventListener('click', () => abrirModal(index));
    card.querySelector('.btn-detail').addEventListener('click', () => abrirModal(index));

    resultsGrid.appendChild(card);
    mostradas++;
  });

  resultsCount.textContent = `${mostradas} imagenes mostradas (de ${items.length} encontradas)`;
}

function abrirModal(index) {
  const item = currentResults[index];
  if (!item) return;

  const data = item.data && item.data[0] ? item.data[0] : {};
  const previewLink = item.links && item.links[0] ? item.links[0].href : '';

  modalTitle.textContent = data.title || 'Detalle del registro';
  modalDescription.textContent = data.description || 'Sin descripcion disponible.';
  modalImage.src = previewLink;
  modalImage.alt = data.title || 'Vista previa';

  if (typeof imageModal.showModal === 'function') {
    imageModal.showModal();
  } else {
    imageModal.setAttribute('open', 'true');
  }
}

function cerrarModal() {
  if (typeof imageModal.close === 'function') {
    imageModal.close();
  } else {
    imageModal.removeAttribute('open');
  }
}

closeModalBtn.addEventListener('click', cerrarModal);

// Cerrar al hacer clic fuera del contenido (sobre el fondo oscuro)
imageModal.addEventListener('click', (event) => {
  if (event.target === imageModal) cerrarModal();
});

searchForm.addEventListener('submit', (event) => {
  event.preventDefault();
  consultarNasaApi(queryInput.value);
});

queryInput.addEventListener('input', () => {
  actualizarVistaPreviaQuery(queryInput.value);
});

quickOptions.addEventListener('click', (event) => {
  const button = event.target.closest('.btn-category');
  if (!button) return;

  document.querySelectorAll('.btn-category').forEach(btn => btn.classList.remove('active'));
  button.classList.add('active');

  const selectedQuery = button.getAttribute('data-query');
  queryInput.value = selectedQuery;
  actualizarVistaPreviaQuery(selectedQuery);
  consultarNasaApi(selectedQuery);
});

function mostrarCargando(isLoading, message = '') {
  statusContainer.style.display = isLoading ? 'block' : 'none';
  if (isLoading) statusMessage.textContent = message;
}

function mostrarError(errorMessage) {
  resultsGrid.innerHTML = `
    <div class="grid-message error">
      <p><strong>Error en la consulta</strong></p>
      <small>${escaparHtml(errorMessage)}</small>
    </div>`;
  resultsCount.textContent = 'Error';
}

document.addEventListener('DOMContentLoaded', () => {
  actualizarVistaPreviaQuery(queryInput.value);
  consultarNasaApi(queryInput.value || 'planets');
});