#!/usr/bin/env python3
"""
Настройка базы данных через Supabase REST API
Без необходимости пароля PostgreSQL!
"""

import requests
import json

SUPABASE_URL = "https://ftqpccuyibzdczzowzkw.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0cXBjY3V5aWJ6ZGN6em93emt3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTMzMzQwMywiZXhwIjoyMDc2OTA5NDAzfQ.SUE6yANk72zYF9c3m-HQqHSE2HXqq200_yMxuaaq1ko"

print("=" * 80)
print("🚀 СОЗДАНИЕ SQL ФАЙЛА ДЛЯ ИМПОРТА")
print("=" * 80)
print()

# Создаём единый SQL файл со всем необходимым
full_sql = open('/Users/outcasts/Documents/outlivion-dashboard/supabase/schema.sql', 'r').read()
function_sql = open('/Users/outcasts/Documents/outlivion-dashboard/supabase/generate_token_function.sql', 'r').read()

complete_sql = full_sql + "\n\n" + function_sql

# Сохраняем в файл для импорта
output_file = '/Users/outcasts/Documents/outlivion-dashboard/supabase/complete_setup.sql'
with open(output_file, 'w') as f:
    f.write(complete_sql)

print(f"✅ SQL файл создан: {output_file}")
print()
print("=" * 80)
print("📋 ИНСТРУКЦИЯ ПО ИМПОРТУ")
print("=" * 80)
print()
print("1. Откройте Supabase SQL Editor:")
print("   https://supabase.com/dashboard/project/ftqpccuyibzdczzowzkw/sql/new")
print()
print("2. Скопируйте содержимое файла:")
print(f"   cat {output_file}")
print()
print("3. Вставьте в SQL Editor и нажмите RUN")
print()
print("4. Дождитесь сообщения 'Success'")
print()
print("=" * 80)
print()
print("🤖 После этого запустите бота:")
print("   cd telegram-bot && python3 bot.py")
print()
print("=" * 80)
print()

# Выводим SQL для копирования
print("📄 ИЛИ СКОПИРУЙТЕ ЭТОТ SQL ПРЯМО СЕЙЧАС:")
print("=" * 80)
print()
print(complete_sql)
print()
print("=" * 80)

