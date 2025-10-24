#!/bin/bash
# Скрипт для быстрого запуска бота

cd "$(dirname "$0")"

echo "🤖 Запуск Outlivion Bot..."
echo ""

# Проверка Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 не установлен!"
    exit 1
fi

# Установка зависимостей
echo "📦 Установка зависимостей..."
pip3 install -r requirements.txt --quiet

echo ""
echo "✅ Зависимости установлены!"
echo "🚀 Запуск бота..."
echo ""

# Запуск бота
python3 bot.py

