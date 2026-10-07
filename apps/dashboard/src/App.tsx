import { usePath } from "./router";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

export default function App() {
  const path = usePath();
  if (path.startsWith("/app")) return <Dashboard />;
  if (path.startsWith("/login")) return <Login />;
  return <Landing />;
}
