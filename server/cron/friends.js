import supabase from '../services/supabase.js';

// ============================================================
// CONSÉQUENCES INTER-JOUEURS (toutes les 6 heures)
// ============================================================
export async function processFriendConsequences() {
  try {
    console.log('👥 Traitement des conséquences inter-joueurs...');

    // Récupérer toutes les amitiés actives
    const { data: friendships } = await supabase
      .from('friendships')
      .select('user_a, user_b')
      .eq('status', 'accepted');

    if (!friendships || friendships.length === 0) return;

    let eventsCreated = 0;

    for (const friendship of friendships) {
      // 15% de chance par relation par cycle
      if (Math.random() > 0.15) continue;

      // Récupérer les deux personnages
      const { data: charA } = await supabase
        .from('characters')
        .select('id, user_id, name, karma, current_avatar, health, age, alive')
        .eq('user_id', friendship.user_a)
        .eq('alive', true)
        .limit(1)
        .single();

      const { data: charB } = await supabase
        .from('characters')
        .select('id, user_id, name, karma, current_avatar, health, age, alive')
        .eq('user_id', friendship.user_b)
        .eq('alive', true)
        .limit(1)
        .single();

      if (!charA || !charB) continue;

      // Déterminer qui affecte qui (basé sur le karma le plus extrême)
      const karmaDiffA = Math.abs(charA.karma - 50);
      const karmaDiffB = Math.abs(charB.karma - 50);

      const source = karmaDiffA > karmaDiffB ? charA : charB;
      const target = source === charA ? charB : charA;

      // Générer l'événement basé sur le karma de la source
      let event;

      if (source.karma >= 75) {
        // Source très vertueuse → bénédiction
        const blessings = [
          { desc: `${source.name} prie pour toi. Tu ressens une chaleur intérieure.`, fx: { happiness: 3, morality: 2 }, karma: 2 },
          { desc: `${source.name} t'envoie un message d'espoir. Tes doutes s'apaisent.`, fx: { happiness: 4, health: 1 }, karma: 1 },
          { desc: `La bonté de ${source.name} rayonne jusqu'à toi. Tu te sens inspiré.`, fx: { morality: 4, happiness: 2 }, karma: 3 }
        ];
        const b = blessings[Math.floor(Math.random() * blessings.length)];
        event = { event_type: 'blessing', description: b.desc, stat_effects: b.fx, karma_effect: b.karma };

      } else if (source.karma >= 50) {
        // Source neutre → influence légère
        const neutrals = [
          { desc: `${source.name} partage sa vision pragmatique. Tu y réfléchis.`, fx: { wealth: 2, morality: -1 }, karma: 0 },
          { desc: `${source.name} te conseille froidement. C'est efficace mais froid.`, fx: { wealth: 3, happiness: -1 }, karma: -1 },
          { desc: `L'équilibre de ${source.name} t'influence subtilement.`, fx: { morality: 1, happiness: 1 }, karma: 0 }
        ];
        const n = neutrals[Math.floor(Math.random() * neutrals.length)];
        event = { event_type: 'karma_influence', description: n.desc, stat_effects: n.fx, karma_effect: n.karma };

      } else if (source.karma >= 25) {
        // Source en chute → mauvaise influence
        const fallenEvents = [
          { desc: `${source.name} t'entraîne dans une soirée qui dérape.`, fx: { health: -3, happiness: 2, morality: -4 }, karma: -3 },
          { desc: `L'ombre de ${source.name} pèse sur tes pensées. Le doute s'installe.`, fx: { happiness: -4, morality: -2 }, karma: -2 },
          { desc: `${source.name} te propose un raccourci douteux.`, fx: { wealth: 4, morality: -5, health: -1 }, karma: -3 }
        ];
        const f = fallenEvents[Math.floor(Math.random() * fallenEvents.length)];
        event = { event_type: 'random_event', description: f.desc, stat_effects: f.fx, karma_effect: f.karma };

      } else {
        // Source diabolique → trahison / corruption
        const devilEvents = [
          { desc: `${source.name} te trahit. L'argent et la confiance s'envolent.`, fx: { wealth: -5, happiness: -6, morality: -3 }, karma: -5 },
          { desc: `La violence de ${source.name} t'éclabousse. Tu es blessé dans l'altercation.`, fx: { health: -8, happiness: -4, morality: -2 }, karma: -4 },
          { desc: `${source.name} te manipule. Quand tu t'en rends compte, le mal est fait.`, fx: { happiness: -5, morality: -6, wealth: -3 }, karma: -6 },
          { desc: `${source.name} sombre et t'entraîne avec lui dans les ténèbres.`, fx: { health: -4, happiness: -7, morality: -8 }, karma: -7 }
        ];
        const d = devilEvents[Math.floor(Math.random() * devilEvents.length)];
        event = { event_type: 'betrayal', description: d.desc, stat_effects: d.fx, karma_effect: d.karma };
      }

      // Insérer l'événement
      await supabase.from('friend_events').insert({
        source_character_id: source.id,
        target_character_id: target.id,
        ...event
      });

      eventsCreated++;
    }

    console.log(`👥 ${eventsCreated} événements d'amis créés`);
  } catch (err) {
    console.error('Friend consequences error:', err);
  }
}

// ============================================================
// IMPACT DE LA MORT D'UN AMI
// ============================================================
export async function processDeathImpact(deadCharacterId, deadCharacterName) {
  try {
    // Trouver le user du personnage mort
    const { data: deadChar } = await supabase
      .from('characters')
      .select('user_id, karma')
      .eq('id', deadCharacterId)
      .single();

    if (!deadChar) return;

    // Trouver les amis du joueur mort
    const { data: friendships } = await supabase
      .from('friendships')
      .select('user_a, user_b')
      .or(`user_a.eq.${deadChar.user_id},user_b.eq.${deadChar.user_id}`)
      .eq('status', 'accepted');

    if (!friendships || friendships.length === 0) return;

    for (const f of friendships) {
      const friendUserId = f.user_a === deadChar.user_id ? f.user_b : f.user_a;

      const { data: friendChar } = await supabase
        .from('characters')
        .select('id')
        .eq('user_id', friendUserId)
        .eq('alive', true)
        .limit(1)
        .single();

      if (!friendChar) continue;

      // Impact émotionnel de la mort d'un ami
      const event = {
        source_character_id: deadCharacterId,
        target_character_id: friendChar.id,
        event_type: 'death_impact',
        description: `${deadCharacterName} est mort. Le deuil te frappe comme une vague glacée.`,
        stat_effects: { happiness: -8, morality: 3, health: -2 },
        karma_effect: 2  // La perte rend plus moral
      };

      await supabase.from('friend_events').insert(event);
    }

    console.log(`💀 Impact de la mort de ${deadCharacterName} envoyé aux amis`);
  } catch (err) {
    console.error('Death impact error:', err);
  }
}
