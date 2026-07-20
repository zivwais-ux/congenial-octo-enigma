import type { ViewStyle } from 'react-native';
import type { Category, GeoPoint } from '@/types';

export interface MapMarker {
  id: string;
  coordinate: GeoPoint;
  title: string;
  category: Category;
}

export interface MapPanelProps {
  center: GeoPoint;
  markers: MapMarker[];
  selectedId?: string | null;
  onSelectMarker?: (id: string) => void;
  style?: ViewStyle;
}
