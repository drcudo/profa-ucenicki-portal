import { createContext, useContext } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { DEFAULT_RAZINA, RAZINA_VALUES } from '@/lib/razine';

// Razina je svojstvo učenika (odabrana pri upisu ili u pozivnici), ne prekidač u pregledniku.
const RazinaContext = createContext({ razina: DEFAULT_RAZINA });

export function RazinaProvider({ children }) {
  const { user } = useAuth();
  const razina = RAZINA_VALUES.includes(user?.razina) ? user.razina : DEFAULT_RAZINA;

  return <RazinaContext.Provider value={{ razina }}>{children}</RazinaContext.Provider>;
}

export const useRazina = () => useContext(RazinaContext);