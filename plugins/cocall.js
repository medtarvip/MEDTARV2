import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const statusFile = path.join(__dirname, 'anticall_status.json')

// دالة قراءة الحالة
function getAntiCallStatus() {
  if (!fs.existsSync(statusFile)) {
    fs.writeFileSync(statusFile, JSON.stringify({ active: true }))
  }
  let data = JSON.parse(fs.readFileSync(statusFile))
  return data.active
}

// دالة كتابة الحالة
function setAntiCallStatus(status) {
  fs.writeFileSync(statusFile, JSON.stringify({ active: status }))
}

// 1. أمر التحكم عبر الشات (.cocall on/off)
let handler = async (m, { conn, args, usedPrefix, command }) => {
  let action = args[0] ? args[0].toLowerCase() : ''

  if (action === 'on') {
    setAntiCallStatus(true)
    return m.reply('🛡️ *تم تفعيل مانع المكالمات (Anti-Call) بنجاح!*\nسيرفض البوت أي مكالمة واردة فوراً.')
  } else if (action === 'off') {
    setAntiCallStatus(false)
    return m.reply('🔓 *تم إيقاف مانع المكالمات!*\nسيقبل البوت المكالمات الآن بشكل طبيعي.')
  } else {
    return m.reply(`⚙️ *التحكم في مانع المكالمات:*\n\n*الاستخدام:*\n• *${usedPrefix + command} on* (لتفعيل الرفض التلقائي)\n• *${usedPrefix + command} off* (لإيقاف الرفض)\n\nالحالة الحالية: ${getAntiCallStatus() ? '🟢 (مفعل)' : '🔴 (متوقف)'}`)
  }
}

handler.help = ['cocall <on/off>']
handler.command = ['cocall']
handler.tags = ['owner', 'tools']
handler.rowner = true

export default handler

// 2. كود الاستماع للمكالمات (يعمل تلقائياً في الخلفية ويرفضها مع إرسال الرسالة المزخرفة)
if (global.conn) {
  global.conn.ev.on('call', async (json) => {
    if (!getAntiCallStatus()) return // إذا كانت الميزة متوقفة، لا تفعل شيئاً

    for (let call of json) {
      if (call.status === 'offer') {
        try {
          // رفض المكالمة
          await global.conn.rejectCall(call.id, call.from)
          
          // تنسيق رقم المتصل
          let remoteJid = call.chat || call.from
          if (!remoteJid.endsWith('@s.whatsapp.net')) {
            remoteJid = remoteJid.includes('@') ? remoteJid : remoteJid + '@s.whatsapp.net'
          }

          // إرسال الرسالة المزخرفة
          await global.conn.sendMessage(remoteJid, { 
            text: '⚠️ *عـذراً، هـذا الـرقـم مـخـصـص لـبـوت وكـالـة [ 𝐊𝐀𝐈𝐓𝐎 𝐊𝐃 ] ولا يـقـبـل الـمـكـالـمـات الـصـوتـيـة أو الـمـرئـيـة نـهـائـيـاً. يـرجـى الاكـتـفـاء بـالـرسـائـل الـنـصـيـة فـقـط! 🚫*' 
          })
        } catch (err) {
          console.error('❌ خطأ في رفض المكالمة:', err)
        }
      }
    }
  })
}