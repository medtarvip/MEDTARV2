const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

function formatTime(seconds) {
const minutes = Math.floor(seconds / 60)
const remaining = seconds % 60

return `${String(minutes).padStart(2, '0')}:${String(remaining).padStart(2, '0')}`

}

function progressBar(percent) {
const total = 8
const filled = Math.round((percent / 100) * total)

return '▰'.repeat(filled) + '▱'.repeat(total - filled)

}

const handler = async (m, { conn, args }) => {
const seconds = Number(args[0])

if (!Number.isInteger(seconds) || seconds < 1 || seconds > 60) {
    return m.reply('⏱️ استخدم: .عد 10\n\nالمدة المسموحة: من 1 إلى 60 ثانية فقط.')
}

const start = Date.now()
const end = start + seconds * 1000

try {
    const sent = await conn.sendMessage(m.chat, {
        text: `⏳ ${formatTime(seconds)}\n${progressBar(0)} 0%`
    }, { quoted: m })

    let lastRemaining = seconds

    while (Date.now() < end) {
        const remaining = Math.max(
            0,
            Math.ceil((end - Date.now()) / 1000)
        )

        if (remaining !== lastRemaining) {
            lastRemaining = remaining

            const elapsed = seconds - remaining
            const percent = Math.min(
                100,
                Math.floor((elapsed / seconds) * 100)
            )

            await conn.sendMessage(m.chat, {
                text: `⏳ ${formatTime(remaining)}\n${progressBar(percent)} ${percent}%`,
                edit: sent.key
            }).catch(error => {
                console.error('Countdown edit error:', error)
            })
        }

        await sleep(50)
    }

    await conn.sendMessage(m.chat, {
        delete: sent.key
    }).catch(error => {
        console.error('Countdown delete error:', error)
    })

} catch (error) {
    console.error('Countdown error:', error)
    await m.reply('❌ حدث خطأ أثناء تشغيل العد التنازلي.')
}

}

handler.help = ['عد <ثواني>']
handler.tags = ['tools']
handler.command = /^(عد|countdown)$/i

export default handler