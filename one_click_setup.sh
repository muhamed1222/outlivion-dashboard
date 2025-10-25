#!/bin/bash
# Автоматическая настройка БД в один клик!

echo "🚀 Автоматическая настройка Supabase..."
echo ""

PROJECT_REF="${SUPABASE_PROJECT_REF:-<project-ref>}"
SQL_FILE="$(dirname "$0")/supabase/complete_setup.sql"

# Копируем SQL в буфер обмена
if command -v pbcopy >/dev/null 2>&1; then
  cat "$SQL_FILE" | pbcopy
  echo "✅ SQL скопирован в буфер обмена!"
else
  echo "ℹ️  Скопируйте SQL вручную: $SQL_FILE"
fi

echo ""
echo "🌐 Открываю Supabase SQL Editor..."

# Открываем браузер
open "https://supabase.com/dashboard/project/${PROJECT_REF}/sql/new"

sleep 2

echo ""
echo "================================================================================"
echo "📋 ОСТАЛОСЬ СДЕЛАТЬ:"
echo "================================================================================"
echo ""
echo "1. ✅ SQL уже в буфере обмена"
echo "2. 📝 Нажмите Cmd+V в SQL Editor"  
echo "3. ▶️  Нажмите кнопку RUN (справа внизу)"
echo "4. ⏳ Дождитесь 'Success'"
echo ""
echo "🤖 После этого бот готов к работе!"
echo ""
