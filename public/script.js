// 1. Pega o nome da sala da URL
const roomName = window.location.pathname.slice(1);

// 2. Lógica principal: Verifica se estamos na raiz ou em uma sala
if (!roomName) {
    // Estamos na raiz (página principal)
    promptForRoom();
} else {
    // Estamos em uma sala (ex: /projeto-xyz)
    initializeFileRoom();
}


/**
 * Função 1: Chamada se estivermos na página principal (roomName está vazio).
 * Pergunta ao usuário o nome da nova sala e o redireciona.
 */
function promptForRoom() {
    // Esconde qualquer coisa da "sala de arquivos" que possa estar no HTML
    document.body.innerHTML = `
        <div class="prompt-container">
            <h2>Bem-vindo ao DontFile</h2>
            <p>Para começar, crie um nome para sua sala de arquivos:</p>
            <input type="text" id="roomInput" placeholder="ex: projeto-cliente" autofocus>
            <button id="createRoomBtn">Criar ou Acessar Sala</button>
        </div>
    `;

    // Adiciona CSS para centralizar
    const style = document.createElement('style');
    style.innerHTML = `
        body { display: flex; align-items: center; justify-content: center; min-height: 90vh; }
        .prompt-container { text-align: center; background: #2c2c2c; padding: 30px; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.3); }
        .prompt-container h2 { margin-top: 0; }
        .prompt-container input { width: 80%; padding: 10px; margin: 15px 0; border: 1px solid #444; border-radius: 4px; background: #333; color: white; }
        .prompt-container button { padding: 10px 20px; font-weight: bold; }
    `;
    document.head.appendChild(style);

    const input = document.getElementById('roomInput');
    const btn = document.getElementById('createRoomBtn');

    const goToRoom = () => {
        const newRoom = input.value.trim();
        if (newRoom.length > 0) {
            // Limpa o nome para ser 'amigável' para URL
            const safeRoomName = newRoom
                .toLowerCase()
                .replace(/\s+/g, '-')       // Substitui espaços por -
                .replace(/[^\w-]+/g, '')   // Remove caracteres especiais
                .replace(/--+/g, '-');      // Remove hífens duplicados

            if (safeRoomName) {
                // Redireciona o navegador para a nova URL
                window.location.href = `/${safeRoomName}`;
            } else {
                alert("Por favor, digite um nome válido.");
            }
        } else {
            alert("Por favor, digite um nome para a sala.");
        }
    };

    btn.addEventListener('click', goToRoom);
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            goToRoom();
        }
    });
}


/**
 * Função 2: Chamada se roomName *não* estiver vazio.
 * Contém *todo* o seu código original da sala de arquivos.
 */
function initializeFileRoom() {
    // --- Variáveis Globais (agora dentro da função) ---
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const filesList = document.getElementById('filesList');
    const progressBar = document.getElementById('progressBar');
    const progressBarFill = document.getElementById('progressBarFill');

    // Define o nome da sala no topo da página
    document.getElementById('roomName').textContent = roomName;

    // --- Event Listeners de Upload ---
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

    // --- Funções Principais da Sala ---

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
                        console.log('Upload completo:', file.name);
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

    async function loadFiles() {
        // A trava de segurança (embora agora não seja estritamente necessária,
        // pois initializeFileRoom() só é chamada se roomName existir,
        // é uma boa prática manter).
        if (!roomName) {
            console.warn("loadFiles() chamada sem um roomName. Abortando.");
            return;
        }

        try {
            const response = await fetch(`/api/${roomName}/files`);
            // Se a sala não existir no backend, o fetch pode falhar
            if (!response.ok) {
                // Se a sala não existe (404), trata o erro
                if (response.status === 404) {
                     filesList.innerHTML = `<div class="empty-state">
                        <h2>Sala não encontrada</h2>
                        <p>A sala "${roomName}" não parece existir. Verifique a URL.</p>
                     </div>`;
                     // Para o loop de atualização se a sala não existe
                     clearInterval(refreshInterval);
                     return;
                }
                // Outros erros de servidor
                throw new Error(`Erro de servidor: ${response.status}`);
            }

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

            files.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));

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
            // Se o JSON falhar (ex: erro 404 retornou HTML)
             if (error instanceof SyntaxError) {
                 filesList.innerHTML = `<div class="empty-state">
                    <h2>Erro</h2>
                    <p>Ocorreu um erro ao comunicar com o servidor.</p>
                 </div>`;
                 // Para o loop de atualização
                 clearInterval(refreshInterval);
             }
        }
    }

    // --- Funções Utilitárias (Aninhadas) ---
    // (Note que deleteFile e downloadFile agora são declaradas
    // globalmente no escopo do *navegador* para o 'onclick' funcionar)

    window.downloadFile = function(filename) {
        window.location.href = `/api/${roomName}/download/${encodeURIComponent(filename)}`;
    }

    window.deleteFile = async function(filename) {
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

    function getFileIconHTML(filename) {
        const extension = filename.split('.').pop().toLowerCase();
        let iconClass = 'fa-solid fa-file'; // Ícone padrão

        switch (extension) {
            case 'pdf': iconClass = 'fa-solid fa-file-pdf'; break;
            case 'py': iconClass = 'fa-brands fa-python'; break;
            case 'js': iconClass = 'fa-brands fa-js'; break;
            case 'html': case 'htm': iconClass = 'fa-brands fa-html5'; break;
            case 'css': iconClass = 'fa-brands fa-css3-alt'; break;
            case 'txt': case 'md': iconClass = 'fa-solid fa-file-lines'; break;
            case 'doc': case 'docx': iconClass = 'fa-solid fa-file-word'; break;
            case 'xls': case 'xlsx': iconClass = 'fa-solid fa-file-excel'; break;
            case 'ppt': case 'pptx': iconClass = 'fa-solid fa-file-powerpoint'; break;
            case 'zip': case 'rar': case '7z': iconClass = 'fa-solid fa-file-zipper'; break;
            case 'png': case 'jpg': case 'jpeg': case 'gif': case 'webp': iconClass = 'fa-solid fa-file-image'; break;
            case 'mp3': case 'wav': iconClass = 'fa-solid fa-file-audio'; break;
            case 'mp4': case 'mov': case 'avi': iconClass = 'fa-solid fa-file-video'; break;
            case 'sql': iconClass = 'fa-solid fa-database'; break;
        }
        return `<i class="file-icon ${iconClass}"></i>`;
    }

    function formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }

    function formatDate(date) {
        return new Date(date).toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // --- Execução Inicial (Dentro da Sala) ---
    
    // Carrega os arquivos ao abrir a página
    loadFiles();
    
    // Atualiza a lista a cada 5 segundos
    // (Guardamos em uma variável para poder parar se a sala não existir)
    const refreshInterval = setInterval(loadFiles, 5000);
    
} // Fim da função initializeFileRoom()