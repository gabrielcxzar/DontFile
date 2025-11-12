// --- MUDANÇA AQUI ---
// Pega o nome da sala da URL. Como o server.js nos protege,
// 'roomName' sempre terá um valor quando este script for carregado.
const roomName = window.location.pathname.slice(1);
// --- FIM DA MUDANÇA ---

document.getElementById('roomName').textContent = roomName;

const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const filesList = document.getElementById('filesList');
const progressBar = document.getElementById('progressBar');
const progressBarFill = document.getElementById('progressBarFill');

// Carrega os arquivos ao abrir a página
loadFiles();

// Event listeners de upload... (sem mudanças)
uploadArea.addEventListener('click', () => {
  fileInput.click();
});

fileInput.addEventListener('change', (e) => {
  handleFiles(e.target.files);
});

uploadArea.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadArea.classList.add('dragging');
});

uploadArea.addEventListener('dragleave', () => {
  uploadArea.classList.remove('dragging');
});

uploadArea.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadArea.classList.remove('dragging');
  handleFiles(e.dataTransfer.files);
});

// Função de upload... (sem mudanças, exceto um log)
async function handleFiles(files) {
  for (let file of files) {
    if (file.size > 50 * 1024 * 1024) {
      alert(`❌ Arquivo "${file.name}" é muito grande (máx: 50MB)`);
      continue;
    }

    const formData = new FormData();
    formData.append('file', file);

    progressBar.style.display = 'block';
    progressBarFill.style.width = '0%';

    try {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percent = (e.loaded / e.total) * 100;
          progressBarFill.style.width = percent + '%';
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          console.log('Upload completo:', file.name); // Emoji removido
          loadFiles();
          progressBar.style.display = 'none';
        } else {
          alert('❌ Erro no upload: ' + file.name);
        }
      });

      xhr.open('POST', `/api/${roomName}/upload`);
      xhr.send(formData);

    } catch (error) {
      console.error('Erro:', error);
      alert('❌ Erro ao enviar arquivo');
    }
  }

  fileInput.value = '';
}

// --- NOVA FUNÇÃO DE ÍCONE ---
/**
 * Retorna o HTML de um ícone do Font Awesome com base na extensão do arquivo.
 */
function getFileIconHTML(filename) {
  const extension = filename.split('.').pop().toLowerCase();
  let iconClass = 'fa-solid fa-file'; // Ícone padrão

  switch (extension) {
    case 'pdf':
      iconClass = 'fa-solid fa-file-pdf';
      break;
    case 'py':
      iconClass = 'fa-brands fa-python';
      break;
    case 'js':
      iconClass = 'fa-brands fa-js';
      break;
    case 'html':
    case 'htm':
      iconClass = 'fa-brands fa-html5';
      break;
    case 'css':
      iconClass = 'fa-brands fa-css3-alt';
      break;
    case 'txt':
    case 'md':
      iconClass = 'fa-solid fa-file-lines';
      break;
    case 'doc':
    case 'docx':
      iconClass = 'fa-solid fa-file-word';
      break;
    case 'xls':
    case 'xlsx':
      iconClass = 'fa-solid fa-file-excel';
      break;
    case 'ppt':
    case 'pptx':
      iconClass = 'fa-solid fa-file-powerpoint';
      break;
    case 'zip':
    case 'rar':
    case '7z':
      iconClass = 'fa-solid fa-file-zipper';
      break;
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'webp':
      iconClass = 'fa-solid fa-file-image';
      break;
    case 'mp3':
    case 'wav':
      iconClass = 'fa-solid fa-file-audio';
      break;
    case 'mp4':
    case 'mov':
    case 'avi':
      iconClass = 'fa-solid fa-file-video';
      break;
    case 'sql':
      iconClass = 'fa-solid fa-database';
      break;
  }

  return `<i class="file-icon ${iconClass}"></i>`;
}

// --- FUNÇÃO DE CARREGAR ARQUIVOS ATUALIZADA ---
async function loadFiles() {
  try {
    const response = await fetch(`/api/${roomName}/files`);
    const files = await response.json();

    if (files.length === 0) {
      filesList.innerHTML = `
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
            <polyline points="13 2 13 9 20 9"></polyline>
          </svg>
          <p>Nenhum arquivo nesta sala ainda</p>
          <p style="margin-top: 5px;">Faça upload do primeiro arquivo!</p>
        </div>
      `;
      return;
    }

    // Ordena os arquivos por data de upload (mais recente primeiro)
    files.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));

    // Mapeia os arquivos para HTML, agora com ícones
    filesList.innerHTML = files.map(file => `
      <div class="file-item">
        <div class="file-info">
          ${getFileIconHTML(file.name)} <div class="file-details">
            <div class="file-name">${file.name}</div>
            <div class="file-meta">
              ${formatBytes(file.size)} • ${formatDate(file.uploadDate)}
            </div>
          </div>
        </div>
        <div class="file-actions">
          <button class="btn" onclick="downloadFile('${file.name}')">
            <i class="fa-solid fa-download"></i> Baixar
          </button>
          <button class="btn btn-delete" onclick="deleteFile('${file.name}')">
            <i class="fa-solid fa-trash"></i> Deletar
          </button>
        </div>
      </div>
    `).join('');

  } catch (error) {
    console.error('Erro ao carregar arquivos:', error);
  }
}

// Download de arquivo... (sem mudanças)
function downloadFile(filename) {
  window.location.href = `/api/${roomName}/download/${encodeURIComponent(filename)}`;
}

// Deletar arquivo... (sem mudanças)
async function deleteFile(filename) {
  if (!confirm(`Tem certeza que deseja deletar "${filename}"?`)) {
    return;
  }

  try {
    const response = await fetch(`/api/${roomName}/delete/${encodeURIComponent(filename)}`, {
      method: 'DELETE'
    });

    if (response.ok) {
      loadFiles();
    } else {
      alert('❌ Erro ao deletar arquivo');
    }
  } catch (error) {
    console.error('Erro:', error);
    alert('❌ Erro ao deletar arquivo');
  }
}

// Formata bytes... (sem mudanças)
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Formata data... (sem mudanças)
function formatDate(date) {
  return new Date(date).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Atualiza a lista a cada 5 segundos... (sem mudanças)
setInterval(loadFiles, 5000);