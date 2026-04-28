import { supabase } from '../lib/supabase';
import { TranslationEntry } from '../types';

export class DbService {
  static async saveTranslation(userId: string, entry: Omit<TranslationEntry, 'id'>): Promise<TranslationEntry> {
    const { data, error } = await supabase
      .from('translations')
      .insert({
        user_id: userId,
        mode: entry.mode,
        source_lang: entry.sourceLang,
        target_lang: entry.targetLang,
        input_text: entry.inputText,
        output: entry.output,
        image_url: entry.image, // Note: image is base64 in the current frontend, storing it in text column for now
        segments: entry.segments,
        is_saved: entry.isSaved,
        created_at: new Date(entry.timestamp).toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      timestamp: new Date(data.created_at).getTime(),
      mode: data.mode,
      sourceLang: data.source_lang,
      targetLang: data.target_lang,
      inputText: data.input_text || '',
      output: data.output,
      image: data.image_url,
      segments: data.segments,
      isSaved: data.is_saved
    };
  }

  static async getHistory(userId: string): Promise<TranslationEntry[]> {
    const { data, error } = await supabase
      .from('translations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    return (data || []).map(this.mapToEntry);
  }

  static async getSaved(userId: string): Promise<TranslationEntry[]> {
    const { data, error } = await supabase
      .from('translations')
      .select('*')
      .eq('user_id', userId)
      .eq('is_saved', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(this.mapToEntry);
  }

  static async toggleSave(id: string, isSaved: boolean): Promise<void> {
    const { error } = await supabase
      .from('translations')
      .update({ is_saved: isSaved })
      .eq('id', id);

    if (error) throw error;
  }

  static async deleteEntry(id: string): Promise<void> {
    const { error } = await supabase
      .from('translations')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  static async clearHistory(userId: string): Promise<void> {
    const { error } = await supabase
      .from('translations')
      .delete()
      .eq('user_id', userId)
      .eq('is_saved', false);

    if (error) throw error;
  }

  private static mapToEntry(data: any): TranslationEntry {
    return {
      id: data.id,
      timestamp: new Date(data.created_at).getTime(),
      mode: data.mode,
      sourceLang: data.source_lang,
      targetLang: data.target_lang,
      inputText: data.input_text || '',
      output: data.output,
      image: data.image_url,
      segments: data.segments,
      isSaved: data.is_saved
    };
  }
}
