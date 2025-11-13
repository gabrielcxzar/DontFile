const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração do Multer... (sem mudanças aqui)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const roomName = req.params.room;
    const uploadPath = path.join(__dirname, 'uploads', roomName);
    
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB
});

// Servir arquivos estáticos (HTML, CSS, JS)
app.use(express.static('public'));

// --- MUDANÇA AQUI ---
// Rota principal - serve a página de CRIAÇÃO de sala
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
// --- FIM DA MUDANÇA ---

// Rota dinâmica para cada "sala"
app.get('/:room', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API: Listar arquivos... (sem mudanças)
app.get('/api/:room/files', (req, res) => {
  const roomName = req.params.room;
  const uploadPath = path.join(__dirname, 'uploads', roomName);
  
  if (!fs.existsSync(uploadPath)) {
    return res.json([]);
  }
  
  fs.readdir(uploadPath, (err, files) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao listar arquivos' });
    }
    
    const fileDetails = files.map(filename => {
      const filePath = path.join(uploadPath, filename);
      const stats = fs.statSync(filePath);
      
      return {
        name: filename,
        size: stats.size,
        uploadDate: stats.mtime
      };
    });
    
    res.json(fileDetails);
  });
});

// API: Upload de arquivo... (sem mudanças)
// API: Upload de arquivo... (COM TRATAMENTO DE ERRO)
app.post('/api/:room/upload', (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    // Se um erro ocorrer (ex: limite de tamanho ou disco cheio)
    if (err) {
      return next(err); // Passa o erro para o middleware de tratamento
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    res.json({
      success: true,
      filename: req.file.originalname,
      size: req.file.size
    });
  });
});

// API: Download de arquivo... (sem mudanças)
app.get('/api/:room/download/:filename', (req, res) => {
  const roomName = req.params.room;
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'uploads', roomName, filename);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Arquivo não encontrado' });
  }
  
  res.download(filePath, filename);
});

// API: Deletar arquivo... (sem mudanças)
app.delete('/api/:room/delete/:filename', (req, res) => {
  const roomName = req.params.room;
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'uploads', roomName, filename);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Arquivo não encontrado' });
  }
  
  fs.unlink(filePath, (err) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao deletar arquivo' });
    }
    
    res.json({ success: true, message: 'Arquivo deletado com sucesso' });
  });
});

// --- NOVO: Middleware de tratamento de erros ---
// Este "pega" os erros de upload, incluindo o "Sem espaço"
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Erro do Multer (ex: arquivo muito grande)
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Arquivo muito grande (Máx: 100MB)' });
    }
    return res.status(400).json({ error: err.message });
  } else if (err && err.code === 'ENOSPC') {
    // Erro de "Sem espaço no dispositivo"
    console.error('ALERTA: Armazenamento da VM está cheio!');
    return res.status(507).json({ error: 'Sem armazenamento disponível. Contate o suporte: dontfile@gmail.com' });
  }

  // Outros erros
  console.error(err.stack);
  res.status(500).json({ error: 'Ocorreu um erro interno no servidor' });
});
// Inicia o servidor
app.listen(PORT, () => {
  console.log(`🚀 DontFile rodando em http://localhost:${PORT}`);
  console.log(`📁 Arquivos salvos em: ${path.join(__dirname, 'uploads')}`);
});