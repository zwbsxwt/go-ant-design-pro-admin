import {
  ApartmentOutlined,
  AppstoreOutlined,
  BookOutlined,
  CalendarOutlined,
  CrownOutlined,
  DatabaseOutlined,
  FundOutlined,
  LineChartOutlined,
  MenuOutlined,
  MessageOutlined,
  SettingOutlined,
  StockOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import React from 'react';

const menuIconComponents: Record<string, React.ElementType> = {
  apartment: ApartmentOutlined,
  appstore: AppstoreOutlined,
  book: BookOutlined,
  calendar: CalendarOutlined,
  crown: CrownOutlined,
  database: DatabaseOutlined,
  fund: FundOutlined,
  'line-chart': LineChartOutlined,
  menu: MenuOutlined,
  message: MessageOutlined,
  setting: SettingOutlined,
  stock: StockOutlined,
  team: TeamOutlined,
  user: UserOutlined,
};

function normalizeIconName(icon?: React.ReactNode) {
  if (typeof icon !== 'string') {
    return undefined;
  }
  const withoutSuffix = icon.replace(/Outlined$/i, '');
  return withoutSuffix
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[_\s]+/g, '-')
    .toLowerCase();
}

export function resolveMenuIcon(icon?: React.ReactNode) {
  if (React.isValidElement(icon)) {
    return icon;
  }
  const normalizedName = normalizeIconName(icon);
  const IconComponent = normalizedName
    ? menuIconComponents[normalizedName]
    : undefined;
  return IconComponent ? <IconComponent /> : undefined;
}
