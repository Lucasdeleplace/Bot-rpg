const ownerId = '371386482717622273';

module.exports = {
    name: 'messageCreate',
    once: false,
    async execute(client, message) {
        const prefix = '!'

        if (message.author.bot) return;
        if (!message.content.toLowerCase().startsWith(prefix)) return;

        const args = message.content.slice(prefix.length).trim().split(/ +/g);
        const cmdName = args.shift().toLowerCase();
        if (cmdName.length === 0) return;

        let cmd = client.commands.get(cmdName);
        if (!cmd) return message.reply("Cette commande n'existe pas!");

        if(cmd.ownerOnly) {
            if (message.author.id !== ownerId) return message.reply('La seule personne pouvant taper cette commande est Shivii');
        }

        if(!message.member.permissions.has([cmd.permissions])) return message.reply(`Vous n'avez pas les permissions requises pour taper cette commande! (\`${cmd.permissions.join( ', ' )}\`)`)
        
        if(cmd) cmd.run(client, message, args);
    }
}