import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";

export function LanguageToggle() {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === "en" ? "es" : "en";
    i18n.changeLanguage(newLang);
  };

  return (
    <button
      onClick={toggleLanguage}
      className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white transition-all hover:bg-white/10 active:scale-95"
      aria-label="Toggle language"
    >
      <div className="flex items-center justify-center gap-1">
        <Globe className="h-4 w-4" />
        <span className="text-xs font-bold uppercase">{i18n.language}</span>
      </div>
    </button>
  );
}
