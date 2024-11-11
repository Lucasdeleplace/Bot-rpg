const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./rpg-bot.db');

db.serialize(() => {
    db.run("CREATE TABLE IF NOT EXISTS players (id TEXT PRIMARY KEY, xp INTEGER, level INTEGER, gold INTEGER, current_chapter_id INTEGER, current_quest_id INTEGER, hp INTEGER, attack INTEGER, defense INTEGER, energy INTEGER, last_hp_update INTEGER, last_energy_update INTEGER)");
    db.run("CREATE TABLE IF NOT EXISTS chapters (id INTEGER PRIMARY KEY, name TEXT, description TEXT, reward TEXT, dialogue TEXT)");
    db.run("CREATE TABLE IF NOT EXISTS quests (id INTEGER PRIMARY KEY, chapter_id INTEGER, name TEXT, description TEXT, reward TEXT, condition TEXT, dialogue TEXT, enemy TEXT, FOREIGN KEY(chapter_id) REFERENCES chapters(id))");
    db.run("CREATE TABLE IF NOT EXISTS player_quests (player_id TEXT, quest_id INTEGER, status TEXT, progress INTEGER, FOREIGN KEY(player_id) REFERENCES players(id), FOREIGN KEY(quest_id) REFERENCES quests(id))");

    // Ajout des colonnes si elles n'existent pas
    db.all("PRAGMA table_info(players)", (err, columns) => {
        if (err) {
            console.error(err.message);
            return;
        }
        const columnNames = columns.map(column => column.name);
        if (!columnNames.includes('last_hp_update')) {
            db.run("ALTER TABLE players ADD COLUMN last_hp_update INTEGER", (err) => {
                if (err) {
                    console.error(err.message);
                } else {
                    console.log("Colonne 'last_hp_update' ajoutée à la table 'players'.");
                }
            });
        }
        if (!columnNames.includes('last_energy_update')) {
            db.run("ALTER TABLE players ADD COLUMN last_energy_update INTEGER", (err) => {
                if (err) {
                    console.error(err.message);
                } else {
                    console.log("Colonne 'last_energy_update' ajoutée à la table 'players'.");
                }
            });
        }
    });

    // Insertion des chapitres et quêtes de base
    db.run("INSERT OR IGNORE INTO chapters (id, name, description, reward, dialogue) VALUES (1, 'Chapitre 1', 'Le début de l''aventure', '100 XP, 50 Gold', 'Bienvenue dans le premier chapitre de votre aventure!')");
    db.run("INSERT OR IGNORE INTO quests (id, chapter_id, name, description, reward, condition, dialogue, enemy) VALUES (1, 1, 'Quête 1', 'La première quête', '50 XP, 20 Gold', 'Tuer 5 gobelins', 'Bonne chance pour votre première quête', 'gobelin')");
});

module.exports = db;