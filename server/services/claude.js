import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ============================================================
// PROMPTS SYSTÈME PAR AVATAR
// ============================================================
const SYSTEM_PROMPTS = {
  angel: `Tu es le narrateur d'ANIMUS, un jeu de vie interactive. L'avatar-guide est un Ange Heureux qui pousse l'humain vers la lumière, la joie et la bonté.

RÈGLES STRICTES :
- Génère un court chapitre narratif (3-4 phrases, style littéraire sombre-poétique en français)
- Génère exactement 3 choix de vie
- L'ange pousse vers : travail épanouissant, relations sincères, santé, altruisme, buts nobles
- Les choix : un très positif, un modéré, un tentant mais négatif
- Intègre le contexte des amis du joueur si fourni
- Réponds UNIQUEMENT en JSON valide`,

  neutral: `Tu es le narrateur d'ANIMUS, un jeu de vie interactive. L'avatar-guide est un être Neutre qui voit la vie comme une équation froide.

RÈGLES STRICTES :
- Génère un court chapitre narratif (3-4 phrases, style analytique-poétique en français)
- Génère exactement 3 choix
- Le neutre pousse vers : efficacité, pragmatisme, solitude calculée, ambiguïté morale
- Réponds UNIQUEMENT en JSON valide`,

  fallen: `Tu es le narrateur d'ANIMUS, un jeu de vie interactive. L'avatar-guide est un Ange Déchu, beau et maudit.

RÈGLES STRICTES :
- Génère un court chapitre narratif (3-4 phrases, style dark-poétique en français)
- Génère exactement 3 choix
- L'ange déchu pousse vers : addiction, relations toxiques, décadence, nihilisme doux
- Réponds UNIQUEMENT en JSON valide`,

  devil: `Tu es le narrateur d'ANIMUS, un jeu de vie interactive. L'avatar-guide est le Diable incarné.

RÈGLES STRICTES :
- Génère un court chapitre narratif (3-4 phrases, style sombre-intense en français)
- Génère exactement 3 choix
- Le diable pousse vers : violence, crime, destruction, emprisonnement, fins tragiques
- Réponds UNIQUEMENT en JSON valide`
};

// ============================================================
// FORMAT DE RÉPONSE ATTENDU
// ============================================================
const RESPONSE_FORMAT = `
Réponds en JSON avec cette structure exacte :
{
  "chapter_title": "Titre du chapitre",
  "narrative": "Le texte narratif du chapitre (3-4 phrases poétiques)...",
  "whisper": "Une phrase que l'avatar murmure au joueur...",
  "choices": [
    {
      "text": "Description du choix",
      "emoji": "emoji unicode",
      "tag": "mot-clé court (courage, tentation, etc.)",
      "effects": {
        "health": 5,
        "happiness": 10,
        "wealth": -2,
        "morality": 8
      },
      "karma_shift": 5,
      "consequence": "Courte phrase décrivant ce qui se passe si on choisit ça"
    }
  ]
}

Contraintes sur les valeurs :
- effects: entre -30 et +20 par stat
- karma_shift: entre -18 et +15 (positif = vers ange, négatif = vers diable)
- Le choix 1 doit être le plus positif, le choix 3 le plus négatif
`;

// ============================================================
// GÉNÉRER UN CHAPITRE
// ============================================================
export async function generateChapter({
  avatar, name, city, day, chapter, age,
  stats, karma, history, npcContext, friendContext
}) {
  const systemPrompt = SYSTEM_PROMPTS[avatar] || SYSTEM_PROMPTS.angel;

  const userPrompt = `Personnage : ${name}, ${age} ans, vit à ${city}.
Jour ${day}, Chapitre ${chapter}/5.

Stats actuelles :
- Santé: ${stats.health}/100
- Bonheur: ${stats.happiness}/100
- Richesse: ${stats.wealth}/100
- Moralité: ${stats.morality}/100
- Karma: ${karma}/100

${history && history.length > 0 ? `Historique récent :\n${history.map(h => `- Jour ${h.day}: ${h.summary}`).join('\n')}` : ''}

${npcContext ? `PNJ importants : ${npcContext}` : ''}

${friendContext ? `Contexte des amis du joueur :\n${friendContext}` : ''}

${RESPONSE_FORMAT}`;

  const message = await anthropic.messages.create({
    model: process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }]
  });

  const text = message.content[0].text;

  // Extraire le JSON de la réponse
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Réponse Claude invalide — pas de JSON trouvé');

  return JSON.parse(jsonMatch[0]);
}

// ============================================================
// GÉNÉRER UN RÉCAP QUOTIDIEN
// ============================================================
export async function generateDailyRecap({
  avatar, name, city, day, age, stats, karma, todayHistory
}) {
  const summaries = todayHistory.map((h, i) => `Chapitre ${i + 1}: ${h.choice_made}`).join('\n');

  const message = await anthropic.messages.create({
    model: process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514',
    max_tokens: 1500,
    system: `Tu es le narrateur d'ANIMUS. Écris la chronique de la journée du personnage. Style littéraire, poétique et sombre. En français.`,
    messages: [{
      role: 'user',
      content: `Personnage : ${name}, ${age} ans, ${city}.
Jour ${day}. Avatar dominant : ${avatar}.

Résumé des chapitres du jour :
${summaries}

Stats en fin de journée :
Santé ${Math.round(stats.health)}, Bonheur ${Math.round(stats.happiness)}, Richesse ${Math.round(stats.wealth)}, Moralité ${Math.round(stats.morality)}, Karma ${Math.round(karma)}.

Écris une chronique narrative de 5-8 phrases qui raconte cette journée comme un chapitre de roman. Inclus un murmure de l'avatar.

Réponds en JSON : {"chapter_title": "...", "narrative": "...", "whisper": "..."}`
    }]
  });

  const text = message.content[0].text;
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Réponse recap invalide');
  return JSON.parse(jsonMatch[0]);
}

// ============================================================
// GÉNÉRER UN RÉCAP HEBDOMADAIRE
// ============================================================
export async function generateWeeklyRecap({ name, age, stats, karma, weekHistory }) {
  const message = await anthropic.messages.create({
    model: process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514',
    max_tokens: 800,
    system: `Tu es le chroniqueur d'ANIMUS. Résume la semaine d'un personnage en 3-4 phrases épiques.`,
    messages: [{
      role: 'user',
      content: `${name}, ${age} ans. Karma: ${karma}. Stats: santé ${Math.round(stats.health)}, bonheur ${Math.round(stats.happiness)}, richesse ${Math.round(stats.wealth)}, moralité ${Math.round(stats.morality)}.
Événements de la semaine : ${weekHistory.map(h => h.choice_made).join(', ')}.
Réponds en JSON : {"summary": "...", "title": "..."}`
    }]
  });

  const text = message.content[0].text;
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return { summary: 'La semaine se fond dans le silence.', title: 'Chronique' };
  return JSON.parse(jsonMatch[0]);
}
