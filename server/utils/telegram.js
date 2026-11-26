export async function enviarMensajeTelegram(texto, { chatId, token } = {}) {
  const botToken = token || process.env.TELEGRAM_BOT_TOKEN;
  const destinosRaw = chatId || process.env.TELEGRAM_CHAT_ID || '';
  const destinos = destinosRaw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  if (!botToken) {
    throw new Error('Falta TELEGRAM_BOT_TOKEN en las variables de entorno del servidor');
  }
  if (destinos.length === 0) {
    throw new Error('Falta TELEGRAM_CHAT_ID en las variables de entorno del servidor');
  }

  const resultados = [];
  for (const id of destinos) {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: id,
        text: texto,
        parse_mode: 'HTML',
        disable_web_page_preview: true
      })
    });

    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.ok) {
      throw new Error(data?.description || `Error de Telegram (${res.status}) al enviar a ${id}`);
    }
    resultados.push({ chatId: id, messageId: data.result?.message_id });
  }

  return resultados;
}
