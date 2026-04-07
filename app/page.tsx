import { redirect } from 'next/navigation';
import { getSupabaseServer } from '@/lib/supabase-server';

export default async function Home() {
  const supabase = getSupabaseServer();
  const { data } = await supabase
    .from('workspaces')
    .select('slug')
    .order('created_at', { ascending: true })
    .limit(1)
    .single();

  redirect(data?.slug ? `/${data.slug}` : '/mighty');
}
