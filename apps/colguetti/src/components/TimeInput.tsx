import { useEffect, useRef, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { useLightDark } from '../providers/theme';
import { clampTime } from '../utils/time';

type TimeInputProps = {
  value: string;
  onChange: (value: string) => void;
  onValidityChange?: (valid: boolean) => void;
};

const onlyDigits = (text: string): string => text.replace(/\D/g, '').slice(0, 2);

export default function TimeInput({ value, onChange, onValidityChange }: TimeInputProps) {
  const { theme } = useLightDark();
  const minutesRef = useRef<TextInput>(null);

  const [hh, setHh] = useState(() => value.slice(0, 2));
  const [mm, setMm] = useState(() => value.slice(3, 5));

  useEffect(() => {
    setHh((raw) => (raw === value.slice(0, 2) ? raw : value.slice(0, 2)));
    setMm((raw) => (raw === value.slice(3, 5) ? raw : value.slice(3, 5)));
  }, [value]);

  const update = (hours: string, minutes: string) => {
    onChange(`${hours}:${minutes}`);
    onValidityChange?.(hours.length === 2 && minutes.length === 2);
  };

  const handleHour = (text: string) => {
    const digits = onlyDigits(text);
    setHh(digits);
    update(digits, mm);
    if (digits.length === 2) minutesRef.current?.focus();
  };

  const handleMinute = (text: string) => {
    const digits = onlyDigits(text);
    setMm(digits);
    update(hh, digits);
  };

  const normalize = () => {
    const { hours, minutes } = clampTime(
      hh === '' ? 0 : Number(hh),
      mm === '' ? 0 : Number(mm),
    );
    const nextHh = hh === '' ? '' : String(hours).padStart(2, '0');
    const nextMm = mm === '' ? '' : String(minutes).padStart(2, '0');
    setHh(nextHh);
    setMm(nextMm);
    update(nextHh || '00', nextMm || '00');
  };

  return (
    <View style={styles.row}>
      <TextInput
        value={hh}
        onChangeText={handleHour}
        onBlur={normalize}
        keyboardType="number-pad"
        maxLength={2}
        style={[styles.input, { color: theme.color, borderColor: theme.border }]}
      />
      <View style={[styles.separator, { backgroundColor: theme.muted }]} />
      <TextInput
        ref={minutesRef}
        value={mm}
        onChangeText={handleMinute}
        onBlur={normalize}
        keyboardType="number-pad"
        maxLength={2}
        style={[styles.input, { color: theme.color, borderColor: theme.border }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 10,
  },
  input: {
    width: 64,
    textAlign: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    fontWeight: '700',
  },
  separator: {
    width: 8,
    height: 3,
    borderRadius: 2,
    opacity: 0.8,
  },
});
