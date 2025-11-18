import AdminSidebar from "../../components/AdminSidebar";

export default function AdminLayout({ children }) {
  return (
    <div className="flex">
      <aside className="w-1/5 h-screen bg-gray-100 p-4">
        <AdminSidebar />
      </aside>
      <main className="w-4/5 p-4">{children}</main>
    </div>
  );
}
