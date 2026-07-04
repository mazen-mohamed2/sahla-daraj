// Feature flags via Vite env
export const FLAGS = {
  B2C: (import.meta.env.VITE_FLAG_B2C ?? "true") !== "false",
};
