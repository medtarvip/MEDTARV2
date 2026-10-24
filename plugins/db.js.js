let handler = async (m, { conn, text, usedPrefix, command }) => {
  // تنظيف المدخلات وإزالة أي مسافات أو رموز زائدة مثل +
  let input = text || (m.quoted ? m.quoted.sender : '')
  input = input.replace(/[^0-9]/g, '') // إبقاء الأرقام فقط

  if (!input) {
    return m.reply(`📸 أرجو إدخال رقم الهاتف أو الرد على رسالة الشخص.\nمثال:\n*${usedPrefix + command} 22242203253*`)
  }

  // تحويل الرقم إلى الصيغة الصحيحة لـ WhatsApp JID
  let jid = input + '@s.whatsapp.net'

  try {
    await m.reply('⏳ جاري البحث عن صورة البروفايل...')

    // جلب رابط صورة البروفايل بجودة عالية (أو 'preview' للصورة المصغرة)
    let ppUrl = await conn.profilePictureUrl(jid, 'image').catch(() => null)

    if (!ppUrl) {
      return m.reply('❌ عذراً، هذا الشخص ليس لديه صورة بروفايل أو أن إعدادات الخصوصية لديه تحجبها.')
    }

    // إرسال الصورة مع رسالة توضيحية
    await conn.sendMessage(m.chat, {
      image: { url: ppUrl },
      caption: `👤 *صورة البروفايل للرقم:*\n+${input}`
    }, { quoted: m })

  } catch (err) {
    console.error('❌ خطأ في جلب صورة البروفايل:', err)
    m.reply(`❌ حدث خطأ أثناء محاولة جلب الصورة: ${err.message}`)
  }
}

handler.help = ['db <رقم>']
handler.command = ['db', 'getpp', 'profile']
handler.tags = ['tools']

export default handler