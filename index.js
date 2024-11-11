const { Client, Collection } = require("discord.js");
const dotenv = require('dotenv'); dotenv.config();
const client = new Client({ intents: 1539, partials: ['MESSAGE', 'CHANNEL', 'REACTION', 'USER'] });
const Logger = require('./utils/Logger');
const db = require('./utils/database');

const x = ['commands'];
for (const i of x) {
  client[i] = new Collection();
};
['CommandUtil', 'EventUtil'].forEach(handler => { require(`./utils/handlers/${handler}`) (client)});
require('./utils/Functions')(client);

process.on('exit', code => { Logger.client(`Le processus s'est arrêté avec le code: ${code}\n`) });
process.on('uncaughtException', (err, origin) => {
    Logger.error(`UNCAUGHT_EXCEPTION: ${err}`)
    console.error(`Origine: ${origin}\n`)
 });
process.on('unhandledRejection', (reason, promise) => {
    Logger.warn(`UNHANDLED_REJECTION: ${reason}\n-----\n`)
    console.log(promise, '\n')
});
process.on('warning', (...args) => {
    Logger.warn(...args)
});

client.login(process.env.DISCORD_TOKEN);

// Régénération des HP et de l'énergie toutes les 10 minutes
setInterval(() => {
    const now = Math.floor(Date.now() / 1000); // Temps actuel en secondes
    const regenAmount = 5; // Quantité de HP et d'énergie régénérée

    db.all("SELECT * FROM players", [], (err, players) => {
        if (err) {
            console.error(err.message);
            return;
        }
        players.forEach(player => {
            const hpRegenTime = now - player.last_hp_update;
            const energyRegenTime = now - player.last_energy_update;

            if (hpRegenTime >= 600) { // 10 minutes
                const newHp = Math.min(player.hp + regenAmount, 100); // Limite des HP à 100
                db.run("UPDATE players SET hp = ?, last_hp_update = ? WHERE id = ?", [newHp, now, player.id], (err) => {
                    if (err) {
                        console.error(err.message);
                    }
                });
            }

            if (energyRegenTime >= 600) { // 10 minutes
                const newEnergy = Math.min(player.energy + regenAmount, 10); // Limite de l'énergie à 10
                db.run("UPDATE players SET energy = ?, last_energy_update = ? WHERE id = ?", [newEnergy, now, player.id], (err) => {
                    if (err) {
                        console.error(err.message);
                    }
                });
            }
        });
    });
}, 600000); // 10 minutes en millisecondes