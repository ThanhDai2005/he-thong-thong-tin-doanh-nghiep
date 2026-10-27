import { createBrowserRouter } from "react-router-dom";
import clientRoute from "./clientRoute";
import adminRoute from "./adminRoute";

const router = createBrowserRouter([clientRoute, adminRoute]);

export default router;
