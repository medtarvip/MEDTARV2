const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

const handler = async (m, { conn, args }) => {
const text = args.join(' ').trim()

if (!text) {
    return m.reply('✍️ مثال:\n.كتابة أهلاً بكم في عالم كايتو كيد 🎩')
}

if (text.length > 150) {
    return m.reply('⚠️ الحد الأقصى 150 حرفًا.')
}

let sent

try {
    // إظهار مؤشر الكتابة الحقيقي في واتساب
    await conn.sendPresenceUpdate('composing', m.chat)

    await sleep(1000)

    sent = await conn.sendMessage(m.chat, {
        text: text[0]
    }, { quoted: m })

    for (let i = 2; i <= text.length; i++) {
        await conn.sendPresenceUpdate('composing', m.chat)

        await sleep(250)

        await conn.sendMessage(m.chat, {
            text: text.slice(0, i),
            edit: sent.key
        })
    }

} catch (error) {
    console.error('Typing animation error:', error)
    await m.reply('❌ تعذرت الكتابة المتحركة. تحقق من دعم إصدار Baileys لديك.')
} finally {
    await conn.sendPresenceUpdate('paused', m.chat).catch(() => {})
}

}

handler.help = ['كتابة <النص>']
handler.tags = ['fun']
handler.command = /^(كتابة|يكتب|typing)$/i

export default handler