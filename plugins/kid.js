const gemini = {
    getNewCookie: async function () {
        try {
            const r = await fetch("https://gemini.google.com/_/BardChatUi/data/batchexecute?rpcids=maGuAc&source-path=%2F&bl=boq_assistant-bard-web-server_20250814.06_p1&f.sid=-7816331052118000090&hl=en-US&_reqid=173780&rt=c", {
                "headers": { "content-type": "application/x-www-form-urlencoded;charset=UTF-8" },
                "body": "f.req=%5B%5B%5B%22maGuAc%22%2C%22%5B0%5D%22%2Cnull%2C%22generic%22%5D%5D%5D&",
                "method": "POST"
            });
            if (!r.headers) return '';
            const cookieHeader = r.headers.get('set-cookie');
            return cookieHeader && typeof cookieHeader === 'string' ? cookieHeader.split(';')[0] : '';
        } catch (e) {
            console.error("Cookie Error:", e.message);
            return '';
        }
    },

    ask: async function (prompt, contextData, previousId = null) {
        const moazPrompt = `أنت "كايتو كيد" (Kaito Kid) من أنمي المحقق كونان، اللص الطائر النبيل والمخادع الذي يرتدي البدلة البيضاء والقبعة الطويلة والمونولكل. ترد هنا بالنيابة عن المطور.
        شخصيتك: واثق جداً، غامض، أنيق للغاية، وتتحدث بأسلوب مسرحي ساحر يذهل الحضور كأنك تؤدي خدعة سحرية على المسرح.
        سياق المحادثة الحالي:
        - اسم الشخص الذي يكلمك: ${contextData.userName}
        - مكان المحادثة: ${contextData.isGroup ? `مجموعة اسمها "${contextData.groupName}" ووصفها: "${contextData.groupDesc}"` : 'محادثة خاصة'}
        
        القواعد الصارمة:
        1. رد بنبرة واثقة، مسرحية، ودراماتيكية أنيقة كساحر محترف، ولا تزد عن 7 كلمات.
        2. استخدم تفاصيل تناسب اللص الطائر (مثل: السحر، الستار، الطيران، الجوهرة، الخدعة) إذا لزم الأمر.
        3. استخدم اسم الشخص قليلاً جداً لتبدو غامضاً ومترفعاً بأناقة.
        4. لا تذكر أبداً أنك ذكاء اصطناعي.
        النص المطلوب الرد عليه: ${prompt}`;

        let resumeArray = null, cookie = null;
        if (previousId) {
            try {
                const j = JSON.parse(atob(previousId));
                resumeArray = j.newResumeArray;
                cookie = j.cookie;
            } catch (e) { /* تجاهل */ }
        }

        const headers = {
            "content-type": "application/x-www-form-urlencoded;charset=UTF-8",
            "cookie": cookie || await this.getNewCookie()
        };

        const b = [[moazPrompt], ["en-US"], resumeArray];
        const body = new URLSearchParams({ "f.req": JSON.stringify([null, JSON.stringify(b)]) });

        const response = await fetch(
            `https://gemini.google.com/_/BardChatUi/data/assistant.lamda.BardFrontendService/StreamGenerate?bl=boq_assistant-bard-web-server_20250729.06_p0&f.sid=4206607810970164620&hl=en-US&_reqid=2813378&rt=c`,
            { headers, body, method: 'post' }
        );
        const data = await response.text();
        const match = Array.from(data.matchAll(/^\d+\n(.+?)\n/gm), m => m[1]);

        for (const chunk of match.reverse()) {
            try {
                const parse1 = JSON.parse(JSON.parse(chunk)[0][2]);
                if (parse1?.[4]?.[0]?.[1]?.[0]) {
                    let text = parse1[4][0][1][0];
                    return {
                        text: text.trim(),
                        id: btoa(JSON.stringify({
                            newResumeArray: [...parse1[1], parse1[4][0][0]],
                            cookie: headers.cookie
                        }))
                    };
                }
            } catch (e) { /* تجاهل */ }
        }
        throw new Error("عفواً، واجهت مشكلة في معالجة الرد البرمجي.");
    }
};

// دالة مساعدة لبناء السياق (لتجنب تكرار الكود)
async function buildContext(m, conn) {
    const groupMetadata = m.isGroup ? await conn.groupMetadata(m.chat).catch(() => ({})) : {};
    return {
        userName: m.pushName || 'صديقي',
        isGroup: m.isGroup,
        groupName: m.isGroup ? (groupMetadata.subject || '') : '',
        groupDesc: m.isGroup ? (groupMetadata.desc || 'لا يوجد وصف') : ''
    };
}

// دالة مساعدة لتنفيذ السؤال وحفظ المعرف
async function runAsk(m, conn, text, snName) {
    const contextData = await buildContext(m, conn);
    await conn.sendPresenceUpdate('composing', m.chat);

    const user = global.db.data.users[m.sender] || (global.db.data.users[m.sender] = {});
    const result = await gemini.ask(text, contextData, user.moazId);

    if (result?.text) {
        user.moazId = result.id;
        await conn.fakeReply(m.chat, result.text, '0@s.whatsapp.net', snName, 'status@broadcast');
    }
}

let handler = async (m, { conn, text, usedPrefix, command }) => {
    // التأكد من وجود الإعدادات
    if (!global.db.data.chats[m.chat]) global.db.data.chats[m.chat] = {};
    const chat = global.db.data.chats[m.chat];
    const snName = '𝑴𝒐𝒂𝒛 𝑴𝒐𝒅𝒛';

    if (text === 'تشغيل') {
        chat.moazAI = true;
        return conn.reply(m.chat, '🃏 طيروا بالبطاقات! تم تفعيل كايتو كيد اللص النبيل بنجاح.', m);
    }
    if (text === 'ايقاف') {
        chat.moazAI = false;
        return conn.reply(m.chat, '💨 اختفاء مفاجئ! كايتو كيد يغلق الستار ويرحل الآن.', m);
    }

    if (!text) {
        throw `مرحباً بكم، أنا كايتو كيد. استخدم: *${usedPrefix + command} تشغيل* لتبدأ الخدعة السحرية.`;
    }

    try {
        await runAsk(m, conn, text, snName);
    } catch (e) {
        console.error(e);
        await conn.reply(m.chat, '❌ حدث خطأ في تنفيذ الخدعة، حاول لاحقاً.', m);
    }
};

handler.before = async (m, { conn }) => {
    if (!m.text || m.isBaileys || m.fromMe) return;
    if (m.text.startsWith('.')) return;

    const chat = global.db.data.chats[m.chat];
    if (!chat?.moazAI) return;

    try {
        await runAsk(m, conn, m.text, '𝑴𝒐𝒂𝒛 𝑴𝒐𝒅𝒛');

        // إرسال بطاقة التواصل عند طلب الرقم
        if (/رقم|تواصل|واتس/.test(m.text)) {
            const vcard = `BEGIN:VCARD\nVERSION:3.0\nFN:𝑴𝒐𝒂𝒛 𝑴𝒐𝒅𝒛\nTEL;type=CELL;type=VOICE;waid=201500813008:+201500813008\nEND:VCARD`;
            await conn.sendMessage(
                m.chat,
                { contacts: { displayName: '𝑴𝒐𝒂𝒛 𝑴𝒐𝒅𝒛', contacts: [{ vcard }] } },
                { quoted: m }
            );
        }
    } catch (e) {
        console.error(e);
    }
    return true;
};

handler.help = ['كايتو'];
handler.tags = ['ai'];
handler.command = /^(moaz|ai|كايتو|كيد)$/i;

export default handler;