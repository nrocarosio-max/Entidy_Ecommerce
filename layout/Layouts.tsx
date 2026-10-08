import DefaultLayout from "./DefaultLayout";
import NoLayout from "./NoLayout";
import AdminLayout from "./AdminLayout";
export const Layouts = {
 Default: DefaultLayout,
 undefined: NoLayout,
 Admin: AdminLayout,
};
export type LayoutKeys = keyof typeof Layouts; // "Main" | "Admin"
