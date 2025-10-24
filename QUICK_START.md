# 🚀 Быстрый старт - Последний шаг!

## ⚡ Автоматическая настройка БД (1 команда!)

### Шаг 1: Получите пароль от Supabase

1. Откройте: https://supabase.com/dashboard/project/ftqpccuyibzdczzowzkw/settings/database
2. Прокрутите до раздела **"Connection string"**
3. Нажмите **"Reset database password"** (если пароль не видно)
4. **Скопируйте пароль**

### Шаг 2: Запустите автоустановку

```bash
cd /Users/outcasts/Documents/outlivion-dashboard
python3 auto_setup.py YOUR_PASSWORD_HERE
```

Замените `YOUR_PASSWORD_HERE` на пароль из шага 1.

### Шаг 3: Запустите бота

После успешной настройки БД:

```bash
cd telegram-bot
python3 bot.py
```

## ✅ Готово!

Теперь:
1. Откройте Telegram
2. Найдите вашего бота
3. Отправьте `/start`
4. Нажмите кнопку "Войти в личный кабинет"

---

## 🔧 Альтернативный способ (через переменную окружения)

```bash
cd /Users/outcasts/Documents/outlivion-dashboard
SUPABASE_DB_PASSWORD=your_password python3 auto_setup.py
```

---

## ❓ Что делает скрипт?

✅ Устанавливает зависимости (psycopg2)  
✅ Подключается к Supabase PostgreSQL  
✅ Создаёт все таблицы (users, plans, codes, и т.д.)  
✅ Добавляет тарифы (1 мес, 3 мес, 12 мес)  
✅ Создаёт функцию generate_auth_token  
✅ Проверяет результат  

---

## 🐛 Если что-то пошло не так

### Ошибка подключения
- Проверьте пароль
- Убедитесь, что база данных активна в Supabase

### Ошибка "table already exists"
- Это нормально! Таблицы уже созданы
- Скрипт использует `CREATE TABLE IF NOT EXISTS`

### Другие ошибки
- Посмотрите логи выше
- Или свяжитесь с поддержкой

---

**Один шаг от запуска! 🚀**

