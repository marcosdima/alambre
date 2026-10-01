import Home from '../views/home/Home';
import FormsTestbed from '../views/forms/FormsTestbed';
import OverlaysTestbed from '../views/overlays/OverlaysTestbed';
import SwipeableRowsTestbed from '../views/swipeable-row/SwipeableRowsTestbed';
import WheelPickerTestbed from '../views/wheel-picker/WheelPickerTestbed';
import type { Page } from 'alambre';

export type PageTitle = Record<'es' | 'en', string>;

export type AppPage = Page & {
  title?: PageTitle;
  subpages?: Record<string, AppPage>;
};

export const pages: Record<string, AppPage> = {
  home: {
    component: <Home />,
  },
  forms: {
    title: { es: 'Forms Testbed', en: 'Forms Testbed' },
    component: <FormsTestbed />,
  },
  overlays: {
    title: { es: 'Overlays Testbed', en: 'Overlays Testbed' },
    component: <OverlaysTestbed />,
  },
  swipeableRow: {
    title: { es: 'Swipeable Row Testbed', en: 'Swipeable Row Testbed' },
    component: <SwipeableRowsTestbed />,
  },
  wheelPicker: {
    title: { es: 'Wheel Picker Testbed', en: 'Wheel Picker Testbed' },
    component: <WheelPickerTestbed />,
  },
};

export default pages;
