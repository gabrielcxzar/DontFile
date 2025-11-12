  // Pega o nome da sala da URL (ex: /sala123)
    const roomName = window.location.pathname.slice(1) || 'principal';
    document.getElementById('roomName').textContent = roomName;

    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const filesList = document.getElementById('filesList');
    const progressBar = document.getElementById('progressBar');
    const progressBarFill = document.getElementById('progressBarFill');

    // Carrega os arquivos ao abrir a página
    loadFiles();

    // Click na área de upload
    uploadArea.addEventListener('click', () => {
      fileInput.click();
    });

    // Quando seleciona arquivos
    fileInput.addEventListener('change', (e) => {
      handleFiles(e.target.files);
    });

    // Drag and drop
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

    // Função para fazer upload dos arquivos
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
          
          // Atualiza a barra de progresso
          xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
              const percent = (e.loaded / e.total) * 100;
              progressBarFill.style.width = percent + '%';
            }
          });

          xhr.addEventListener('load', () => {
            if (xhr.status === 200) {
              console.log('✅ Upload completo:', file.name);
              loadFiles(); // Recarrega a lista
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

      fileInput.value = ''; // Limpa o input
    }

    // Carrega a lista de arquivos
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

        filesList.innerHTML = files.map(file => `
          <div class="file-item">
            <div class="file-info">
              <div class="file-name">📄 ${file.name}</div>
              <div class="file-meta">
                ${formatBytes(file.size)} • ${formatDate(file.uploadDate)}
              </div>
            </div>
            <div class="file-actions">
              <button class="btn" onclick="downloadFile('${file.name}')">⬇ Baixar</button>
              <button class="btn btn-delete" onclick="deleteFile('${file.name}')">🗑 Deletar</button>
            </div>
          </div>
        `).join('');

      } catch (error) {
        console.error('Erro ao carregar arquivos:', error);
      }
    }

    // Download de arquivo
    function downloadFile(filename) {
      window.location.href = `/api/${roomName}/download/${encodeURIComponent(filename)}`;
    }

    // Deletar arquivo
    async function deleteFile(filename) {
      if (!confirm(`Tem certeza que deseja deletar "${filename}"?`)) {
        return;
      }

      try {
        const response = await fetch(`/api/${roomName}/delete/${encodeURIComponent(filename)}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          loadFiles(); // Recarrega a lista
        } else {
          alert('❌ Erro ao deletar arquivo');
        }
      } catch (error) {
        console.error('Erro:', error);
        alert('❌ Erro ao deletar arquivo');
      }
    }

    // Formata bytes para KB, MB, etc
    function formatBytes(bytes) {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }

    // Formata data
    function formatDate(date) {
      return new Date(date).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }

    // Atualiza a lista a cada 5 segundos
    setInterval(loadFiles, 5000);
  