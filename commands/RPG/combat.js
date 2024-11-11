const { MessageEmbed } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
    name: 'combat',
    category: 'RPG',
    permissions: ['SEND_MESSAGES'],
    ownerOnly: false,
    usage: 'combat',
    examples: ['combat'],
    description: 'Lance un combat contre un ennemi',
    async run(client, message, args) {
        const playerId = message.author.id;
        db.get("SELECT * FROM players WHERE id = ?", [playerId], (err, player) => {
            if (err) {
                console.error(err.message);
                return message.reply("Une erreur est survenue lors de la récupération de votre profil.");
            }
            if (!player) {
                return message.reply("Vous n'avez pas encore de profil. Utilisez la commande `start` pour commencer.");
            }
            if (player.energy <= 0) {
                return message.reply("Vous n'avez plus d'énergie pour combattre.");
            }
            db.get("SELECT * FROM player_quests WHERE player_id = ? AND status = 'in_progress'", [playerId], (err, playerQuest) => {
                if (err) {
                    console.error(err.message);
                    return message.reply("Une erreur est survenue lors de la récupération de votre quête.");
                }
                if (!playerQuest) {
                    return message.reply("Vous n'avez pas de quête en cours.");
                }
                db.get("SELECT * FROM quests WHERE id = ?", [playerQuest.quest_id], (err, quest) => {
                    if (err) {
                        console.error(err.message);
                        return message.reply("Une erreur est survenue lors de la récupération des détails de la quête.");
                    }
                    if (!quest) {
                        return message.reply("La quête spécifiée n'existe pas.");
                    }
                    let enemyHp = 10; // Points de vie de l'ennemi
                    let playerHp = player.hp; // Points de vie du joueur
                    let resultMessage = '';
                    while (enemyHp > 0 && playerHp > 0) {
                        // Simuler un tour de combat
                        const playerDamage = Math.max(0, Math.floor(Math.random() * player.attack) - 2); // Attaque du joueur
                        const enemyDamage = Math.max(0, Math.floor(Math.random() * 5) - player.defense); // Attaque de l'ennemi
                        enemyHp -= playerDamage;
                        playerHp -= enemyDamage;
                        resultMessage += `Vous avez infligé ${playerDamage} points de dégâts à l'ennemi.\nL'ennemi vous a infligé ${enemyDamage} points de dégâts.\n`;
                        if (enemyHp <= 0) {
                            resultMessage += "Vous avez vaincu l'ennemi !\n";
                            // Mettre à jour la progression de la quête
                            db.run("UPDATE player_quests SET progress = progress + 1 WHERE player_id = ? AND quest_id = ?", [playerId, quest.id], (err) => {
                                if (err) {
                                    console.error(err.message);
                                    return message.reply("Une erreur est survenue lors de la mise à jour de la progression de la quête.");
                                }
                                // Vérifier si la quête est terminée
                                db.get("SELECT progress FROM player_quests WHERE player_id = ? AND quest_id = ?", [playerId, quest.id], (err, row) => {
                                    if (err) {
                                        console.error(err.message);
                                        return message.reply("Une erreur est survenue lors de la vérification de la progression de la quête.");
                                    }
                                    if (row.progress >= 5) { // Condition de la quête : tuer 5 gobelins
                                        db.run("UPDATE player_quests SET status = 'completed' WHERE player_id = ? AND quest_id = ?", [playerId, quest.id], (err) => {
                                            if (err) {
                                                console.error(err.message);
                                                return message.reply("Une erreur est survenue lors de la mise à jour de l'état de la quête.");
                                            }
                                            // Attribuer les récompenses
                                            const rewards = quest.reward.split(', ');
                                            let xp = parseInt(rewards[0].split(' ')[0]);
                                            let gold = parseInt(rewards[1].split(' ')[0]);
                                            db.run("UPDATE players SET xp = xp + ?, gold = gold + ? WHERE id = ?", [xp, gold, playerId], (err) => {
                                                if (err) {
                                                    console.error(err.message);
                                                    return message.reply("Une erreur est survenue lors de l'attribution des récompenses.");
                                                }
                                                message.reply("Félicitations ! Vous avez complété la première quête et gagné " + quest.reward + ".");
                                            });
                                        });
                                    } else {
                                        message.reply(resultMessage);
                                    }
                                });
                            });
                        } else if (playerHp <= 0) {
                            resultMessage += "Vous avez été vaincu par l'ennemi.\n";
                            break;
                        } else {
                            resultMessage += `Il reste ${enemyHp} points de vie à l'ennemi.\nIl vous reste ${playerHp} points de vie.\n`;
                        }
                    }
                    // Mettre à jour les PV et l'énergie du joueur
                    db.run("UPDATE players SET hp = ?, energy = energy - 1 WHERE id = ?", [playerHp, playerId], (err) => {
                        if (err) {
                            console.error(err.message);
                            return message.reply("Une erreur est survenue lors de la mise à jour de votre profil.");
                        }
                        message.reply(resultMessage);
                    });
                });
            });
        });
    },
    async runInteraction(client, interaction) {
        const playerId = interaction.user.id;
        await interaction.deferReply();
        db.get("SELECT * FROM players WHERE id = ?", [playerId], (err, player) => {
            if (err) {
                console.error(err.message);
                return interaction.editReply("Une erreur est survenue lors de la récupération de votre profil.");
            }
            if (!player) {
                return interaction.editReply("Vous n'avez pas encore de profil. Utilisez la commande `start` pour commencer.");
            }
            if (player.energy <= 0) {
                return interaction.editReply("Vous n'avez plus d'énergie pour combattre.");
            }
            db.get("SELECT * FROM player_quests WHERE player_id = ? AND status = 'in_progress'", [playerId], (err, playerQuest) => {
                if (err) {
                    console.error(err.message);
                    return interaction.editReply("Une erreur est survenue lors de la récupération de votre quête.");
                }
                if (!playerQuest) {
                    return interaction.editReply("Vous n'avez pas de quête en cours.");
                }
                db.get("SELECT * FROM quests WHERE id = ?", [playerQuest.quest_id], (err, quest) => {
                    if (err) {
                        console.error(err.message);
                        return interaction.editReply("Une erreur est survenue lors de la récupération des détails de la quête.");
                    }
                    if (!quest) {
                        return interaction.editReply("La quête spécifiée n'existe pas.");
                    }
                    let enemyHp = 10; // Points de vie de l'ennemi
                    let playerHp = player.hp; // Points de vie du joueur
                    let resultMessage = '';
                    while (enemyHp > 0 && playerHp > 0) {
                        // Simuler un tour de combat
                        const playerDamage = Math.max(0, Math.floor(Math.random() * player.attack) - 2); // Attaque du joueur
                        const enemyDamage = Math.max(0, Math.floor(Math.random() * 5) - player.defense); // Attaque de l'ennemi
                        enemyHp -= playerDamage;
                        playerHp -= enemyDamage;
                        resultMessage += `Vous avez infligé ${playerDamage} points de dégâts à l'ennemi.\nL'ennemi vous a infligé ${enemyDamage} points de dégâts.\n`;
                        if (enemyHp <= 0) {
                            resultMessage += "Vous avez vaincu l'ennemi !\n";
                            // Mettre à jour la progression de la quête
                            db.run("UPDATE player_quests SET progress = progress + 1 WHERE player_id = ? AND quest_id = ?", [playerId, quest.id], (err) => {
                                if (err) {
                                    console.error(err.message);
                                    return interaction.editReply("Une erreur est survenue lors de la mise à jour de la progression de la quête.");
                                }
                                // Vérifier si la quête est terminée
                                db.get("SELECT progress FROM player_quests WHERE player_id = ? AND quest_id = ?", [playerId, quest.id], (err, row) => {
                                    if (err) {
                                        console.error(err.message);
                                        return interaction.editReply("Une erreur est survenue lors de la vérification de la progression de la quête.");
                                    }
                                    if (row.progress >= 5) { // Condition de la quête : tuer 5 gobelins
                                        db.run("UPDATE player_quests SET status = 'completed' WHERE player_id = ? AND quest_id = ?", [playerId, quest.id], (err) => {
                                            if (err) {
                                                console.error(err.message);
                                                return interaction.editReply("Une erreur est survenue lors de la mise à jour de l'état de la quête.");
                                            }
                                            // Attribuer les récompenses
                                            const rewards = quest.reward.split(', ');
                                            let xp = parseInt(rewards[0].split(' ')[0]);
                                            let gold = parseInt(rewards[1].split(' ')[0]);
                                            db.run("UPDATE players SET xp = xp + ?, gold = gold + ? WHERE id = ?", [xp, gold, playerId], (err) => {
                                                if (err) {
                                                    console.error(err.message);
                                                    return interaction.editReply("Une erreur est survenue lors de l'attribution des récompenses.");
                                                }
                                                interaction.editReply("Félicitations ! Vous avez complété la première quête et gagné " + quest.reward + ".");
                                            });
                                        });
                                    } else {
                                        interaction.editReply(resultMessage);
                                    }
                                });
                            });
                        } else if (playerHp <= 0) {
                            resultMessage += "Vous avez été vaincu par l'ennemi.\n";
                            break;
                        } else {
                            resultMessage += `Il reste ${enemyHp} points de vie à l'ennemi.\nIl vous reste ${playerHp} points de vie.\n`;
                        }
                    }
                    // Mettre à jour les PV et l'énergie du joueur
                    db.run("UPDATE players SET hp = ?, energy = energy - 1 WHERE id = ?", [playerHp, playerId], (err) => {
                        if (err) {
                            console.error(err.message);
                            return interaction.editReply("Une erreur est survenue lors de la mise à jour de votre profil.");
                        }
                        interaction.editReply(resultMessage);
                    });
                });
            });
        });
    }
};