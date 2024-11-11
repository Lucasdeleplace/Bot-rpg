const Logger = require('../../utils/Logger')

module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        let guildsCount = await client.guilds.fetch();
        let usersCount = await client.guilds.cache.reduce((a, g) => a + g.memberCount, 0)

        Logger.client(`- prêt à être utilisé par ${usersCount} utilisateurs sur ${guildsCount.size} serveurs !\n`);

        client.user.setPresence({ activities: [{ name: 'Rpg-bot', type: "WATCHING"}], status: 'online'});

        const devGuild = await client.guilds.cache.get('1195758369319960696');
        devGuild.commands.set(client.commands.map(cmd => cmd));
    },
};