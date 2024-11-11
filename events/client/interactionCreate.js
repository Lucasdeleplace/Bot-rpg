const ownerId = '371386482717622273';

module.exports = {
    name: 'interactionCreate',
    once: false,
    async execute(client,interaction) {

        if (interaction.isCommand()) {
            const cmd = client.commands.get(interaction.commandName);
            if (!cmd) return interaction.reply("Cette commande n'existe pas!");

            if(cmd.ownerOnly) {
                if (interaction.user.id !== ownerId) return interaction.reply('La seule personne pouvant taper cette commande est Shivii');
            }

            if(!interaction.member.permissions.has([cmd.permissions])) return interaction.reply({ content : `Vous n'avez pas les permissions requises pour taper cette commande! (\`${cmd.permissions.join( ', ' )}\`)`, ephemeral: true})

            cmd.runInteraction(client, interaction);
        } 
    }
};