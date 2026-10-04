import React from 'react';
import { View, StyleSheet, ScrollView, Text, Pressable } from 'react-native';
import { useLightDark } from '../../providers/theme';
import Svg, { Circle, Path, Rect, G, Line } from 'react-native-svg';
import { Heart, SettingsIcon } from 'alambre';

export default function ColguettiMenuTestbed() {
  const { theme } = useLightDark();

  // Background colors from the design
  const bgColor = '#181b19';
  const dotColor = '#2b332d';
  const card1Bg = '#374136';
  const card2Bg = '#403833';
  const textPrimary = '#f6f2e6';
  const textSecondary = '#9ba59b';

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      {/* Grid Background Pattern */}
      <View style={StyleSheet.absoluteFill}>
        <Svg width="100%" height="100%">
          <Line x1="0" y1="0" x2="100%" y2="100%" stroke="none" />
        </Svg>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Top Header */}
        <View style={styles.header}>
          <Pressable style={[styles.iconButton, { backgroundColor: '#212723' }]}>
            <Heart size={20} color={textPrimary} drawIt={true} />
          </Pressable>
          <Pressable style={[styles.iconButton, { backgroundColor: '#212723' }]}>
            <SettingsIcon size={20} color={textPrimary} drawIt={true} />
          </Pressable>
        </View>

        {/* Hero Graphic: Baby Mobile */}
        <View style={styles.heroGraphic}>
           <Svg width={200} height={120} viewBox="0 0 200 120">
             {/* Center string */}
             <Line x1={100} y1={0} x2={100} y2={20} stroke={textPrimary} strokeWidth={2} />
             {/* Horizontal Bar */}
             <Line x1={40} y1={20} x2={160} y2={20} stroke={textPrimary} strokeWidth={3} strokeLinecap="round" />
             
             {/* Left item */}
             <Line x1={45} y1={20} x2={35} y2={70} stroke={textSecondary} strokeWidth={2} />
             <Circle cx={35} cy={80} r={12} fill="#a4b49b" />
             <Circle cx={35} cy={80} r={4} fill={bgColor} />

             {/* Center Left item */}
             <Line x1={85} y1={20} x2={85} y2={85} stroke={textSecondary} strokeWidth={2} />
             <Path d="M70 100 Q 85 70 100 100 Z" fill="#d9cdbc" />
             
             {/* Center Right item */}
             <Line x1={115} y1={20} x2={105} y2={100} stroke={textSecondary} strokeWidth={2} />
             <Path d="M95 110 L 115 115 L 105 85 Z" fill="#93a891" />

             {/* Right item */}
             <Line x1={140} y1={20} x2={140} y2={45} stroke={textSecondary} strokeWidth={2} />
             <Line x1={120} y1={45} x2={160} y2={45} stroke={textPrimary} strokeWidth={2} />
             <Line x1={155} y1={45} x2={155} y2={65} stroke={textSecondary} strokeWidth={2} />
             <Path d="M 155 65 L 165 75 L 155 85 L 145 75 Z" fill="#e7dbcc" />
           </Svg>
        </View>

        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={[styles.mainTitle, { color: textPrimary }]}>Colguetti</Text>
          <Text style={[styles.subTitle, { color: textSecondary }]}>Little alarms, hung just right.</Text>
        </View>

        {/* Cards */}
        <Pressable style={[styles.card, { backgroundColor: card1Bg }]}>
           <View style={styles.cardContent}>
             <Text style={[styles.cardTitle, { color: textPrimary }]}>Alarms</Text>
             <Text style={[styles.cardDesc, { color: textSecondary }]}>Set, tune and snooze{'\n'}your wake-ups.</Text>
             <View style={[styles.cardBtn, { backgroundColor: textPrimary }]}>
               <SettingsIcon size={20} color={bgColor} drawIt={true} />
             </View>
           </View>
           <View style={styles.cardGraphic}>
              {/* Clock Illustration */}
              <Svg width={140} height={140} viewBox="0 0 120 120">
                <Circle cx={60} cy={60} r={35} fill="#f4ebd8" />
                <Circle cx={60} cy={60} r={40} stroke="#2e382d" strokeWidth={5} fill="none" />
                <Line x1={60} y1={60} x2={60} y2={40} stroke="#181b19" strokeWidth={4} strokeLinecap="round" />
                <Line x1={60} y1={60} x2={48} y2={72} stroke="#181b19" strokeWidth={4} strokeLinecap="round" />
                <Circle cx={60} cy={60} r={4} fill="#181b19" />
              </Svg>
           </View>
        </Pressable>

        <Pressable style={[styles.card, { backgroundColor: card2Bg, marginTop: 16 }]}>
           <View style={styles.cardContent}>
             <Text style={[styles.cardTitle, { color: textPrimary }]}>My Items</Text>
             <Text style={[styles.cardDesc, { color: textSecondary }]}>Your saved sounds,{'\n'}shapes and routines.</Text>
             <View style={[styles.cardBtn, { backgroundColor: textPrimary }]}>
               <SettingsIcon size={20} color={bgColor} drawIt={true} />
             </View>
           </View>
           <View style={styles.cardGraphic}>
              {/* Shapes Illustration */}
              <Svg width={140} height={140} viewBox="0 0 120 120">
                <Line x1={10} y1={90} x2={110} y2={90} stroke="#f4ebd8" strokeWidth={4} strokeLinecap="round" />
                <Line x1={20} y1={90} x2={20} y2={100} stroke="#f4ebd8" strokeWidth={4} strokeLinecap="round" />
                <Line x1={95} y1={90} x2={95} y2={100} stroke="#f4ebd8" strokeWidth={4} strokeLinecap="round" />
                
                <Rect x={20} y={60} width={30} height={25} rx={6} fill="#a4b49b" />
                <Circle cx={85} cy={72} r={16} fill="#f4ebd8" />
                <Circle cx={85} cy={72} r={6} fill="#181b19" />
                <Path d="M 55 45 L 75 80 L 35 80 Z" fill="#f4ebd8" />
              </Svg>
           </View>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  iconButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  heroGraphic: { alignItems: 'center', marginVertical: 10 },
  titleContainer: { alignItems: 'center', marginBottom: 40 },
  mainTitle: { fontSize: 48, fontWeight: '900', letterSpacing: -1 },
  subTitle: { fontSize: 16, marginTop: 4 },
  card: { borderRadius: 32, padding: 24, flexDirection: 'row', overflow: 'hidden', minHeight: 180 },
  cardContent: { flex: 1, zIndex: 10 },
  cardTitle: { fontSize: 32, fontWeight: 'bold', marginBottom: 8 },
  cardDesc: { fontSize: 16, lineHeight: 22, marginBottom: 24, flex: 1, paddingRight: 40 },
  cardBtn: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  cardGraphic: { position: 'absolute', right: -20, bottom: -20, zIndex: 1 },
});
