// Dans commands/RPG/start.js
const { MessageEmbed } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
    name: 'start',
    category: 'RPG',
    permissions: ['SEND_MESSAGES'],
    ownerOnly: false,
    usage: 'start',
    examples: ['start'],
    description: 'Crée un profil de joueur',
    async run(client, message, args) {
        const now = Math.floor(Date.now() / 1000); // Temps actuel en secondes
        db.get("SELECT * FROM players WHERE id = ?", [message.author.id], (err, row) => {
            if (err) {
                console.error(err.message);
                return message.reply("Une erreur est survenue lors de la création de votre profil.");
            }

            if (row) {
                return message.reply("Vous avez déjà un profil.");
            }

            db.run("INSERT INTO players (id, xp, level, gold, hp, attack, defense, energy, last_hp_update, last_energy_update) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [message.author.id, 0, 1, 0, 100, 10, 5, 10, now, now], (err) => {
                if (err) {
                    console.error(err.message);
                    return message.reply("Une erreur est survenue lors de la création de votre profil.");
                }

                const embed = new MessageEmbed()
                    .setTitle('Profil créé')
                    .setDescription('Votre profil a été créé avec succès !')
                    .setColor('GREEN');

                message.channel.send({ embeds: [embed] });
            });
        });
    },

    async runInteraction(client, interaction) {
        const now = Math.floor(Date.now() / 1000); // Temps actuel en secondes
        db.get("SELECT * FROM players WHERE id = ?", [interaction.user.id], (err, row) => {
            if (err) {
                console.error(err.message);
                return interaction.reply("Une erreur est survenue lors de la création de votre profil.");
            }

            if (row) {
                return interaction.reply("Vous avez déjà un profil.");
            }

            db.run("INSERT INTO players (id, xp, level, gold, hp, attack, defense, energy, last_hp_update, last_energy_update) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [interaction.user.id, 0, 1, 0, 100, 10, 5, 10, now, now], (err) => {
                if (err) {
                    console.error(err.message);
                    return interaction.reply("Une erreur est survenue lors de la création de votre profil.");
                }

                const embed = new MessageEmbed()
                    .setTitle('Profil créé')
                    .setDescription('Votre profil a été créé avec succès !')
                    .setColor('GREEN');

                interaction.reply({ embeds: [embed] });
            });
        });
    }
};