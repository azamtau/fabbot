process.env["NTBA_FIX_319"] = 1;

const TelegramBot = require('node-telegram-bot-api');
const Datastore = require('nedb');

const express = require('express');
const app = express();

const Agent = require('socks5-https-client/lib/Agent') 
//require('dotenv').config()
const wakeDyno = require("woke-dyno");


process.env["TELEGRAM_API_TOKEN"] = process.env.BOT_TOKEN;
// process.env["PROXY_SOCKS5_HOST"] = '127.0.0.1';
// process.env["PROXY_SOCKS5_PORT"] = '9150';

const PORT = process.env.PORT || 3000; 

const bot = new TelegramBot(process.env.TELEGRAM_API_TOKEN, {
	polling: true,
	// request: {
	// 	agentClass: Agent,
	// 	agentOptions: {
	// 		socksHost: process.env.PROXY_SOCKS5_HOST,
	// 		socksPort: parseInt(process.env.PROXY_SOCKS5_PORT),
	// 	}
	// }
})

const dbSt = new Datastore({ filename: './data/students', autoload: true });
const dbLs = new Datastore({ filename: './data/lessons', autoload: true });

let studs = [
        {
            fullname: "Katya Petrova",
            username: "kate",
            rating: 98
        },
        {
            fullname: "Bot Botov",
            username: "azamtau",
            rating: 72
        },
        {
            fullname: "Ludmila Sidorova",
            username: "luda",
            rating: 83
        }
];

let lessons = [
        {
            date: new Date("2020-06-01"),
            notes_url: "https://docs.google.com/document/d/11UPICzVDYvDNBxiBbGMFNqDoq8fGIagAhQHF1nI1Eck/edit?usp=sharing",
            homework: {
                deadline: new Date("2020-06-08T12:00:00"),
                url: "https://docs.google.com/document/d/1J8tCZWJ4HKjAUFq613DuOr673ji5RiBnlWXP34PpGCU/edit?usp=sharing"
            }
        },
        {
            date: new Date("2020-06-08"),
            notes_url: "https://docs.google.com/document/d/1XAciiQsDCAOLkX0vlk5ZrXZI0InHe-CmmD1YXtKj0ks/edit?usp=sharing",
            homework: {
                deadline: new Date("2020-06-17T12:00:00"),
                url: "https://docs.google.com/document/d/1fLOiE7XnIws33WNT3FP7_z2-o4O00AfH5aJwyh7nUD4/edit?usp=sharing"
            }
        }
];

// dbSetup(lessons, dbLs);
// dbSetup(studs, dbSt);

function dbSetup(docs, db) {
    for (let doc of docs) {
        db.insert(doc, (err, newDoc) => {
            console.log('New doc added to db');
        });
    }
}

bot.onText(/\/yo/, (msg, match) => {
    let text = `Type:\n<a href="/rating">/rating</a> - to get your current rating\n<a href="/hws">/hws</a> - to get all homeworks\n<a href="/hw 8">/hw 8</a> - to get HW8\n<a href="/last">/last</a> - to get last homework`;
    bot.sendMessage(msg.chat.id, text,  {"parse_mode": "HTML"});
    console.log(msg.chat);
});

bot.onText(/\/rating/, (msg, match) => {
    dbSt.find({ "username": msg.chat.username }, (err, docs) => {
        if (err) {
            bot.sendMessage(msg.chat.id, "Error: " + err);
        }
        else {
            if (docs.length > 0) {
                bot.sendMessage(msg.chat.id, `Your current rating is: ${docs[0].rating}`);
            }
            else {
                bot.sendMessage(msg.chat.id, "No student with such username");
            }
        }
    });
});

bot.onText(/\/hws/, (msg, match) => {
    dbLs.find({}, (err, docs) => {
        if (err) {
            bot.sendMessage(msg.chat.id, "Error: " + err);
        }
        else {
            if (docs.length > 0) {
                for (let doc of docs) {
                    let text = `Deadline: ${doc.homework.deadline} \nURL: ${doc.homework.url}`;
                    bot.sendMessage(msg.chat.id, text, {"parse_mode": "HTML"});
                }
            } 
            else {
                bot.sendMessage(msg.chat.id, "No such data");
            }
        }
    });
});

bot.onText(/\/hw ([0-9]{1,2})/, (msg, match) => {
    dbLs.find({"homework.id": `hw${match[1]}`}, (err, docs) => {
        if (err) {
            bot.sendMessage(msg.chat.id, "Error: " + err);
        }
        else {
            if (docs.length > 0) {
                for (let doc of docs) {
                    let text = `Deadline: ${doc.homework.deadline} \nURL: ${doc.homework.url}`;
                    bot.sendMessage(msg.chat.id, text, {"parse_mode": "HTML"});
                }
            }
            else {
                bot.sendMessage(msg.chat.id, "No such data");
            }
        }
    });
});

bot.onText(/\/last/, (msg, match) => {
    dbLs.find({}).sort({"homework.deadline": -1}).limit(1).exec((err, docs) => {
        if (err) {
            bot.sendMessage(msg.chat.id, "Error: " + err);
        }
        else {
            if (docs.length > 0) {
                let text = `Deadline: ${docs[0].homework.deadline} \nURL: ${docs[0].homework.url} ${docs[0]._id}`;
                bot.sendMessage(msg.chat.id, text, {"parse_mode": "HTML"});
            }
            else {
                bot.sendMessage(msg.chat.id, "No such data");
            }
        }
    });
});

app.listen(PORT, () => {
    wakeDyno("https://cs101bot.herokuapp.com/").start();
});
