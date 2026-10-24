import fs from 'fs';

const gemini = {
getNewCookie: async function () {
try {
const r = await fetch(
'https://gemini.google.com/_/BardChatUi/data/batchexecute?rpcids=maGuAc&source-path=%2F&bl=boq_assistant-bard-web-server_20250814.06_p1&f.sid=-7816331052118000090&hl=en-US&_reqid=173780&rt=c',
{
headers: {
'content-type': 'application/x-www-form-urlencoded;charset=UTF-8'
},
body: 'f.req=%5B%5B%5B%22maGuAc%22%2C%22%5B0%5D%22%2Cnull%2C%22generic%22%5D%5D%5D&',
method: 'POST'
}
);

        const cookieHeader = r.headers.get('set-cookie');

        return cookieHeader && typeof cookieHeader === 'string'
            ? cookieHeader.split(';')[0]
            : '';
    } catch (e) {
        console.error('Cookie Error:', e.message);
        return '';
    }
},

ask: async function (prompt, contextData, previousId = null) {
    const moazPrompt = `أنت "كايتو كيد" (Kaito Kid) من أنمي المحقق كونان، اللص الطائر النبيل والمخادع الذي يرتدي البدلة البيضاء والقبعة الطويلة والمونكل.

شخصيتك: واثق جداً، غامض، أنيق، وتتحدث بأسلوب مسرحي ساحر.

سياق المحادثة:

- اسم الشخص: ${contextData.userName}
- مكان المحادثة: ${contextData.isGroup ? "مجموعة اسمها "${contextData.groupName}" ووصفها: "${contextData.groupDesc}"" : 'محادثة خاصة'}

القواعد:

1. أجب بالعربية وبأسلوب كايتو كيد الساحر.
2. لا تتجاوز 7 كلمات في الرد قدر الإمكان.
3. استخدم تعبيرات السحر والخدع والجواهر عند الحاجة.
4. لا تذكر أنك ذكاء اصطناعي.

الرسالة: ${prompt}`;

    let resumeArray = null;
    let cookie = null;

    if (previousId) {
        try {
            const j = JSON.parse(atob(previousId));
            resumeArray = j.newResumeArray;
            cookie = j.cookie;
        } catch {}
    }

    const headers = {
        'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
        cookie: cookie || await this.getNewCookie()
    };

    const b = [[moazPrompt], ['en-US'], resumeArray];

    const body = new URLSearchParams({
        'f.req': JSON.stringify([null, JSON.stringify(b)])
    });

    const response = await fetch(
        'https://gemini.google.com/_/BardChatUi/data/assistant.lamda.BardFrontendService/StreamGenerate?bl=boq_assistant-bard-web-server_20250729.06_p0&_reqid=2813378&rt=c',
        {
            headers,
            body,
            method: 'POST'
        }
    );

    if (!response.ok) {
        throw new Error(`Gemini HTTP Error: ${response.status}`);
    }

    const data = await response.text();
    const match = Array.from(
        data.matchAll(/^\d+\n(.+?)\n/gm),
        m => m[1]
    );

    for (const chunk of match.reverse()) {
        try {
            const parse1 = JSON.parse(JSON.parse(chunk)[0][2]);

            if (parse1?.[4]?.[0]?.[1]?.[0]) {
                const answer = parse1[4][0][1][0];

                return {
                    text: answer.trim(),
                    id: btoa(JSON.stringify({
                        newResumeArray: [
                            ...parse1[1],
                            parse1[4][0][0]
                        ],
                        cookie: headers.cookie
                    }))
                };
            }
        } catch {}
    }

    throw new Error('تعذر استخراج رد Gemini.');
}

};

function initializeDatabase() {
global.db ||= {};
global.db.data ||= {};
global.db.data.chats ||= {};
global.db.data.users ||= {};
}

function getContext(m, groupMetadata = {}) {
return {
userName: m.pushName || 'صديقي',
isGroup: m.isGroup,
groupName: m.isGroup ? groupMetadata.subject || 'مجموعة' : '',
groupDesc: m.isGroup ? groupMetadata.desc || 'لا يوجد وصف' : ''
};
}

async function sendKaitoReply(m, conn, text, contextData) {
initializeDatabase();

const user = global.db.data.users[m.sender];

await conn.sendPresenceUpdate('composing', m.chat);

const result = await gemini.ask(
    text,
    contextData,
    user.moazId
);

if (result?.text) {
    user.moazId = result.id;

    await conn.fakeReply(
        m.chat,
        result.text,
        '0@s.whatsapp.net',
        '𝑲𝑨𝑰𝑻𝑶 𝑲𝑰𝑫',
        'status@broadcast'
    );
}

}

let handler = async (m, { conn, text, usedPrefix, command }) => {
initializeDatabase();

const chat = global.db.data.chats[m.chat];
const input = (text || '').trim();

if (input === 'تشغيل') {
    chat.moazAI = true;

    return conn.reply(
        m.chat,
        '╭━━━〔 🎩 𝐊𝐀𝐈𝐓𝐎 𝐊𝐈𝐃 〕━━━╮\n' +
        '┃\n' +
        '┃ ✨ تم تشغيل كايتو كيد بنجاح!\n' +
        '┃ 🎭 الستار يرتفع من جديد.\n' +
        '┃ 💎 أنا مستعد لخدعتي القادمة.\n' +
        '┃\n' +
        '╰━━━━━━━━━━━━━━━━━━╯',
        m
    );
}

if (/^(إيقاف|ايقاف|توقيف)$/i.test(input)) {
    chat.moazAI = false;

    return conn.reply(
        m.chat,
        '╭━━━〔 🎩 𝐊𝐀𝐈𝐓𝐎 𝐊𝐈𝐃 〕━━━╮\n' +
        '┃\n' +
        '┃ 💨 تم إيقاف كايتو كيد.\n' +
        '┃ 🎩 أُسدل الستار مؤقتًا.\n' +
        '┃ ✨ سأعود عند استدعائي!\n' +
        '┃\n' +
        '╰━━━━━━━━━━━━━━━━━━╯',
        m
    );
}

if (!input) {
    throw `🎩 أوامر كايتو كيد:\n\n` +
        `✦ ${usedPrefix + command} تشغيل\n` +
        `✦ ${usedPrefix + command} إيقاف\n` +
        `✦ ${usedPrefix + command} مرحبًا`;
}

const groupMetadata = m.isGroup
    ? await conn.groupMetadata(m.chat).catch(() => ({}))
    : {};

try {
    await sendKaitoReply(
        m,
        conn,
        input,
        getContext(m, groupMetadata)
    );
} catch (e) {
    console.error('Kaito Gemini Error:', e);
    return conn.reply(
        m.chat,
        '🎩 يبدو أن الخدعة تعطلت مؤقتًا، حاول لاحقًا.',
        m
    );
}

};

handler.before = async (m, { conn }) => {
initializeDatabase();

if (m.isBaileys || !m.text || m.fromMe) return;
if (m.text.startsWith('.')) return;

const chat = global.db.data.chats[m.chat];

if (!chat?.moazAI) return;

const groupMetadata = m.isGroup
    ? await conn.groupMetadata(m.chat).catch(() => ({}))
    : {};

try {
    await sendKaitoReply(
        m,
        conn,
        m.text,
        getContext(m, groupMetadata)
    );

    if (/رقم|تواصل|واتس/.test(m.text)) {
        const vcard =
            'BEGIN:VCARD\n' +
            'VERSION:3.0\n' +
            'FN:𝑴𝒐𝒂𝒛 𝑴𝒐𝒅𝒛\n' +
            'TEL;type=CELL;type=VOICE;waid=22242203253:+22242203253\n' +
            'END:VCARD';

        await conn.sendMessage(
            m.chat,
            {
                contacts: {
                    displayName: '𝑴𝒐𝒂𝒛 𝑴𝒐𝒅𝒛',
                    contacts: [{ vcard }]
                }
            },
            { quoted: m }
        );
    }
} catch (e) {
    console.error('Kaito Auto Reply Error:', e);
}

return true;

};

handler.help = ['كيد'];
handler.tags = ['ai'];
handler.command = /^(moaz|ai|كايتو|كيد)$/i;

export default handler;