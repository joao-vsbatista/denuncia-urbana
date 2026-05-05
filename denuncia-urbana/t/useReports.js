import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { supabase, PHOTOS_BUCKET } from './supabase';

// ─── Upload de foto para o Supabase Storage ─────────────────────────────────

async function uploadPhoto(uri) {
  if (!uri) return null;

  try {
    const response = await fetch(uri);
    const blob = await response.blob();

    const ext = uri.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const filePath = `reports/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(PHOTOS_BUCKET)
      .upload(filePath, blob, {
        contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
        upsert: false,
      });

    if (uploadError) {
      console.warn('Erro no upload da foto:', uploadError.message);
      return null;
    }

    const { data } = supabase.storage
      .from(PHOTOS_BUCKET)
      .getPublicUrl(filePath);

    return data?.publicUrl || null;
  } catch (err) {
    console.warn('Erro ao processar foto:', err.message);
    return null;
  }
}

// ─── Hook principal ──────────────────────────────────────────────────────────

export function useReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setReports((data || []).map(dbRowToReport));
    } catch (err) {
      console.error('Erro ao carregar denúncias:', err.message);
      setError(err.message);
      Alert.alert('Erro de conexão', 'Não foi possível carregar as denúncias. Verifique sua conexão.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();

    // Escuta mudanças em tempo real
    const channel = supabase
      .channel('reports-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reports' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setReports((prev) => [dbRowToReport(payload.new), ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setReports((prev) =>
              prev.map((r) => (r.id === payload.new.id ? dbRowToReport(payload.new) : r))
            );
          } else if (payload.eventType === 'DELETE') {
            setReports((prev) => prev.filter((r) => r.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchReports]);

  async function addReport({ title, description, category, photo, coordinate }) {
    try {
      const photoUrl = photo ? await uploadPhoto(photo) : null;

      const { data, error: insertError } = await supabase
        .from('reports')
        .insert({
          title:       title.trim(),
          description: description || null,
          category,
          photo_url:   photoUrl,
          latitude:    coordinate.latitude,
          longitude:   coordinate.longitude,
          status:      'Aberto',
        })
        .select()
        .single();

      if (insertError) throw insertError;

      return dbRowToReport(data);
    } catch (err) {
      console.error('Erro ao salvar denúncia:', err.message);
      Alert.alert('Erro ao salvar', 'Não foi possível registrar a denúncia. Tente novamente.');
      return null;
    }
  }

  async function updateStatus(id, status) {
    // Optimistic update
    setReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status } : r))
    );

    try {
      const { error: updateError } = await supabase
        .from('reports')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (updateError) throw updateError;
    } catch (err) {
      console.error('Erro ao atualizar status:', err.message);
      fetchReports(); // Reverte
      Alert.alert('Erro', 'Não foi possível atualizar o status.');
    }
  }

  return { reports, loading, error, addReport, updateStatus, refetch: fetchReports };
}

// ─── Converte linha do banco → objeto do app ─────────────────────────────────

function dbRowToReport(row) {
  return {
    id:          row.id,
    title:       row.title,
    description: row.description || '',
    category:    row.category,
    photo:       row.photo_url || null,
    coordinate: {
      latitude:  parseFloat(row.latitude),
      longitude: parseFloat(row.longitude),
    },
    status:    row.status,
    date:      new Date(row.created_at).toLocaleDateString('pt-BR'),
    createdAt: new Date(row.created_at).getTime(),
  };
}
