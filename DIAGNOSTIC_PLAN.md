# 🔍 Диагностический план авторизации

## Проблема:
```
500 Error → "Неверный или истекший токен"
```

## Цепочка авторизации:
```
1. Юзер → /start в боте
2. Бот → RPC вызов generate_auth_token в Supabase
3. Supabase → Создает запись в auth_tokens
4. Бот → Отправляет ссылку с токеном
5. Фронт → Вытаскивает token из URL
6. Фронт → POST /api/auth/verify-token с токеном
7. API → Ищет токен в auth_tokens
8. API → Должен вернуть user + session
9. Фронт → Устанавливает сессию и редиректит
```

## Шаг 1: Проверим что вообще создаются токены?

Выполните этот SQL в Supabase Dashboard → SQL Editor:

```sql
-- Проверяем таблицу auth_tokens
SELECT 
  token,
  telegram_id,
  used,
  expires_at,
  created_at,
  (expires_at > NOW()) as is_not_expired,
  EXTRACT(EPOCH FROM (expires_at - NOW())) as seconds_until_expiry
FROM auth_tokens
ORDER BY created_at DESC
LIMIT 5;
```

**Ожидаем увидеть:**
- Последние 5 токенов
- У них должны быть разные telegram_id
- expires_at должны быть в будущем
- used должны быть false (пока не использованы)

---

## Шаг 2: Если токены ЕСТЬ - проверим что возвращает API

Скопируйте ЛЮБОЙ токен из результата выше (самый свежий) и вставьте сюда:

```bash
curl -v -X POST "https://outliviondashboard.vercel.app/api/auth/verify-token" \
  -H "Content-Type: application/json" \
  -d '{"token":"ВАШ_ТОКЕН_ОТСЮДА"}'
```

**Ожидаем увидеть:**
- Полный HTTP ответ
- Status 200 если успех
- Status 500 если ошибка - и ПОЧЕМУ в детали

---

## Шаг 3: Если токены НЕ создаются - проверим бот

Выполните в боте:
```
/start
```

Проверьте логи бота:
```bash
tail -50 /Users/outcasts/Documents/outlivion-dashboard/telegram-bot/bot.log
```

**Ищем:**
- Ошибки при вызове generate_auth_token
- Ошибки подключения к Supabase
- Exception при создании токена

---

## Шаг 4: Проверим саму функцию generate_auth_token

Выполните в Supabase SQL Editor:

```sql
-- Пытаемся вызвать функцию напрямую
SELECT * FROM generate_auth_token(782245481);
```

**Ожидаем:**
- JSON с success: true
- token: "какой-то UUID"
- auth_url: "ссылка"
- expires_at: timestamp

Если ошибка - значит проблема в самой функции.

---

## Чек-лист:

- [ ] Токены создаются? (Шаг 1)
- [ ] Функция работает? (Шаг 4)
- [ ] Бот не ошибается? (Шаг 3)
- [ ] API возвращает 500? (Шаг 2)
- [ ] Если 500 - какая КОНКРЕТНО ошибка в деталях?

**ОТВЕТЬТЕ на эти вопросы и я буду знать где именно проблема!**
