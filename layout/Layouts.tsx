import DefaultLayout from "./DefaultLayout";
import NoLayout from "./NoLayout";
import AdminLayout from "./AdminLayout";
import PosLayout from "./PosLaytout";
export const Layouts = {
 Default: DefaultLayout,
 undefined: NoLayout,
 Admin: AdminLayout,
 Pos: PosLayout,
};
export type LayoutKeys = keyof typeof Layouts; // "Main" | "Admin"
