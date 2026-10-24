let handler = async (m, { conn, usedPrefix, command }) => {
  // التحقق مما إذا كان المستخدم قد رد على رسالة (حالة أو ستوري)
  if (!m.quoted) {
    return m.reply(`📥 يرجى الرد على حالة واتساب (صورة أو فيديو) مع كتابة الأمر: *${usedPrefix + command}*`)
  }

  try {
    await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } })

    // تحميل الوسائط من الرسالة المُرتد عليها (صورة أو فيديو)
    const mediaBuffer = await m.quoted.download()
    
    if (!mediaBuffer) {
      return m.reply('❌ لم يتم العثور على محتوى وسائط صالح في هذه الرسالة.')
    }

    const mime = m.quoted.mimetype || ''

    // التحقق من نوع الوسائط وإرسالها
    if (/image/.test(mime)) {
      await conn.sendMessage(m.chat, {
        image: mediaBuffer,
        caption: '📥 *تم تحميل الحالة (صورة) بنجاح!*'
      }, { quoted: m })
    } else if (/video/.test(mime)) {
      await conn.sendMessage(m.chat, {
        video: mediaBuffer,
        caption: '📥 *تم تحميل الحالة (فيديو) بنجاح!*'
      }, { quoted: m })
    } else {
      await m.reply('❌ نوع الوسائط غير مدعوم، يرجى الرد على صورة أو فيديو فقط.')
    }

  } catch (err) {
    console.error('❌ خطأ في تحميل الحالة:', err)
    await m.reply(`❌ حدث خطأ أثناء تحميل الحالة: ${err.message}`)
  }
}

handler.help = ['gsts']
handler.command = ['gsts', 'savestatus', 'حالة']
handler.tags = ['download']

export default handler