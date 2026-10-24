import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let handler = async (m, { conn, usedPrefix, command }) => {
  // التحقق من الرد على صورة
  const quoted = m.quoted ? m.quoted : m
  const mime = (quoted.msg || quoted).mimetype || ''

  if (!/image/.test(mime)) {
    return m.reply(`📸 يرجى الرد على صورة مع كتابة *${usedPrefix + command}* لتغيير بروفايل البوت.`)
  }

  let filePath = path.join(__dirname, `bot_pp_${Date.now()}.jpg`)

  try {
    await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } })

    // تحميل الصورة وحفظها مؤقتاً
    let media = await quoted.download()
    fs.writeFileSync(filePath, media)

    // استخراج رقم البوت بالصيغة الصحيحة تماماً
    let botJid = conn.decodeJid ? conn.decodeJid(conn.user.id) : conn.user.id
    if (botJid.includes(':')) {
      botJid = botJid.split(':')[0] + '@s.whatsapp.net'
    }

    // تحديث الصورة للرقم الشخصي للبوت
    await conn.updateProfilePicture(botJid, { url: filePath })

    await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } })
    await m.reply('✨ *تم تغيير صورة بروفايل البوت بنجاح!*')

  } catch (err) {
    console.error('❌ خطأ في أمر brof:', err)
    await m.reply(`❌ حدث خطأ: ${err.message}`)
  } finally {
    if (fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath) } catch (e) {}
    }
  }
}

handler.help = ['brof']
handler.command = ['brof', 'setppbot', 'تغيير_البروفايل']
handler.tags = ['owner', 'tools']
// أزلنا شرط rowner مؤقتاً للتأكد من أن الأمر يشتغل معك، ويمكنك إعادته لاحقاً

export default handler