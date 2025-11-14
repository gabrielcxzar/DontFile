# DontFile

Um serviço simples, anônimo e gratuito para transferência de arquivos, inspirado no DontPad. Crie uma sala, arraste seus arquivos e compartilhe o link.

**Acesse a versão ao vivo:** [**https://dontfile.onrender.com/**](https://dontfile.onrender.com/)

---

## Funcionalidades

* **Salas Anônimas:** Crie uma sala com qualquer nome (ex: `dontfile.onrender.com/meu-projeto`) e ela é criada instantaneamente.
* **Upload Rápido:** Arraste e solte múltiplos arquivos (limite de 100MB por arquivo).
* **Sem Cadastro:** Nenhuma conta ou e-mail é necessário.
* **Feedback & Suporte:** Seção de doação via PIX (com QR Code) e link direto para e-mail de suporte.

---

## ⚠️ Atenção: Armazenamento Efêmero

Este projeto é hospedado no plano gratuito do **Render**. Isso significa que o sistema de arquivos é **efêmero**.

* **Todos os arquivos são DELETADOS** sempre que o servidor reinicia.
* Um reinício ocorre em todo `deploy` (qualquer atualização de código) ou em reinicializações automáticas de manutenção da plataforma.

**Use este serviço para transferências rápidas, não para armazenamento de longo prazo.**

---

## Tecnologias Utilizadas

O projeto é dividido em um frontend simples e um backend Node.js.

* **Backend:**
    * **Node.js**
    * **Express**: Gerenciamento das rotas e da API.
    * **Multer**: Middleware para lidar com o upload dos arquivos.
* **Frontend:**
    * HTML5, CSS3 e JavaScript (Vanilla JS).
    * **Font Awesome**: Ícones.
    * **qrcode.js**: Para geração dinâmica do QR Code do PIX no cliente.
* **Deployment:**
    * **Render**: Hospedagem do serviço web.
    * **UptimeRobot**: Utilizado para manter a instância gratuita do Render "acordada", evitando o *sleep* de 15 minutos por inatividade.

---

## Como Rodar Localmente

Para clonar e rodar este projeto na sua própria máquina:

1.  **Clone o repositório:**
    ```bash
    git clone https://[URL-DO-SEU-REPOSITORIO-GIT]
    cd dontfile-main
    ```

2.  **Instale as dependências:**
    (Você precisa ter o [Node.js](https://nodejs.org/) instalado)
    ```bash
    npm install
    ```

3.  **Inicie o servidor:**
    ```bash
    npm run dev
    ```
    *(Este comando usa o `nodemon` para reiniciar automaticamente a cada mudança)*

4.  **Acesse no seu navegador:**
    [http://localhost:3000](http://localhost:3000)

---

## Autor e Agradecimentos

Feito por **Gabriel Cézar**.

Inspirado no [dontpad.com](https://dontpad.com).
