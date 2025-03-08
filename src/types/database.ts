export interface Item {
  id: string;
  name: string;
  description: string;
  current_value: number;
  trend: 'rising' | 'falling' | 'stable';
  change: string;
  image_url: string;
  created_at: string;
  updated_at: string;
  additional_fields: Record<string, any>;
}

export interface ItemHistory {
  id: string;
  item_id: string;
  value: number;
  date: string;
  created_at: string;
}