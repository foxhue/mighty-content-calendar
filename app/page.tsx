import { redirect } from 'next/navigation';

export default function Home() {
  // For now, redirect to mighty. Later: workspace picker or landing page.
  redirect('/mighty');
}
