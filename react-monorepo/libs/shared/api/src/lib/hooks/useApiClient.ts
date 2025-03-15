import { useContext } from "react";
import { ApiClientContext } from "../context/apiClientContext";

export const useApiClient = () => {
  const client = useContext(ApiClientContext);
  if (!client) {
    throw new Error('useApiClient must be used within an ApiClientProvider');
  }
  return client;
};
