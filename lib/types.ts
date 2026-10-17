export type Role = "parent" | "child";

export type NotifyPrefs = Partial<Record<NotifyKind, boolean>>;
export type NotifyKind = "shopping" | "wishes" | "meals" | "events" | "recipes";

export type Member = {
  id: number;
  family_id: number;
  name: string;
  emoji: string;
  color: string;
  role: Role;
  notify_prefs: NotifyPrefs;
  has_pin: boolean;
};

export type ShoppingItem = {
  id: number;
  name: string;
  quantity: string | null;
  category: string;
  added_by: number | null;
  done: boolean;
  created_at: string;
};

export type Recipe = {
  id: number;
  title: string;
  emoji: string;
  servings: number | null;
  minutes: number | null;
  ingredients: string;
  instructions: string;
  source_url: string | null;
  created_by: number | null;
};

export type MealSlot = "paiva" | "ilta";

export type Meal = {
  id: number;
  date: string;
  slot: MealSlot;
  title: string;
  cook_id: number | null;
  recipe_id: number | null;
  note: string | null;
  wish_id: number | null;
  /** Lapsen ehdotus odottaa vanhemman hyväksyntää. */
  status: "approved" | "proposed";
  created_by: number | null;
};

export type Wish = {
  id: number;
  title: string;
  note: string | null;
  recipe_id: number | null;
  requested_by: number | null;
  cook_id: number | null;
  status: "pending" | "approved" | "rejected";
  planned_date: string | null;
  decision_note: string | null;
  created_at: string;
  votes: number[];
};

export type CalendarEvent = {
  id: number;
  title: string;
  date: string;
  end_date: string | null;
  start_time: string | null;
  end_time: string | null;
  note: string | null;
  emoji: string;
  participants: number[];
  created_by: number | null;
};
