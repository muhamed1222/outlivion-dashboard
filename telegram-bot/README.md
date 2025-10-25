# Outlivion Telegram Bot

Бот для авторизации пользователей в Dashboard через Telegram.

## 🚀 Установка и запуск

### 1. Установите Python 3.8+

Убедитесь, что Python установлен:
```bash
python3 --version
```

### 2. Установите зависимости

```bash
cd telegram-bot
pip3 install -r requirements.txt
```

### 3. Настройте переменные окружения

Создайте файл `.env` рядом с `bot.py` или экспортируйте переменные перед запуском:
```bash
export TELEGRAM_BOT_TOKEN=your_bot_token
export TELEGRAM_BOT_SUPABASE_URL=https://<project-ref>.supabase.co
export TELEGRAM_BOT_SUPABASE_SERVICE_KEY=your_service_role_key
export TELEGRAM_BOT_DASHBOARD_URL=https://your-vercel-url.vercel.app
```

### 4. Запустите бота

```bash
python3 bot.py
```

Вы должны увидеть:
```
Starting Outlivion Bot...
Bot is ready! Starting polling...
```

## 📝 Доступные команды

- `/start` - Получить ссылку для входа в личный кабинет
- `/help` - Справка по командам
- `/referral` - Получить реферальную ссылку
- `/support` - Связаться с поддержкой

## 🔧 Настройка Edge Function

Перед запуском бота нужно задеплоить Edge Function в Supabase:

```bash
# Установите Supabase CLI
npm install -g supabase

# Войдите в аккаунт
supabase login

# Свяжите проект
supabase link --project-ref <project-ref>

# Задеплойте функцию
supabase functions deploy get-token --project-ref <project-ref>

# Установите переменную окружения
supabase secrets set DASHBOARD_URL=https://your-vercel-url.vercel.app --project-ref <project-ref>
```

## 🐳 Запуск в Docker (опционально)

Создайте `Dockerfile`:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY bot.py .

CMD ["python", "bot.py"]
```

Запустите:
```bash
docker build -t outlivion-bot .
docker run -d --name outlivion-bot outlivion-bot
```

## 🌐 Деплой на сервер

### Вариант 1: PM2 (Node.js процесс-менеджер)

```bash
# Установите PM2
npm install -g pm2

# Запустите бота
pm2 start bot.py --name outlivion-bot --interpreter python3

# Автозапуск при перезагрузке
pm2 startup
pm2 save
```

### Вариант 2: systemd (Linux)

Создайте файл `/etc/systemd/system/outlivion-bot.service`:

```ini
[Unit]
Description=Outlivion Telegram Bot
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/telegram-bot
ExecStart=/usr/bin/python3 /path/to/telegram-bot/bot.py
Restart=always

[Install]
WantedBy=multi-user.target
```

Запустите:
```bash
sudo systemctl daemon-reload
sudo systemctl enable outlivion-bot
sudo systemctl start outlivion-bot
sudo systemctl status outlivion-bot
```

## 📊 Логи

Просмотр логов в PM2:
```bash
pm2 logs outlivion-bot
```

Просмотр логов в systemd:
```bash
journalctl -u outlivion-bot -f
```

## 🔒 Безопасность

⚠️ **Важно:**
- Никогда не публикуйте `BOT_TOKEN` в публичных репозиториях
- Используйте переменные окружения для токенов
- Регулярно обновляйте зависимости

## 🧪 Тестирование

1. Найдите бота в Telegram: `@your_bot_name`
2. Отправьте `/start`
3. Нажмите кнопку "Войти в личный кабинет"
4. Проверьте авторизацию в Dashboard

## 📞 Поддержка

Если бот не работает:
1. Проверьте логи
2. Убедитесь, что Edge Function задеплоена
3. Проверьте переменные окружения
4. Убедитесь, что Supabase доступен

## 🎉 Готово!

Ваш Telegram бот готов к работе!
