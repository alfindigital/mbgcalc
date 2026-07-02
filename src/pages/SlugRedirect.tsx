import { Navigate, useParams } from "react-router-dom";
import { parseSlug } from "@/lib/slug";
import NotFound from "./NotFound";

/**
 * Slug pendek: /500m, /1t, /2jt → redirect ke /?amount=…
 * Kalau slug tidak cocok pola, tampilkan NotFound.
 */
export default function SlugRedirect() {
  const { slug } = useParams<{ slug: string }>();
  const amount = slug ? parseSlug(slug) : null;
  if (amount && amount > 0) return <Navigate to={`/?amount=${amount}`} replace />;
  return <NotFound />;
}
