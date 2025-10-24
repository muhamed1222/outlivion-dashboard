#!/bin/bash
# Автоматическая настройка БД в один клик!

echo "🚀 Автоматическая настройка Supabase..."
echo ""

# Копируем SQL в буфер обмена
cat /Users/outcasts/Documents/outlivion-dashboard/supabase/complete_setup.sql | pbcopy

echo "✅ SQL скопирован в буфер обмена!"
echo ""
echo "🌐 Открываю Supabase SQL Editor..."

# Открываем браузер
open "https://supabase.com/dashboard/project/ftqpccuyibzdczzowzkw/sql/new"

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

