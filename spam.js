/**
 * Telegram Bot API Spam Message Script
 * Author: KryptonSec_My
 */

require('./setup.js');
const readline = require("readline");
const axios = require("axios");
const fs = require("fs");
const FormData = require("form-data");
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const { exec } =require('child_process');

const argv = yargs(hideBin(process.argv)).option('t', {
    alias: 'token',
    describe: 'Telegram bot token',
    type: 'string',
    demandOption: true // This makes the token argument required
}).option('c', {
    alias: 'chatid',
    describe: 'Target chat ID',
    type: 'string',
    demandOption: true // This makes the chatid argument required
})
.version('2.6')
.alias('version', 'v')
.argv;

const currentVersion = '2.6';

async function checkForUpdates() {
    const repository = 'kryptonproject/P-TBSPAM'
    const url = `https://api.github.com/kryptonproject/P-TBSPAM/releases/latest`;

    try {
        const response = await axios.get(url);
        const latestVersion = response.data.tag_name;
    if (latestVersion !== currentVersion) {
        console.log("Updating To Version" + latestVersion + "...");
        exec('git pull', (error, stdout, stderr) => {
            if (error) {
                console.error(`exec error: ${error}`);
                return;
            }
            console.log(`stdout: ${stdout}`);
            console.error(`stderr: ${stderr}`);
            console.log("Update complete! Please restart the script,");
            process.exit();
        });
    } else {
        console.log("You are using the latest version.");
    }
    } catch (error) {
        console.error("Failed to check for updates:", error);
    }
}

async function promptUser() {
    await checkForUpdates();
    displayCredits();
    const botToken = argv.token;
    const chatId = argv.chatid;

    await promptOptions(botToken, chatId);
}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

let messageQueue = [];
let processing = false;

async function sendMessage(botToken, chatId, message) {
    const text = encodeURIComponent(message.text);
    const url = `https://api.telegram.org/bot${botToken}/sendMessage?parse_mode=HTML&chat_id=${chatId}&text=${text}`;

    try {
        const response = await axios.get(url);
        console.log(response.data);
    } catch (error) {
        if (error.response) {
            console.log('\x1b[31m', `Error: ${error.response.status} - ${error.response.data.description}`, '\x1b[0m');
            if (error.response.status === 429) {
                const retryAfter = error.response.headers['retry-after'];
                const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 60000;
                console.log('\x1b[31m', `Rate limit exceeded. Retrying after ${waitTime / 1000} seconds.`, '\x1b[0m');
                setTimeout(() => sendMessage(botToken, chatId, message), waitTime);
            }
        } else {
            console.log('\x1b[31m', `Network or other error: ${error.message}`, '\x1b[0m');
        }
    }
}

// Modify the function definition to accept chatId
async function getBotInfo(botToken, chatId) {
    const url = `https://api.telegram.org/bot${botToken}/getMe`;

    try {
        const response = await axios.get(url);
        const botInfo = response.data.result;
        console.log(JSON.stringify(botInfo, null, 2));
        await getBotProfilePhotos(botToken, botInfo.id);
        await getBotPrivacySettings(botToken);
        await promptOptions(botToken, chatId); // Now chatId is defined
    } catch (error) {
        console.log('\x1b[31m', `Error fetching bot info: ${error.message}` ,'\x1b[32m');
    }
}

async function getBotProfilePhotos(botToken, botId) {
    const url = `https://api.telegram.org/bot${botToken}/getUserProfilePhotos?user_id=${botId}&limit=1`;

    try {
        const response = await axios.get(url);
        const photos = response.data.result.photos;
        if (photos.length > 0) {
            const fileId = photos[0][0].file_id;
            console.log(`Profile Photo File ID: ${fileId}`);
        } else {
            console.log('\x1b[31m', 'No profile photos found.' ,'\x1b[32m');
        }
    } catch (error) {
        console.log('\x1b[31m', 'Error fetching profile photos: ${error.message}' ,'\x1b[32m');
    }
}

async function getBotPrivacySettings(botToken) {
    const url = `https://api.telegram.org/bot${botToken}/getMyCommands`;

    try {
        const response = await axios.get(url);
        const commands = response.data.result;
        console.log("Bot Commands:");
        commands.forEach(command => {
            console.log(`Command: /${command.command} - ${command.description}`);
        });
    } catch (error) {
        console.log('\x1b[31m', `Error fetching bot commands: ${error.message}` ,'\x1b[32m');
    }
}

async function getChatInfo(botToken, chatId) {
    const url = `https://api.telegram.org/bot${botToken}/getChat?chat_id=${chatId}`;
    console.log(`Using botToken: ${botToken}, chatId: ${chatId}`);
    console.log(`Fetching chat info with URL: ${url}`);

    try {
        const response = await axios.get(url);
        console.log("Response:", JSON.stringify(response.data, null, 2));
        const chatInfo = response.data.result;
        
    } catch (error) {
        console.error('\x1b[31m', `Error fetching chat info: ${error.message}`, '\x1b[0m');
        if (error.response) {
            console.error("Detailed error response:", JSON.stringify(error.response.data, null, 2));
        }
    }
    await promptOptions(botToken, chatId); // Ensure chatId is passed if needed
}

async function sendFile(botToken, chatId, filePath, caption) {
    const url = `https://api.telegram.org/bot${botToken}/sendDocument`;
    const form = new FormData();
    form.append("chat_id", chatId);
    form.append("document", fs.createReadStream(filePath));
    if (caption) {
        form.append("caption", caption);
    }

    try {
        const response = await axios.post(url, form, { headers: form.getHeaders() });
        console.log("File sent successfully.");
    } catch (error) {
        console.log('\x1b[31m', `Error sending file: ${error.message}` ,'\x1b[31m');
    }
}

async function promptOptions(botToken, chatId) {
    const menuChoice = await new Promise((resolve) => {
        rl.question("Choose an option:\n1. Spam\n2. Bot Info\n3. Send File\n4. Chat Info\noptions > ", (answer) => {
            resolve(answer);
        });
    });

    if (menuChoice === '1') {
        const text = await new Promise((resolve) => {
            rl.question("Enter the message text: ", (answer) => {
                resolve(answer);
            });
        });

        rl.close();
        startSpamming(botToken, chatId, text);
    } else if (menuChoice === '2') {
        await getBotInfo(botToken, chatId); // Pass chatId here
    } else if (menuChoice === '3') {
        const filePath = await new Promise((resolve) => {
            rl.question("Enter the path to the file: ", (answer) => {
                resolve(answer);
            });
        });
        const caption = await new Promise((resolve) => {
            rl.question("Enter the caption for the file (optional): ", (answer) => {
                resolve(answer);
            });
        });
        await sendFile(botToken, chatId, filePath, caption);
        rl.close();
    } else if (menuChoice === '4') {
        await getChatInfo(botToken, chatId);
    } else {
        console.log('\x1b[31m', "Invalid choice. Exiting..." ,'\x1b[32m');
        rl.close();
    }
}

function processQueue() {
    if (processing || messageQueue.length === 0) return;

    processing = true;
    const { botToken, chatId, text } = messageQueue.shift();
    sendMessage(botToken, chatId, { text }).then(() => {
        processing = false;
        processQueue();
    });
}

function startSpamming(botToken, chatId, text) {
    const interval = 10;
    setInterval(() => {
      if (messageQueue.length < 10) {
        messageQueue.push({
          'botToken': botToken,
          'chatId': chatId,
          'text': text
        });
        processQueue();
      }
    }, interval);
}

function displayCredits() {
    console.log("\x1b[32m" + `
  ____     _____ ____ ____  ____   _    __  __ 
 |  _ \   |_   _| __ ) ___||  _ \ / \  |  \/  |
 | |_) |____| | |  _ \___ \| |_) / _ \ | |\/| |
 |  __/_____| | | |_) |__) |  __/ ___ \| |  | |
 |_|        |_| |____/____/|_| /_/   \_\_|  |_|
                                               
` + "\x1b[32m");
    console.log('\x1b[91m', "Created by: KryptonSec_My\n" ,'\x1b[0m');
    console.log('\x1b[91m', "github: https://github.com/kryptonproject\n" ,'\x1b[0m')
    console.log('\x1b[91m', "Version: 2.6\n" ,'\x1b[0m');
}

async function promptUser() {
    displayCredits();
    const botToken = argv.token;
    const chatId = argv.chatid;

    await promptOptions(botToken, chatId);
}

process.on('SIGINT', function () {
    console.log("Thanks for using this tool!");
    process.exit();
});

promptUser();

