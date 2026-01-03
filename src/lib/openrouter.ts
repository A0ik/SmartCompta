/**
 * Client OpenRouter pour les API IA
 * Utilise Whisper pour la transcription et GPT-4o pour l'extraction
 */

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1';

interface TranscriptionResult {
  text: string;
  success: boolean;
  error?: string;
}

interface ExtractionResult {
  numDossier: string;
  montantHT: number;
  prestation: string;
  success: boolean;
  error?: string;
  rawResponse?: string;
}

/**
 * Transcrit un fichier audio en texte via Whisper
 */
export async function transcrireAudio(audioBlob: Blob): Promise<TranscriptionResult> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  
  if (!apiKey) {
    return { text: '', success: false, error: 'Clé API OpenRouter non configurée' };
  }

  try {
    // Convertir le blob en base64
    const arrayBuffer = await audioBlob.arrayBuffer();
    const base64Audio = Buffer.from(arrayBuffer).toString('base64');

    const response = await fetch(`${OPENROUTER_API_URL}/audio/transcriptions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'SmartCompta Voice',
      },
      body: JSON.stringify({
        model: 'openai/whisper-large-v3',
        file: base64Audio,
        language: 'fr',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return { text: '', success: false, error: `Erreur transcription: ${error}` };
    }

    const data = await response.json();
    return { text: data.text || '', success: true };
  } catch (error) {
    return { 
      text: '', 
      success: false, 
      error: `Erreur: ${error instanceof Error ? error.message : 'Inconnue'}` 
    };
  }
}

/**
 * Extrait les informations de facturation depuis une transcription
 */
export async function extraireInfosFacture(transcription: string): Promise<ExtractionResult> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  
  if (!apiKey) {
    return { 
      numDossier: '', 
      montantHT: 0, 
      prestation: '', 
      success: false, 
      error: 'Clé API OpenRouter non configurée' 
    };
  }

  const systemPrompt = `Tu es un assistant spécialisé dans l'extraction d'informations de facturation pour un cabinet comptable.

À partir de la transcription vocale fournie, tu dois extraire:
1. Le numéro de dossier client (peut être alphanumérique comme "AM0028", "CKH088", "SPR", etc.)
2. Le montant HT en euros (nombre décimal)
3. La description de la prestation

RÈGLES IMPORTANTES:
- Le numéro de dossier peut contenir des lettres et des chiffres
- Le montant doit être en euros, converti si mentionné autrement
- La prestation doit être une description claire et professionnelle
- Si une information n'est pas claire, fais une interprétation raisonnable

Réponds UNIQUEMENT avec un objet JSON valide, sans markdown ni explication:
{"numDossier": "string", "montantHT": number, "prestation": "string"}`;

  try {
    const response = await fetch(`${OPENROUTER_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'SmartCompta Voice',
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Transcription vocale: "${transcription}"` },
        ],
        temperature: 0.1,
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return { 
        numDossier: '', 
        montantHT: 0, 
        prestation: '', 
        success: false, 
        error: `Erreur extraction: ${error}` 
      };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    // Parser le JSON de la réponse
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { 
        numDossier: '', 
        montantHT: 0, 
        prestation: '', 
        success: false, 
        error: 'Format de réponse invalide',
        rawResponse: content
      };
    }

    const parsed = JSON.parse(jsonMatch[0]);
    
    return {
      numDossier: String(parsed.numDossier || '').toUpperCase().trim(),
      montantHT: Number(parsed.montantHT) || 0,
      prestation: String(parsed.prestation || '').trim(),
      success: true,
      rawResponse: content,
    };
  } catch (error) {
    return { 
      numDossier: '', 
      montantHT: 0, 
      prestation: '', 
      success: false, 
      error: `Erreur: ${error instanceof Error ? error.message : 'Inconnue'}` 
    };
  }
}
