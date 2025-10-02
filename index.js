import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./src/routes/authRoutes.js";
import dashboardRoutes from "./src/routes/dashboardRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT;
const HOSTNAME = process.env.HOSTNAME;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://${HOSTNAME}:${PORT}`);
});