export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type Alarm = {
  id: string;
  label: string;
  time: string;
  weekdays: Weekday[];
  enabled: boolean;
  itemIds: string[];
};

export type AlarmInput = Omit<Alarm, 'id'>;
