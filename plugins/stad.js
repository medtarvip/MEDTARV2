let handler = async (m, { conn, text, usedPrefix, command }) => {
  try {
    // 1. التحقق من الرد على رسالة
    let q = m.quoted ? m.quoted : m
    let mime = (q.msg || q).mimetype || ''

    if (!mime.includes('image') && !mime.includes('audio') && !mime.includes('ptt')) {
      return m.reply(`⚠️ *يرجى الرد على (صورة) أو (ملف صوتي/بصمة) مع كتابة النص المطلوب!*\n\n*مثال:* \n${usedPrefix + command} هذا هو نص الحالة الجديد`)
    }

    let captionText = text || q.text || '✨ حالة جديدة'

    m.reply('🔄 *جاري تجهيز ونشر الحالة...*')

    // 2. تحميل الوسائط
    let mediaBuffer = await q.download ? await q.download() : await conn.downloadMediaMessage(q)

    if (!mediaBuffer) {
      return m.reply('❌ فشل تحميل الملف من الرسالة. تأكد من أن الوسائط حديثة.')
    }

    // 3. تجهيز قائمة الأرقام (ضروري جداً لتظهر الحالة عند المشتركين أو المالك)
    let chats = Object.keys(conn.chats || {})
    let jids = chats.filter(v => v.endsWith('@s.whatsapp.net'))
    if (jids.length === 0) {
      jids = [conn.user.jid]
    }

    let mediaContent = {}

    // 4. بناء محتوى الوسائط بالشكل الصحيح تماماً لحالات البث
    if (mime.includes('image')) {
      mediaContent = {
        image: mediaBuffer,
        caption: captionText
      }
    } else if (mime.includes('audio') || mime.includes('ptt')) {
      mediaContent = {
        audio: mediaBuffer,
        mimetype: 'audio/mp4',
        ptt: true
      }
    }

    // 5. الإرسال بالطريقة القياسية المعتمدة للبث مع تحديد statusJidList فقط
    await conn.sendMessage('status@broadcast', mediaContent, {
      statusJidList: jids
    })

    return m.reply(`✅ *تم نشر الحالة بنجاح!*\n📝 *النص المرفق:* ${captionText}`)

  } catch (err) {
    console.error('❌ خطأ في أمر نشر الحالة:', err)
    return m.reply(`❌ حدث خطأ أثناء نشر الحالة:\n\`\`\`${err.message}\`\`\``)
  }
}

handler.help = ['stad <النص>', 'status <النص>']
handler.command = ['stad', 'status', 'حالة']
handler.tags = ['owner', 'tools']
handler.rowner = true 

export default handler