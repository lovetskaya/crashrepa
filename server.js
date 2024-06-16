const express = require("express");
const fs = require("fs");
const needle = require("needle");
const http = require("http");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const filePath = "keywords.json";

app.use(express.static(__dirname + "/static"));

app.get("/", function (req, res) {
  res.sendFile(__dirname + "/static/index.html");
});

app.get("/api/keywords", function (req, res) {
  const content = fs.readFileSync(filePath, "utf8");
  const keywords = JSON.parse(content);
  res.send(keywords);
});

app.get("/api/keywords/:keyword", function (req, res) {
  const keyword = req.params.keyword;
  const content = fs.readFileSync(filePath, "utf8");
  const keywords = JSON.parse(content);
  let urls = null;
  for (let i = 0; i < keywords.length; i++) {
    if (keywords[i].keyword == keyword) {
      urls = keywords[i].urls;
      break;
    }
  }
  if (urls) {
    res.send(urls);
  } else {
    res.status(404).send("Запрос не найден");
  }
});

app.get("/api/:keyword/:url", async function (req, res) {
  const keyword = req.params.keyword;
  const url = req.params.url;
  const content = fs.readFileSync(filePath, "utf8");
  const keywords = JSON.parse(content);
  let urls = null;
  for (let i = 0; i < keywords.length; i++) {
    if (keywords[i].keyword == keyword) {
      urls = keywords[i].urls;
      break;
    }
  }
  const response = await needle("get", urls[url]);
  const page = response.body;
  res.set({ "content-type": "application/json; charset=utf-8" });
  res.send(JSON.stringify(page));
});

// Функция для отправки данных о прогрессе загрузки через WebSocket
function sendProgress(ws, progress) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(progress));
  }
}

// Обработчик подключения WebSocket
wss.on('connection', function connection(ws) {
  console.log('Клиент подключен');
  
  // Сохраняем ссылку на ws в app.locals для последующего использования
  app.locals.ws = ws;

  ws.on('message', function incoming(message) {
    console.log('получено сообщение: %s', message);
  });

  ws.on('close', function close() {
    console.log('Клиент отключен');
  });
});

app.get('/download', function(req, res) {
  // Получаем ссылку на ws из app.locals
  const ws = app.locals.ws;

  // Отправляем данные о прогрессе загрузки
  sendProgress(ws, { progress: 50 }); // Пример отправки прогресса 50%
});

server.listen(3000, function() {
  console.log('Сервер запущен на порту 3000');
});
