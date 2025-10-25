#!/usr/bin/env python3
"""
Outlivion Telegram Bot
Бот для авторизации пользователей в Dashboard
"""

import os
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


def _require_env(var_name: str) -> str:
    value = os.getenv(var_name)
    if not value:
        raise RuntimeError(f"Environment variable {var_name} is not set")
    return value


# Конфигурация
BOT_TOKEN = _require_env("TELEGRAM_BOT_TOKEN")
SUPABASE_URL = os.getenv("TELEGRAM_BOT_SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("TELEGRAM_BOT_SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_SERVICE_ROLE_KEY")
DASHBOARD_URL = os.getenv("TELEGRAM_BOT_DASHBOARD_URL") or os.getenv("NEXT_PUBLIC_APP_URL")
SUPPORT_URL = os.getenv("TELEGRAM_SUPPORT_URL") or os.getenv("NEXT_PUBLIC_SUPPORT_URL") or "https://t.me/outlivion_support"

if not SUPABASE_URL:
    raise RuntimeError("Environment variable TELEGRAM_BOT_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL is not set")
if not SUPABASE_SERVICE_KEY:
    raise RuntimeError("Environment variable TELEGRAM_BOT_SUPABASE_SERVICE_KEY or SUPABASE_SERVICE_ROLE_KEY is not set")
if not DASHBOARD_URL:
    raise RuntimeError("Environment variable TELEGRAM_BOT_DASHBOARD_URL or NEXT_PUBLIC_APP_URL is not set")


def create_supabase_client() -> Client:
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


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

    try:
        supabase_client = create_supabase_client()
        response = supabase_client.rpc('generate_auth_token', {'tg_id': telegram_id}).execute()

        if response.data:
            data = response.data
            auth_url = data.get("auth_url") or f"{DASHBOARD_URL.rstrip('/')}/auth/login?token={data.get('token')}"

            if referrer_id and referrer_id != telegram_id:
                save_referral(supabase_client, telegram_id, referrer_id)

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
    except Exception as e:
        logger.error(f"Error in start command: {e}")
        await update.message.reply_text(
            "❌ Произошла ошибка. Попробуйте еще раз или обратитесь в поддержку."
        )


def save_referral(supabase_client: Client, referred_id: int, referrer_id: int):
    """Сохранение реферала в базу данных"""
    try:
        response = supabase_client.table('users').select('id').eq('telegram_id', referrer_id).limit(1).execute()
        if response.data:
            logger.info(f"Referral saved: {referrer_id} -> {referred_id}")
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
        [InlineKeyboardButton("💬 Написать в поддержку", url=SUPPORT_URL)]
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

    app = Application.builder().token(BOT_TOKEN).build()

    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("help", help_command))
    app.add_handler(CommandHandler("referral", referral_command))
    app.add_handler(CommandHandler("support", support_command))

    app.add_error_handler(error_handler)

    logger.info("Bot is ready! Starting polling...")

    app.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    main()
