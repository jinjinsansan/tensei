type ServerEnv = {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
};

type PublicEnv = {
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
};

function ensureEnv(name: keyof ServerEnv, value: string | undefined) {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getServerEnv(): ServerEnv {
  return {
    SUPABASE_URL: ensureEnv('SUPABASE_URL', process.env.SUPABASE_URL),
    SUPABASE_SERVICE_ROLE_KEY: ensureEnv(
      'SUPABASE_SERVICE_ROLE_KEY',
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    ),
  };
}

export function getPublicEnv(): PublicEnv {
  return {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
  };
}
