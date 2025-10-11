import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("login", "routes/login.tsx"),
  route("events", "routes/events.tsx"),
  route("checkin/:eventId", "routes/checkin.tsx"),
  route("stats/:eventId", "routes/stats.tsx")
] satisfies RouteConfig;
