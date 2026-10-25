import { AccountView } from "../../features/auth/AccountView";
export const metadata = { title: "Tài khoản" };
export default function AccountPage() {
  return (
    <main className="page">
      <div className="container">
        <AccountView />
      </div>
    </main>
  );
}
