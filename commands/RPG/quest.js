const { MessageEmbed } = require("discord.js");
const db = require("../../utils/database");

module.exports = {
  name: "quest",
  category: "RPG",
  permissions: ["SEND_MESSAGES"],
  ownerOnly: false,
  usage: "quest <start|list|current|progress> [quest_id]",
  examples: [
    "quest start 1",
    "quest list",
    "quest current",
    "quest progress 1",
  ],
  description: "Gère les quêtes du jeu",
  options: [
    {
      name: "list",
      description: "Affiche les quêtes du chapitre en cours",
      type: "SUB_COMMAND",
    },
    {
      name: "start",
      description: "Commence une quête",
      type: "SUB_COMMAND",
      options: [
        {
          name: "quest_id",
          description: "ID de la quête",
          type: "INTEGER",
          required: true,
        },
      ],
    },
    {
      name: "current",
      description: "Affiche la quête en cours",
      type: "SUB_COMMAND",
    },
    {
      name: "progress",
      description: "Met à jour la progression d'une quête",
      type: "SUB_COMMAND",
      options: [
        {
          name: "quest_id",
          description: "ID de la quête",
          type: "INTEGER",
          required: true,
        },
        {
          name: "progress",
          description: "Progression de la quête",
          type: "INTEGER",
          required: true,
        },
      ],
    },
  ],
  async run(client, message, args) {
    const subcommand = args[0];
    if (subcommand === "list") {
      db.get(
        "SELECT current_chapter_id FROM players WHERE id = ?",
        [message.author.id],
        (err, row) => {
          if (err) {
            console.error(err.message);
            return message.reply(
              "Une erreur est survenue lors de la récupération du chapitre en cours."
            );
          }
          if (!row || !row.current_chapter_id) {
            return message.reply("Vous n'avez pas de chapitre en cours.");
          }
          const chapterId = row.current_chapter_id;
          db.all(
            "SELECT * FROM quests WHERE chapter_id = ?",
            [chapterId],
            (err, rows) => {
              if (err) {
                console.error(err.message);
                return message.reply(
                  "Une erreur est survenue lors de la récupération des quêtes."
                );
              }
              const embed = new MessageEmbed()
                .setTitle(`Quêtes du chapitre ${chapterId}`)
                .setColor("RANDOM");
              rows.forEach((row) => {
                const questDescription = `Récompense: ${row.reward}\nCondition: ${row.condition}\nDialogue: ${row.dialogue}`;
                embed.addField(`Quête ${row.id}: ${row.name}`, questDescription);
              });
              message.channel.send({ embeds: [embed] });
            }
          );
        }
      );
    } else if (subcommand === "start") {
      const questId = args[1];
      if (!questId) {
        return message.reply(
          "Veuillez spécifier l'ID de la quête à commencer."
        );
      }
      db.get("SELECT * FROM quests WHERE id = ?", [questId], (err, row) => {
        if (err) {
          console.error(err.message);
          return message.reply(
            "Une erreur est survenue lors de la récupération de la quête."
          );
        }
        if (!row) {
          return message.reply("Cette quête n'existe pas.");
        }
        // Vérifier si la quête est déjà terminée
        db.get(
          "SELECT * FROM player_quests WHERE player_id = ? AND quest_id = ?",
          [message.author.id, questId],
          (err, playerQuest) => {
            if (err) {
              console.error(err.message);
              return message.reply(
                "Une erreur est survenue lors de la vérification de la quête."
              );
            }
            if (playerQuest && playerQuest.status === "completed") {
              return message.reply("Vous avez déjà terminé cette quête.");
            }
            // Commencer la quête pour le joueur
            db.run(
              "INSERT INTO player_quests (player_id, quest_id, status, progress) VALUES (?, ?, ?, ?)",
              [message.author.id, questId, "in_progress", 0],
              (err) => {
                if (err) {
                  console.error(err.message);
                  return message.reply(
                    "Une erreur est survenue lors de la création de la quête."
                  );
                }
                // Mettre à jour la quête en cours pour le joueur
                db.run(
                  "UPDATE players SET current_quest_id = ? WHERE id = ?",
                  [questId, message.author.id],
                  (err) => {
                    if (err) {
                      console.error(err.message);
                      return message.reply(
                        "Une erreur est survenue lors de la mise à jour de la quête en cours."
                      );
                    }
                    const embed = new MessageEmbed()
                      .setTitle(`Quête ${row.id}: ${row.name}`)
                      .setDescription(
                        `${row.description}\nRécompense: ${row.reward}\nCondition: ${row.condition}\nDialogue: ${row.dialogue}`
                      )
                      .setColor("GREEN");
                    message.channel.send({ embeds: [embed] });
                  }
                );
              }
            );
          }
        );
      });
    } else if (subcommand === "current") {
      db.get(
        "SELECT current_quest_id FROM players WHERE id = ?",
        [message.author.id],
        (err, row) => {
          if (err) {
            console.error(err.message);
            return message.reply(
              "Une erreur est survenue lors de la récupération de la quête en cours."
            );
          }
          if (!row || !row.current_quest_id) {
            return message.reply("Vous n'avez pas de quête en cours.");
          }
          const questId = row.current_quest_id;
          db.get(
            "SELECT * FROM quests WHERE id = ?",
            [questId],
            (err, quest) => {
              if (err) {
                console.error(err.message);
                return message.reply(
                  "Une erreur est survenue lors de la récupération de la quête."
                );
              }
              const embed = new MessageEmbed()
                .setTitle(`Quête en cours: ${quest.name}`)
                .setDescription(
                  `${quest.description}\nRécompense: ${quest.reward}\nCondition: ${quest.condition}\nDialogue: ${quest.dialogue}`
                )
                .setColor("BLUE");
              message.channel.send({ embeds: [embed] });
            }
          );
        }
      );
    } else if (subcommand === "progress") {
      const questId = args[1];
      const progress = args[2];
      if (!questId || !progress) {
        return message.reply(
          "Veuillez spécifier l'ID de la quête et la progression."
        );
      }
      db.get(
        "SELECT * FROM player_quests WHERE player_id = ? AND quest_id = ?",
        [message.author.id, questId],
        (err, row) => {
          if (err) {
            console.error(err.message);
            return message.reply(
              "Une erreur est survenue lors de la récupération de la quête."
            );
          }
          if (!row) {
            return message.reply("Vous n'avez pas commencé cette quête.");
          }
          // Mettre à jour la progression de la quête
          db.run(
            "UPDATE player_quests SET progress = ? WHERE player_id = ? AND quest_id = ?",
            [progress, message.author.id, questId],
            (err) => {
              if (err) {
                console.error(err.message);
                return message.reply(
                  "Une erreur est survenue lors de la mise à jour de la progression de la quête."
                );
              }
              // Vérifier si la quête est terminée
              db.get(
                "SELECT * FROM quests WHERE id = ?",
                [questId],
                (err, quest) => {
                  if (err) {
                    console.error(err.message);
                    return message.reply(
                      "Une erreur est survenue lors de la récupération de la quête."
                    );
                  }
                  if (progress >= 5) { // Condition de la quête : tuer 5 gobelins
                    db.run(
                      "UPDATE player_quests SET status = 'completed' WHERE player_id = ? AND quest_id = ?",
                      [message.author.id, questId],
                      (err) => {
                        if (err) {
                          console.error(err.message);
                          return message.reply(
                            "Une erreur est survenue lors de la mise à jour de l'état de la quête."
                          );
                        }
                        // Attribuer les récompenses
                        const rewards = quest.reward.split(', ');
                        let xp = parseInt(rewards[0].split(' ')[0]);
                        let gold = parseInt(rewards[1].split(' ')[0]);
                        db.run(
                          "UPDATE players SET xp = xp + ?, gold = gold + ? WHERE id = ?",
                          [xp, gold, message.author.id],
                          (err) => {
                            if (err) {
                              console.error(err.message);
                              return message.reply(
                                "Une erreur est survenue lors de l'attribution des récompenses."
                              );
                            }
                            message.reply(
                              "Félicitations ! Vous avez complété la quête et gagné " +
                                quest.reward +
                                "."
                            );
                          }
                        );
                      }
                    );
                  } else {
                    message.reply(
                      `Progression de la quête mise à jour : ${progress}/5`
                    );
                  }
                }
              );
            }
          );
        }
      );
    }
  },

  async runInteraction(client, interaction) {
    const subcommand = interaction.options.getSubcommand();
    if (subcommand === "list") {
      db.get(
        "SELECT current_chapter_id FROM players WHERE id = ?",
        [interaction.user.id],
        (err, row) => {
          if (err) {
            console.error(err.message);
            return interaction.reply(
              "Une erreur est survenue lors de la récupération du chapitre en cours."
            );
          }
          if (!row || !row.current_chapter_id) {
            return interaction.reply("Vous n'avez pas de chapitre en cours.");
          }
          const chapterId = row.current_chapter_id;
          db.all(
            "SELECT * FROM quests WHERE chapter_id = ?",
            [chapterId],
            (err, rows) => {
              if (err) {
                console.error(err.message);
                return interaction.reply(
                  "Une erreur est survenue lors de la récupération des quêtes."
                );
              }
              const embed = new MessageEmbed()
                .setTitle(`Quêtes du chapitre ${chapterId}`)
                .setColor("RANDOM");
              rows.forEach((row) => {
                const questDescription = `Récompense: ${row.reward}\nCondition: ${row.condition}\nDialogue: ${row.dialogue}`;
                embed.addField(`Quête ${row.id}: ${row.name}`, questDescription);
              });
              interaction.reply({ embeds: [embed] });
            }
          );
        }
      );
    } else if (subcommand === "start") {
      const questId = interaction.options.getInteger("quest_id");
      db.get("SELECT * FROM quests WHERE id = ?", [questId], (err, row) => {
        if (err) {
          console.error(err.message);
          return interaction.reply(
            "Une erreur est survenue lors de la récupération de la quête."
          );
        }
        if (!row) {
          return interaction.reply("Cette quête n'existe pas.");
        }
        // Vérifier si la quête est déjà terminée
        db.get(
          "SELECT * FROM player_quests WHERE player_id = ? AND quest_id = ?",
          [interaction.user.id, questId],
          (err, playerQuest) => {
            if (err) {
              console.error(err.message);
              return interaction.reply(
                "Une erreur est survenue lors de la vérification de la quête."
              );
            }
            if (playerQuest && playerQuest.status === "completed") {
              return interaction.reply("Vous avez déjà terminé cette quête.");
            }
            // Commencer la quête pour le joueur
            db.run(
              "INSERT INTO player_quests (player_id, quest_id, status, progress) VALUES (?, ?, ?, ?)",
              [interaction.user.id, questId, "in_progress", 0],
              (err) => {
                if (err) {
                  console.error(err.message);
                  return interaction.reply(
                    "Une erreur est survenue lors de la création de la quête."
                  );
                }
                // Mettre à jour la quête en cours pour le joueur
                db.run(
                  "UPDATE players SET current_quest_id = ? WHERE id = ?",
                  [questId, interaction.user.id],
                  (err) => {
                    if (err) {
                      console.error(err.message);
                      return interaction.reply(
                        "Une erreur est survenue lors de la mise à jour de la quête en cours."
                      );
                    }
                    const embed = new MessageEmbed()
                      .setTitle(`Quête ${row.id}: ${row.name}`)
                      .setDescription(
                        `${row.description}\nRécompense: ${row.reward}\nCondition: ${row.condition}\nDialogue: ${row.dialogue}`
                      )
                      .setColor("GREEN");
                    interaction.reply({ embeds: [embed] });
                  }
                );
              }
            );
          }
        );
      });
    } else if (subcommand === "current") {
      db.get(
        "SELECT current_quest_id FROM players WHERE id = ?",
        [interaction.user.id],
        (err, row) => {
          if (err) {
            console.error(err.message);
            return interaction.reply(
              "Une erreur est survenue lors de la récupération de la quête en cours."
            );
          }
          if (!row || !row.current_quest_id) {
            return interaction.reply("Vous n'avez pas de quête en cours.");
          }
          const questId = row.current_quest_id;
          db.get(
            "SELECT * FROM quests WHERE id = ?",
            [questId],
            (err, quest) => {
              if (err) {
                console.error(err.message);
                return interaction.reply(
                  "Une erreur est survenue lors de la récupération de la quête."
                );
              }
              const embed = new MessageEmbed()
                .setTitle(`Quête en cours: ${quest.name}`)
                .setDescription(
                  `${quest.description}\nRécompense: ${quest.reward}\nCondition: ${quest.condition}\nDialogue: ${quest.dialogue}`
                )
                .setColor("BLUE");
              interaction.reply({ embeds: [embed] });
            }
          );
        }
      );
    } else if (subcommand === "progress") {
      const questId = interaction.options.getInteger("quest_id");
      const progress = interaction.options.getInteger("progress");
      db.get(
        "SELECT * FROM player_quests WHERE player_id = ? AND quest_id = ?",
        [interaction.user.id, questId],
        (err, row) => {
          if (err) {
            console.error(err.message);
            return interaction.reply(
              "Une erreur est survenue lors de la récupération de la quête."
            );
          }
          if (!row) {
            return interaction.reply("Vous n'avez pas commencé cette quête.");
          }
          // Mettre à jour la progression de la quête
          db.run(
            "UPDATE player_quests SET progress = ? WHERE player_id = ? AND quest_id = ?",
            [progress, interaction.user.id, questId],
            (err) => {
              if (err) {
                console.error(err.message);
                return interaction.reply(
                  "Une erreur est survenue lors de la mise à jour de la progression de la quête."
                );
              }
              // Vérifier si la quête est terminée
              db.get(
                "SELECT * FROM quests WHERE id = ?",
                [questId],
                (err, quest) => {
                  if (err) {
                    console.error(err.message);
                    return interaction.reply(
                      "Une erreur est survenue lors de la récupération de la quête."
                    );
                  }
                  if (progress >= 5) { // Condition de la quête : tuer 5 gobelins
                    db.run(
                      "UPDATE player_quests SET status = 'completed' WHERE player_id = ? AND quest_id = ?",
                      [interaction.user.id, questId],
                      (err) => {
                        if (err) {
                          console.error(err.message);
                          return interaction.reply(
                            "Une erreur est survenue lors de la mise à jour de l'état de la quête."
                          );
                        }
                        // Attribuer les récompenses
                        const rewards = quest.reward.split(', ');
                        let xp = parseInt(rewards[0].split(' ')[0]);
                        let gold = parseInt(rewards[1].split(' ')[0]);
                        db.run(
                          "UPDATE players SET xp = xp + ?, gold = gold + ? WHERE id = ?",
                          [xp, gold, interaction.user.id],
                          (err) => {
                            if (err) {
                              console.error(err.message);
                              return interaction.reply(
                                "Une erreur est survenue lors de l'attribution des récompenses."
                              );
                            }
                            interaction.reply(
                              "Félicitations ! Vous avez complété la quête et gagné " +
                                quest.reward +
                                "."
                            );
                          }
                        );
                      }
                    );
                  } else {
                    interaction.reply(
                      `Progression de la quête mise à jour : ${progress}/5`
                    );
                  }
                }
              );
            }
          );
        }
      );
    }
  },
};