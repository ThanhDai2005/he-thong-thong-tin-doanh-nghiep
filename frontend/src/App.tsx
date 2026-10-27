import { RouterProvider } from "react-router-dom";
import router from "./routes/indexRoute";
import { Toaster } from "sonner";
import { GoogleOAuthProvider } from "@react-oauth/google";

function App() {
  return (
    <>
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
        <Toaster richColors />
        <RouterProvider router={router} />
      </GoogleOAuthProvider>
    </>
  );
}

export default App;
