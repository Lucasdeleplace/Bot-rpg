const { MessageEmbed } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
    name: 'profile',
    category: 'RPG',
    permissions: ['SEND_MESSAGES'],
    ownerOnly: false,
    usage: 'profile',
    examples: ['profile'],
    description: 'Affiche le profil du joueur',
    async run(client, message, args) {
        db.get("SELECT * FROM players WHERE id = ?", [message.author.id], (err, row) => {
            if (err) {
                console.error(err.message);
                return message.reply("Une erreur est survenue lors de la récupération de votre profil.");
            }

            if (!row) {
                return message.reply("Vous n'avez pas encore de profil. Utilisez la commande `start` pour commencer.");
            }

            const embed = new MessageEmbed()
                .setTitle(`${message.author.username}'s Profile`)
                .setDescription(`XP: ${row.xp}\nLevel: ${row.level}\nGold: ${row.gold}\nHP: ${row.hp}\nAttack: ${row.attack}\nDefense: ${row.defense}\nEnergy: ${row.energy}`)
                .setColor('RANDOM');

            message.channel.send({ embeds: [embed] });
        });
    },

    async runInteraction(client, interaction) {
        db.get("SELECT * FROM players WHERE id = ?", [interaction.user.id], (err, row) => {
            if (err) {
                console.error(err.message);
                return interaction.reply("Une erreur est survenue lors de la récupération de votre profil.");
            }

            if (!row) {
                return interaction.reply("Vous n'avez pas encore de profil. Utilisez la commande `start` pour commencer.");
            }

            const embed = new MessageEmbed()
                .setTitle(`${interaction.user.username}'s Profile`)
                .setDescription(`XP: ${row.xp}\nLevel: ${row.level}\nGold: ${row.gold}\nHP: ${row.hp}\nAttack: ${row.attack}\nDefense: ${row.defense}\nEnergy: ${row.energy}`)
                .setColor('RANDOM');

            interaction.reply({ embeds: [embed] });
        });
    }
};