#!/usr/bin/env python3
"""
Outlivion Telegram Bot
Бот для авторизации пользователей в Dashboard
"""

import os
import requests
import logging
from supabase import create_client, Client
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, ContextTypes

# Настройка логирования
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# Конфигурация
BOT_TOKEN = "8477147639:AAG6Q8iTsJf0rAgw3rKOC0-4GKpjcjKUFH8"
SUPABASE_URL = "https://ftqpccuyibzdczzowzkw.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0cXBjY3V5aWJ6ZGN6em93emt3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzMzM0MDMsImV4cCI6MjA3NjkwOTQwM30.nOjm7wqBUHJQ1-1lX6OpsauHP56SiokB7haiC0sxW7g"
DASHBOARD_URL = "https://outliviondashboard.vercel.app"  # Замените на ваш URL


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обработчик команды /start"""
    user = update.effective_user
    telegram_id = user.id
    username = user.username or user.first_name
    
    logger.info(f"User {username} ({telegram_id}) started the bot")
    
    # Проверяем реферальный параметр
    referrer_id = None
    if context.args:
        try:
            referrer_id = int(context.args[0])
            logger.info(f"Referral detected: {referrer_id}")
        except ValueError:
            pass
    
    # Генерируем токен через SQL функцию в Supabase
    try:
        supabase_client: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
        response = supabase_client.rpc('generate_auth_token', {'tg_id': telegram_id}).execute()
        
        if response.data:
            data = response.data
            auth_url = data.get("auth_url")
            
            # Если есть реферер, сохраняем его
            if referrer_id and referrer_id != telegram_id:
                save_referral(telegram_id, referrer_id)
            
            # Создаём кнопку для входа
            keyboard = [
                [InlineKeyboardButton("🔐 Войти в личный кабинет", url=auth_url)]
            ]
            reply_markup = InlineKeyboardMarkup(keyboard)
            
            welcome_message = (
                f"👋 Добро пожаловать, {username}!\n\n"
                f"🔐 Для входа в личный кабинет Outlivion нажмите кнопку ниже.\n\n"
                f"⏱ Ссылка действительна 1 час.\n\n"
                f"После входа вы сможете:\n"
                f"• 💰 Управлять балансом\n"
                f"• 📊 Следить за подпиской\n"
                f"• 🎟️ Активировать промокоды\n"
                f"• 👥 Приглашать друзей и получать бонусы"
            )
            
            await update.message.reply_text(
                welcome_message,
                reply_markup=reply_markup
            )
        else:
            logger.error(f"Failed to generate token: {response}")
            await update.message.reply_text(
                "❌ Ошибка при генерации ссылки для входа.\n"
                "Попробуйте еще раз через минуту или обратитесь в поддержку."
            )
    
    except requests.exceptions.Timeout:
        logger.error("Request timeout")
        await update.message.reply_text(
            "⏱ Превышено время ожидания.\n"
            "Попробуйте еще раз через минуту."
        )
    except Exception as e:
        logger.error(f"Error in start command: {e}")
        await update.message.reply_text(
            "❌ Произошла ошибка. Попробуйте еще раз или обратитесь в поддержку."
        )


def save_referral(referred_id: int, referrer_id: int):
    """Сохранение реферала в базу данных"""
    try:
        # Сначала получаем ID пользователей из базы
        # Реферер
        ref_response = requests.get(
            f"{SUPABASE_URL}/rest/v1/users",
            params={"telegram_id": f"eq.{referrer_id}", "select": "id"},
            headers={
                "apikey": SUPABASE_ANON_KEY,
                "Authorization": f"Bearer {SUPABASE_ANON_KEY}"
            },
            timeout=5
        )
        
        if ref_response.status_code == 200 and ref_response.json():
            referrer_user_id = ref_response.json()[0]["id"]
            
            # Приглашенный (создастся автоматически при первом входе)
            # Здесь мы просто логируем, что реферал был
            logger.info(f"Referral saved: {referrer_id} -> {referred_id}")
            
            # Реферал будет создан в базе при первой активации кода
            # через API Route /api/code/activate
    except Exception as e:
        logger.error(f"Error saving referral: {e}")


async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обработчик команды /help"""
    help_text = (
        "📱 <b>Доступные команды:</b>\n\n"
        "/start - Получить ссылку для входа в личный кабинет\n"
        "/help - Показать эту справку\n"
        "/referral - Получить реферальную ссылку\n"
        "/support - Связаться с поддержкой\n\n"
        "❓ <b>Часто задаваемые вопросы:</b>\n\n"
        "• Как пополнить баланс?\n"
        "  Войдите в личный кабинет и выберите раздел 'Пополнить'\n\n"
        "• Как активировать промокод?\n"
        "  В личном кабинете откройте раздел 'Активация'\n\n"
        "• Как пригласить друга?\n"
        "  Используйте команду /referral для получения персональной ссылки"
    )
    
    await update.message.reply_text(help_text, parse_mode='HTML')


async def referral_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обработчик команды /referral"""
    user = update.effective_user
    telegram_id = user.id
    
    # Генерируем реферальную ссылку
    bot_username = context.bot.username
    referral_link = f"https://t.me/{bot_username}?start={telegram_id}"
    
    referral_text = (
        "👥 <b>Реферальная программа</b>\n\n"
        "Приглашайте друзей и получайте <b>50 ₽</b> за каждого!\n\n"
        "📎 Ваша реферальная ссылка:\n"
        f"<code>{referral_link}</code>\n\n"
        "💰 <b>Как это работает:</b>\n"
        "1. Отправьте ссылку другу\n"
        "2. Друг регистрируется и активирует первый код\n"
        "3. Вы получаете 50 ₽ на баланс!\n\n"
        "Количество приглашений не ограничено 🎉"
    )
    
    await update.message.reply_text(referral_text, parse_mode='HTML')


async def support_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обработчик команды /support"""
    keyboard = [
        [InlineKeyboardButton("💬 Написать в поддержку", url="https://t.me/outlivion_support")]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    support_text = (
        "🆘 <b>Поддержка Outlivion</b>\n\n"
        "Если у вас возникли вопросы или проблемы, "
        "наша команда поддержки всегда готова помочь!\n\n"
        "⏰ Время ответа: обычно в течение 1 часа\n"
        "🕐 Работаем: 24/7"
    )
    
    await update.message.reply_text(
        support_text,
        reply_markup=reply_markup,
        parse_mode='HTML'
    )


async def error_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обработчик ошибок"""
    logger.error(f"Update {update} caused error {context.error}")


def main():
    """Запуск бота"""
    logger.info("Starting Outlivion Bot...")
    
    # Создаём приложение
    app = Application.builder().token(BOT_TOKEN).build()
    
    # Регистрируем обработчики команд
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("help", help_command))
    app.add_handler(CommandHandler("referral", referral_command))
    app.add_handler(CommandHandler("support", support_command))
    
    # Регистрируем обработчик ошибок
    app.add_error_handler(error_handler)
    
    logger.info("Bot is ready! Starting polling...")
    
    # Запускаем бота
    app.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    main()

