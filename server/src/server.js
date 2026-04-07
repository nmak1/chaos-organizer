const Koa = require('koa');
const Router = require('@koa/router');
const bodyParser = require('koa-bodyparser');
const cors = require('@koa/cors');
const serve = require('koa-static');
const WebSocket = require('ws');
const http = require('http');
const path = require('path');
const multer = require('@koa/multer');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

const app = new Koa();
const router = new Router();

// Настройка хранения файлов
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

// Middleware
app.use(cors({ origin: '*' }));
app.use(bodyParser());
app.use(serve(path.join(__dirname, '../uploads')));

// Хранилище данных в памяти
let messages = [];
let pinnedMessage = null;
let favorites = new Set();

// Функция обработки команд бота
function processBotCommand(command) {
  const cleanCommand = command.trim().toLowerCase();
  
  const responses = {
    '/time': `🕐 Текущее время: ${new Date().toLocaleString('ru-RU')}`,
    '/weather': '🌤 Прогноз погоды:\n☀️ Температура: +22°C\n💨 Ветер: 5 м/с\n💧 Влажность: 65%\n🌈 Осадки: не ожидаются',
    '/joke': '😂 Шутка дня:\n\nПочему программисты путают Хэллоуин и Рождество?\n\nПотому что 31 Oct = 25 Dec!',
    '/help': `🤖 *Доступные команды бота Chaos Organizer*\n━━━━━━━━━━━━━━━━━━━━━━\n\n⌨️ *Основные команды:*\n/time - текущее время\n/weather - прогноз погоды\n/joke - случайная шутка\n/quote - вдохновляющая цитата\n/random - случайное число\n/help - показать это сообщение\n\n📁 *Работа с файлами:*\n• Drag & Drop для загрузки\n• Клик по иконке 📎\n• Поддерживаются: фото, видео, аудио\n\n⭐ *Дополнительно:*\n• Закрепление сообщений\n• Избранное\n• Поиск по истории\n\n━━━━━━━━━━━━━━━━━━━━━━\n💡 *Совет:* Нажмите на три точки у сообщения для дополнительных действий`,
    '/quote': '💡 *Вдохновляющая цитата:*\n\n"Код — это поэзия, написанная для людей и исполняемая машинами."\n\n— Дональд Кнут',
    '/random': `🎲 *Случайное число:* ${Math.floor(Math.random() * 100)}`
  };
  
  return responses[cleanCommand] || `❓ Неизвестная команда: ${command}\n\nИспользуйте /help для просмотра всех доступных команд.`;
}

// Создание сообщения
function createMessage(content, type, username, userId, extra = {}) {
  return {
    id: uuidv4(),
    type,
    content,
    timestamp: Date.now(),
    userId,
    username,
    ...extra
  };
}

// Демо-сообщения
const demoMessages = [
  createMessage('👋 Привет! Я Chaos Bot 🤖. Напиши /help чтобы увидеть все мои команды!', 'text', 'Chaos Bot 🤖', 'bot'),
  createMessage('https://github.com - вот пример кликабельной ссылки', 'text', 'Chaos Bot 🤖', 'bot'),
  createMessage('💡 Попробуй перетащить файл в окно чата или нажать на иконку 📎', 'text', 'Chaos Bot 🤖', 'bot')
];

messages.push(...demoMessages);

// API Routes
router.get('/messages', async (ctx) => {
  const limit = parseInt(ctx.query.limit) || 10;
  const offset = parseInt(ctx.query.offset) || 0;
  
  const start = messages.length - limit - offset;
  const end = messages.length - offset;
  
  const paginatedMessages = messages.slice(Math.max(0, start), end);
  
  ctx.body = {
    messages: paginatedMessages.reverse(),
    total: messages.length,
    hasMore: start > 0
  };
});

router.post('/messages', async (ctx) => {
  const { type, content, username } = ctx.request.body;
  
  let response;
  
  // Проверяем, является ли сообщение командой для бота
  if (type === 'text' && content.trim().startsWith('/')) {
    const botResponse = processBotCommand(content);
    
    // Создаем сообщение пользователя
    const userMessage = createMessage(content, 'text', username || 'User', 'user');
    messages.push(userMessage);
    
    // Создаем ответ бота
    const botMessage = createMessage(botResponse, 'text', 'Chaos Bot 🤖', 'bot');
    messages.push(botMessage);
    
    // Отправляем оба сообщения через WebSocket
    broadcast({ type: 'new_message', message: userMessage });
    broadcast({ type: 'new_message', message: botMessage });
    
    ctx.body = userMessage;
  } else {
    // Обычное сообщение
    const message = createMessage(content, type, username || 'User', 'user');
    messages.push(message);
    ctx.body = message;
    
    // Broadcast через WebSocket
    broadcast({ type: 'new_message', message });
  }
});

router.post('/upload', upload.single('file'), async (ctx) => {
  const file = ctx.file;
  const { username } = ctx.request.body;
  
  if (!file) {
    ctx.status = 400;
    ctx.body = { error: 'No file uploaded' };
    return;
  }
  
  let type = 'file';
  if (file.mimetype.startsWith('image/')) type = 'image';
  else if (file.mimetype.startsWith('video/')) type = 'video';
  else if (file.mimetype.startsWith('audio/')) type = 'audio';
  
  const message = {
    id: uuidv4(),
    type,
    content: `/uploads/${file.filename}`,
    filename: file.originalname,
    filesize: file.size,
    mimetype: file.mimetype,
    timestamp: Date.now(),
    userId: 'user',
    username: username || 'User'
  };
  
  messages.push(message);
  ctx.body = message;
  
  broadcast({ type: 'new_message', message });
});

router.get('/download/:filename', async (ctx) => {
  const filename = ctx.params.filename;
  const filepath = path.join(__dirname, '../uploads', filename);
  
  if (fs.existsSync(filepath)) {
    ctx.attachment(filename);
    ctx.body = fs.createReadStream(filepath);
  } else {
    ctx.status = 404;
    ctx.body = { error: 'File not found' };
  }
});

router.get('/pinned', async (ctx) => {
  ctx.body = pinnedMessage || null;
});

router.post('/pinned', async (ctx) => {
  pinnedMessage = ctx.request.body;
  ctx.body = { success: true };
  
  broadcast({ type: 'pin_updated', message: pinnedMessage });
});

router.delete('/pinned', async (ctx) => {
  pinnedMessage = null;
  ctx.body = { success: true };
  
  broadcast({ type: 'pin_updated', message: null });
});

router.get('/favorites', async (ctx) => {
  const favoriteMessages = messages.filter(m => favorites.has(m.id));
  ctx.body = favoriteMessages;
});

router.post('/favorites/:id', async (ctx) => {
  const { id } = ctx.params;
  
  if (favorites.has(id)) {
    favorites.delete(id);
    ctx.body = { favorited: false };
  } else {
    favorites.add(id);
    ctx.body = { favorited: true };
  }
  
  broadcast({ type: 'favorites_updated', messageId: id, favorited: favorites.has(id) });
});

router.get('/search', async (ctx) => {
  const query = ctx.query.q?.toLowerCase() || '';
  
  if (!query) {
    ctx.body = [];
    return;
  }
  
  const results = messages.filter(m => {
    if (m.type === 'text') {
      return m.content.toLowerCase().includes(query);
    }
    return m.filename?.toLowerCase().includes(query);
  });
  
  ctx.body = results;
});

router.delete('/messages/:id', async (ctx) => {
  const { id } = ctx.params;
  messages = messages.filter(m => m.id !== id);
  favorites.delete(id);
  
  ctx.body = { success: true };
  broadcast({ type: 'message_deleted', messageId: id });
});

// Применяем маршруты
app.use(router.routes());
app.use(router.allowedMethods());

// WebSocket сервер
const server = http.createServer(app.callback());
const wss = new WebSocket.Server({ server });

const clients = new Set();

function broadcast(data) {
  const message = JSON.stringify(data);
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

wss.on('connection', (ws) => {
  console.log('🔌 New WebSocket connection');
  clients.add(ws);
  
  ws.on('message', (data) => {
    try {
      const parsed = JSON.parse(data.toString());
      console.log('📨 WebSocket message:', parsed);
      
      if (parsed.type === 'command') {
        const botResponse = processBotCommand(parsed.command);
        
        // Создаем сообщение пользователя (команда)
        const userCommandMessage = createMessage(parsed.command, 'text', 'User', 'user');
        messages.push(userCommandMessage);
        broadcast({ type: 'new_message', message: userCommandMessage });
        
        // Создаем ответ бота
        const botResponseMessage = createMessage(botResponse, 'text', 'Chaos Bot 🤖', 'bot');
        messages.push(botResponseMessage);
        broadcast({ type: 'new_message', message: botResponseMessage });
      }
    } catch (e) {
      console.error('WebSocket error:', e);
    }
  });
  
  ws.on('close', () => {
    console.log('🔌 WebSocket connection closed');
    clients.delete(ws);
  });
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`\n🚀 Chaos Organizer Server запущен на порту ${PORT}`);
  console.log(`📡 API доступен по адресу: http://localhost:${PORT}`);
  console.log(`🔌 WebSocket доступен по адресу: ws://localhost:${PORT}`);
  console.log(`\n💡 Доступные команды бота: /help, /time, /weather, /joke, /quote, /random\n`);
});