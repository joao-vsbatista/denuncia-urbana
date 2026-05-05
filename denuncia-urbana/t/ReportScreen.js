import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, Image, StyleSheet, Alert,
  Modal, Platform, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CATEGORIES, STATUS_COLORS, getCategoryById } from './categories';
import { COLORS, RADIUS, FONT } from './theme';
import { useImagePicker } from './useImagePicker';

// ─── Constantes ────────────────────────────────────────────────────────────────

// Raio em graus ~100m para detectar denúncias próximas
const NEARBY_DELTA = 0.001;

function isNearby(a, b) {
  if (!a || !b) return false;
  return (
    Math.abs(a.latitude - b.latitude) < NEARBY_DELTA &&
    Math.abs(a.longitude - b.longitude) < NEARBY_DELTA
  );
}

// ─── Modal de Ajuda ────────────────────────────────────────────────────────────

function HelpModal({ visible, onClose }) {
  const steps = [
    { icon: 'create-outline',     color: '#378ADD', title: 'Título',      desc: 'Dê um nome curto e claro para o problema.' },
    { icon: 'list-outline',       color: '#EF9F27', title: 'Categoria',   desc: 'Escolha a categoria que melhor descreve o problema.' },
    { icon: 'document-text-outline', color: '#639922', title: 'Descrição', desc: 'Descreva o problema com mais detalhes.' },
    { icon: 'location-outline',   color: '#E24B4A', title: 'Local',       desc: 'Marque o pino no mapa ou use sua localização atual.' },
    { icon: 'camera-outline',     color: '#D4537E', title: 'Foto',        desc: 'Adicione uma foto para facilitar a identificação.' },
    { icon: 'send-outline',       color: '#185FA5', title: 'Enviar',      desc: 'Toque em "Enviar denúncia" para registrar.' },
  ];
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={help.overlay}>
        <View style={help.box}>
          <View style={help.topRow}>
            <Text style={help.title}>Como fazer uma denúncia</Text>
            <TouchableOpacity onPress={onClose} style={help.closeBtn}>
              <Ionicons name="close" size={22} color={COLORS.gray500} />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            {steps.map((s, i) => (
              <View key={i} style={help.step}>
                <View style={[help.stepIcon, { backgroundColor: s.color + '1A' }]}>
                  <Ionicons name={s.icon} size={20} color={s.color} />
                </View>
                <View style={help.stepText}>
                  <Text style={help.stepTitle}>{s.title}</Text>
                  <Text style={help.stepDesc}>{s.desc}</Text>
                </View>
              </View>
            ))}
            <View style={help.tip}>
              <Ionicons name="information-circle-outline" size={16} color={COLORS.primary} />
              <Text style={help.tipText}>
                Denúncias duplicadas no mesmo local são agrupadas automaticamente para agilizar o atendimento.
              </Text>
            </View>
          </ScrollView>
          <TouchableOpacity style={help.okBtn} onPress={onClose}>
            <Text style={help.okText}>Entendi</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── Card de denúncia próxima ──────────────────────────────────────────────────

function NearbyCard({ report, onPress }) {
  const cat = getCategoryById(report.category);
  const sc  = STATUS_COLORS[report.status] || STATUS_COLORS['Aberto'];
  return (
    <TouchableOpacity style={nearby.card} onPress={onPress} activeOpacity={0.75}>
      <View style={[nearby.iconWrap, { backgroundColor: cat.color }]}>
        <Ionicons name={cat.icon} size={15} color="#FFF" />
      </View>
      <View style={nearby.body}>
        <Text style={nearby.cardTitle} numberOfLines={1}>{report.title}</Text>
        <Text style={nearby.cardMeta}>{cat.label} · {report.date}</Text>
      </View>
      <View style={[nearby.badge, { backgroundColor: sc.bg }]}>
        <View style={[nearby.dot, { backgroundColor: sc.dot }]} />
        <Text style={[nearby.badgeText, { color: sc.text }]}>{report.status}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Seletor de Categoria ──────────────────────────────────────────────────────

function CategoryPicker({ value, onChange }) {
  return (
    <View style={cat.grid}>
      {CATEGORIES.map((c) => {
        const active = value === c.id;
        return (
          <TouchableOpacity
            key={c.id}
            style={[cat.item, active && { borderColor: c.color, backgroundColor: c.color + '18' }]}
            onPress={() => onChange(c.id)}
            activeOpacity={0.75}
          >
            <View style={[cat.iconWrap, { backgroundColor: active ? c.color : COLORS.gray100 }]}>
              <Ionicons name={c.icon} size={18} color={active ? '#FFF' : COLORS.gray500} />
            </View>
            <Text style={[cat.label, active && { color: c.color, fontWeight: FONT.semibold }]}>
              {c.label}
            </Text>
            {active && (
              <View style={[cat.check, { backgroundColor: c.color }]}>
                <Ionicons name="checkmark" size={10} color="#FFF" />
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── Tela principal ────────────────────────────────────────────────────────────

export default function ReportScreen({ location, initialPinLocation, reports = [], onSubmit, onPickLocation, onOpenReport }) {
  const [title, setTitle]           = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory]     = useState('buraco');
  const [photo, setPhoto]           = useState(null);
  // Prioriza o local escolhido no mapa; se não houver, usa localização atual
  const [pinLocation, setPinLocation] = useState(initialPinLocation || location);
  const [helpVisible, setHelp]      = useState(false);
  const [nearbyReports, setNearby]  = useState([]);

  const { takePhoto, pickFromGallery } = useImagePicker();

  // Detecta denúncias próximas sempre que o pin muda
  useEffect(() => {
    if (!pinLocation) { setNearby([]); return; }
    const found = reports.filter((r) => isNearby(r.coordinate, pinLocation));
    setNearby(found);
  }, [pinLocation, reports]);

  async function handleTakePhoto() {
    const uri = await takePhoto();
    if (uri) setPhoto(uri);
  }

  async function handleGallery() {
    const uri = await pickFromGallery();
    if (uri) setPhoto(uri);
  }

  function handlePickPin() {
    onPickLocation((coord) => setPinLocation(coord));
  }

  function handleSubmit() {
    if (!title.trim()) {
      Alert.alert('Campo obrigatório', 'Informe um título para a denúncia.');
      return;
    }
    if (!pinLocation) {
      Alert.alert('Local não definido', 'Marque o local no mapa antes de enviar.');
      return;
    }

    // Avisa se já existe denúncia naquele ponto
    if (nearbyReports.length > 0) {
      Alert.alert(
        'Denúncia similar encontrada',
        `Já existe ${nearbyReports.length} denúncia(s) próxima(s) a este local. Deseja enviar mesmo assim?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Enviar mesmo assim',
            onPress: () => onSubmit({ title: title.trim(), description, category, photo, coordinate: pinLocation }),
          },
        ]
      );
      return;
    }

    onSubmit({ title: title.trim(), description, category, photo, coordinate: pinLocation });
  }

  const selectedCat = getCategoryById(category);

  return (
    <View style={s.root}>
      {/* Header da tela */}
      <View style={s.screenHeader}>
        <View>
          <Text style={s.screenTitle}>Nova Denúncia</Text>
          <Text style={s.screenSub}>Preencha as informações abaixo</Text>
        </View>
        <TouchableOpacity style={s.helpBtn} onPress={() => setHelp(true)}>
          <Ionicons name="help-circle-outline" size={20} color={COLORS.primary} />
          <Text style={s.helpText}>Ajuda</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >

        {/* ── Título ── */}
        <View style={s.section}>
          <Text style={s.label}>Título <Text style={s.required}>*</Text></Text>
          <TextInput
            style={s.input}
            placeholder="Ex: Buraco na calçada da Rua das Flores"
            placeholderTextColor={COLORS.gray400}
            value={title}
            onChangeText={setTitle}
            maxLength={80}
          />
          <Text style={s.charCount}>{title.length}/80</Text>
        </View>

        {/* ── Categoria ── */}
        <View style={s.section}>
          <Text style={s.label}>Categoria <Text style={s.required}>*</Text></Text>
          <CategoryPicker value={category} onChange={setCategory} />
        </View>

        {/* ── Descrição ── */}
        <View style={s.section}>
          <Text style={s.label}>Descrição</Text>
          <TextInput
            style={[s.input, s.textarea]}
            placeholder="Descreva o problema com mais detalhes (opcional)"
            placeholderTextColor={COLORS.gray400}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            maxLength={500}
            textAlignVertical="top"
          />
          <Text style={s.charCount}>{description.length}/500</Text>
        </View>

        {/* ── Local ── */}
        <View style={s.section}>
          <Text style={s.label}>Local <Text style={s.required}>*</Text></Text>
          <TouchableOpacity style={s.locationBtn} onPress={handlePickPin} activeOpacity={0.8}>
            <View style={[s.locationIconWrap, pinLocation && { backgroundColor: COLORS.primaryLight }]}>
              <Ionicons
                name={pinLocation ? 'location' : 'location-outline'}
                size={20}
                color={pinLocation ? COLORS.primary : COLORS.gray400}
              />
            </View>
            <View style={s.locationText}>
              {pinLocation ? (
                <>
                  <Text style={s.locationSet}>Local marcado no mapa</Text>
                  <Text style={s.locationCoord}>
                    {pinLocation.latitude.toFixed(5)}, {pinLocation.longitude.toFixed(5)}
                  </Text>
                </>
              ) : (
                <>
                  <Text style={s.locationPlaceholder}>Toque para marcar no mapa</Text>
                  <Text style={s.locationHint}>Você será redirecionado ao mapa</Text>
                </>
              )}
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.gray400} />
          </TouchableOpacity>
        </View>

        {/* ── Denúncias próximas ── */}
        {nearbyReports.length > 0 && (
          <View style={s.section}>
            <View style={s.nearbyHeader}>
              <Ionicons name="warning-outline" size={16} color={COLORS.warning} />
              <Text style={s.nearbyTitle}>
                {nearbyReports.length} denúncia{nearbyReports.length > 1 ? 's' : ''} próxima{nearbyReports.length > 1 ? 's' : ''} a este local
              </Text>
            </View>
            <Text style={s.nearbySubtitle}>
              Já existe um registro nesta área. Veja abaixo antes de enviar uma nova denúncia:
            </Text>
            {nearbyReports.map((r) => (
              <NearbyCard
                key={r.id}
                report={r}
                onPress={() => onOpenReport && onOpenReport(r)}
              />
            ))}
          </View>
        )}

        {/* ── Em solução / Resolvidos ── */}
        {reports.filter((r) => r.status !== 'Aberto').length > 0 && (
          <View style={s.section}>
            <View style={s.progressHeader}>
              <Ionicons name="checkmark-circle-outline" size={16} color={COLORS.success} />
              <Text style={s.progressTitle}>Outros registros em andamento</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.progressScroll}
            >
              {reports
                .filter((r) => r.status !== 'Aberto')
                .slice(0, 10)
                .map((r) => {
                  const c  = getCategoryById(r.category);
                  const sc = STATUS_COLORS[r.status] || STATUS_COLORS['Aberto'];
                  return (
                    <TouchableOpacity
                      key={r.id}
                      style={s.progressCard}
                      onPress={() => onOpenReport && onOpenReport(r)}
                      activeOpacity={0.8}
                    >
                      <View style={[s.progressIcon, { backgroundColor: c.color }]}>
                        <Ionicons name={c.icon} size={14} color="#FFF" />
                      </View>
                      <Text style={s.progressCardTitle} numberOfLines={2}>{r.title}</Text>
                      <View style={[s.progressBadge, { backgroundColor: sc.bg }]}>
                        <View style={[s.progressDot, { backgroundColor: sc.dot }]} />
                        <Text style={[s.progressBadgeText, { color: sc.text }]}>{r.status}</Text>
                      </View>
                      <Text style={s.progressDate}>{r.date}</Text>
                    </TouchableOpacity>
                  );
                })}
            </ScrollView>
          </View>
        )}

        {/* ── Foto ── */}
        <View style={s.section}>
          <Text style={s.label}>Foto (opcional)</Text>
          {photo ? (
            <View style={s.photoPreviewWrap}>
              <Image source={{ uri: photo }} style={s.photoPreview} />
              <TouchableOpacity style={s.removePhoto} onPress={() => setPhoto(null)}>
                <Ionicons name="close-circle" size={26} color={COLORS.danger} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={s.photoRow}>
              <TouchableOpacity style={s.photoBtn} onPress={handleTakePhoto} activeOpacity={0.8}>
                <Ionicons name="camera-outline" size={22} color={COLORS.primary} />
                <Text style={s.photoBtnText}>Câmera</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.photoBtn} onPress={handleGallery} activeOpacity={0.8}>
                <Ionicons name="images-outline" size={22} color={COLORS.primary} />
                <Text style={s.photoBtnText}>Galeria</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ── Botão Enviar ── */}
        <TouchableOpacity
          style={[s.submitBtn, !title.trim() || !pinLocation ? s.submitDisabled : null]}
          onPress={handleSubmit}
          activeOpacity={0.85}
        >
          <Ionicons name="send-outline" size={18} color="#FFF" />
          <Text style={s.submitText}>Enviar denúncia</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      <HelpModal visible={helpVisible} onClose={() => setHelp(false)} />
    </View>
  );
}

// ─── Estilos principais ────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.white },

  screenHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12,
    borderBottomWidth: 0.5, borderBottomColor: COLORS.gray200,
  },
  screenTitle: { fontSize: 17, fontWeight: FONT.bold, color: COLORS.gray900 },
  screenSub:   { fontSize: 12, color: COLORS.gray500, marginTop: 2 },
  helpBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.primaryLight,
    backgroundColor: COLORS.primaryLight,
  },
  helpText: { fontSize: 13, color: COLORS.primary, fontWeight: FONT.medium },

  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingTop: 20 },

  section: { marginBottom: 22 },
  label: { fontSize: 13, fontWeight: FONT.semibold, color: COLORS.gray700, marginBottom: 8 },
  required: { color: COLORS.danger },

  input: {
    borderWidth: 1, borderColor: COLORS.gray200, borderRadius: RADIUS.md,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: COLORS.gray900, backgroundColor: COLORS.white,
  },
  textarea: { minHeight: 100, paddingTop: 12 },
  charCount: { fontSize: 11, color: COLORS.gray400, textAlign: 'right', marginTop: 4 },

  locationBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, borderColor: COLORS.gray200, borderRadius: RADIUS.md,
    padding: 14, backgroundColor: COLORS.white,
  },
  locationIconWrap: {
    width: 38, height: 38, borderRadius: RADIUS.sm,
    backgroundColor: COLORS.gray100,
    justifyContent: 'center', alignItems: 'center',
  },
  locationText: { flex: 1 },
  locationSet:         { fontSize: 14, color: COLORS.gray900, fontWeight: FONT.medium },
  locationCoord:       { fontSize: 11, color: COLORS.gray500, marginTop: 2, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  locationPlaceholder: { fontSize: 14, color: COLORS.gray400 },
  locationHint:        { fontSize: 11, color: COLORS.gray400, marginTop: 2 },

  // Denúncias próximas
  nearbyHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.warningLight, borderRadius: RADIUS.md,
    paddingHorizontal: 12, paddingVertical: 10, marginBottom: 8,
  },
  nearbyTitle:    { fontSize: 13, fontWeight: FONT.semibold, color: '#854F0B', flex: 1 },
  nearbySubtitle: { fontSize: 12, color: COLORS.gray500, marginBottom: 10 },

  // Em andamento
  progressHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10,
  },
  progressTitle:  { fontSize: 13, fontWeight: FONT.semibold, color: COLORS.success },
  progressScroll: { gap: 10, paddingBottom: 4 },
  progressCard: {
    width: 150, backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg, borderWidth: 0.5, borderColor: COLORS.gray200,
    padding: 12, gap: 6,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  progressIcon: { width: 30, height: 30, borderRadius: RADIUS.sm, justifyContent: 'center', alignItems: 'center' },
  progressCardTitle: { fontSize: 12, fontWeight: FONT.medium, color: COLORS.gray900, lineHeight: 16 },
  progressBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: RADIUS.full, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
  progressDot:   { width: 6, height: 6, borderRadius: 3 },
  progressBadgeText: { fontSize: 10, fontWeight: FONT.semibold },
  progressDate:  { fontSize: 10, color: COLORS.gray400 },

  // Foto
  photoRow:       { flexDirection: 'row', gap: 12 },
  photoBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: RADIUS.md,
    borderWidth: 1.5, borderColor: COLORS.primaryLight,
    borderStyle: 'dashed', backgroundColor: COLORS.primaryLight,
  },
  photoBtnText:   { fontSize: 14, color: COLORS.primary, fontWeight: FONT.medium },
  photoPreviewWrap: { position: 'relative' },
  photoPreview:   { width: '100%', height: 200, borderRadius: RADIUS.lg },
  removePhoto: {
    position: 'absolute', top: 8, right: 8,
    backgroundColor: '#FFF', borderRadius: 13,
  },

  // Botão enviar
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: COLORS.primary, borderRadius: RADIUS.lg,
    paddingVertical: 16, marginTop: 4,
    shadowColor: COLORS.primary, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  submitDisabled: { opacity: 0.45 },
  submitText: { fontSize: 16, fontWeight: FONT.semibold, color: '#FFF' },
});

// ─── Estilos dos sub-componentes ───────────────────────────────────────────────

const cat = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  item: {
    width: '30%', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 6,
    borderRadius: RADIUS.lg, borderWidth: 1.5, borderColor: COLORS.gray200,
    backgroundColor: COLORS.white, position: 'relative',
  },
  iconWrap: { width: 40, height: 40, borderRadius: RADIUS.sm, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  label:    { fontSize: 11, color: COLORS.gray600, textAlign: 'center', fontWeight: FONT.medium },
  check: {
    position: 'absolute', top: 6, right: 6,
    width: 16, height: 16, borderRadius: 8,
    justifyContent: 'center', alignItems: 'center',
  },
});

const nearby = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: COLORS.white, borderRadius: RADIUS.md,
    borderWidth: 0.5, borderColor: COLORS.gray200,
    padding: 12, marginBottom: 8,
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 3, elevation: 1,
  },
  iconWrap: { width: 34, height: 34, borderRadius: RADIUS.sm, justifyContent: 'center', alignItems: 'center' },
  body:     { flex: 1 },
  cardTitle: { fontSize: 13, fontWeight: FONT.medium, color: COLORS.gray900 },
  cardMeta:  { fontSize: 11, color: COLORS.gray500, marginTop: 2 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: RADIUS.full, paddingHorizontal: 8, paddingVertical: 3 },
  dot:   { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: 10, fontWeight: FONT.semibold },
});

const help = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center', alignItems: 'center', padding: 24,
  },
  box: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.xl,
    padding: 20, width: '100%', maxHeight: '80%',
  },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  title:  { fontSize: 16, fontWeight: FONT.bold, color: COLORS.gray900 },
  closeBtn: { padding: 2 },
  step: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 14 },
  stepIcon: { width: 38, height: 38, borderRadius: RADIUS.sm, justifyContent: 'center', alignItems: 'center' },
  stepText: { flex: 1 },
  stepTitle: { fontSize: 14, fontWeight: FONT.semibold, color: COLORS.gray900 },
  stepDesc:  { fontSize: 13, color: COLORS.gray500, marginTop: 2, lineHeight: 18 },
  tip: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: COLORS.primaryLight, borderRadius: RADIUS.md,
    padding: 12, marginTop: 4, marginBottom: 16,
  },
  tipText: { flex: 1, fontSize: 12, color: COLORS.primary, lineHeight: 17 },
  okBtn: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.md,
    paddingVertical: 13, alignItems: 'center',
  },
  okText: { color: '#FFF', fontWeight: FONT.semibold, fontSize: 15 },
});