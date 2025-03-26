// src/events/interactionCreate.js
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
  updateTicketCategoryAndMoveChannel,
  closeTicketService 
} = require('../services/ticketService');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    // 1) Gestion des commandes slash
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;
      try {
        await command.execute(interaction);
      } catch (error) {
        console.error('Erreur lors de l\'exécution de la commande slash :', error);
      }
      return;
    }
    
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
    
    // 3) Gestion des interactions boutons
    if (interaction.isButton()) {
      // Bouton "Créer un ticket" (venant du panel)
      if (interaction.customId === 'create_ticket') {
        try {
          await interaction.deferReply({ ephemeral: true });
          const guild = interaction.guild;
          
          // Vérifier si l'utilisateur a déjà un ticket ouvert
          const existingChannel = guild.channels.cache.find(c => c.name === `ticket-${interaction.user.id}`);
          if (existingChannel) {
            return interaction.followUp({ content: "Vous avez déjà un ticket ouvert.", ephemeral: true });
          }
          
          // Récupérer la variable STAFF_ROLE_IDS depuis le .env (gérée dans le service ticketService.js par ailleurs)
          // Ici, on suppose que la création du salon et l'insertion en BDD se font directement dans ce bloc
          // (la logique d'insertion en BDD devrait être dans ticketDBService.js, appelée via le service métier)
          
          // Construction des permissions
          const staffRolesEnv = process.env.STAFF_ROLE_IDS;
          if (!staffRolesEnv) {
            return interaction.followUp({ content: "Aucun rôle staff n'est configuré (STAFF_ROLE_IDS).", ephemeral: true });
          }
          const staffRoleIds = staffRolesEnv.split(',').map(id => id.trim());
          // Vérification minimale des rôles présents dans le serveur
          const invalidRoles = staffRoleIds.filter(id => !guild.roles.cache.has(id));
          if (invalidRoles.length > 0) {
            return interaction.followUp({ content: `Les rôles suivants sont introuvables sur ce serveur : ${invalidRoles.join(', ')}`, ephemeral: true });
          }
          
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
          
          // Insertion en BDD via createTicket (appelé dans ticketDBService.js via le service métier)
          // Par exemple, si openTicket() est dans un service métier, il aura été appelé dans la commande de création
          // Ici, pour simplifier, on ne l'inclut pas directement, mais assure-toi qu'une insertion a lieu.
          
          // Créer l'embed initial pour le salon ticket (amélioré)
          const ticketEmbed = new EmbedBuilder()
            .setColor('#3498db')
            .setTitle('🎟️ Ticket Ouvert')
            .setDescription(`Bonjour <@${interaction.user.id}> ! Merci d'avoir ouvert un ticket.\n\nVeuillez sélectionner la catégorie de votre demande via le menu ci-dessous.`)
            .addFields(
              { name: 'Statut', value: 'Ouvert', inline: true },
              { name: 'Date', value: `<t:${Math.floor(Date.now()/1000)}:F>`, inline: true }
            )
            .setThumbnail('https://cdn-icons-png.flaticon.com/512/906/906794.png')
            .setFooter({ text: 'Service Support', iconURL: 'https://cdn-icons-png.flaticon.com/512/906/906794.png' })
            .setTimestamp();
          
          // Créer le menu déroulant pour choisir la catégorie
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
          
          // Bouton pour fermer le ticket
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
            components: [selectRow, buttonRow],
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
          // Mise à jour en BDD (fermeture du ticket)
          await closeTicketService(interaction.channel.id);
          // Supprimer le salon
          await interaction.channel.delete();
        } catch (err) {
          console.error('Erreur lors de la fermeture du ticket :', err);
          await interaction.followUp({ content: "Une erreur est survenue lors de la fermeture du ticket.", ephemeral: true });
        }
      }
    }
    
    // 4) Gestion des menus déroulants pour la sélection de catégorie
    if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_category_select') {
      const chosenCategory = interaction.values[0];
      try {
        // Renommer le salon pour y inclure la catégorie
        await interaction.channel.setName(`ticket-${chosenCategory}-${interaction.user.id}`);
        console.log(`Salon renommé en: ticket-${chosenCategory}-${interaction.user.id}`);
        
        // Mettre à jour la BDD et déplacer le salon dans la catégorie Discord correspondante
        await updateTicketCategoryAndMoveChannel(interaction.channel, chosenCategory);
        
        // Répondre à l'interaction
        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor('#2ecc71')
              .setTitle(`Catégorie définie : ${chosenCategory}`)
              .setDescription(`Votre ticket est maintenant classé dans la catégorie **${chosenCategory}**.\nUn membre du staff vous répondra bientôt !`)
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
