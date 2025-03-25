const { SlashCommandBuilder, AttachmentBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const path = require('path');
const fs = require('fs');
const db = require('../utils/database');

// Fonction utilitaire pour corriger les liens
function fixLink(url) {
  if (!url) return '#';
  if (!/^https?:\/\//i.test(url)) {
    return 'https://' + url.replace(/^\/\//, '');
  }
  return url;
}

// Fonction pour générer la requête fuzzy
async function fuzzyQuery(focusedValue, limit = 10) {
  const sql = `
    SELECT strteam
    FROM teams_lite
    WHERE LOWER(strteam)::text % $1::text
       OR LOWER(strteamshort)::text % $1::text
    ORDER BY GREATEST(
      similarity(LOWER(strteam)::text, $1::text),
      similarity(LOWER(strteamshort)::text, $1::text)
    ) DESC
    LIMIT $2;
  `;
  const { rows } = await db.query(sql, [focusedValue, limit]);
  return rows;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('teams')
    .setDescription("Afficher les infos d'une équipe (fuzzy + autocomplétion)")
    .addStringOption(option =>
      option
        .setName('nom')
        .setDescription("Nom de l'équipe (ex: PSG, Real...)")
        .setRequired(true)
        .setAutocomplete(true)
    ),

  // Autocomplétion
  async autocomplete(interaction) {
    const focusedValue = interaction.options.getFocused().toLowerCase();
    console.log('✅ [teams] Autocomplétion appelée :', focusedValue);
    try {
      const rows = await fuzzyQuery(focusedValue, 10);
      const choices = rows.map(r => ({
        name: r.strteam,
        value: r.strteam
      }));
      await interaction.respond(choices);
    } catch (error) {
      console.error('❌ Erreur Autocomplete /teams :', error);
      await interaction.respond([]);
    }
  },

  // Exécution de la commande
  async execute(interaction) {
    try {
      await interaction.deferReply();
    } catch (error) {
      console.error("Erreur deferReply /teams :", error);
      return;
    }

    const userInput = interaction.options.getString('nom').toLowerCase();

    try {
      const sql = `
        SELECT *
        FROM teams_lite
        WHERE LOWER(strteam)::text % $1::text
           OR LOWER(strteamshort)::text % $1::text
        ORDER BY GREATEST(
          similarity(LOWER(strteam)::text, $1::text),
          similarity(LOWER(strteamshort)::text, $1::text)
        ) DESC
        LIMIT 1;
      `;
      const { rows } = await db.query(sql, [userInput]);

      if (!rows.length) {
        return interaction.editReply({
          content: `❌ Aucune équipe trouvée pour "${userInput}".`,
          flags: 64
        });
      }

      const team = rows[0];
      // Corriger les liens utiles
      const siteLink = fixLink(team.strwebsite);
      const twitterLink = fixLink(team.strtwitter);
      const youtubeLink = fixLink(team.stryoutube);

      // Construction de l'embed amélioré
      const embed = new EmbedBuilder()
        .setColor('#1E90FF')
        .setTitle(`🏆 ${team.strteam || team.strteamshort}`)
        .setDescription(team.strdescriptionfr || "Aucune description disponible.")
        .addFields(
          { name: "Pays", value: team.strcountry || "Inconnu", inline: true },
          { name: "Année de création", value: team.intformedyear ? team.intformedyear.toString() : "Inconnue", inline: true },
          { name: "Stade", value: team.strstadium || "Inconnu", inline: false },
          { name: "Liens utiles", value: `[Site officiel](${siteLink}) | [Twitter](${twitterLink}) | [YouTube](${youtubeLink})`, inline: false }
        )
        .setFooter({ text: "Données fournies par TheSportsDB" })
        .setTimestamp();

      // Vérifier l'existence du logo local (dans le dossier /logos/)
      const logoPath = path.resolve(__dirname, '../logos/', `${team.idteam}.png`);
      if (fs.existsSync(logoPath)) {
        const imageBuffer = fs.readFileSync(logoPath);
        const attachment = new AttachmentBuilder(imageBuffer, { name: 'badge.png' });
        embed.setThumbnail('attachment://badge.png');
        await interaction.editReply({ embeds: [embed], files: [attachment] });
      } else if (team.strbadge) {
        embed.setThumbnail(team.strbadge);
        await interaction.editReply({ embeds: [embed] });
      } else {
        await interaction.editReply({ embeds: [embed] });
      }
    } catch (error) {
      console.error("❌ Erreur lors de /teams fuzzy :", error);
      try {
        await interaction.followUp({ content: 'Erreur lors de la récupération des infos.', flags: 64 });
      } catch (followError) {
        console.error("Erreur followUp /teams fuzzy :", followError);
      }
    }
  }
};
