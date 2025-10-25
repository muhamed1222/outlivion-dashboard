#!/usr/bin/env python3
"""
Настройка базы данных через Supabase REST API
Без необходимости пароля PostgreSQL!
"""

import os
from pathlib import Path

SUPABASE_URL = os.getenv("TELEGRAM_BOT_SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL", "")
PROJECT_REF = os.getenv("SUPABASE_PROJECT_REF")

if not PROJECT_REF and SUPABASE_URL:
    try:
        PROJECT_REF = SUPABASE_URL.replace("https://", "").split(".")[0]
    except IndexError:
        PROJECT_REF = "<your-project-ref>"
elif not PROJECT_REF:
    PROJECT_REF = "<your-project-ref>"

print("=" * 80)
print("🚀 СОЗДАНИЕ SQL ФАЙЛА ДЛЯ ИМПОРТА")
print("=" * 80)
print()

# Создаём единый SQL файл со всем необходимым
base_dir = Path(__file__).resolve().parent
schema_path = base_dir / 'supabase' / 'schema.sql'
function_path = base_dir / 'supabase' / 'generate_token_function.sql'

full_sql = schema_path.read_text()
function_sql = function_path.read_text()

complete_sql = full_sql + "\n\n" + function_sql

# Сохраняем в файл для импорта
output_file = base_dir / 'supabase' / 'complete_setup.sql'
output_file.write_text(complete_sql)

print(f"✅ SQL файл создан: {output_file}")
print()
print("=" * 80)
print("📋 ИНСТРУКЦИЯ ПО ИМПОРТУ")
print("=" * 80)
print()
print("1. Откройте Supabase SQL Editor:")
print(f"   https://supabase.com/dashboard/project/{PROJECT_REF}/sql/new")
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
