const { MessageEmbed } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
    name: 'chapter',
    category: 'RPG',
    permissions: ['SEND_MESSAGES'],
    ownerOnly: false,
    usage: 'chapter <start|list|current> [chapter_id]',
    examples: ['chapter start 1', 'chapter list', 'chapter current'],
    description: 'Gère les chapitres du jeu',
    options: [
        {
            name: 'list',
            description: 'Affiche la liste des chapitres disponibles',
            type: 'SUB_COMMAND',
        },
        {
            name: 'start',
            description: 'Commence un chapitre',
            type: 'SUB_COMMAND',
            options: [
                {
                    name: 'chapter_id',
                    description: 'ID du chapitre à commencer',
                    type: 'INTEGER',
                    required: true,
                },
            ],
        },
        {
            name: 'current',
            description: 'Affiche le chapitre en cours',
            type: 'SUB_COMMAND',
        },
    ],
    async run(client, message, args) {
        const subcommand = args[0];

        if (subcommand === 'list') {
            db.all("SELECT * FROM chapters", [], (err, rows) => {
                if (err) {
                    console.error(err.message);
                    return message.reply("Une erreur est survenue lors de la récupération des chapitres.");
                }

                const embed = new MessageEmbed()
                    .setTitle('Chapitres disponibles')
                    .setColor('RANDOM');

                rows.forEach(row => {
                    embed.addField(`Chapitre ${row.id}: ${row.name}`, `${row.description}\nRécompense: ${row.reward}\nDialogue: ${row.dialogue}`);
                });

                message.channel.send({ embeds: [embed] });
            });
        } else if (subcommand === 'start') {
            const chapterId = args[1];
            if (!chapterId) {
                return message.reply("Veuillez spécifier l'ID du chapitre à commencer.");
            }

            db.get("SELECT current_chapter_id FROM players WHERE id = ?", [message.author.id], (err, row) => {
                if (err) {
                    console.error(err.message);
                    return message.reply("Une erreur est survenue lors de la récupération du chapitre en cours.");
                }

                const currentChapterId = row ? row.current_chapter_id : null;

                if (currentChapterId && currentChapterId === parseInt(chapterId)) {
                    return message.reply("Vous êtes déjà dans ce chapitre.");
                }

                // Vérifier si toutes les quêtes du chapitre actuel sont terminées
                if (currentChapterId) {
                    db.all("SELECT * FROM quests WHERE chapter_id = ?", [currentChapterId], (err, quests) => {
                        if (err) {
                            console.error(err.message);
                            return message.reply("Une erreur est survenue lors de la récupération des quêtes.");
                        }

                        const unfinishedQuests = quests.filter(quest => {
                            return !quest.status || quest.status !== 'completed';
                        });

                        if (unfinishedQuests.length > 0) {
                            return message.reply("Vous devez terminer toutes les quêtes du chapitre en cours avant de passer au chapitre suivant.");
                        }

                        // Passer au chapitre suivant
                        startChapter(chapterId, message);
                    });
                } else {
                    // Commencer le chapitre directement si aucun chapitre en cours
                    startChapter(chapterId, message);
                }
            });
        } else if (subcommand === 'current') {
            db.get("SELECT current_chapter_id FROM players WHERE id = ?", [message.author.id], (err, row) => {
                if (err) {
                    console.error(err.message);
                    return message.reply("Une erreur est survenue lors de la récupération du chapitre en cours.");
                }

                if (!row || !row.current_chapter_id) {
                    return message.reply("Vous n'avez pas de chapitre en cours.");
                }

                db.get("SELECT * FROM chapters WHERE id = ?", [row.current_chapter_id], (err, chapter) => {
                    if (err) {
                        console.error(err.message);
                        return message.reply("Une erreur est survenue lors de la récupération du chapitre.");
                    }

                    const embed = new MessageEmbed()
                        .setTitle(`Chapitre en cours: ${chapter.name}`)
                        .setDescription(`${chapter.description}\nRécompense: ${chapter.reward}\nDialogue: ${chapter.dialogue}`)
                        .setColor('BLUE');

                    message.channel.send({ embeds: [embed] });
                });
            });
        } else {
            message.reply("Commande invalide. Utilisez `chapter list` pour voir les chapitres disponibles, `chapter start <chapter_id>` pour commencer un chapitre, ou `chapter current` pour voir le chapitre en cours.");
        }
    },
    async runInteraction(client, interaction) {
        const subcommand = interaction.options.getSubcommand(false);

        if (!subcommand) {
            return interaction.reply("Commande invalide. Utilisez `chapter list` pour voir les chapitres disponibles, `chapter start <chapter_id>` pour commencer un chapitre, ou `chapter current` pour voir le chapitre en cours.");
        }

        if (subcommand === 'list') {
            db.all("SELECT * FROM chapters", [], (err, rows) => {
                if (err) {
                    console.error(err.message);
                    return interaction.reply("Une erreur est survenue lors de la récupération des chapitres.");
                }

                const embed = new MessageEmbed()
                    .setTitle('Chapitres disponibles')
                    .setColor('RANDOM');

                rows.forEach(row => {
                    embed.addField(`Chapitre ${row.id}: ${row.name}`, `${row.description}\nRécompense: ${row.reward}\nDialogue: ${row.dialogue}`);
                });

                interaction.reply({ embeds: [embed] });
            });
        } else if (subcommand === 'start') {
            const chapterId = interaction.options.getInteger('chapter_id');
            if (!chapterId) {
                return interaction.reply("Veuillez spécifier l'ID du chapitre à commencer.");
            }

            db.get("SELECT current_chapter_id FROM players WHERE id = ?", [interaction.user.id], (err, row) => {
                if (err) {
                    console.error(err.message);
                    return interaction.reply("Une erreur est survenue lors de la récupération du chapitre en cours.");
                }

                const currentChapterId = row ? row.current_chapter_id : null;

                if (currentChapterId && currentChapterId === chapterId) {
                    return interaction.reply("Vous êtes déjà dans ce chapitre.");
                }

                // Vérifier si toutes les quêtes du chapitre actuel sont terminées
                if (currentChapterId) {
                    db.all("SELECT * FROM quests WHERE chapter_id = ?", [currentChapterId], (err, quests) => {
                        if (err) {
                            console.error(err.message);
                            return interaction.reply("Une erreur est survenue lors de la récupération des quêtes.");
                        }

                        const unfinishedQuests = quests.filter(quest => {
                            return !quest.status || quest.status !== 'completed';
                        });

                        if (unfinishedQuests.length > 0) {
                            return interaction.reply("Vous devez terminer toutes les quêtes du chapitre en cours avant de passer au chapitre suivant.");
                        }

                        // Passer au chapitre suivant
                        startChapter(chapterId, interaction);
                    });
                } else {
                    // Commencer le chapitre directement si aucun chapitre en cours
                    startChapter(chapterId, interaction);
                }
            });
        } else if (subcommand === 'current') {
            db.get("SELECT current_chapter_id FROM players WHERE id = ?", [interaction.user.id], (err, row) => {
                if (err) {
                    console.error(err.message);
                    return interaction.reply("Une erreur est survenue lors de la récupération du chapitre en cours.");
                }

                if (!row || !row.current_chapter_id) {
                    return interaction.reply("Vous n'avez pas de chapitre en cours.");
                }

                db.get("SELECT * FROM chapters WHERE id = ?", [row.current_chapter_id], (err, chapter) => {
                    if (err) {
                        console.error(err.message);
                        return interaction.reply("Une erreur est survenue lors de la récupération du chapitre.");
                    }

                    const embed = new MessageEmbed()
                        .setTitle(`Chapitre en cours: ${chapter.name}`)
                        .setDescription(`${chapter.description}\nRécompense: ${chapter.reward}\nDialogue: ${chapter.dialogue}`)
                        .setColor('BLUE');

                    interaction.reply({ embeds: [embed] });
                });
            });
        } else {
            interaction.reply("Commande invalide. Utilisez `chapter list` pour voir les chapitres disponibles, `chapter start <chapter_id>` pour commencer un chapitre, ou `chapter current` pour voir le chapitre en cours.");
        }
    }
};

function startChapter(chapterId, context) {
    db.get("SELECT * FROM chapters WHERE id = ?", [chapterId], (err, row) => {
        if (err) {
            console.error(err.message);
            return context.reply ? context.reply("Une erreur est survenue lors de la récupération du chapitre.") : context.message.reply("Une erreur est survenue lors de la récupération du chapitre.");
        }

        if (!row) {
            return context.reply ? context.reply("Ce chapitre n'existe pas.") : context.message.reply("Ce chapitre n'existe pas.");
        }

        // Mettre à jour le chapitre en cours pour le joueur
        db.run("UPDATE players SET current_chapter_id = ? WHERE id = ?", [chapterId, context.user ? context.user.id : context.message.author.id], (err) => {
            if (err) {
                console.error(err.message);
                return context.reply ? context.reply("Une erreur est survenue lors de la mise à jour du chapitre en cours.") : context.message.reply("Une erreur est survenue lors de la mise à jour du chapitre en cours.");
            }

            const embed = new MessageEmbed()
                .setTitle(`Chapitre ${row.id}: ${row.name}`)
                .setDescription(`${row.description}\nRécompense: ${row.reward}\nDialogue: ${row.dialogue}`)
                .setColor('GREEN');

            context.reply ? context.reply({ embeds: [embed] }) : context.message.channel.send({ embeds: [embed] });
        });
    });
}