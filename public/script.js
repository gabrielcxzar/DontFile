// --- 1. LÓGICA PRINCIPAL ---
let roomName = window.location.pathname.slice(1);
const homeContainer = document.getElementById('homeContainer');
const roomContainer = document.getElementById('roomContainer');

if (roomName.endsWith('index.html') || roomName === '') {
    roomName = ''; // Força o script a tratar como homepage
}

// --- LÓGICA QUE ESTAVA FALTANDO ---
if (!roomName) {
    // Estamos na Raiz: Mostra a Homepage
    homeContainer.style.display = 'block';
    roomContainer.style.display = 'none';
    setupHomepage();
} else {
    // Estamos numa Sala: Mostra a Sala de Arquivos
    homeContainer.style.display = 'none';
    roomContainer.style.display = 'block';
    initializeFileRoom();
}


// --- 2. FUNÇÕES DA HOMEPAGE ---
function setupHomepage() {
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
    const copyBtn = document.getElementById('copyPixBtn');
    const pixInput = document.getElementById('pixKeyInput');
    const qrCodeContainer = document.getElementById('qrcodeCanvas');
    const pixKey = pixInput.value;
    if (qrCodeContainer && pixKey) {
        new QRCode(qrCodeContainer, {
            text: pixKey,
            width: 190,
            height: 190,
            correctLevel: QRCode.CorrectLevel.M
        });
    }
    copyBtn.addEventListener('click', () => {
        pixInput.select();
        pixInput.setSelectionRange(0, 99999); // Para mobile

        try {
            navigator.clipboard.writeText(pixInput.value);
            copyBtn.textContent = 'Copiado!';
            setTimeout(() => {
                copyBtn.textContent = 'Copiar';
            }, 2000);
        } catch (err) {
            console.error('Falha ao copiar:', err);
            alert('Falha ao copiar a chave.');
        }
    });
    btn.addEventListener('click', goToRoom);
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            goToRoom();
        }
    });
}

    



// --- 3. FUNÇÕES DA SALA DE ARQUIVOS ---
function initializeFileRoom() {
    // --- Variáveis Globais da Sala ---
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
            // Limite de 100MB (definido pelo Render)
            if (file.size > 100 * 1024 * 1024) { 
                alert(`❌ Arquivo "${file.name}" é muito grande (máx: 100MB)`);
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
        if (!roomName) return; 

        try {
            const response = await fetch(`/api/${roomName}/files`);
            if (!response.ok) {
                if (response.status === 404) {
                     filesList.innerHTML = `<div class="empty-state">
                        <h2>Sala não encontrada</h2>
                        <p>A sala "${roomName}" não parece existir. Verifique a URL.</p>
                     </div>`;
                     clearInterval(refreshInterval);
                     return;
                }
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
                    <p style="margin-top: 5px; color: #888;">Faça upload do primeiro arquivo!</p>
                </div>`;
                return;
            }

            files.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
            filesList.innerHTML = files.map(file => `
            <div class="file-item">
                <div class="file-info">
                    ${getFileIconHTML(file.name)}
                    <div class="file-details">
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
            </div>`).join('');
        } catch (error) {
            console.error('Erro ao carregar arquivos:', error);
             if (error instanceof SyntaxError) {
                 filesList.innerHTML = `<div class="empty-state">
                    <h2>Erro de Comunicação</h2>
                    <p>Ocorreu um erro ao comunicar com o servidor.</p>
                 </div>`;
                 clearInterval(refreshInterval);
             }
        }
    }

    // --- Funções Utilitárias (Aninhadas) ---
    // (Tornamos globais para o 'onclick' funcionar)

    window.downloadFile = function(filename) {
        window.location.href = `/api/${roomName}/download/${encodeURIComponent(filename)}`;
    }

    window.deleteFile = async function(filename) {
        if (!confirm(`Tem certeza que deseja deletar "${filename}"?`)) return;
        try {
            const response = await fetch(`/api/${roomName}/delete/${encodeURIComponent(filename)}`, { method: 'DELETE' });
            if (response.ok) loadFiles();
            else alert('❌ Erro ao deletar arquivo');
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
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    }

    // --- Execução Inicial (Dentro da Sala) ---
    loadFiles();
    const refreshInterval = setInterval(loadFiles, 5000);
}