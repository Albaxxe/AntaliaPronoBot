// src/events/interactionCreate.js
const {
  ChannelType,
  PermissionFlagsBits,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    // 1) Gestion des commandes slash (si tu en as)
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;
      try {
        await command.execute(interaction);
      } catch (error) {
        console.error(error);
      }
      return;
    }

    // 2) Gestion de l'autocomplete (si tu en as)
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

    // 3) Gestion des boutons
    if (interaction.isButton()) {
      // Bouton "Créer un ticket"
      if (interaction.customId === 'create_ticket') {
        await interaction.deferReply({ ephemeral: true });
        const guild = interaction.guild;

        // Lecture de la variable STAFF_ROLE_IDS
        const staffRolesEnv = process.env.STAFF_ROLE_IDS; 
        if (!staffRolesEnv) {
          return interaction.followUp({
            content: "Aucun rôle staff n'est configuré (STAFF_ROLE_IDS). Vérifiez votre `.env`.",
            ephemeral: true,
          });
        }

        // Conversion en tableau (on enlève les espaces éventuels)
        const staffRoleIds = staffRolesEnv.split(',').map(id => id.trim());
        console.log('STAFF_ROLE_IDS (tableau) :', staffRoleIds);

        // Vérifier si chaque rôle existe sur ce serveur
        const invalidRoles = staffRoleIds.filter(roleId => !guild.roles.cache.has(roleId));
        if (invalidRoles.length > 0) {
          return interaction.followUp({
            content: `Les rôles suivants sont introuvables sur ce serveur : ${invalidRoles.join(', ')}`,
            ephemeral: true,
          });
        }

        // Vérifier si l'utilisateur a déjà un ticket
        const existingChannel = guild.channels.cache.find(c => c.name === `ticket-${interaction.user.id}`);
        if (existingChannel) {
          return interaction.followUp({
            content: "Vous avez déjà un ticket ouvert.",
            ephemeral: true,
          });
        }

        // Construire les permissions
        // 1) Bloquer @everyone
        const permissionOverwrites = [
          {
            id: guild.id, // @everyone
            deny: [PermissionFlagsBits.ViewChannel],
          },
          {
            id: interaction.user.id, // L'utilisateur
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory,
            ],
          },
        ];

        // 2) Ajouter chaque rôle staff
        staffRoleIds.forEach(roleId => {
          permissionOverwrites.push({
            id: roleId,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory,
            ],
          });
        });

        // Création du salon
        const ticketCategoryId = process.env.TICKET_CATEGORY_ID || null;
        const channelName = `ticket-${interaction.user.id}`;

        try {
          const ticketChannel = await guild.channels.create({
            name: channelName,
            type: ChannelType.GuildText,
            parent: ticketCategoryId,
            permissionOverwrites,
          });

          // Embed initial
          const ticketEmbed = new EmbedBuilder()
            .setColor('#2ecc71')
            .setTitle('Ticket Ouvert')
            .setDescription(`Bonjour <@${interaction.user.id}> !\nSélectionnez la catégorie de votre demande.`)
            .setTimestamp();

          // Menu déroulant (catégorie)
          const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('ticket_category_select')
            .setPlaceholder('Choisissez une catégorie')
            .addOptions(
              { label: 'SAV', value: 'SAV' },
              { label: 'Question', value: 'Question' },
              { label: 'Problème Technique', value: 'Problème Technique' },
              { label: 'Autre', value: 'Autre' },
            );
          const selectRow = new ActionRowBuilder().addComponents(selectMenu);

          // Bouton "Fermer le ticket"
          const closeButton = new ButtonBuilder()
            .setCustomId('close_ticket')
            .setLabel('Fermer le ticket')
            .setStyle(ButtonStyle.Danger);
          const buttonRow = new ActionRowBuilder().addComponents(closeButton);

          await ticketChannel.send({
            content: `<@${interaction.user.id}>`,
            embeds: [ticketEmbed],
            components: [selectRow, buttonRow],
          });

          // Réponse éphémère pour confirmer
          await interaction.followUp({
            content: `Votre ticket a été créé : ${ticketChannel}`,
            ephemeral: true,
          });
        } catch (err) {
          console.error('Erreur lors de la création du salon de ticket :', err);
          return interaction.followUp({
            content: "Une erreur s'est produite lors de la création du salon de ticket.",
            ephemeral: true,
          });
        }
      }
      // Bouton "Fermer le ticket"
      else if (interaction.customId === 'close_ticket') {
        await interaction.deferReply({ ephemeral: true });
        try {
          await interaction.channel.delete();
        } catch (err) {
          console.error('Erreur lors de la fermeture du ticket :', err);
        }
      }
    }

    // 4) Gestion des menus déroulants
    if (interaction.isStringSelectMenu()) {
      if (interaction.customId === 'ticket_category_select') {
        const chosenCategory = interaction.values[0];
        await interaction.channel.setName(`ticket-${chosenCategory}-${interaction.user.id}`);
        await interaction.reply({
          content: `Catégorie définie : **${chosenCategory}**`,
          ephemeral: true,
        });
      }
    }
  },
};
