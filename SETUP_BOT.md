# 🤖 Настройка Telegram бота - Пошаговая инструкция

## ✅ Что у вас уже есть:

- ✅ Токен бота: `8477147639:AAG6Q8iTsJf0rAgw3rKOC0-4GKpjcjKUFH8`
- ✅ Supabase проект настроен
- ✅ Dashboard задеплоен на Vercel
- ✅ Код бота создан

---

## 📝 Шаг 1: Обновите URL в боте

1. Откройте файл `telegram-bot/bot.py`
2. Найдите строку 18:
   ```python
   DASHBOARD_URL = "https://your-vercel-url.vercel.app"
   ```
3. Замените на ваш реальный URL из Vercel (что-то вроде `https://outlivion-dashboard-xxx.vercel.app`)

---

## 📝 Шаг 2: Задеплойте Edge Function в Supabase

### Вариант А: Через Supabase CLI (рекомендуется)

```bash
# 1. Установите Supabase CLI
npm install -g supabase

# 2. Войдите в аккаунт
supabase login

# 3. Свяжите проект
cd /Users/outcasts/Documents/outlivion-dashboard
supabase link --project-ref ftqpccuyibzdczzowzkw

# 4. Задеплойте Edge Function
supabase functions deploy get-token --project-ref ftqpccuyibzdczzowzkw

# 5. Установите переменные окружения для функции
supabase secrets set DASHBOARD_URL=https://your-vercel-url.vercel.app --project-ref ftqpccuyibzdczzowzkw
```

### Вариант Б: Вручную через Supabase Dashboard (если CLI не работает)

Если у вас проблемы с CLI, можно **временно использовать альтернативный метод**:

1. Откройте Supabase Dashboard: https://supabase.com/dashboard/project/ftqpccuyibzdczzowzkw/sql
2. Выполните этот SQL для создания токенов напрямую:

```sql
-- Функция для генерации токена (временная замена Edge Function)
CREATE OR REPLACE FUNCTION generate_auth_token(tg_id BIGINT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_token UUID;
  expires_at TIMESTAMP WITH TIME ZONE;
  result JSON;
BEGIN
  new_token := gen_random_uuid();
  expires_at := NOW() + INTERVAL '1 hour';
  
  INSERT INTO auth_tokens (telegram_id, token, expires_at, used)
  VALUES (tg_id, new_token, expires_at, false);
  
  result := json_build_object(
    'success', true,
    'token', new_token::text,
    'auth_url', 'https://your-vercel-url.vercel.app/auth/login?token=' || new_token::text,
    'expires_at', expires_at
  );
  
  RETURN result;
END;
$$;
```

Замените `https://your-vercel-url.vercel.app` на ваш URL!

Затем обновите `bot.py` - замените секцию генерации токена (строки 33-52) на:

```python
        # Используем прямой SQL вместо Edge Function
        from supabase import create_client
        
        supabase = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
        response = supabase.rpc('generate_auth_token', {'tg_id': telegram_id}).execute()
        
        if response.data:
            data = response.data
            auth_url = data.get("auth_url")
```

И добавьте в requirements.txt:
```
supabase==2.3.0
```

---

## 📝 Шаг 3: Запустите бота

```bash
cd /Users/outcasts/Documents/outlivion-dashboard/telegram-bot

# Установите зависимости
pip3 install -r requirements.txt

# Запустите
python3 bot.py
```

---

## 🧪 Шаг 4: Протестируйте

1. Найдите своего бота в Telegram (используйте username, который вы задали при создании)
2. Отправьте `/start`
3. Нажмите на кнопку "🔐 Войти в личный кабинет"
4. Вы должны попасть в Dashboard

---

## 🎉 Команды бота

- `/start` - Получить ссылку для входа
- `/help` - Справка
- `/referral` - Реферальная ссылка
- `/support` - Поддержка

---

## 🐛 Решение проблем

### Проблема: Бот не отвечает
**Решение:**
- Проверьте, что бот запущен (`python3 bot.py`)
- Убедитесь, что токен правильный
- Проверьте интернет соединение

### Проблема: Ошибка при генерации токена
**Решение:**
- Если используете Edge Function: убедитесь, что она задеплоена
- Если используете SQL функцию: проверьте, что функция создана
- Проверьте логи бота

### Проблема: Ссылка не работает
**Решение:**
- Убедитесь, что `DASHBOARD_URL` правильный в bot.py
- Проверьте, что таблица `auth_tokens` существует в Supabase
- Проверьте, что токен создался в БД

---

## 🚀 Деплой бота на сервер (опционально)

### Локально (для теста):
```bash
python3 bot.py
```

### На сервере с PM2:
```bash
npm install -g pm2
pm2 start bot.py --name outlivion-bot --interpreter python3
pm2 save
pm2 startup
```

### В Docker:
```bash
docker build -t outlivion-bot telegram-bot/
docker run -d --name outlivion-bot --restart always outlivion-bot
```

---

## 📊 Проверка работы

Откройте Supabase и проверьте таблицу `auth_tokens`:
```sql
SELECT * FROM auth_tokens ORDER BY created_at DESC LIMIT 10;
```

После использования команды `/start` должна появиться новая запись.

---

## ✅ Финальный чеклист

- [ ] URL обновлен в bot.py
- [ ] Edge Function задеплоена (или SQL функция создана)
- [ ] Зависимости установлены
- [ ] Бот запущен
- [ ] Тест: команда /start работает
- [ ] Тест: переход в Dashboard работает
- [ ] Тест: авторизация проходит успешно

---

**Поздравляем! Ваш Telegram бот готов! 🎉**

Теперь пользователи могут авторизоваться через Telegram и использовать ваш VPN Dashboard!

