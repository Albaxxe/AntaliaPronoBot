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
    // ----------------------------
    // 1) Gestion des commandes slash
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;
      try {
        await command.execute(interaction);
      } catch (error) {
        console.error('Erreur lors de l’exécution de la commande slash :', error);
      }
      return;
    }

    // ----------------------------
    // 2) Gestion de l'autocomplete
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

    // ----------------------------
    // 3) Gestion des interactions boutons
    if (interaction.isButton()) {
      // Bouton "Créer un ticket"
      if (interaction.customId === 'create_ticket') {
        try {
          await interaction.deferReply({ ephemeral: true });
          const guild = interaction.guild;

          // Débogage : lister les salons texte contenant l'ID de l'utilisateur
          const matchingChannels = guild.channels.cache
            .filter(c => c.type === ChannelType.GuildText && c.name.includes(interaction.user.id))
            .map(c => c.name);
          console.log("Salons existants pour cet utilisateur :", matchingChannels);

          // Recherche uniquement dans les salons texte dont le nom commence par "ticket-"
          const existingChannel = guild.channels.cache
            .filter(c => c.type === ChannelType.GuildText)
            .find(c => c.name.startsWith('ticket-') && c.name.includes(interaction.user.id));

          if (existingChannel) {
            console.log(`Ticket déjà ouvert : ${existingChannel.name}`);
            return interaction.followUp({ content: "Vous avez déjà un ticket ouvert.", ephemeral: true });
          }

          // Récupération des rôles staff depuis STAFF_ROLE_IDS dans le .env
          const staffRolesEnv = process.env.STAFF_ROLE_IDS || '';
          if (!staffRolesEnv) {
            return interaction.followUp({ content: "Aucun rôle staff configuré (STAFF_ROLE_IDS).", ephemeral: true });
          }
          const staffRoleIds = staffRolesEnv.split(',').map(id => id.trim());
          // Vérifier que chaque rôle existe sur le serveur
          const invalidRoles = staffRoleIds.filter(id => !guild.roles.cache.has(id));
          if (invalidRoles.length > 0) {
            return interaction.followUp({ content: `Les rôles suivants sont introuvables sur ce serveur : ${invalidRoles.join(', ')}`, ephemeral: true });
          }

          // Construction des permissionOverwrites
          const permissionOverwrites = [
            {
              id: guild.id,
              deny: [PermissionFlagsBits.ViewChannel],
            },
            {
              id: interaction.user.id,
              allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
            }
          ];
          staffRoleIds.forEach(roleId => {
            permissionOverwrites.push({
              id: roleId,
              allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
            });
          });

          // Créer le salon de ticket
          const ticketCategoryId = process.env.TICKET_CATEGORY_ID || null;
          const channelName = `ticket-${interaction.user.id}`;
          const ticketChannel = await guild.channels.create({
            name: channelName,
            type: ChannelType.GuildText,
            parent: ticketCategoryId,
            permissionOverwrites
          });
          console.log(`Salon ticket créé: ${ticketChannel.id} pour ${interaction.user.tag}`);

          // Insertion en BDD du ticket
          const newTicket = await openTicketDB(ticketChannel.id, interaction.user.id);
          console.log('Ticket inséré en BDD :', newTicket);

          // Création de l'embed initial pour le ticket
          const ticketEmbed = new EmbedBuilder()
            .setColor('#3498db')
            .setTitle('🎟️ Ticket Ouvert')
            .setDescription(`Bonjour <@${interaction.user.id}> !\nVeuillez sélectionner la catégorie de votre demande via le menu ci-dessous.`)
            .addFields(
              { name: 'Statut', value: 'Ouvert', inline: true },
              { name: 'Date', value: `<t:${Math.floor(Date.now()/1000)}:F>`, inline: true }
            )
            .setThumbnail('https://cdn-icons-png.flaticon.com/512/906/906794.png')
            .setFooter({ text: 'Service Support' })
            .setTimestamp();

          // Créer le menu déroulant pour la catégorie
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

          // Envoyer l'embed dans le salon ticket
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
        try {
          await interaction.deferReply({ ephemeral: true });
          // Mettre à jour la BDD pour fermer le ticket
          await closeTicketService(interaction.channel.id);
          // Supprimer le salon
          await interaction.channel.delete();
        } catch (err) {
          console.error('Erreur lors de la fermeture du ticket :', err);
          await interaction.followUp({ content: "Une erreur est survenue lors de la fermeture du ticket.", ephemeral: true });
        }
      }
    }

    // ----------------------------
    // 4) Gestion du menu déroulant "ticket_category_select"
    if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_category_select') {
      const chosenCategory = interaction.values[0];
      try {
        // Renommer le salon pour inclure la catégorie
        await interaction.channel.setName(`ticket-${chosenCategory}-${interaction.user.id}`);
        console.log(`Salon renommé en: ticket-${chosenCategory}-${interaction.user.id}`);
        
        // Mettre à jour la catégorie en BDD et déplacer le salon dans la bonne catégorie
        await updateTicketCategoryAndMoveChannel(interaction.channel, chosenCategory);
        
        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor('#2ecc71')
              .setTitle(`Catégorie définie : ${chosenCategory}`)
              .setDescription(`Votre ticket est maintenant classé en **${chosenCategory}**. Un membre du staff vous répondra bientôt !`)
              .setTimestamp()
          ],
          ephemeral: true
        });
      } catch (error) {
        console.error('Erreur lors de la mise à jour de la catégorie du ticket :', error);
        await interaction.reply({ content: "Une erreur est survenue lors de la configuration de votre ticket.", ephemeral: true });
      }
    }
  }
};
