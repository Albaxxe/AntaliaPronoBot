// events/interactionCreate.js
const { 
  ChannelType,
  PermissionFlagsBits,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle 
} = require('discord.js');
const {
  openTicketDB,
  updateTicketCategoryAndMoveChannel,
  closeTicketService
} = require('../services/ticketService');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    // 1) Commandes slash
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;
      try {
        await command.execute(interaction);
      } catch (error) {
        console.error('Erreur exécution commande slash :', error);
      }
      return;
    }
    
    // 2) Autocomplete
    if (interaction.isAutocomplete()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;
      if (typeof command.autocomplete === 'function') {
        try {
          await command.autocomplete(interaction);
        } catch (error) {
          console.error('❌ Erreur Autocomplete :', error);
        }
      }
      return;
    }
    
    // 3) Boutons
    if (interaction.isButton()) {
      // Bouton "Créer un ticket"
      if (interaction.customId === 'create_ticket') {
        await interaction.deferReply({ ephemeral: true });
        const guild = interaction.guild;
        
        // Vérifier si l'utilisateur a déjà un ticket
        const existingChannel = guild.channels.cache.find(c => 
          c.name.startsWith('ticket-') && c.name.includes(interaction.user.id)
        );        
        if (existingChannel) {
          return interaction.followUp({ content: "Vous avez déjà un ticket ouvert.", ephemeral: true });
        }
        
        try {
          // Récupérer STAFF_ROLE_IDS
          const staffRolesEnv = process.env.STAFF_ROLE_IDS || '';
          if (!staffRolesEnv) {
            return interaction.followUp({ content: "Aucun rôle staff configuré (STAFF_ROLE_IDS).", ephemeral: true });
          }
          const staffRoleIds = staffRolesEnv.split(',').map(id => id.trim());
          
          // Permissions
          const permissionOverwrites = [
            {
              id: guild.id,
              deny: [PermissionFlagsBits.ViewChannel],
            },
            {
              id: interaction.user.id,
              allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.ReadMessageHistory
              ],
            }
          ];
          staffRoleIds.forEach(roleId => {
            permissionOverwrites.push({
              id: roleId,
              allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.ReadMessageHistory
              ],
            });
          });
          
          // Créer le salon
          const ticketCategoryId = process.env.TICKET_CATEGORY_ID || null;
          const channelName = `ticket-${interaction.user.id}`;
          const ticketChannel = await guild.channels.create({
            name: channelName,
            type: ChannelType.GuildText,
            parent: ticketCategoryId,
            permissionOverwrites
          });
          console.log(`Salon ticket créé: ${ticketChannel.id} pour ${interaction.user.tag}`);
          
          // Insérer en BDD
          await openTicketDB(ticketChannel.id, interaction.user.id);
          
          // Embed initial
          const ticketEmbed = new EmbedBuilder()
            .setColor('#3498db')
            .setTitle('🎟️ Ticket Ouvert')
            .setDescription(`Bonjour <@${interaction.user.id}> ! Sélectionnez la catégorie de votre demande via le menu ci-dessous.`)
            .setTimestamp();
          
          // Menu déroulant (catégorie)
          const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('ticket_category_select')
            .setPlaceholder('Choisissez une catégorie')
            .addOptions(
              { label: 'SAV', value: 'SAV' },
              { label: 'Question', value: 'Question' },
              { label: 'Problème Technique', value: 'Problème Technique' },
              { label: 'Autre', value: 'Autre' }
            );
          const selectRow = new ActionRowBuilder().addComponents(selectMenu);
          
          // Bouton "Fermer le ticket"
          const closeButton = new ButtonBuilder()
            .setCustomId('close_ticket')
            .setLabel('Fermer le ticket')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('🔒');
          const buttonRow = new ActionRowBuilder().addComponents(closeButton);
          
          await ticketChannel.send({
            content: `<@${interaction.user.id}>`,
            embeds: [ticketEmbed],
            components: [selectRow, buttonRow]
          });
          
          await interaction.followUp({ content: `Votre ticket a été créé : ${ticketChannel}`, ephemeral: true });
        } catch (err) {
          console.error('Erreur lors de la création du ticket :', err);
          return interaction.followUp({ content: "Une erreur est survenue lors de la création du ticket.", ephemeral: true });
        }
      }
      // Bouton "Fermer le ticket"
      else if (interaction.customId === 'close_ticket') {
        await interaction.deferReply({ ephemeral: true });
        try {
          // Fermer en BDD
          await closeTicketService(interaction.channel.id);
          // Supprimer le salon
          await interaction.channel.delete();
        } catch (err) {
          console.error('Erreur fermeture ticket :', err);
          await interaction.followUp({ content: "Erreur lors de la fermeture du ticket.", ephemeral: true });
        }
      }
    }
    
    // 4) Menu "ticket_category_select"
    if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_category_select') {
      const chosenCategory = interaction.values[0];
      try {
        // Renommer
        await interaction.channel.setName(`ticket-${chosenCategory}-${interaction.user.id}`);
        console.log(`Salon renommé en ticket-${chosenCategory}-${interaction.user.id}`);
        
        // Mettre à jour BDD + déplacer salon
        await updateTicketCategoryAndMoveChannel(interaction.channel, chosenCategory);
        
        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor('#2ecc71')
              .setTitle(`Catégorie définie : ${chosenCategory}`)
              .setDescription(`Votre ticket est désormais classé en **${chosenCategory}**. Le staff vous répondra bientôt !`)
              .setTimestamp()
          ],
          ephemeral: true
        });
      } catch (error) {
        console.error('Erreur set catégorie ticket :', error);
        await interaction.reply({ content: "Une erreur est survenue lors de la configuration de la catégorie.", ephemeral: true });
      }
    }
  }
};
