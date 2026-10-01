import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, FadeInDown, FadeInLeft, FadeInRight } from 'react-native-reanimated';
import { AlambreIcons } from 'alambre';
import { useLightDark } from '../../providers/theme';
import AppTitle, { AppText } from '../../components/AppTitle';
import AppButton from '../../components/AppButton';
import type { ButtonSize, ButtonTone, ButtonVariant } from '../../components/AppButton';
import AppSegmentedControl from '../../components/AppSegmentedControl';
import AppTextInput from '../../components/AppTextInput';
import type { InputSize, InputTone, InputVariant } from '../../components/AppTextInput';
import AppSwitch from '../../components/AppSwitch';
import AppBadge, { AppChip } from '../../components/AppBadge';
import AppCard from '../../components/AppCard';
import type { CardPadding, CardVariant } from '../../components/AppCard';
import AppDialog from '../../components/AppDialog';
import AppActionSheet, { type ActionSheetOption } from '../../components/AppActionSheet';
import AppAccordion from '../../components/AppAccordion';
import AppProgressBar from '../../components/AppProgressBar';

type ActiveTab = 'buttons' | 'inputs' | 'cards' | 'modals' | 'disclosure';

const TEAM_MEMBERS = [
  { name: 'Alex Rivera', role: 'Engineering Lead' },
  { name: 'Beatriz Gomez', role: 'Product Designer' },
  { name: 'Carlos Mendez', role: 'Operations & QA' },
  { name: 'Diana Rossi', role: 'Mobile Architect' },
];

export default function ComponentsTest() {
  const { theme } = useLightDark();
  const [activeTab, setActiveTab] = useState<ActiveTab>('buttons');

  // --- Button Playground State ---
  const [variant, setVariant] = useState<ButtonVariant>('solid');
  const [tone, setTone] = useState<ButtonTone>('primary');
  const [size, setSize] = useState<ButtonSize>('md');
  const [loading, setLoading] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [fullWidth, setFullWidth] = useState(false);
  const [clicks, setClicks] = useState(0);

  // --- Input Playground State ---
  const [inputVariant, setInputVariant] = useState<InputVariant>('outline');
  const [inputTone, setInputTone] = useState<InputTone>('default');
  const [inputSize, setInputSize] = useState<InputSize>('md');
  const [inputClearable, setInputClearable] = useState(true);
  const [inputPassword, setInputPassword] = useState(false);
  const [inputDisabled, setInputDisabled] = useState(false);
  const [inputHasError, setInputHasError] = useState(false);
  const [inputWithIcon, setInputWithIcon] = useState(true);
  const [inputTestValue, setInputTestValue] = useState('Dynamic Value');

  // --- Real-world Inputs Showcase State ---
  const [searchQuery, setSearchQuery] = useState('');
  const [emailText, setEmailText] = useState('user@alambre.dev');
  const [passwordText, setPasswordText] = useState('supersecret123');
  const [noteText, setNoteText] = useState('Please leave package by the front door.');

  // --- Switch Showcase State ---
  const [switchNotifications, setSwitchNotifications] = useState(true);
  const [switchHaptics, setSwitchHaptics] = useState(true);
  const [switchAnalytics, setSwitchAnalytics] = useState(false);

  // --- Switch Size Comparison State ---
  const [sizeSm, setSizeSm] = useState(false);
  const [sizeMd, setSizeMd] = useState(true);
  const [sizeLg, setSizeLg] = useState(true);

  // --- Card Playground State ---
  const [cardVariant, setCardVariant] = useState<CardVariant>('outlined');
  const [cardPadding, setCardPadding] = useState<CardPadding>('md');
  const [cardInteractive, setCardInteractive] = useState(true);
  const [cardSelected, setCardSelected] = useState(false);
  const [cardHasHeader, setCardHasHeader] = useState(true);
  const [cardHasChevron, setCardHasChevron] = useState(true);
  const [cardClicks, setCardClicks] = useState(0);

  // --- Real-world Cards & Badges State ---
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'pro'>('pro');
  const [filterTags, setFilterTags] = useState<string[]>(['React Native', 'TypeScript']);
  const [activeRemovableTags, setActiveRemovableTags] = useState<string[]>(['In Stock', 'Top Rated', 'Free Shipping']);

  const filteredMembers = TEAM_MEMBERS.filter((m) =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.role.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const toggleFilterTag = (tag: string) => {
    setFilterTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const removeTag = (tagToRemove: string) => {
    setActiveRemovableTags((prev) => prev.filter((t) => t !== tagToRemove));
  };

  // --- Modals & Sheets Showcase State ---
  const [activeDialog, setActiveDialog] = useState<
    'danger' | 'success' | 'warning' | 'custom' | null
  >(null);
  const [activeSheet, setActiveSheet] = useState<'actions' | 'custom' | null>(null);
  const [dialogLoading, setDialogLoading] = useState(false);
  const [customProjectName, setCustomProjectName] = useState('alambre-mobile');
  const [feedbackNote, setFeedbackNote] = useState('');
  const [sheetMotion, setSheetMotion] = useState<'smooth' | 'bouncy'>('smooth');
  const [lastActionMessage, setLastActionMessage] = useState('No actions triggered yet');

  // --- Disclosure & Progress Showcase State ---
  const [progressVal, setProgressVal] = useState(65);
  const [progressTone, setProgressTone] = useState<'primary' | 'success' | 'warning' | 'danger'>('primary');
  const [progressIndeterminate, setProgressIndeterminate] = useState(false);
  const [accordionAnimType, setAccordionAnimType] = useState<'timing' | 'spring'>('timing');
  const [accordionDuration, setAccordionDuration] = useState<number>(260);
  const [accordionSpringPreset, setAccordionSpringPreset] = useState<'smooth' | 'bouncy' | 'gentle'>('smooth');
  const [accordionRotation, setAccordionRotation] = useState<90 | 180>(180);
  const [accordionMode, setAccordionMode] = useState<'multi' | 'single'>('multi');
  const [activeAccordionId, setActiveAccordionId] = useState<string | null>('sec');

  const handleDeleteWorkspace = () => {
    setDialogLoading(true);
    setTimeout(() => {
      setDialogLoading(false);
      setActiveDialog(null);
      setLastActionMessage('Workspace deleted permanently.');
    }, 700);
  };

  const sheetOptions: ActionSheetOption[] = [
    {
      id: 'copy-link',
      label: 'Copy Repository URL',
      subtitle: 'alambre/react-native/playground',
      icon: <AlambreIcons.Laptop drawIt color={theme.primary} lineWidth={2} style={styles.sheetIcon} />,
      tone: 'primary',
      onPress: () => setLastActionMessage('Repository link copied to clipboard.'),
    },
    {
      id: 'export-data',
      label: 'Export Analytics',
      subtitle: 'Download latest telemetry CSV',
      icon: <AlambreIcons.Documents drawIt color={theme.color} lineWidth={2} style={styles.sheetIcon} />,
      tone: 'default',
      onPress: () => setLastActionMessage('Analytics data exported.'),
    },
    {
      id: 'project-settings',
      label: 'Project Settings',
      subtitle: 'Manage members & permissions',
      icon: <AlambreIcons.Gear drawIt color={theme.color} lineWidth={2} style={styles.sheetIcon} />,
      tone: 'default',
      onPress: () => setLastActionMessage('Opened project settings.'),
    },
    {
      id: 'delete-workspace',
      label: 'Delete Workspace',
      subtitle: 'Destructive action',
      icon: <AlambreIcons.TriangleAlert drawIt color="#ef4444" lineWidth={2} style={styles.sheetIcon} />,
      tone: 'danger',
      onPress: () => {
        setActiveSheet(null);
        setTimeout(() => setActiveDialog('danger'), 150);
      },
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* 1. Header Hero with Compound AppTitle */}
      <Animated.View
        entering={FadeInDown.duration(280).easing(Easing.out(Easing.cubic))}
        style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
      >
        <AppTitle
          level={1}
          badge="UI Core"
          badgeTone="primary"
          subtitle="Explore visual variants, semantic tones, sizing tokens, and tactile spring physics across the component library."
        >
          UI Components
        </AppTitle>

        {/* Catalog Navigation Tabs */}
        <AppSegmentedControl<ActiveTab>
          value={activeTab}
          onChange={setActiveTab}
          options={[
            { label: 'Buttons', value: 'buttons' },
            { label: 'Inputs & Controls', value: 'inputs' },
            { label: 'Cards & Badges', value: 'cards' },
            { label: 'Modals & Sheets', value: 'modals' },
            { label: 'Layout & Disclosure', value: 'disclosure' },
          ]}
        />
      </Animated.View>

      {/* ============================================================== */}
      {/* TAB 1: BUTTONS & TYPOGRAPHY                                    */}
      {/* ============================================================== */}
      {activeTab === 'buttons' && (
        <>
          {/* Interactive Button Playground */}
          <Animated.View
            entering={FadeInLeft.duration(280).delay(40).easing(Easing.out(Easing.cubic))}
            style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
          >
            <AppTitle level={2} subtitle="Tune button parameters to test variant, tone, size, and spring responses in real time.">
              Interactive Playground
            </AppTitle>

            {/* Variant selector */}
            <AppSegmentedControl<ButtonVariant>
              label="Visual Variant"
              value={variant}
              onChange={setVariant}
              options={[
                { label: 'Solid', value: 'solid' },
                { label: 'Outline', value: 'outline' },
                { label: 'Soft', value: 'soft' },
                { label: 'Ghost', value: 'ghost' },
              ]}
            />

            {/* Tone selector */}
            <AppSegmentedControl<ButtonTone>
              label="Semantic Tone"
              value={tone}
              onChange={setTone}
              options={[
                { label: 'Primary', value: 'primary' },
                { label: 'Success', value: 'success' },
                { label: 'Warning', value: 'warning' },
                { label: 'Danger', value: 'danger' },
                { label: 'Neutral', value: 'neutral' },
              ]}
            />

            {/* Size selector */}
            <AppSegmentedControl<ButtonSize>
              label="Size"
              value={size}
              onChange={setSize}
              options={[
                { label: 'SM (34px)', value: 'sm' },
                { label: 'MD (44px)', value: 'md' },
                { label: 'LG (52px)', value: 'lg' },
              ]}
            />

            {/* Toggles */}
            <View style={styles.togglesRow}>
              <AppButton
                variant={loading ? 'solid' : 'soft'}
                tone={loading ? 'warning' : 'neutral'}
                size="sm"
                label={loading ? 'Loading: YES' : 'Loading: NO'}
                onPress={() => setLoading((v) => !v)}
              />
              <AppButton
                variant={disabled ? 'solid' : 'soft'}
                tone={disabled ? 'danger' : 'neutral'}
                size="sm"
                label={disabled ? 'Disabled: YES' : 'Disabled: NO'}
                onPress={() => setDisabled((v) => !v)}
              />
              <AppButton
                variant={fullWidth ? 'solid' : 'soft'}
                tone={fullWidth ? 'primary' : 'neutral'}
                size="sm"
                label={fullWidth ? 'Width: 100%' : 'Width: Auto'}
                onPress={() => setFullWidth((v) => !v)}
              />
            </View>

            {/* Live Preview Area */}
            <View
              style={[
                styles.previewArea,
                { backgroundColor: theme.surfaceAlt, borderColor: theme.border },
              ]}
            >
              <AppText variant="caption">Tactile Spring Physics Preview</AppText>
              <AppButton
                variant={variant}
                tone={tone}
                size={size}
                loading={loading}
                disabled={disabled}
                fullWidth={fullWidth}
                label={`Press Button (${clicks})`}
                leftIcon={
                  <AlambreIcons.Zap
                    drawIt={true}
                    color={variant === 'solid' ? (tone === 'warning' ? '#1e1e1e' : '#fff') : theme.primary}
                    lineWidth={2}
                    style={{ width: 18, height: 18 }}
                  />
                }
                onPress={() => setClicks((c) => c + 1)}
              />
              <AppText variant="subtitle">
                Press and hold to feel the spring scale feedback (withSpring).
              </AppText>
            </View>
          </Animated.View>

          {/* Variants Showcase */}
          <Animated.View
            entering={FadeInRight.duration(280).delay(80).easing(Easing.out(Easing.cubic))}
            style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
          >
            <AppTitle level={2} subtitle="Four visual styles to establish clear hierarchy for user actions.">
              Visual Variants
            </AppTitle>

            <View style={styles.gridRow}>
              <AppButton
                variant="solid"
                tone="primary"
                label="Solid"
                style={styles.gridBtn}
                leftIcon={<AlambreIcons.CircleCheck drawIt color="#fff" lineWidth={2} style={styles.btnIcon} />}
              />
              <AppButton
                variant="outline"
                tone="primary"
                label="Outline"
                style={styles.gridBtn}
              />
            </View>

            <View style={styles.gridRow}>
              <AppButton
                variant="soft"
                tone="primary"
                label="Soft"
                style={styles.gridBtn}
              />
              <AppButton
                variant="ghost"
                tone="primary"
                label="Ghost"
                style={styles.gridBtn}
              />
            </View>
          </Animated.View>

          {/* Semantic Tones Showcase */}
          <Animated.View
            entering={FadeInLeft.duration(280).delay(120).easing(Easing.out(Easing.cubic))}
            style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
          >
            <AppTitle level={2} subtitle="Semantic color palettes ready for every UI context and tone.">
              Semantic Tones
            </AppTitle>

            <View style={styles.tonesGrid}>
              <AppButton variant="solid" tone="primary" label="Primary" size="sm" />
              <AppButton variant="solid" tone="success" label="Success" size="sm" />
              <AppButton variant="solid" tone="warning" label="Warning" size="sm" />
              <AppButton variant="solid" tone="danger" label="Danger" size="sm" />
              <AppButton variant="solid" tone="neutral" label="Neutral" size="sm" />
            </View>

            <View style={styles.tonesGrid}>
              <AppButton variant="soft" tone="primary" label="Soft Primary" size="sm" />
              <AppButton variant="soft" tone="success" label="Soft Success" size="sm" />
              <AppButton variant="soft" tone="warning" label="Soft Warning" size="sm" />
              <AppButton variant="soft" tone="danger" label="Soft Danger" size="sm" />
              <AppButton variant="soft" tone="neutral" label="Soft Neutral" size="sm" />
            </View>
          </Animated.View>

          {/* Icons and Shapes */}
          <Animated.View
            entering={FadeInRight.duration(280).delay(160).easing(Easing.out(Easing.cubic))}
            style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
          >
            <AppTitle level={2} subtitle="Support for left/right icon slots, responsive sizing, and square icon-only buttons.">
              Icons & Layout
            </AppTitle>

            <View style={styles.gridRow}>
              <AppButton
                variant="solid"
                tone="primary"
                label="Left Icon"
                style={styles.gridBtn}
                leftIcon={<AlambreIcons.Zap drawIt color="#fff" lineWidth={2} style={styles.btnIcon} />}
              />
              <AppButton
                variant="outline"
                tone="primary"
                label="Right Arrow"
                style={styles.gridBtn}
                rightIcon={<AlambreIcons.Arrow drawIt color={theme.primary} lineWidth={2} style={styles.btnIcon} />}
              />
            </View>

            <AppText variant="caption">Square Icon Buttons (iconOnly)</AppText>
            <View style={styles.iconRow}>
              <AppButton
                variant="soft"
                tone="primary"
                iconOnly
                leftIcon={<AlambreIcons.Gear drawIt color={theme.primary} lineWidth={2.2} style={styles.btnIcon} />}
              />
              <AppButton
                variant="soft"
                tone="success"
                iconOnly
                leftIcon={<AlambreIcons.CircleCheck drawIt color="#10b981" lineWidth={2.2} style={styles.btnIcon} />}
              />
              <AppButton
                variant="soft"
                tone="danger"
                iconOnly
                leftIcon={<AlambreIcons.CircleX drawIt color="#ef4444" lineWidth={2.2} style={styles.btnIcon} />}
              />
              <AppButton
                variant="outline"
                tone="neutral"
                iconOnly
                leftIcon={<AlambreIcons.Moon drawIt color={theme.color} lineWidth={2.2} style={styles.btnIcon} />}
              />
            </View>
          </Animated.View>

          {/* Typography System */}
          <Animated.View
            entering={FadeInDown.duration(280).delay(200).easing(Easing.out(Easing.cubic))}
            style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
          >
            <AppTitle level={2} subtitle="Structured hierarchy with dynamic light and dark theme bindings.">
              Typography System (AppTitle & AppText)
            </AppTitle>

            <View style={[styles.typeBox, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
              <AppTitle level={1} badge="H1 (28px)" badgeTone="primary">
                Title Level 1 (Hero)
              </AppTitle>
              <AppText variant="subtitle">For primary screens, hero banners, and full-page titles.</AppText>
            </View>

            <View style={[styles.typeBox, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
              <AppTitle level={2} badge="H2 (22px)" badgeTone="success">
                Title Level 2 (Section)
              </AppTitle>
              <AppText variant="subtitle">For content sections, modal sheets, and configuration cards.</AppText>
            </View>

            <View style={[styles.typeBox, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
              <AppTitle level={3} badge="H3 (17px)" badgeTone="warning">
                Title Level 3 (Card)
              </AppTitle>
              <AppText variant="subtitle">For internal cards, summary blocks, and item headers.</AppText>
            </View>

            <View style={[styles.typeBox, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
              <AppText variant="caption">CAPTION / UPPERCASE LABEL (11px)</AppText>
              <AppText variant="body">
                Standard body text (<AppText variant="code">variant="body"</AppText>) with optimized line height for comfortable mobile reading.
              </AppText>
              <AppText variant="muted">
                Secondary muted text (<AppText variant="code">variant="muted"</AppText>) providing balanced context without distraction.
              </AppText>
            </View>
          </Animated.View>
        </>
      )}

      {/* ============================================================== */}
      {/* TAB 2: INPUTS & FORM CONTROLS                                  */}
      {/* ============================================================== */}
      {activeTab === 'inputs' && (
        <>
          {/* Interactive Input Configurator */}
          <Animated.View
            entering={FadeInLeft.duration(280).delay(40).easing(Easing.out(Easing.cubic))}
            style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
          >
            <AppTitle level={2} subtitle="Customize input styles, validation feedback, and focus animation in real time.">
              Input Configurator
            </AppTitle>

            {/* Input Variant */}
            <AppSegmentedControl<InputVariant>
              label="Input Variant"
              value={inputVariant}
              onChange={setInputVariant}
              options={[
                { label: 'Outline', value: 'outline' },
                { label: 'Soft', value: 'soft' },
                { label: 'Underlined', value: 'underlined' },
              ]}
            />

            {/* Input Tone */}
            <AppSegmentedControl<InputTone>
              label="Tone / State"
              value={inputTone}
              onChange={setInputTone}
              options={[
                { label: 'Default', value: 'default' },
                { label: 'Success', value: 'success' },
                { label: 'Warning', value: 'warning' },
                { label: 'Danger', value: 'danger' },
              ]}
            />

            {/* Input Size */}
            <AppSegmentedControl<InputSize>
              label="Size"
              value={inputSize}
              onChange={setInputSize}
              options={[
                { label: 'SM (36px)', value: 'sm' },
                { label: 'MD (46px)', value: 'md' },
                { label: 'LG (54px)', value: 'lg' },
              ]}
            />

            {/* Feature Toggles */}
            <View style={styles.togglesRow}>
              <AppButton
                variant={inputClearable ? 'solid' : 'soft'}
                tone={inputClearable ? 'primary' : 'neutral'}
                size="sm"
                label={inputClearable ? 'Clearable: YES' : 'Clearable: NO'}
                onPress={() => setInputClearable((v) => !v)}
              />
              <AppButton
                variant={inputPassword ? 'solid' : 'soft'}
                tone={inputPassword ? 'warning' : 'neutral'}
                size="sm"
                label={inputPassword ? 'Password: YES' : 'Password: NO'}
                onPress={() => setInputPassword((v) => !v)}
              />
              <AppButton
                variant={inputWithIcon ? 'solid' : 'soft'}
                tone={inputWithIcon ? 'primary' : 'neutral'}
                size="sm"
                label={inputWithIcon ? 'Icon: YES' : 'Icon: NO'}
                onPress={() => setInputWithIcon((v) => !v)}
              />
              <AppButton
                variant={inputHasError ? 'solid' : 'soft'}
                tone={inputHasError ? 'danger' : 'neutral'}
                size="sm"
                label={inputHasError ? 'Error: ON' : 'Error: OFF'}
                onPress={() => setInputHasError((v) => !v)}
              />
              <AppButton
                variant={inputDisabled ? 'solid' : 'soft'}
                tone={inputDisabled ? 'danger' : 'neutral'}
                size="sm"
                label={inputDisabled ? 'Disabled: YES' : 'Disabled: NO'}
                onPress={() => setInputDisabled((v) => !v)}
              />
            </View>

            {/* Live Interactive Input Preview */}
            <View style={[styles.previewArea, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
              <AppText variant="caption">Interactive Live Input (Type to Test)</AppText>
              <AppTextInput
                label="Customizable Field"
                required
                value={inputTestValue}
                onChangeText={setInputTestValue}
                variant={inputVariant}
                tone={inputTone}
                size={inputSize}
                clearable={inputClearable}
                isPassword={inputPassword}
                disabled={inputDisabled}
                errorMessage={inputHasError ? 'This value does not satisfy validation rules.' : undefined}
                helperText={!inputHasError ? 'Smooth animated border interpolation on focus.' : undefined}
                placeholder="Type here..."
                leftIcon={
                  inputWithIcon ? (
                    <AlambreIcons.Zap
                      drawIt
                      color={theme.primary}
                      lineWidth={2}
                      style={styles.btnIcon}
                    />
                  ) : undefined
                }
              />
            </View>
          </Animated.View>

          {/* Real-World Use Cases Showcase */}
          <Animated.View
            entering={FadeInRight.duration(280).delay(80).easing(Easing.out(Easing.cubic))}
            style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
          >
            <AppTitle level={2} subtitle="Everyday mobile application form patterns.">
              Real-World Use Cases
            </AppTitle>

            {/* 1. Real-World Search Bar with Live Filter */}
            <AppTextInput
              placeholder="Search team members (e.g. Alex, Design)..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              clearable
              variant="soft"
              leftIcon={
                <AlambreIcons.Search
                  drawIt
                  color={theme.muted}
                  lineWidth={2}
                  style={styles.btnIcon}
                />
              }
              helperText={
                searchQuery
                  ? `Showing results matching "${searchQuery}" (${filteredMembers.length} found)`
                  : 'Type in the box above to filter the directory in real time.'
              }
            />

            {/* Live Filter Results */}
            <View
              style={[
                styles.searchResultCard,
                { backgroundColor: theme.surfaceAlt, borderColor: theme.border },
              ]}
            >
              <AppText variant="caption">Team Directory Results</AppText>
              {filteredMembers.length > 0 ? (
                filteredMembers.map((member, idx) => (
                  <View key={member.name}>
                    {idx > 0 && <View style={[styles.searchResultDivider, { backgroundColor: theme.border }]} />}
                    <View style={styles.searchResultItem}>
                      <Text style={{ fontWeight: '700', color: theme.color, fontSize: 13 }}>
                        {member.name}
                      </Text>
                      <Text style={{ color: theme.muted, fontSize: 12 }}>
                        {member.role}
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={{ color: theme.muted, fontSize: 13, fontStyle: 'italic', paddingVertical: 4 }}>
                  No team members found for "{searchQuery}". Tap 'X' to clear.
                </Text>
              )}
            </View>

            {/* 2. Authentication fields */}
            <AppTextInput
              label="Email Address"
              value={emailText}
              onChangeText={setEmailText}
              placeholder="name@example.com"
              autoCapitalize="none"
              keyboardType="email-address"
              clearable
              leftIcon={
                <AlambreIcons.Documents
                  drawIt
                  color={theme.muted}
                  lineWidth={2}
                  style={styles.btnIcon}
                />
              }
            />

            <AppTextInput
              label="Account Password"
              value={passwordText}
              onChangeText={setPasswordText}
              isPassword
              placeholder="Enter your password..."
              leftIcon={
                <AlambreIcons.Keys
                  drawIt
                  color={theme.muted}
                  lineWidth={2}
                  style={styles.btnIcon}
                />
              }
              helperText="Tap the eye icon on the right to toggle between dots and visible text."
            />

            {/* 3. Verified Promo Code (Checkout Pattern) */}
            <AppTextInput
              label="Applied Coupon / Promo Code"
              value="SUMMER2026"
              tone="success"
              editable={false}
              rightIcon={
                <AlambreIcons.CircleCheck
                  drawIt
                  color="#10b981"
                  lineWidth={2}
                  style={styles.btnIcon}
                />
              }
              helperText="20% seasonal checkout discount applied to total."
            />

            {/* 4. Form Validation Error Pattern */}
            <AppTextInput
              label="Postal / ZIP Code"
              value="9401"
              errorMessage="Postal code must be 5 digits (e.g. 94016)."
              leftIcon={
                <AlambreIcons.Phone
                  drawIt
                  color={theme.muted}
                  lineWidth={2}
                  style={styles.btnIcon}
                />
              }
            />

            {/* 5. Multiline Textarea */}
            <AppTextInput
              label="Order Delivery Notes"
              value={noteText}
              onChangeText={setNoteText}
              multiline
              numberOfLines={3}
              placeholder="Write delivery instructions or notes..."
              helperText="Multiline input adapts height for longer descriptions and feedback."
            />
          </Animated.View>

          {/* Tactile Switch & Toggles Showcase */}
          <Animated.View
            entering={FadeInLeft.duration(280).delay(120).easing(Easing.out(Easing.cubic))}
            style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
          >
            <AppTitle level={2} subtitle="Tactile toggle switches with Reanimated spring physics and press feedback.">
              Tactile Switches (AppSwitch)
            </AppTitle>

            <View style={[styles.switchCard, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
              <AppSwitch
                label="Push Notifications"
                subtitle="Receive alerts on background process completions."
                checked={switchNotifications}
                onChange={setSwitchNotifications}
                activeTone="primary"
              />

              <View style={[styles.divider, { backgroundColor: theme.border }]} />

              <AppSwitch
                label="Haptic Feedback"
                subtitle="Trigger physical vibration pulses on button actions."
                checked={switchHaptics}
                onChange={setSwitchHaptics}
                activeTone="success"
              />

              <View style={[styles.divider, { backgroundColor: theme.border }]} />

              <AppSwitch
                label="Diagnostic Telemetry"
                subtitle="Send anonymous crash reports and stack traces."
                checked={switchAnalytics}
                onChange={setSwitchAnalytics}
                activeTone="warning"
              />
            </View>

            {/* Sizing Comparison */}
            <AppText variant="caption">Switch Sizing Comparison (Independent Toggles)</AppText>
            <View style={styles.switchSizeRow}>
              <View style={styles.switchSizeItem}>
                <AppText variant="subtitle">SM</AppText>
                <AppSwitch
                  size="sm"
                  checked={sizeSm}
                  onChange={setSizeSm}
                />
              </View>
              <View style={styles.switchSizeItem}>
                <AppText variant="subtitle">MD (Default)</AppText>
                <AppSwitch
                  size="md"
                  checked={sizeMd}
                  onChange={setSizeMd}
                />
              </View>
              <View style={styles.switchSizeItem}>
                <AppText variant="subtitle">LG</AppText>
                <AppSwitch
                  size="lg"
                  checked={sizeLg}
                  onChange={setSizeLg}
                />
              </View>
            </View>
          </Animated.View>
        </>
      )}

      {/* ============================================================== */}
      {/* TAB 3: CARDS & BADGES                                          */}
      {/* ============================================================== */}
      {activeTab === 'cards' && (
        <>
          {/* 1. Interactive Card Configurator */}
          <Animated.View
            entering={FadeInLeft.duration(280).delay(40).easing(Easing.out(Easing.cubic))}
            style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
          >
            <AppTitle level={2} subtitle="Configure card surface styling, padding, and tactile touch feedback.">
              Card Configurator
            </AppTitle>

            {/* Variant Selector */}
            <AppSegmentedControl<CardVariant>
              label="Card Variant"
              value={cardVariant}
              onChange={setCardVariant}
              options={[
                { label: 'Outlined', value: 'outlined' },
                { label: 'Elevated', value: 'elevated' },
                { label: 'Soft', value: 'soft' },
              ]}
            />

            {/* Padding Selector */}
            <AppSegmentedControl<CardPadding>
              label="Padding"
              value={cardPadding}
              onChange={setCardPadding}
              options={[
                { label: 'SM (12px)', value: 'sm' },
                { label: 'MD (16px)', value: 'md' },
                { label: 'LG (22px)', value: 'lg' },
              ]}
            />

            {/* Toggles */}
            <View style={styles.togglesRow}>
              <AppButton
                variant={cardInteractive ? 'solid' : 'soft'}
                tone={cardInteractive ? 'primary' : 'neutral'}
                size="sm"
                label={cardInteractive ? 'Interactive: YES' : 'Interactive: NO'}
                onPress={() => setCardInteractive((v) => !v)}
              />
              <AppButton
                variant={cardSelected ? 'solid' : 'soft'}
                tone={cardSelected ? 'primary' : 'neutral'}
                size="sm"
                label={cardSelected ? 'Selected: YES' : 'Selected: NO'}
                onPress={() => setCardSelected((v) => !v)}
              />
              <AppButton
                variant={cardHasHeader ? 'solid' : 'soft'}
                tone={cardHasHeader ? 'primary' : 'neutral'}
                size="sm"
                label={cardHasHeader ? 'Header: YES' : 'Header: NO'}
                onPress={() => setCardHasHeader((v) => !v)}
              />
              <AppButton
                variant={cardHasChevron ? 'solid' : 'soft'}
                tone={cardHasChevron ? 'primary' : 'neutral'}
                size="sm"
                label={cardHasChevron ? 'Chevron: YES' : 'Chevron: NO'}
                onPress={() => setCardHasChevron((v) => !v)}
              />
            </View>

            {/* Live Interactive Card Preview */}
            <View style={[styles.previewArea, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
              <AppText variant="caption">Interactive Card Preview (Tap to Feel Spring)</AppText>
              <AppCard
                variant={cardVariant}
                padding={cardPadding}
                selected={cardSelected}
                title={cardHasHeader ? `Interactive Surface (${cardClicks})` : undefined}
                subtitle={cardHasHeader ? 'Tactile spring scale response on press.' : undefined}
                badge={cardHasHeader ? 'DYNAMIC' : undefined}
                badgeTone="primary"
                chevron={cardHasChevron}
                onPress={cardInteractive ? () => setCardClicks((c) => c + 1) : undefined}
              >
                <AppText variant="body">
                  Cards serve as flexible content containers with customizable elevation, border radius, and structured header/footer slots.
                </AppText>
              </AppCard>
            </View>
          </Animated.View>

          {/* 2. Badges & Interactive Chips Showcase */}
          <Animated.View
            entering={FadeInRight.duration(280).delay(80).easing(Easing.out(Easing.cubic))}
            style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
          >
            <AppTitle level={2} subtitle="Semantic labels for status, counts, categories, and active filters.">
              Badges & Interactive Chips
            </AppTitle>

            {/* Badges Matrix: Soft */}
            <AppText variant="caption">Soft Badges (Default)</AppText>
            <View style={styles.badgeRow}>
              <AppBadge label="Primary" tone="primary" />
              <AppBadge label="Success" tone="success" />
              <AppBadge label="Warning" tone="warning" />
              <AppBadge label="Danger" tone="danger" />
              <AppBadge label="Neutral" tone="neutral" />
            </View>

            {/* Badges Matrix: Solid */}
            <AppText variant="caption">Solid Badges</AppText>
            <View style={styles.badgeRow}>
              <AppBadge label="Primary" tone="primary" variant="solid" />
              <AppBadge label="Success" tone="success" variant="solid" />
              <AppBadge label="Warning" tone="warning" variant="solid" />
              <AppBadge label="Danger" tone="danger" variant="solid" />
            </View>

            {/* Badges with Icons */}
            <AppText variant="caption">Badges with Icon Slot</AppText>
            <View style={styles.badgeRow}>
              <AppBadge
                label="Verified"
                tone="success"
                icon={<AlambreIcons.CircleCheck drawIt color="#10b981" lineWidth={2} style={styles.badgeIcon} />}
              />
              <AppBadge
                label="High Priority"
                tone="danger"
                icon={<AlambreIcons.TriangleAlert drawIt color="#ef4444" lineWidth={2} style={styles.badgeIcon} />}
              />
              <AppBadge
                label="Fast Track"
                tone="primary"
                icon={<AlambreIcons.Zap drawIt color={theme.primary} lineWidth={2} style={styles.badgeIcon} />}
              />
            </View>

            {/* Filter Chips Bar */}
            <AppText variant="caption">Interactive Filter Chips (Tap to Toggle)</AppText>
            <View style={styles.chipRow}>
              {['All', 'React Native', 'TypeScript', 'Reanimated', 'Mobile UI'].map((tag) => {
                const isSelected = filterTags.includes(tag);
                return (
                  <AppChip
                    key={tag}
                    label={tag}
                    selected={isSelected}
                    onPress={() => toggleFilterTag(tag)}
                    icon={
                      isSelected ? (
                        <AlambreIcons.CircleCheck
                          drawIt
                          color={theme.primary}
                          lineWidth={2}
                          style={styles.badgeIcon}
                        />
                      ) : undefined
                    }
                  />
                );
              })}
            </View>

            {/* Removable Chips */}
            <AppText variant="caption">Dismissible Active Filter Chips</AppText>
            <View style={styles.chipRow}>
              {activeRemovableTags.map((tag) => (
                <AppChip
                  key={tag}
                  label={tag}
                  selected
                  onRemove={() => removeTag(tag)}
                />
              ))}
              {activeRemovableTags.length === 0 && (
                <Text style={{ color: theme.muted, fontSize: 13, fontStyle: 'italic', paddingVertical: 4 }}>
                  All filters removed.
                </Text>
              )}
            </View>
          </Animated.View>

          {/* 3. Real-World Card Patterns */}
          <Animated.View
            entering={FadeInLeft.duration(280).delay(120).easing(Easing.out(Easing.cubic))}
            style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
          >
            <AppTitle level={2} subtitle="Cohesive card patterns assembled from buttons, typography, and badges.">
              Real-World Card Patterns
            </AppTitle>

            {/* Pattern A: Plan Selection Cards */}
            <AppText variant="caption">Pattern 1: Interactive Plan / Tier Selector (Tap to Select)</AppText>
            <View style={styles.planCardsCol}>
              {/* Starter Card */}
              <AppCard
                variant={selectedPlan === 'free' ? 'outlined' : 'soft'}
                selected={selectedPlan === 'free'}
                title="Community"
                subtitle="Free forever for individuals & open source prototypes"
                badge="STARTER"
                badgeTone="neutral"
                onPress={() => setSelectedPlan('free')}
                headerAction={
                  selectedPlan === 'free' ? (
                    <AlambreIcons.CircleCheck
                      drawIt
                      color={theme.primary}
                      lineWidth={2}
                      style={styles.planSelectedIcon}
                    />
                  ) : null
                }
              >
                <View style={styles.planBodyRow}>
                  <Text style={[styles.planPrice, { color: theme.color }]}>$0 / free</Text>
                  <AppText variant="subtitle">Basic gesture physics & 2 slots</AppText>
                </View>
              </AppCard>

              {/* Pro Card */}
              <AppCard
                variant={selectedPlan === 'pro' ? 'outlined' : 'soft'}
                selected={selectedPlan === 'pro'}
                title="Professional"
                subtitle="Full design system & priority feature support"
                badge="POPULAR"
                badgeTone="primary"
                onPress={() => setSelectedPlan('pro')}
                headerAction={
                  selectedPlan === 'pro' ? (
                    <AlambreIcons.CircleCheck
                      drawIt
                      color={theme.primary}
                      lineWidth={2}
                      style={styles.planSelectedIcon}
                    />
                  ) : null
                }
              >
                <View style={styles.planBodyRow}>
                  <Text style={[styles.planPrice, { color: theme.primary }]}>$19 / mo</Text>
                  <AppText variant="subtitle">Unlimited components & spring physics</AppText>
                </View>
              </AppCard>
            </View>

            {/* Pattern B: Product / E-Commerce Card */}
            <AppText variant="caption">Pattern 2: Product & Summary Card</AppText>
            <AppCard
              variant="elevated"
              title="Alambre Tactile Keyboard"
              subtitle="Custom mechanical switches engineered for mobile typing."
              badge="IN STOCK"
              badgeTone="success"
              footer={
                <View style={styles.productFooter}>
                  <View>
                    <AppText variant="caption">Price</AppText>
                    <Text style={[styles.productPrice, { color: theme.color }]}>$129.00</Text>
                  </View>
                  <AppButton
                    variant="solid"
                    tone="primary"
                    size="sm"
                    label="Add to Cart"
                    leftIcon={<AlambreIcons.ShoppingBag drawIt color="#fff" lineWidth={2} style={styles.btnIcon} />}
                  />
                </View>
              }
            >
              <AppText variant="body">
                Features hot-swappable tactile stems, aluminum top plate, and Bluetooth 5.2 dual-pairing.
              </AppText>
            </AppCard>

            {/* Pattern C: Navigation Row Card */}
            <AppText variant="caption">Pattern 3: Settings Action Row</AppText>
            <AppCard
              variant="outlined"
              title="Biometric Authentication"
              subtitle="FaceID and fingerprint security lock."
              badge="ENABLED"
              badgeTone="success"
              chevron
              onPress={() => {}}
            />
          </Animated.View>
        </>
      )}

      {/* ============================================================== */}
      {/* TAB 4: MODALS & ACTION SHEETS                                   */}
      {/* ============================================================== */}
      {activeTab === 'modals' && (
        <>
          {/* Dialogs Showcase Card */}
          <Animated.View
            entering={FadeInRight.duration(280).delay(40).easing(Easing.out(Easing.cubic))}
            style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
          >
            <AppTitle
              level={2}
              badge="Spring"
              badgeTone="primary"
              subtitle="Spring-animated centered alert and confirmation dialogs with dimmed backdrops, tone badges, and focus handling."
            >
              Confirmation Dialogs
            </AppTitle>

            <View style={styles.gridRow}>
              <AppButton
                variant="solid"
                tone="danger"
                label="Delete Workspace"
                onPress={() => setActiveDialog('danger')}
                style={styles.gridBtn}
                leftIcon={<AlambreIcons.TriangleAlert drawIt color="#fff" lineWidth={2} style={styles.btnIcon} />}
              />
              <AppButton
                variant="solid"
                tone="success"
                label="Plan Upgraded"
                onPress={() => setActiveDialog('success')}
                style={styles.gridBtn}
                leftIcon={<AlambreIcons.CircleCheck drawIt color="#fff" lineWidth={2} style={styles.btnIcon} />}
              />
            </View>

            <View style={styles.gridRow}>
              <AppButton
                variant="outline"
                tone="warning"
                label="Unsaved Changes"
                onPress={() => setActiveDialog('warning')}
                style={styles.gridBtn}
                leftIcon={<AlambreIcons.TriangleAlert drawIt color="#f59e0b" lineWidth={2} style={styles.btnIcon} />}
              />
              <AppButton
                variant="soft"
                tone="primary"
                label="Rename Form"
                onPress={() => setActiveDialog('custom')}
                style={styles.gridBtn}
                leftIcon={<AlambreIcons.Zap drawIt color={theme.primary} lineWidth={2} style={styles.btnIcon} />}
              />
            </View>
          </Animated.View>

          {/* Action Sheets Showcase Card */}
          <Animated.View
            entering={FadeInRight.duration(280).delay(80).easing(Easing.out(Easing.cubic))}
            style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
          >
            <AppTitle
              level={2}
              badge="Gesture"
              badgeTone="success"
              subtitle="Bottom-sheet action drawers with grab handles, option lists, and PanGesture drag-to-dismiss physics."
            >
              Action Sheets & Drawers
            </AppTitle>

            <AppSegmentedControl<'smooth' | 'bouncy'>
              label="Spring Physics Profile"
              value={sheetMotion}
              onChange={setSheetMotion}
              options={[
                { label: 'Smooth (Calm)', value: 'smooth' },
                { label: 'Bouncy (Elastic)', value: 'bouncy' },
              ]}
            />

            <View style={styles.gridRow}>
              <AppButton
                variant="outline"
                tone="primary"
                label="Open Actions Drawer"
                onPress={() => setActiveSheet('actions')}
                style={styles.gridBtn}
                leftIcon={<AlambreIcons.Gear drawIt color={theme.primary} lineWidth={2} style={styles.btnIcon} />}
              />
              <AppButton
                variant="outline"
                tone="neutral"
                label="Feedback Sheet"
                onPress={() => setActiveSheet('custom')}
                style={styles.gridBtn}
                leftIcon={<AlambreIcons.Documents drawIt color={theme.color} lineWidth={2} style={styles.btnIcon} />}
              />
            </View>
          </Animated.View>

          {/* Real-World Action Log Card */}
          <Animated.View
            entering={FadeInRight.duration(280).delay(120).easing(Easing.out(Easing.cubic))}
            style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
          >
            <AppTitle level={3} subtitle="Live callback event stream verifying that modal and sheet actions settle properly.">
              Event Log
            </AppTitle>
            <View style={[styles.typeBox, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
              <AppText variant="muted">Last Action Event:</AppText>
              <AppText variant="body" style={{ fontWeight: '600', color: theme.primary }}>
                {lastActionMessage}
              </AppText>
            </View>
          </Animated.View>

          {/* Modals & Sheets Instances */}
          <AppDialog
            visible={activeDialog === 'danger'}
            tone="danger"
            title="Delete Workspace?"
            description="This action cannot be undone. All project repositories, environments, and team member access will be permanently revoked."
            confirmLabel="Delete Workspace"
            cancelLabel="Cancel"
            confirmLoading={dialogLoading}
            onConfirm={handleDeleteWorkspace}
            onCancel={() => setActiveDialog(null)}
            onClose={() => setActiveDialog(null)}
          />

          <AppDialog
            visible={activeDialog === 'success'}
            tone="success"
            title="Plan Upgraded Successfully"
            description="You are now on the Enterprise tier. High-concurrency worker threads and priority emulator queues are now unlocked."
            confirmLabel="Awesome, Continue"
            onConfirm={() => {
              setActiveDialog(null);
              setLastActionMessage('Enterprise upgrade confirmed.');
            }}
            onClose={() => setActiveDialog(null)}
          />

          <AppDialog
            visible={activeDialog === 'warning'}
            tone="warning"
            title="Discard Unsaved Changes?"
            description="You have modified 3 configuration parameters. Exiting without saving will revert all changes back to previous state."
            confirmLabel="Discard"
            cancelLabel="Keep Editing"
            onConfirm={() => {
              setActiveDialog(null);
              setLastActionMessage('Unsaved draft discarded.');
            }}
            onCancel={() => setActiveDialog(null)}
            onClose={() => setActiveDialog(null)}
          />

          <AppDialog
            visible={activeDialog === 'custom'}
            tone="primary"
            title="Rename Workspace"
            description="Choose a clean alphanumeric identifier for this workspace."
            confirmLabel="Save Name"
            cancelLabel="Cancel"
            onConfirm={() => {
              setActiveDialog(null);
              setLastActionMessage(`Workspace renamed to "${customProjectName}".`);
            }}
            onCancel={() => setActiveDialog(null)}
            onClose={() => setActiveDialog(null)}
          >
            <AppTextInput
              label="Workspace Identifier"
              variant="outline"
              tone="default"
              value={customProjectName}
              onChangeText={setCustomProjectName}
              clearable
            />
          </AppDialog>

          <AppActionSheet
            visible={activeSheet === 'actions'}
            title="alambre-mobile"
            description="Select an operation for this project repository"
            cancelLabel="Cancel"
            options={sheetOptions}
            springConfig={
              sheetMotion === 'smooth'
                ? { damping: 32, stiffness: 220, mass: 0.9 }
                : { damping: 18, stiffness: 260, mass: 1.0 }
            }
            onClose={() => setActiveSheet(null)}
          />

          <AppActionSheet
            visible={activeSheet === 'custom'}
            title="Quick Feedback"
            description="Let us know what you think of the new mobile components"
            cancelLabel="Close"
            springConfig={
              sheetMotion === 'smooth'
                ? { damping: 32, stiffness: 220, mass: 0.9 }
                : { damping: 18, stiffness: 260, mass: 1.0 }
            }
            onClose={() => setActiveSheet(null)}
          >
            <AppTextInput
              label="Feedback & Suggestions"
              multiline
              numberOfLines={3}
              placeholder="Share bugs, suggestions, or thoughts..."
              value={feedbackNote}
              onChangeText={setFeedbackNote}
            />
            <AppButton
              variant="solid"
              tone="primary"
              label="Submit Feedback"
              onPress={() => {
                const note = feedbackNote.trim() || 'No text provided';
                setActiveSheet(null);
                setFeedbackNote('');
                setLastActionMessage(`Feedback submitted: "${note}"`);
              }}
              style={{ marginTop: 12 }}
            />
          </AppActionSheet>
        </>
      )}

      {/* ============================================================== */}
      {/* TAB 5: LAYOUT, DISCLOSURE & PROGRESS                           */}
      {/* ============================================================== */}
      {activeTab === 'disclosure' && (
        <>
          {/* Progress Bar Showcase Card */}
          <Animated.View
            entering={FadeInDown.duration(280).easing(Easing.out(Easing.cubic))}
            style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
          >
            <AppTitle
              level={2}
              badge="AppProgressBar"
              badgeTone="primary"
              subtitle="Spring-driven accessible progress meter with customizable semantic tones and indeterminate sweep."
            >
              Progress Indicators
            </AppTitle>

            {/* Dynamic Progress Bar */}
            <AppProgressBar
              value={progressVal}
              max={100}
              label="Overall Task Completion"
              showPercentage
              tone={progressTone}
              indeterminate={progressIndeterminate}
              height={10}
            />

            {/* Controls */}
            <View style={styles.togglesRow}>
              <AppButton
                size="sm"
                variant="soft"
                tone="primary"
                label="-10%"
                onPress={() => setProgressVal((v) => Math.max(0, v - 10))}
              />
              <AppButton
                size="sm"
                variant="soft"
                tone="primary"
                label="+10%"
                onPress={() => setProgressVal((v) => Math.min(100, v + 10))}
              />
              <AppButton
                size="sm"
                variant={progressIndeterminate ? 'solid' : 'outline'}
                tone="warning"
                label={progressIndeterminate ? 'Indeterminate ON' : 'Indeterminate OFF'}
                onPress={() => setProgressIndeterminate((i) => !i)}
              />
            </View>

            {/* Tone Selector */}
            <AppSegmentedControl<typeof progressTone>
              label="Semantic Tone"
              value={progressTone}
              onChange={setProgressTone}
              options={[
                { label: 'Primary', value: 'primary' },
                { label: 'Success', value: 'success' },
                { label: 'Warning', value: 'warning' },
                { label: 'Danger', value: 'danger' },
              ]}
            />
          </Animated.View>

          {/* Accordion / Collapsible Showcase Card */}
          <Animated.View
            entering={FadeInDown.duration(280).delay(60).easing(Easing.out(Easing.cubic))}
            style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
          >
            <AppTitle
              level={2}
              badge="AppAccordion"
              badgeTone="success"
              subtitle="Layout-jump free dynamic height disclosure with configurable motion dynamics."
            >
              Collapsible Sections
            </AppTitle>

            {/* Motion & Expansion Interactive Configurator */}
            <View style={[styles.previewArea, { backgroundColor: theme.surfaceAlt, borderColor: theme.border, alignItems: 'stretch', gap: 12, marginBottom: 8 }]}>
              <AppText variant="caption" style={{ fontWeight: '700' }}>MOTION & DISCLOSURE CONFIGURATOR</AppText>

              {/* Animation Driver */}
              <AppSegmentedControl<'timing' | 'spring'>
                label="Animation Driver"
                value={accordionAnimType}
                onChange={setAccordionAnimType}
                options={[
                  { label: 'Timing (Bezier)', value: 'timing' },
                  { label: 'Spring (Physics)', value: 'spring' },
                ]}
              />

              {/* Duration or Spring Presets */}
              {accordionAnimType === 'timing' ? (
                <AppSegmentedControl<number>
                  label="Timing Duration"
                  value={accordionDuration}
                  onChange={setAccordionDuration}
                  options={[
                    { label: 'Fast (160ms)', value: 160 },
                    { label: 'Normal (260ms)', value: 260 },
                    { label: 'Slow (450ms)', value: 450 },
                  ]}
                />
              ) : (
                <AppSegmentedControl<'smooth' | 'bouncy' | 'gentle'>
                  label="Spring Preset"
                  value={accordionSpringPreset}
                  onChange={setAccordionSpringPreset}
                  options={[
                    { label: 'Smooth (d24/s180)', value: 'smooth' },
                    { label: 'Bouncy (d14/s160)', value: 'bouncy' },
                    { label: 'Gentle (d32/s130)', value: 'gentle' },
                  ]}
                />
              )}

              {/* Chevron Angle & Mode */}
              <View style={styles.togglesRow}>
                <View style={{ flex: 1, minWidth: 140 }}>
                  <AppSegmentedControl<90 | 180>
                    label="Chevron Angle"
                    value={accordionRotation}
                    onChange={setAccordionRotation}
                    options={[
                      { label: '180° (Flip)', value: 180 },
                      { label: '90° (Quarter)', value: 90 },
                    ]}
                  />
                </View>

                <View style={{ flex: 1, minWidth: 140 }}>
                  <AppSegmentedControl<'multi' | 'single'>
                    label="Expansion Mode"
                    value={accordionMode}
                    onChange={(m) => {
                      setAccordionMode(m);
                      if (m === 'single') {
                        setActiveAccordionId('sec');
                      }
                    }}
                    options={[
                      { label: 'Multi (Free)', value: 'multi' },
                      { label: 'Single (Solo)', value: 'single' },
                    ]}
                  />
                </View>
              </View>
            </View>

            {/* Accordion Group without violent layout springs */}
            <View style={{ gap: 12 }}>
              <AppAccordion
                title="Account Security & 2FA"
                subtitle="Manage hardware security keys and authenticator apps"
                badge="Recommended"
                badgeTone="success"
                animationType={accordionAnimType}
                duration={accordionDuration}
                springConfig={
                  accordionSpringPreset === 'bouncy'
                    ? { damping: 14, stiffness: 160 }
                    : accordionSpringPreset === 'gentle'
                      ? { damping: 32, stiffness: 130 }
                      : { damping: 24, stiffness: 180 }
                }
                rotationAngle={accordionRotation}
                expanded={accordionMode === 'single' ? activeAccordionId === 'sec' : undefined}
                defaultExpanded={true}
                onToggle={(isExp) => {
                  if (accordionMode === 'single') {
                    setActiveAccordionId(isExp ? 'sec' : null);
                  }
                }}
              >
                <AppText variant="caption" style={{ marginBottom: 8 }}>
                  Two-factor authentication is currently enabled via Google Authenticator.
                </AppText>
                <AppButton
                  size="sm"
                  variant="outline"
                  tone="neutral"
                  label="Generate Backup Codes"
                  onPress={() => {}}
                />
              </AppAccordion>

              <AppAccordion
                title="Telemetry & Error Reporting"
                subtitle="Opt-in anonymous crash diagnostic dispatch"
                badge="Optional"
                badgeTone="neutral"
                animationType={accordionAnimType}
                duration={accordionDuration}
                springConfig={
                  accordionSpringPreset === 'bouncy'
                    ? { damping: 14, stiffness: 160 }
                    : accordionSpringPreset === 'gentle'
                      ? { damping: 32, stiffness: 130 }
                      : { damping: 24, stiffness: 180 }
                }
                rotationAngle={accordionRotation}
                expanded={accordionMode === 'single' ? activeAccordionId === 'telemetry' : undefined}
                defaultExpanded={false}
                onToggle={(isExp) => {
                  if (accordionMode === 'single') {
                    setActiveAccordionId(isExp ? 'telemetry' : null);
                  }
                }}
              >
                <AppText variant="caption" style={{ marginBottom: 8 }}>
                  Crash logs and performance metrics are sent to EAS Observe to monitor app stability.
                </AppText>
                <AppSwitch
                  label="Dispatch Anonymous Crash Logs"
                  checked={true}
                  onChange={() => {}}
                />
              </AppAccordion>

              <AppAccordion
                title="Experimental Features"
                subtitle="Locked under early preview program"
                badge="Locked"
                badgeTone="danger"
                animationType={accordionAnimType}
                duration={accordionDuration}
                springConfig={
                  accordionSpringPreset === 'bouncy'
                    ? { damping: 14, stiffness: 160 }
                    : accordionSpringPreset === 'gentle'
                      ? { damping: 32, stiffness: 130 }
                      : { damping: 24, stiffness: 180 }
                }
                rotationAngle={accordionRotation}
                disabled={true}
              >
                <AppText variant="caption">
                  You need to join the Canary testing flight to access experimental flags.
                </AppText>
              </AppAccordion>
            </View>
          </Animated.View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    gap: 16,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 14,
  },
  togglesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  previewArea: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
    alignItems: 'center',
    width: '100%',
  },
  gridRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  gridBtn: {
    flex: 1,
    minWidth: 120,
  },
  tonesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  iconRow: {
    flexDirection: 'row',
    gap: 12,
  },
  btnIcon: {
    width: 18,
    height: 18,
  },
  typeBox: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  searchResultCard: {
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 6,
  },
  searchResultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  searchResultDivider: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
  },
  switchCard: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 8,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
  },
  switchSizeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 8,
  },
  switchSizeItem: {
    alignItems: 'center',
    gap: 6,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badgeIcon: {
    width: 12,
    height: 12,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  planCardsCol: {
    gap: 12,
    width: '100%',
  },
  planBodyRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    width: '100%',
    flexWrap: 'wrap',
    gap: 8,
  },
  planSelectedIcon: {
    width: 20,
    height: 20,
  },
  planPrice: {
    fontSize: 24,
    fontWeight: '800',
    marginVertical: 4,
  },
  productFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  productPrice: {
    fontSize: 18,
    fontWeight: '800',
  },
  sheetIcon: {
    width: 20,
    height: 20,
  },
});
