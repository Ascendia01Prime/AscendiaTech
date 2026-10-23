import { notFound } from "next/navigation";

// Any URL that matches no page ends up here, so the 404 page is shown inside the site layout.
export default function CatchAll() {
  notFound();
}
