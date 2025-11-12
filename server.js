const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração do Multer para upload de arquivos
// Cada "sala" terá sua própria pasta baseada na URL
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const roomName = req.params.room;
    const uploadPath = path.join(__dirname, 'uploads', roomName);
    
    // Cria a pasta se não existir
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Mantém o nome original do arquivo
    cb(null, file.originalname);
  }
});

// Limite de 50MB por arquivo
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB em bytes
});

// Servir arquivos estáticos (HTML, CSS, JS)
app.use(express.static('public'));

// Rota principal - serve o HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Rota dinâmica para cada "sala"
app.get('/:room', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API: Listar arquivos de uma sala
app.get('/api/:room/files', (req, res) => {
  const roomName = req.params.room;
  const uploadPath = path.join(__dirname, 'uploads', roomName);
  
  // Se a pasta não existe, retorna lista vazia
  if (!fs.existsSync(uploadPath)) {
    return res.json([]);
  }
  
  // Lista todos os arquivos da sala
  fs.readdir(uploadPath, (err, files) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao listar arquivos' });
    }
    
    // Pega informações detalhadas de cada arquivo
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

// API: Upload de arquivo
app.post('/api/:room/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Nenhum arquivo enviado' });
  }
  
  res.json({ 
    success: true, 
    filename: req.file.originalname,
    size: req.file.size
  });
});

// API: Download de arquivo
app.get('/api/:room/download/:filename', (req, res) => {
  const roomName = req.params.room;
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'uploads', roomName, filename);
  
  // Verifica se o arquivo existe
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Arquivo não encontrado' });
  }
  
  // Envia o arquivo para download
  res.download(filePath, filename);
});

// API: Deletar arquivo
app.delete('/api/:room/delete/:filename', (req, res) => {
  const roomName = req.params.room;
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'uploads', roomName, filename);
  
  // Verifica se o arquivo existe
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Arquivo não encontrado' });
  }
  
  // Deleta o arquivo
  fs.unlink(filePath, (err) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao deletar arquivo' });
    }
    
    res.json({ success: true, message: 'Arquivo deletado com sucesso' });
  });
});

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`🚀 DontFile rodando em http://localhost:${PORT}`);
  console.log(`📁 Arquivos salvos em: ${path.join(__dirname, 'uploads')}`);
});