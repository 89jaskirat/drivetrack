import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

type Role = 'driver' | 'cityAdmin' | 'superAdmin';
type Tab = 'home' | 'track' | 'community' | 'admin' | 'settings';
type Units = 'metric' | 'imperial';

type MileageLog = { id: string; date: string; start: number; end: number };
type FuelLog = { id: string; date: string; litres: number; cost: number; odometer: number };
type ExpenseLog = { id: string; date: string; amount: number; category: string; note: string };
type Post = { id: string; author: string; title: string; body: string; votes: number };
type GasPrice = { id: string; station: string; price: number; distanceKm: number };

type AppState = {
  signedIn: boolean;
  name: string;
  role: Role;
  zone: string;
  tab: Tab;
  gpsConsent: boolean;
  units: Units;
  mileage: MileageLog[];
  fuel: FuelLog[];
  expenses: ExpenseLog[];
  posts: Post[];
  gas: GasPrice[];
};

const STORAGE_KEY = 'uber-driver-companion-local-v1';

const seed: AppState = {
  signedIn: false,
  name: 'Jaskirat',
  role: 'driver',
  zone: 'Calgary',
  tab: 'home',
  gpsConsent: false,
  units: 'metric',
  mileage: [
    { id: 'm1', date: '2026-04-12', start: 128440, end: 128598 },
    { id: 'm2', date: '2026-04-13', start: 128598, end: 128751 },
  ],
  fuel: [
    { id: 'f1', date: '2026-04-11', litres: 41.2, cost: 57.31, odometer: 128390 },
    { id: 'f2', date: '2026-04-13', litres: 38.4, cost: 52.44, odometer: 128745 },
  ],
  expenses: [
    { id: 'e1', date: '2026-04-12', amount: 18, category: 'Parking', note: 'Airport queue lot' },
    { id: 'e2', date: '2026-04-13', amount: 42.5, category: 'Maintenance', note: 'Interior detail' },
  ],
  posts: [
    { id: 'p1', author: 'Maria', title: 'Airport tonight', body: 'Traffic is building after 8pm.', votes: 14 },
    { id: 'p2', author: 'City Admin', title: 'Gas deal', body: 'Riverbend Fuel is lowest this afternoon.', votes: 9 },
  ],
  gas: [
    { id: 'g1', station: 'Riverbend Fuel', price: 1.42, distanceKm: 2.4 },
    { id: 'g2', station: 'Macleod Stop', price: 1.45, distanceKm: 4.1 },
    { id: 'g3', station: 'Airport Petro', price: 1.47, distanceKm: 5.6 },
  ],
};

const zones = ['Calgary', 'Edmonton', 'Red Deer'];
const roles: Role[] = ['driver', 'cityAdmin', 'superAdmin'];
const categories = ['Fuel', 'Maintenance', 'Insurance', 'Parking', 'Tolls', 'Lease', 'Misc'];
const tabs: { key: Tab; label: string }[] = [
  { key: 'home', label: 'Home' },
  { key: 'track', label: 'Track' },
  { key: 'community', label: 'Community' },
  { key: 'admin', label: 'Admin' },
  { key: 'settings', label: 'Settings' },
];

const money = (value: number) =>
  new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(value);
const kmToMiles = (km: number) => km * 0.621371;
const id = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`;

export default function App() {
  const [state, setState] = useState<AppState>(seed);
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState('Local prototype mode active.');
  const [profile, setProfile] = useState({ name: seed.name, role: seed.role, zone: seed.zone });
  const [mileageForm, setMileageForm] = useState({ date: '2026-04-14', start: '', end: '' });
  const [fuelForm, setFuelForm] = useState({ date: '2026-04-14', litres: '', cost: '', odometer: '' });
  const [expenseForm, setExpenseForm] = useState({ date: '2026-04-14', amount: '', category: 'Parking', note: '' });
  const [postForm, setPostForm] = useState({ title: '', body: '' });
  const [gasForm, setGasForm] = useState({ station: '', price: '', distanceKm: '' });

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (!saved) return;
        const parsed = JSON.parse(saved) as AppState;
        setState(parsed);
        setProfile({ name: parsed.name, role: parsed.role, zone: parsed.zone });
      })
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!ready) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {
      setNotice('Save failed. Changes may not persist after reload.');
    });
  }, [ready, state]);

  const analytics = useMemo(() => {
    const km = state.mileage.reduce((sum, item) => sum + Math.max(item.end - item.start, 0), 0);
    const fuelCost = state.fuel.reduce((sum, item) => sum + item.cost, 0);
    const fuelLitres = state.fuel.reduce((sum, item) => sum + item.litres, 0);
    const expenseCost = state.expenses.reduce((sum, item) => sum + item.amount, 0);
    const earnings = km * 1.18;
    return {
      km,
      earnings,
      fuelCost,
      expenseCost,
      profit: earnings - fuelCost - expenseCost,
      fuelPer100: km > 0 ? (fuelLitres / km) * 100 : 0,
    };
  }, [state]);

  const setTab = (tab: Tab) => setState((current) => ({ ...current, tab }));
  const update = (next: Partial<AppState>) => setState((current) => ({ ...current, ...next }));

  const signIn = () => {
    update({ signedIn: true, name: profile.name || 'Driver', role: profile.role, zone: profile.zone, tab: 'home' });
    setNotice(`Signed in as ${profile.name || 'Driver'} in ${profile.zone}.`);
  };

  const addMileage = () => {
    const start = Number(mileageForm.start);
    const end = Number(mileageForm.end);
    if (Number.isNaN(start) || Number.isNaN(end) || end <= start) {
      setNotice('Mileage needs a valid start and a higher end odometer.');
      return;
    }
    update({ mileage: [{ id: id('m'), date: mileageForm.date, start, end }, ...state.mileage] });
    setMileageForm({ ...mileageForm, start: '', end: '' });
    setNotice('Mileage log saved.');
  };

  const addFuel = () => {
    const litres = Number(fuelForm.litres);
    const cost = Number(fuelForm.cost);
    const odometer = Number(fuelForm.odometer);
    if ([litres, cost, odometer].some(Number.isNaN)) {
      setNotice('Fuel log needs litres, cost, and odometer.');
      return;
    }
    update({ fuel: [{ id: id('f'), date: fuelForm.date, litres, cost, odometer }, ...state.fuel] });
    setFuelForm({ ...fuelForm, litres: '', cost: '', odometer: '' });
    setNotice('Fuel entry saved.');
  };

  const addExpense = () => {
    const amount = Number(expenseForm.amount);
    if (Number.isNaN(amount) || !expenseForm.note.trim()) {
      setNotice('Expense needs an amount and note.');
      return;
    }
    update({
      expenses: [{ id: id('e'), date: expenseForm.date, amount, category: expenseForm.category, note: expenseForm.note }, ...state.expenses],
    });
    setExpenseForm({ ...expenseForm, amount: '', note: '' });
    setNotice('Expense saved.');
  };

  const addPost = () => {
    if (!postForm.title.trim() || !postForm.body.trim()) {
      setNotice('Forum posts need a title and body.');
      return;
    }
    update({ posts: [{ id: id('p'), author: state.name, title: postForm.title, body: postForm.body, votes: 1 }, ...state.posts] });
    setPostForm({ title: '', body: '' });
    setNotice('Forum post published.');
  };

  const vote = (postId: string, delta: number) => {
    update({ posts: state.posts.map((post) => (post.id === postId ? { ...post, votes: post.votes + delta } : post)) });
  };

  const addGas = () => {
    if (state.role === 'driver') {
      setNotice('Only admins can add verified gas prices.');
      return;
    }
    const price = Number(gasForm.price);
    const distanceKm = Number(gasForm.distanceKm);
    if (Number.isNaN(price) || Number.isNaN(distanceKm) || !gasForm.station.trim()) {
      setNotice('Gas price needs station, price, and distance.');
      return;
    }
    update({
      gas: [{ id: id('g'), station: gasForm.station, price, distanceKm }, ...state.gas].sort((a, b) => a.price - b.price),
    });
    setGasForm({ station: '', price: '', distanceKm: '' });
    setNotice('Gas board updated.');
  };

  if (!state.signedIn) {
    return (
      <SafeAreaView style={styles.screen}>
        <StatusBar style="light" />
        <ScrollView contentContainerStyle={styles.authWrap}>
          <View style={styles.hero}>
            <Text style={styles.kicker}>Uber Driver Companion</Text>
            <Text style={styles.title}>A driver-owned operating system for every shift.</Text>
            <Text style={styles.subtitle}>
              Local mobile MVP with mileage, fuel, expenses, zone community, and admin-ready gas updates.
            </Text>
          </View>
          <Card title="Local sign-in">
            <Field label="Display name" value={profile.name} onChangeText={(value) => setProfile({ ...profile, name: value })} />
            <ChoiceRow label="Role" options={roles} value={profile.role} onChange={(value) => setProfile({ ...profile, role: value as Role })} />
            <ChoiceRow label="Zone" options={zones} value={profile.zone} onChange={(value) => setProfile({ ...profile, zone: value })} />
            <Button label="Enter app" onPress={signIn} />
          </Card>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="light" />
      <View style={styles.container}>
        <View style={styles.top}>
          <View>
            <Text style={styles.topTitle}>{state.name}</Text>
            <Text style={styles.topMeta}>{state.zone} • {state.role}</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{state.gpsConsent ? 'GPS on' : 'GPS off'}</Text>
          </View>
        </View>
        <View style={styles.notice}>
          <Text style={styles.noticeText}>{notice}</Text>
        </View>
        <ScrollView contentContainerStyle={styles.scroll}>
          {state.tab === 'home' && (
            <>
              <View style={styles.hero}>
                <Text style={styles.kicker}>Daily command view</Text>
                <Text style={styles.title}>Quiet authority, clear numbers, fast decisions.</Text>
                <Text style={styles.subtitle}>Dark hero, bright content surfaces, and a strong blue navigation rhythm inspired by PlayStation.</Text>
              </View>
              <View style={styles.stats}>
                <Stat title="Distance" value={state.units === 'metric' ? `${analytics.km.toFixed(0)} km` : `${kmToMiles(analytics.km).toFixed(0)} mi`} />
                <Stat title="Profit" value={money(analytics.profit)} />
                <Stat title="Fuel spend" value={money(analytics.fuelCost)} />
                <Stat title="Efficiency" value={`${analytics.fuelPer100.toFixed(1)} L/100km`} />
              </View>
              <Card title="Today in your zone">
                <Item title="Lowest gas" body={`${state.gas[0]?.station} • $${state.gas[0]?.price.toFixed(2)} • ${state.gas[0]?.distanceKm} km`} />
                <Item title="Community pulse" body={`${state.posts.length} active posts in ${state.zone}`} />
                <Item title="Tax readiness" body={`${state.mileage.length} mileage logs and ${state.expenses.length} expenses captured`} />
              </Card>
            </>
          )}
          {state.tab === 'track' && (
            <>
              <Card title="Mileage">
                <Field label="Date" value={mileageForm.date} onChangeText={(value) => setMileageForm({ ...mileageForm, date: value })} />
                <Field label="Start odometer" value={mileageForm.start} onChangeText={(value) => setMileageForm({ ...mileageForm, start: value })} keyboardType="numeric" />
                <Field label="End odometer" value={mileageForm.end} onChangeText={(value) => setMileageForm({ ...mileageForm, end: value })} keyboardType="numeric" />
                <Button label="Save mileage" onPress={addMileage} />
              </Card>
              <Card title="Fuel">
                <Field label="Date" value={fuelForm.date} onChangeText={(value) => setFuelForm({ ...fuelForm, date: value })} />
                <Field label="Litres" value={fuelForm.litres} onChangeText={(value) => setFuelForm({ ...fuelForm, litres: value })} keyboardType="decimal-pad" />
                <Field label="Cost" value={fuelForm.cost} onChangeText={(value) => setFuelForm({ ...fuelForm, cost: value })} keyboardType="decimal-pad" />
                <Field label="Odometer" value={fuelForm.odometer} onChangeText={(value) => setFuelForm({ ...fuelForm, odometer: value })} keyboardType="numeric" />
                <Button label="Save fuel" onPress={addFuel} secondary />
              </Card>
              <Card title="Expenses">
                <Field label="Date" value={expenseForm.date} onChangeText={(value) => setExpenseForm({ ...expenseForm, date: value })} />
                <ChoiceRow label="Category" options={categories} value={expenseForm.category} onChange={(value) => setExpenseForm({ ...expenseForm, category: value })} />
                <Field label="Amount" value={expenseForm.amount} onChangeText={(value) => setExpenseForm({ ...expenseForm, amount: value })} keyboardType="decimal-pad" />
                <Field label="Note" value={expenseForm.note} onChangeText={(value) => setExpenseForm({ ...expenseForm, note: value })} />
                <Button label="Save expense" onPress={addExpense} />
              </Card>
            </>
          )}
          {state.tab === 'community' && (
            <>
              <Card title={`${state.zone} forum`}>
                <Field label="Title" value={postForm.title} onChangeText={(value) => setPostForm({ ...postForm, title: value })} />
                <Field label="Body" value={postForm.body} onChangeText={(value) => setPostForm({ ...postForm, body: value })} multiline />
                <Button label="Post to forum" onPress={addPost} />
              </Card>
              {state.posts.map((post) => (
                <Card key={post.id} title={post.title}>
                  <Text style={styles.cardMeta}>by {post.author}</Text>
                  <Text style={styles.cardBody}>{post.body}</Text>
                  <View style={styles.voteRow}>
                    <Button label="+" onPress={() => vote(post.id, 1)} compact />
                    <Text style={styles.voteCount}>{post.votes}</Text>
                    <Button label="-" onPress={() => vote(post.id, -1)} compact secondary />
                  </View>
                </Card>
              ))}
            </>
          )}
          {state.tab === 'admin' && (
            <>
              <Card title="Gas price board">
                <Field label="Station" value={gasForm.station} onChangeText={(value) => setGasForm({ ...gasForm, station: value })} />
                <Field label="Price / litre" value={gasForm.price} onChangeText={(value) => setGasForm({ ...gasForm, price: value })} keyboardType="decimal-pad" />
                <Field label="Distance km" value={gasForm.distanceKm} onChangeText={(value) => setGasForm({ ...gasForm, distanceKm: value })} keyboardType="decimal-pad" />
                <Button label="Add verified gas price" onPress={addGas} secondary />
              </Card>
              <Card title="Current prices">
                {state.gas.map((entry) => (
                  <Item key={entry.id} title={`${entry.station} • $${entry.price.toFixed(2)}`} body={`${entry.distanceKm.toFixed(1)} km away`} />
                ))}
              </Card>
            </>
          )}
          {state.tab === 'settings' && (
            <>
              <Card title="Profile">
                <Field label="Display name" value={profile.name} onChangeText={(value) => setProfile({ ...profile, name: value })} />
                <ChoiceRow label="Role" options={roles} value={profile.role} onChange={(value) => setProfile({ ...profile, role: value as Role })} />
                <ChoiceRow label="Zone" options={zones} value={profile.zone} onChange={(value) => setProfile({ ...profile, zone: value })} />
                <Button label="Update profile" onPress={signIn} />
              </Card>
              <Card title="Preferences">
                <ChoiceRow label="Units" options={['metric', 'imperial']} value={state.units} onChange={(value) => update({ units: value as Units })} />
                <View style={styles.switchRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>GPS activity detection</Text>
                    <Text style={styles.switchHelp}>Consent-based and fully local in this prototype.</Text>
                  </View>
                  <Switch value={state.gpsConsent} onValueChange={(value) => update({ gpsConsent: value })} />
                </View>
              </Card>
            </>
          )}
        </ScrollView>
        <View style={styles.tabBar}>
          {tabs.map((tab) => (
            <Pressable key={tab.key} onPress={() => setTab(tab.key)} style={[styles.tabButton, state.tab === tab.key && styles.tabActive]}>
              <Text style={[styles.tabText, state.tab === tab.key && styles.tabTextActive]}>{tab.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <View style={styles.cardBodyWrap}>{children}</View>
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  keyboardType,
  multiline,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  keyboardType?: 'default' | 'numeric' | 'decimal-pad';
  multiline?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        multiline={multiline}
        placeholderTextColor="#6b6b6b"
        style={[styles.input, multiline && styles.inputTall]}
      />
    </View>
  );
}

function ChoiceRow({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.choiceRow}>
        {options.map((option) => (
          <Pressable key={option} onPress={() => onChange(option)} style={[styles.choice, value === option && styles.choiceActive]}>
            <Text style={[styles.choiceText, value === option && styles.choiceTextActive]}>{option}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function Button({
  label,
  onPress,
  secondary,
  compact,
}: {
  label: string;
  onPress: () => void;
  secondary?: boolean;
  compact?: boolean;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.button, secondary && styles.buttonSecondary, compact && styles.buttonCompact]}>
      <Text style={[styles.buttonText, secondary && styles.buttonSecondaryText]}>{label}</Text>
    </Pressable>
  );
}

function Stat({ title, value }: { title: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{title}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function Item({ title, body }: { title: string; body: string }) {
  return (
    <View style={styles.item}>
      <Text style={styles.itemTitle}>{title}</Text>
      <Text style={styles.itemBody}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000000' },
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 12 },
  authWrap: { padding: 16, gap: 16, paddingBottom: 32 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  topTitle: { color: '#ffffff', fontSize: 28, fontWeight: '300' },
  topMeta: { color: '#53b1ff', marginTop: 4 },
  badge: { backgroundColor: '#0070cc', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  badgeText: { color: '#ffffff', fontWeight: '700', fontSize: 12 },
  notice: { backgroundColor: '#121314', borderRadius: 24, padding: 14, marginBottom: 12 },
  noticeText: { color: '#ffffff' },
  scroll: { paddingBottom: 110, gap: 14 },
  hero: {
    backgroundColor: '#121314',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#0070cc',
  },
  kicker: { color: '#53b1ff', fontSize: 13, marginBottom: 8 },
  title: { color: '#ffffff', fontSize: 34, lineHeight: 40, fontWeight: '300' },
  subtitle: { color: '#cccccc', marginTop: 10, lineHeight: 22 },
  stats: { gap: 12, marginTop: 14 },
  stat: { backgroundColor: '#ffffff', borderRadius: 24, padding: 18, shadowColor: '#000000', shadowOpacity: 0.08, shadowRadius: 9, shadowOffset: { width: 0, height: 5 } },
  statLabel: { color: '#6b6b6b', fontSize: 12 },
  statValue: { color: '#000000', fontSize: 26, fontWeight: '700', marginTop: 6 },
  card: { backgroundColor: '#ffffff', borderRadius: 24, padding: 18, marginTop: 14 },
  cardTitle: { color: '#000000', fontSize: 26, fontWeight: '300' },
  cardBodyWrap: { gap: 12, marginTop: 14 },
  cardMeta: { color: '#6b6b6b' },
  cardBody: { color: '#1f1f1f', lineHeight: 21 },
  field: { gap: 8 },
  fieldLabel: { color: '#1f1f1f', fontSize: 13, fontWeight: '600' },
  input: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#cccccc', borderRadius: 3, paddingHorizontal: 12, paddingVertical: 12, color: '#1f1f1f' },
  inputTall: { minHeight: 88, textAlignVertical: 'top' },
  choiceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: { backgroundColor: '#f5f7fa', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 10 },
  choiceActive: { backgroundColor: '#0070cc' },
  choiceText: { color: '#1f1f1f', fontWeight: '500' },
  choiceTextActive: { color: '#ffffff' },
  button: { backgroundColor: '#0070cc', borderRadius: 999, paddingVertical: 14, alignItems: 'center' },
  buttonSecondary: { backgroundColor: '#d53b00' },
  buttonCompact: { paddingVertical: 10, paddingHorizontal: 16 },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  buttonSecondaryText: { color: '#ffffff' },
  voteRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  voteCount: { color: '#0070cc', fontWeight: '700', fontSize: 18 },
  item: { backgroundColor: '#f5f7fa', borderRadius: 12, padding: 14 },
  itemTitle: { color: '#000000', fontWeight: '700' },
  itemBody: { color: '#6b6b6b', marginTop: 4, lineHeight: 20 },
  switchRow: { flexDirection: 'row', gap: 12, alignItems: 'center', justifyContent: 'space-between' },
  switchHelp: { color: '#6b6b6b', marginTop: 4 },
  tabBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    backgroundColor: '#0070cc',
    borderRadius: 999,
    padding: 8,
    flexDirection: 'row',
    gap: 6,
  },
  tabButton: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 999 },
  tabActive: { backgroundColor: '#ffffff' },
  tabText: { color: '#ffffff', fontSize: 12, fontWeight: '700' },
  tabTextActive: { color: '#0070cc' },
});
